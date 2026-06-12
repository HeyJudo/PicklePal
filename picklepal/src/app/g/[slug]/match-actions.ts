"use server";

import { createServerClient } from "@/lib/supabase";
import { authorizeGroupWrite, resolveGroupIdFromMatch } from "@/lib/auth";
import { findOrCreateManualBucket } from "@/lib/sessions/manualBucket";
import {
  validateManualMatchScores,
  validateTeams,
  validatePlayedDate,
  playedDateToTimestamp,
} from "@/lib/matches/validation";
import type { Database, MatchType } from "@/lib/supabase";

interface ActionResult {
  readonly success: boolean;
  readonly error?: string;
}

type MatchUpdate = Database["public"]["Tables"]["matches"]["Update"];

async function getMatchStatus(
  matchId: string,
): Promise<{ id: string; status: string } | null> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("matches")
    .select("id, status")
    .eq("id", matchId)
    .single();
  return data;
}

async function updateMatch(
  matchId: string,
  updates: MatchUpdate,
): Promise<{ error: unknown }> {
  const supabase = createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("matches") as any)
    .update(updates)
    .eq("id", matchId);
  return { error };
}

/**
 * Correct a match's scores.
 * Only works on completed matches. Updates winning/losing team based on new scores.
 */
export async function correctMatchScores(
  matchId: string,
  teamAScore: number,
  teamBScore: number,
): Promise<ActionResult> {
  if (teamAScore < 0 || teamBScore < 0) {
    return { success: false, error: "Scores cannot be negative" };
  }

  if (teamAScore === teamBScore) {
    return { success: false, error: "Scores cannot be tied for a completed match" };
  }

  const groupId = await resolveGroupIdFromMatch(matchId);
  if (!groupId) return { success: false, error: "Match not found" };
  const authResult = await authorizeGroupWrite(groupId);
  if (!authResult.authorized) return { success: false, error: authResult.error };

  const match = await getMatchStatus(matchId);

  if (!match) {
    return { success: false, error: "Match not found" };
  }

  if (match.status !== "completed") {
    return { success: false, error: "Can only correct completed matches" };
  }

  const winningTeam = teamAScore > teamBScore ? "A" : "B";
  const losingTeam = teamAScore > teamBScore ? "B" : "A";

  const { error } = await updateMatch(matchId, {
    team_a_score: teamAScore,
    team_b_score: teamBScore,
    winning_team: winningTeam,
    losing_team: losingTeam,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return { success: false, error: "Failed to update match" };
  }

  return { success: true };
}

/**
 * Cancel a match (soft delete).
 * Sets status to 'cancelled' — the match remains in the DB but is excluded from stats.
 */
export async function cancelMatch(matchId: string): Promise<ActionResult> {
  const groupId = await resolveGroupIdFromMatch(matchId);
  if (!groupId) return { success: false, error: "Match not found" };
  const authResult = await authorizeGroupWrite(groupId);
  if (!authResult.authorized) return { success: false, error: authResult.error };

  const match = await getMatchStatus(matchId);

  if (!match) {
    return { success: false, error: "Match not found" };
  }

  if (match.status === "cancelled") {
    return { success: false, error: "Match is already cancelled" };
  }

  const { error } = await updateMatch(matchId, {
    status: "cancelled",
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return { success: false, error: "Failed to cancel match" };
  }

  return { success: true };
}

// ─── Update Manual Match ─────────────────────────────────────────────────────

interface UpdateManualMatchInput {
  readonly matchId: string;
  readonly matchType: MatchType;
  readonly teamAPlayerIds: readonly string[];
  readonly teamBPlayerIds: readonly string[];
  readonly teamAScore: number;
  readonly teamBScore: number;
  readonly targetScore: number;
  readonly winBy: number;
  readonly playedDate: string; // YYYY-MM-DD
}

/**
 * Update a manual match (source='manual', status='completed').
 * Full re-validation of teams and scores.
 * If the date changes, the match is moved to the new bucket session.
 */
export async function updateManualMatch(
  input: UpdateManualMatchInput,
): Promise<ActionResult> {
  // Validate date
  const dateError = validatePlayedDate(input.playedDate);
  if (dateError) {
    return { success: false, error: dateError };
  }

  // Validate teams
  const teamError = validateTeams(input.matchType, input.teamAPlayerIds, input.teamBPlayerIds);
  if (teamError) {
    return { success: false, error: teamError };
  }

  // Validate scores
  const scoreError = validateManualMatchScores(
    input.teamAScore,
    input.teamBScore,
    input.targetScore,
    input.winBy,
  );
  if (scoreError) {
    return { success: false, error: scoreError };
  }

  // Authorize
  const groupId = await resolveGroupIdFromMatch(input.matchId);
  if (!groupId) return { success: false, error: "Match not found" };
  const authResult = await authorizeGroupWrite(groupId);
  if (!authResult.authorized) return { success: false, error: authResult.error };

  // Fetch current match to check source/status
  const supabase = createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: match } = await (supabase as any)
    .from("matches")
    .select("id, status, source, session_id")
    .eq("id", input.matchId)
    .single();

  if (!match) {
    return { success: false, error: "Match not found" };
  }

  if (match.source !== "manual" || match.status !== "completed") {
    return { success: false, error: "Only completed manual matches can be edited" };
  }

  const winningTeam = input.teamAScore > input.teamBScore ? "A" : "B";
  const losingTeam = winningTeam === "A" ? "B" : "A";
  const playedAt = playedDateToTimestamp(input.playedDate);

  // Determine if we need to move the match to a different bucket
  let newSessionId: string = match.session_id;

  // Check if current session is a manual_bucket
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: currentSession } = await (supabase as any)
    .from("sessions")
    .select("id, source, bucket_date")
    .eq("id", match.session_id)
    .maybeSingle();

  if (currentSession?.source === "manual_bucket") {
    // Date changed — move to new bucket
    if (currentSession.bucket_date !== input.playedDate) {
      const bucketResult = await findOrCreateManualBucket(supabase, groupId, input.playedDate);
      if ("error" in bucketResult) {
        return { success: false, error: bucketResult.error };
      }
      newSessionId = bucketResult.sessionId;
    }
  }
  // If assigned to a real (live) session, only played_at changes; session_id stays

  const { error } = await updateMatch(input.matchId, {
    session_id: newSessionId,
    match_type: input.matchType,
    team_a_player_ids: [...input.teamAPlayerIds],
    team_b_player_ids: [...input.teamBPlayerIds],
    team_a_score: input.teamAScore,
    team_b_score: input.teamBScore,
    winning_team: winningTeam,
    losing_team: losingTeam,
    target_score: input.targetScore,
    win_by: input.winBy,
    played_at: playedAt,
    completed_at: playedAt,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return { success: false, error: "Failed to update match" };
  }

  return { success: true };
}

/**
 * Restore a cancelled match back to completed status.
 */
export async function restoreMatch(matchId: string): Promise<ActionResult> {
  const groupId = await resolveGroupIdFromMatch(matchId);
  if (!groupId) return { success: false, error: "Match not found" };
  const authResult = await authorizeGroupWrite(groupId);
  if (!authResult.authorized) return { success: false, error: authResult.error };

  const match = await getMatchStatus(matchId);

  if (!match) {
    return { success: false, error: "Match not found" };
  }

  if (match.status !== "cancelled") {
    return { success: false, error: "Only cancelled matches can be restored" };
  }

  const { error } = await updateMatch(matchId, {
    status: "completed",
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return { success: false, error: "Failed to restore match" };
  }

  return { success: true };
}
