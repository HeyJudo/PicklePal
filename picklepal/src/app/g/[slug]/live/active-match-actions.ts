"use server";

import { currentUser } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { authorizeGroupWrite, resolveGroupIdFromSession, resolveGroupIdFromMatch } from "@/lib/auth";
import { recomputeBelts } from "@/lib/belts/recomputeBelts";
import type { MatchType, MatchSnapshot } from "@/lib/supabase";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ActionResult<T = void> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: string;
}

interface CreateActiveMatchInput {
  readonly sessionId: string;
  readonly matchType: MatchType;
  readonly teamAPlayerIds: readonly string[];
  readonly teamBPlayerIds: readonly string[];
  readonly startingServerPlayerId: string;
  readonly targetScore: number;
  readonly winBy: number;
}

interface ActiveMatchData {
  readonly id: string;
  readonly session_id: string;
  readonly match_type: MatchType;
  readonly status: string;
  readonly team_a_player_ids: string[];
  readonly team_b_player_ids: string[];
  readonly team_a_score: number;
  readonly team_b_score: number;
  readonly starting_server_player_id: string | null;
  readonly target_score: number;
  readonly win_by: number;
  readonly scorer_clerk_user_id: string | null;
  readonly scorer_heartbeat_at: string | null;
  readonly current_snapshot: MatchSnapshot | null;
  readonly started_at: string | null;
}

/** Staleness threshold in milliseconds (30 seconds) */
const HEARTBEAT_STALE_MS = 30_000;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

// ─── Create Active Match ─────────────────────────────────────────────────────

/**
 * Creates a match record with status 'active' when scoring begins.
 * Records the scorer's Clerk user ID and initial snapshot.
 * Only one active match per session is allowed.
 */
export async function createActiveMatch(
  input: CreateActiveMatchInput,
): Promise<ActionResult<{ matchId: string }>> {
  const user = await currentUser();
  if (!user) {
    return { success: false, error: "You must be signed in" };
  }

  const groupId = await resolveGroupIdFromSession(input.sessionId);
  if (!groupId) return { success: false, error: "Session not found" };
  const auth = await authorizeGroupWrite(groupId);
  if (!auth.authorized) return { success: false, error: auth.error };

  const supabase = getSupabase();

  // Enforce: only one active match per session
  const { data: existing } = await supabase
    .from("matches")
    .select("id")
    .eq("session_id", input.sessionId)
    .eq("status", "active")
    .maybeSingle();

  if (existing) {
    return { success: false, error: "A match is already active in this session" };
  }

  const initialSnapshot: MatchSnapshot = {
    teamAScore: 0,
    teamBScore: 0,
    servingTeam: "A",
    serverPlayerId: input.startingServerPlayerId,
    serverNumber: input.matchType === "doubles" ? 2 : null,
    rallyCount: 0,
    updatedAt: new Date().toISOString(),
  };

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .insert({
      session_id: input.sessionId,
      match_type: input.matchType,
      status: "active",
      team_a_player_ids: [...input.teamAPlayerIds],
      team_b_player_ids: [...input.teamBPlayerIds],
      starting_server_player_id: input.startingServerPlayerId,
      target_score: input.targetScore,
      win_by: input.winBy,
      source: "live",
      scorer_clerk_user_id: user.id,
      scorer_heartbeat_at: new Date().toISOString(),
      current_snapshot: initialSnapshot,
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (matchError || !match) {
    return { success: false, error: matchError?.message ?? "Failed to create active match" };
  }

  return { success: true, data: { matchId: match.id } };
}

// ─── Update Match Snapshot ───────────────────────────────────────────────────

/**
 * Updates the live scoring snapshot on an active match.
 * Called periodically during scoring to keep DB state fresh for viewers.
 * Also updates the scorer heartbeat timestamp.
 */
export async function updateMatchSnapshot(
  matchId: string,
  snapshot: MatchSnapshot,
): Promise<ActionResult> {
  const user = await currentUser();
  if (!user) {
    return { success: false, error: "You must be signed in" };
  }

  const groupId = await resolveGroupIdFromMatch(matchId);
  if (!groupId) return { success: false, error: "Match not found" };
  const auth = await authorizeGroupWrite(groupId);
  if (!auth.authorized) return { success: false, error: auth.error };

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("matches")
    .update({
      current_snapshot: snapshot,
      team_a_score: snapshot.teamAScore,
      team_b_score: snapshot.teamBScore,
      scorer_heartbeat_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", matchId)
    .eq("status", "active")
    .eq("scorer_clerk_user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data) {
    return { success: false, error: "Scorer ownership lost" };
  }

  return { success: true };
}

// ─── Complete Active Match ───────────────────────────────────────────────────

interface CompleteActiveMatchInput {
  readonly matchId: string;
  readonly teamAScore: number;
  readonly teamBScore: number;
  readonly winningTeam: string;
  readonly losingTeam: string;
  readonly rallyEvents: readonly RallyEventInput[];
}

interface RallyEventInput {
  readonly sequenceNumber: number;
  readonly rallyWinnerTeam: string;
  readonly resultingTeamAScore: number;
  readonly resultingTeamBScore: number;
  readonly serverPlayerId: string;
  readonly serverNumber: number | null;
  readonly sideOutOccurred: boolean;
}

/**
 * Transitions an active match to completed status.
 * Writes final scores, rally events, and clears the snapshot.
 */
export async function completeActiveMatch(
  input: CompleteActiveMatchInput,
): Promise<ActionResult> {
  const user = await currentUser();
  if (!user) {
    return { success: false, error: "You must be signed in" };
  }

  const groupId = await resolveGroupIdFromMatch(input.matchId);
  if (!groupId) return { success: false, error: "Match not found" };
  const auth = await authorizeGroupWrite(groupId);
  if (!auth.authorized) return { success: false, error: auth.error };

  const supabase = getSupabase();

  // Fetch started_at to compute server-authoritative duration
  const { data: matchRow } = await supabase
    .from("matches")
    .select("started_at")
    .eq("id", input.matchId)
    .single();
  const nowMs = Date.now();
  const durationSeconds = matchRow?.started_at
    ? Math.round((nowMs - new Date(matchRow.started_at).getTime()) / 1000)
    : null;

  // Update match to completed
  const { error: matchError } = await supabase
    .from("matches")
    .update({
      status: "completed",
      team_a_score: input.teamAScore,
      team_b_score: input.teamBScore,
      winning_team: input.winningTeam,
      losing_team: input.losingTeam,
      current_snapshot: null,
      completed_at: new Date(nowMs).toISOString(),
      duration_seconds: durationSeconds,
      updated_at: new Date(nowMs).toISOString(),
    })
    .eq("id", input.matchId)
    .eq("status", "active");

  if (matchError) {
    return { success: false, error: matchError.message };
  }

  // Save rally events
  if (input.rallyEvents.length > 0) {
    const rallyRows = input.rallyEvents.map((event) => ({
      match_id: input.matchId,
      sequence_number: event.sequenceNumber,
      rally_winner_team: event.rallyWinnerTeam,
      resulting_team_a_score: event.resultingTeamAScore,
      resulting_team_b_score: event.resultingTeamBScore,
      server_player_id: event.serverPlayerId,
      server_number: event.serverNumber,
      side_out_occurred: event.sideOutOccurred,
    }));

    const { error: rallyError } = await supabase
      .from("rally_events")
      .insert(rallyRows);

    if (rallyError) {
      // Rally save failed — revert match to active so scorer can retry
      await supabase
        .from("matches")
        .update({ status: "active", completed_at: null, duration_seconds: null, updated_at: new Date().toISOString() })
        .eq("id", input.matchId);
      return { success: false, error: "Failed to save rally events. Match not completed." };
    }
  }

  // Recompute belt holders after successful match completion.
  // Failure is swallowed inside recomputeBelts — never reverts this match.
  void recomputeBelts(groupId);

  return { success: true };
}

// ─── Flush Rally Events ──────────────────────────────────────────────────────

/**
 * Progressively inserts rally events for an active match during scoring.
 * Called alongside the snapshot sync so match completion only needs to insert
 * the last few unflushed rallies instead of the entire game's worth at once.
 */
export async function flushRallyEvents(
  matchId: string,
  rallyEvents: readonly RallyEventInput[],
): Promise<ActionResult> {
  if (rallyEvents.length === 0) return { success: true };

  const user = await currentUser();
  if (!user) return { success: false, error: "You must be signed in" };

  const groupId = await resolveGroupIdFromMatch(matchId);
  if (!groupId) return { success: false, error: "Match not found" };
  const auth = await authorizeGroupWrite(groupId);
  if (!auth.authorized) return { success: false, error: auth.error };

  const supabase = getSupabase();

  const rallyRows = rallyEvents.map((event) => ({
    match_id: matchId,
    sequence_number: event.sequenceNumber,
    rally_winner_team: event.rallyWinnerTeam,
    resulting_team_a_score: event.resultingTeamAScore,
    resulting_team_b_score: event.resultingTeamBScore,
    server_player_id: event.serverPlayerId,
    server_number: event.serverNumber,
    side_out_occurred: event.sideOutOccurred,
  }));

  const { error } = await supabase.from("rally_events").insert(rallyRows);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ─── Get Active Match ────────────────────────────────────────────────────────

/**
 * Returns the currently active match for a session, if any.
 * Used for auto-resume and viewer display.
 */
export async function getActiveMatch(
  sessionId: string,
): Promise<ActionResult<ActiveMatchData | null>> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("matches")
    .select(
      "id, session_id, match_type, status, team_a_player_ids, team_b_player_ids, " +
      "team_a_score, team_b_score, starting_server_player_id, target_score, win_by, " +
      "scorer_clerk_user_id, scorer_heartbeat_at, current_snapshot, started_at",
    )
    .eq("session_id", sessionId)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: data as ActiveMatchData | null };
}

// ─── Abandon Active Match ────────────────────────────────────────────────────

/**
 * Cancels an active match that was abandoned (e.g., scorer left without completing).
 * Only the original scorer or a group admin can abandon.
 */
export async function abandonActiveMatch(
  matchId: string,
): Promise<ActionResult> {
  const user = await currentUser();
  if (!user) {
    return { success: false, error: "You must be signed in" };
  }

  const supabase = getSupabase();

  const { error } = await supabase
    .from("matches")
    .update({
      status: "cancelled",
      current_snapshot: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", matchId)
    .eq("status", "active");

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ─── Take Over Scoring ───────────────────────────────────────────────────────

/**
 * Reassigns scorer_clerk_user_id to the current user.
 * Only allowed when the current scorer's heartbeat is stale (>30s).
 * The new user becomes the active scorer.
 */
export async function takeOverScoring(
  matchId: string,
): Promise<ActionResult> {
  const user = await currentUser();
  if (!user) {
    return { success: false, error: "You must be signed in" };
  }

  const groupId = await resolveGroupIdFromMatch(matchId);
  if (!groupId) return { success: false, error: "Match not found" };
  const auth = await authorizeGroupWrite(groupId);
  if (!auth.authorized) return { success: false, error: auth.error };

  const supabase = getSupabase();

  // Fetch the active match to verify staleness
  const { data: match, error: fetchError } = await supabase
    .from("matches")
    .select("id, scorer_clerk_user_id, scorer_heartbeat_at")
    .eq("id", matchId)
    .eq("status", "active")
    .maybeSingle();

  if (fetchError || !match) {
    return { success: false, error: "Active match not found" };
  }

  // If the user is already the scorer, no-op success
  if (match.scorer_clerk_user_id === user.id) {
    return { success: true };
  }

  // Verify heartbeat is stale
  if (match.scorer_heartbeat_at) {
    const heartbeatAge = Date.now() - new Date(match.scorer_heartbeat_at).getTime();
    if (heartbeatAge < HEARTBEAT_STALE_MS) {
      return { success: false, error: "Current scorer is still active. Cannot take over." };
    }
  }
  // If scorer_heartbeat_at is null, treat as stale (legacy match or never set)

  // Reassign scorer
  const { error: updateError } = await supabase
    .from("matches")
    .update({
      scorer_clerk_user_id: user.id,
      scorer_heartbeat_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", matchId)
    .eq("status", "active");

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true };
}
