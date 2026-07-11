"use server";

import { createServerClient } from "@/lib/supabase";
import { authorizeGroupWrite, resolveGroupIdFromSession } from "@/lib/auth";
import { findOrCreateManualBucket } from "@/lib/sessions/manualBucket";
import { recomputeBelts } from "@/lib/belts/recomputeBelts";
import {
  invalidateGroupMutation,
  invalidateGroupMutationBySlug,
  revalidateGroupCache,
  revalidateGroupCacheBySlug,
} from "@/lib/cache";
import {
  validateManualMatchScores,
  validateTeams,
  validatePlayedDate,
  playedDateToTimestamp,
} from "@/lib/matches/validation";
import type { MatchType } from "@/lib/supabase";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ActionResult<T = void> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: string;
}

interface RecordManualMatchInput {
  readonly sessionId: string;
  readonly matchType: MatchType;
  readonly teamAPlayerIds: readonly string[];
  readonly teamBPlayerIds: readonly string[];
  readonly teamAScore: number;
  readonly teamBScore: number;
  readonly targetScore: number;
  readonly winBy: number;
}

interface RecordPastMatchInput {
  readonly groupSlug: string;
  readonly sessionId: string | null;
  readonly playedDate: string; // YYYY-MM-DD
  readonly matchType: MatchType;
  readonly teamAPlayerIds: readonly string[];
  readonly teamBPlayerIds: readonly string[];
  readonly teamAScore: number;
  readonly teamBScore: number;
  readonly targetScore: number;
  readonly winBy: number;
}

// ─── Record Manual Match (live session) ─────────────────────────────────────

export async function recordManualMatch(
  input: RecordManualMatchInput,
): Promise<ActionResult<{ matchId: string }>> {
  // Validate teams
  const teamError = validateTeams(
    input.matchType,
    input.teamAPlayerIds,
    input.teamBPlayerIds,
  );
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

  const winningTeam = input.teamAScore > input.teamBScore ? "A" : "B";
  const losingTeam = winningTeam === "A" ? "B" : "A";

  const groupId = await resolveGroupIdFromSession(input.sessionId);
  if (!groupId) return { success: false, error: "Session not found" };
  const auth = await authorizeGroupWrite(groupId);
  if (!auth.authorized) return { success: false, error: auth.error };

  const supabase = createServerClient();
  const now = new Date().toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: match, error: matchError } = await (supabase as any)
    .from("matches")
    .insert({
      session_id: input.sessionId,
      match_type: input.matchType,
      status: "completed",
      team_a_player_ids: [...input.teamAPlayerIds],
      team_b_player_ids: [...input.teamBPlayerIds],
      team_a_score: input.teamAScore,
      team_b_score: input.teamBScore,
      winning_team: winningTeam,
      losing_team: losingTeam,
      starting_server_player_id: null,
      target_score: input.targetScore,
      win_by: input.winBy,
      source: "manual",
      played_at: now,
      completed_at: now,
    })
    .select("id")
    .single();

  if (matchError || !match) {
    return {
      success: false,
      error: matchError?.message ?? "Failed to record match",
    };
  }

  // Recompute belt holders after successful manual match record.
  // Failure is swallowed inside recomputeBelts — never reverts this match.
  void recomputeBelts(groupId);
  await invalidateGroupMutation(groupId, "match-result", input.sessionId);
  await revalidateGroupCache(groupId);

  return { success: true, data: { matchId: match.id } };
}

// ─── Record Past Match ───────────────────────────────────────────────────────

export async function recordPastMatch(
  input: RecordPastMatchInput,
): Promise<ActionResult<{ matchId: string }>> {
  // Validate date
  const dateError = validatePlayedDate(input.playedDate);
  if (dateError) {
    return { success: false, error: dateError };
  }

  // Validate teams
  const teamError = validateTeams(
    input.matchType,
    input.teamAPlayerIds,
    input.teamBPlayerIds,
  );
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

  // Resolve group
  const supabase = createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: group, error: groupError } = await (supabase as any)
    .from("groups")
    .select("id")
    .eq("slug", input.groupSlug)
    .single();

  if (groupError || !group) {
    return { success: false, error: "Group not found" };
  }

  const auth = await authorizeGroupWrite(group.id);
  if (!auth.authorized) return { success: false, error: auth.error };

  // Determine session ID
  let sessionId: string;

  if (input.sessionId) {
    // Verify the given session belongs to this group
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: sess } = await (supabase as any)
      .from("sessions")
      .select("id")
      .eq("id", input.sessionId)
      .eq("group_id", group.id)
      .maybeSingle();

    if (!sess) {
      return { success: false, error: "Session not found in this group" };
    }
    sessionId = input.sessionId;
  } else {
    // Find or create a manual bucket for this date
    const bucketResult = await findOrCreateManualBucket(
      supabase,
      group.id,
      input.playedDate,
    );
    if ("error" in bucketResult) {
      return { success: false, error: bucketResult.error };
    }
    sessionId = bucketResult.sessionId;
  }

  const winningTeam = input.teamAScore > input.teamBScore ? "A" : "B";
  const losingTeam = winningTeam === "A" ? "B" : "A";
  const playedAt = playedDateToTimestamp(input.playedDate);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: match, error: matchError } = await (supabase as any)
    .from("matches")
    .insert({
      session_id: sessionId,
      match_type: input.matchType,
      status: "completed",
      team_a_player_ids: [...input.teamAPlayerIds],
      team_b_player_ids: [...input.teamBPlayerIds],
      team_a_score: input.teamAScore,
      team_b_score: input.teamBScore,
      winning_team: winningTeam,
      losing_team: losingTeam,
      starting_server_player_id: null,
      target_score: input.targetScore,
      win_by: input.winBy,
      source: "manual",
      played_at: playedAt,
      completed_at: playedAt,
    })
    .select("id")
    .single();

  if (matchError || !match) {
    return {
      success: false,
      error: matchError?.message ?? "Failed to record past match",
    };
  }

  // Recompute belt holders after successful past match record.
  // Failure is swallowed inside recomputeBelts — never reverts this match.
  void recomputeBelts(group.id);
  invalidateGroupMutationBySlug(input.groupSlug, "match-result", sessionId);
  revalidateGroupCacheBySlug(input.groupSlug);

  return { success: true, data: { matchId: match.id } };
}
