"use server";

import { createClient } from "@supabase/supabase-js";
import { computeKingOfTheKitchen } from "@/lib/stats/streaks";
import { computePoacher } from "@/lib/stats/poacher";
import { computePicklers } from "@/lib/stats/picklers";
import { computeLeaderboard } from "@/lib/stats/leaderboard";
import type { Player, Match } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BeltType = "king_of_the_kitchen" | "poacher" | "pickler";

export interface BeltReign {
  readonly id: string;
  readonly group_id: string;
  readonly belt_type: BeltType;
  readonly holder_player_id: string;
  readonly subject_player_id: string | null;
  readonly context: Record<string, unknown> | null;
  readonly started_at: string;
  readonly ended_at: string | null;
  readonly season_id: string | null;
  readonly created_at: string;
}

export interface CurrentBelt {
  readonly beltType: BeltType;
  readonly holderPlayerIds: readonly string[];
  readonly context: Record<string, unknown> | null;
  readonly startedAt: string;
  /** Pickler only: the dominated opponent's player ID */
  readonly subjectPlayerId: string | null;
}

// ─── Supabase service-role client (same pattern as active-match-actions.ts) ──

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

// ─── Data loading helpers (matches board/actions.ts query pattern) ────────────

async function loadGroupData(
  groupId: string,
): Promise<{ players: Player[]; matches: Match[] } | null> {
  const supabase = getSupabase();

  // Fetch all active players for this group
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: players, error: playersError } = await (supabase as any)
    .from("players")
    .select("*")
    .eq("group_id", groupId)
    .eq("is_active", true)
    .order("display_name");

  if (playersError || !players) return null;

  // Fetch all sessions for this group
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sessions } = await (supabase as any)
    .from("sessions")
    .select("id")
    .eq("group_id", groupId);

  if (!sessions || sessions.length === 0) {
    return { players: players as Player[], matches: [] };
  }

  const sessionIds = sessions.map((s: { id: string }) => s.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: matches, error: matchesError } = await (supabase as any)
    .from("matches")
    .select("*")
    .in("session_id", sessionIds)
    .eq("status", "completed");

  if (matchesError) return null;

  return { players: players as Player[], matches: (matches ?? []) as Match[] };
}

// ─── Desired-holder computation ───────────────────────────────────────────────

interface DesiredHolder {
  beltType: BeltType;
  /** primary holder (or first team member) */
  holderPlayerId: string;
  /** for multi-holder belts (Poacher team wins), one reign per winner */
  allHolderIds: string[];
  subjectPlayerId: string | null;
  context: Record<string, unknown> | null;
}

function computeDesiredHolders(
  players: Player[],
  matches: Match[],
): DesiredHolder[] {
  const desired: DesiredHolder[] = [];

  // King of the Kitchen
  const king = computeKingOfTheKitchen(players, matches);
  if (king) {
    desired.push({
      beltType: "king_of_the_kitchen",
      holderPlayerId: king.holderId,
      allHolderIds: [king.holderId],
      subjectPlayerId: null,
      context: { streak: king.streak },
    });
  }

  // The Poacher
  const leaderboard = computeLeaderboard(players, matches);
  const poacher = computePoacher(players, matches, leaderboard);
  if (poacher && poacher.holderIds.length > 0) {
    // Each winner on the upset team gets a co-holder entry — but the unique
    // index is (group_id, belt_type, COALESCE(subject_player_id, NULL_UUID)).
    // The Poacher has no subject_player_id so only ONE reign can be active.
    // We store the PRIMARY holder as the first player; context carries all winners.
    desired.push({
      beltType: "poacher",
      holderPlayerId: poacher.holderIds[0],
      allHolderIds: [...poacher.holderIds],
      subjectPlayerId: null,
      context: { holderIds: [...poacher.holderIds], matchId: poacher.matchId },
    });
  }

  // The Pickler — one belt entry per dominating pair
  const picklers = computePicklers(players, matches);
  for (const p of picklers) {
    desired.push({
      beltType: "pickler",
      holderPlayerId: p.holderPlayerId,
      allHolderIds: [p.holderPlayerId],
      subjectPlayerId: p.subjectPlayerId,
      context: {
        wins: p.wins,
        losses: p.losses,
        winRate: p.winRate,
        games: p.games,
        subjectPlayerId: p.subjectPlayerId,
      },
    });
  }

  return desired;
}

// ─── recomputeBelts ───────────────────────────────────────────────────────────

/**
 * Recompute all belt holders for a group after a match completes.
 * Diffs against the currently open reigns, closes changed ones, and
 * inserts new ones.
 *
 * CRITICAL: any failure is swallowed + logged and NEVER throws back to the
 * match-completion flow. A belt failure must never revert an authoritative
 * completed match.
 */
export async function recomputeBelts(groupId: string): Promise<void> {
  try {
    const data = await loadGroupData(groupId);
    if (!data) {
      console.error("[belts] recomputeBelts: failed to load group data for", groupId);
      return;
    }

    const { players, matches } = data;
    const desired = computeDesiredHolders(players, matches);
    const supabase = getSupabase();
    const now = new Date().toISOString();

    // Load all currently active reigns for this group
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: activeReigns, error: reignsError } = await (supabase as any)
      .from("belt_reigns")
      .select("*")
      .eq("group_id", groupId)
      .is("ended_at", null);

    if (reignsError) {
      console.error("[belts] recomputeBelts: failed to load active reigns", reignsError);
      return;
    }

    const currentReigns = (activeReigns ?? []) as BeltReign[];

    // Build a set of desired identity keys: "beltType::subjectPlayerId" (or
    // "beltType::∅" when subject_player_id is null, matching King/Poacher).
    // This correctly closes individual Pickler reigns whose rivalry pair is no
    // longer qualifying while leaving other active Pickler reigns untouched.
    // King and Poacher (subject=null) are keyed as "beltType::∅" and still
    // close correctly when they disappear from the desired list entirely.
    const NULL_SUBJECT = "∅";
    const desiredIdentities = new Set(
      desired.map((d) => `${d.beltType}::${d.subjectPlayerId ?? NULL_SUBJECT}`),
    );
    const reignsToClose = currentReigns.filter(
      (r) =>
        !desiredIdentities.has(
          `${r.belt_type}::${r.subject_player_id ?? NULL_SUBJECT}`,
        ),
    );
    for (const reign of reignsToClose) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("belt_reigns")
        .update({ ended_at: now })
        .eq("id", reign.id);
    }

    // For each desired holder, check if they already hold that belt
    for (const d of desired) {
      const existingReign = currentReigns.find(
        (r) =>
          r.belt_type === d.beltType &&
          r.subject_player_id === d.subjectPlayerId,
      );

      if (existingReign) {
        if (existingReign.holder_player_id === d.holderPlayerId) {
          // Same holder — update context in case streak/winRate changed
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from("belt_reigns")
            .update({ context: d.context })
            .eq("id", existingReign.id);
          continue;
        }

        // Holder changed — close old reign
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from("belt_reigns")
          .update({ ended_at: now })
          .eq("id", existingReign.id);
      }

      // Insert new reign
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = await (supabase as any)
        .from("belt_reigns")
        .insert({
          group_id: groupId,
          belt_type: d.beltType,
          holder_player_id: d.holderPlayerId,
          subject_player_id: d.subjectPlayerId,
          context: d.context,
          started_at: now,
        });

      if (insertError) {
        console.error("[belts] recomputeBelts: failed to insert reign", d.beltType, insertError);
      }
    }
  } catch (err) {
    // Never throw — belt failures must not affect match completion
    console.error("[belts] recomputeBelts: unexpected error (swallowed)", err);
  }
}

// ─── getCurrentBelts ──────────────────────────────────────────────────────────

/**
 * Returns all currently active belt reigns for a group, formatted for display.
 */
export async function getCurrentBelts(groupId: string): Promise<readonly CurrentBelt[]> {
  try {
    const supabase = getSupabase();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("belt_reigns")
      .select("*")
      .eq("group_id", groupId)
      .is("ended_at", null)
      .order("started_at", { ascending: true });

    if (error || !data) return [];

    return (data as BeltReign[]).map((r) => {
      // Recover all holder IDs from context if stored (Poacher team)
      const holderIds: string[] =
        r.context && Array.isArray((r.context as { holderIds?: unknown }).holderIds)
          ? (r.context as { holderIds: string[] }).holderIds
          : [r.holder_player_id];

      return {
        beltType: r.belt_type,
        holderPlayerIds: holderIds,
        context: r.context,
        startedAt: r.started_at,
        subjectPlayerId: r.subject_player_id ?? null,
      };
    });
  } catch (err) {
    console.error("[belts] getCurrentBelts: error (returning empty)", err);
    return [];
  }
}

// ─── getBeltReigns ────────────────────────────────────────────────────────────

/**
 * Returns all belt reigns (active + historical) for a group, newest first.
 */
export async function getBeltReigns(groupId: string): Promise<readonly BeltReign[]> {
  try {
    const supabase = getSupabase();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("belt_reigns")
      .select("*")
      .eq("group_id", groupId)
      .order("started_at", { ascending: false });

    if (error || !data) return [];
    return data as BeltReign[];
  } catch (err) {
    console.error("[belts] getBeltReigns: error (returning empty)", err);
    return [];
  }
}
