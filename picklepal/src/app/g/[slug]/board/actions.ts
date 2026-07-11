"use server";

import { unstable_cache } from "next/cache";
import { createServerClient } from "@/lib/supabase";
import { computeLeaderboard } from "@/lib/stats";
import { getCurrentBelts } from "@/lib/belts/recomputeBelts";
import type { LeaderboardEntry } from "@/lib/stats";
import type { CurrentBelt } from "@/lib/belts/recomputeBelts";

interface LeaderboardResult {
  readonly entries: readonly LeaderboardEntry[];
  readonly error?: string;
}

/**
 * Fetch leaderboard data for a group.
 * Queries all players and completed matches, then computes rankings.
 * Results are cached per group slug and invalidated on any match write.
 */
export async function getLeaderboard(groupSlug: string): Promise<LeaderboardResult> {
  return unstable_cache(
    () => _getLeaderboard(groupSlug),
    ["leaderboard", groupSlug],
    { tags: [`group-${groupSlug}`], revalidate: 300 },
  )();
}

async function _getLeaderboard(groupSlug: string): Promise<LeaderboardResult> {
  const supabase = createServerClient();

  // Get group ID from slug
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: group, error: groupError } = await (supabase as any)
    .from("groups")
    .select("id")
    .eq("slug", groupSlug)
    .single();

  if (groupError || !group) {
    return { entries: [], error: "Group not found" };
  }

  // Fetch players and sessions in parallel — both depend only on group.id
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [{ data: players, error: playersError }, { data: sessions }] = await Promise.all([
    (supabase as any)
      .from("players")
      .select("id, display_name, color, avatar_url")
      .eq("group_id", group.id)
      .eq("is_active", true)
      .order("display_name"),
    (supabase as any)
      .from("sessions")
      .select("id")
      .eq("group_id", group.id),
  ]);

  if (playersError || !players) {
    return { entries: [], error: "Failed to load players" };
  }

  if (!sessions || sessions.length === 0) {
    return { entries: computeLeaderboard(players, []) };
  }

  const sessionIds = sessions.map((s: { id: string }) => s.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: matches, error: matchesError } = await (supabase as any)
    .from("matches")
    .select(
      "id, session_id, status, match_type, team_a_player_ids, team_b_player_ids, team_a_score, team_b_score, winning_team",
    )
    .in("session_id", sessionIds)
    .eq("status", "completed");

  if (matchesError) {
    return { entries: [], error: "Failed to load matches" };
  }

  const entries = computeLeaderboard(players, matches ?? []);
  return { entries };
}

/**
 * Fetch the currently active belt reigns for the board page.
 * Resolves group ID from slug internally.
 * Results are cached per group slug and invalidated on any match write.
 */
export async function getBoardBelts(
  groupSlug: string,
): Promise<readonly CurrentBelt[]> {
  return unstable_cache(
    () => _getBoardBelts(groupSlug),
    ["board-belts", groupSlug],
    { tags: [`group-${groupSlug}`], revalidate: 300 },
  )();
}

async function _getBoardBelts(
  groupSlug: string,
): Promise<readonly CurrentBelt[]> {
  const supabase = createServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: group, error: groupError } = await (supabase as any)
    .from("groups")
    .select("id")
    .eq("slug", groupSlug)
    .single();

  if (groupError || !group) return [];

  return getCurrentBelts(group.id);
}
