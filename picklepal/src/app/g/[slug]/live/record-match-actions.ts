"use server";

import { createServerClient } from "@/lib/supabase";
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

// ─── Validation ──────────────────────────────────────────────────────────────

function validateManualMatchScores(
  teamAScore: number,
  teamBScore: number,
  targetScore: number,
  winBy: number,
): string | null {
  if (teamAScore < 0 || teamBScore < 0) {
    return "Scores cannot be negative";
  }

  if (teamAScore === teamBScore) {
    return "Scores cannot be tied — there must be a winner";
  }

  const winnerScore = Math.max(teamAScore, teamBScore);
  const loserScore = Math.min(teamAScore, teamBScore);
  const scoreDiff = winnerScore - loserScore;

  // Winner must reach at least target score
  if (winnerScore < targetScore) {
    return `Winner must score at least ${targetScore} points`;
  }

  // Must win by required margin
  if (scoreDiff < winBy) {
    return `Winner must win by at least ${winBy} points`;
  }

  // If winner exceeded target, both players must have been at target-1 or higher
  // (deuce scenario: e.g., 12-10 is valid for target 11 win-by-2)
  if (winnerScore > targetScore && loserScore < targetScore - 1) {
    return `Invalid score: if winner has ${winnerScore}, loser should be at least ${targetScore - 1}`;
  }

  return null;
}

// ─── Record Manual Match ─────────────────────────────────────────────────────

export async function recordManualMatch(
  input: RecordManualMatchInput,
): Promise<ActionResult<{ matchId: string }>> {
  // Validate player counts
  if (input.matchType === "doubles") {
    if (input.teamAPlayerIds.length !== 2 || input.teamBPlayerIds.length !== 2) {
      return { success: false, error: "Doubles requires exactly 2 players per team" };
    }
  } else {
    if (input.teamAPlayerIds.length !== 1 || input.teamBPlayerIds.length !== 1) {
      return { success: false, error: "Singles requires exactly 1 player per team" };
    }
  }

  // Check no duplicate players
  const allPlayerIds = [...input.teamAPlayerIds, ...input.teamBPlayerIds];
  const uniqueIds = new Set(allPlayerIds);
  if (uniqueIds.size !== allPlayerIds.length) {
    return { success: false, error: "A player cannot be on both teams" };
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

  const supabase = createServerClient();

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
      completed_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (matchError || !match) {
    return {
      success: false,
      error: matchError?.message ?? "Failed to record match",
    };
  }

  return { success: true, data: { matchId: match.id } };
}
