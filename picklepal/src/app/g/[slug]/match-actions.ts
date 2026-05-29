"use server";

import { createServerClient } from "@/lib/supabase";
import type { Database } from "@/lib/supabase";

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

/**
 * Restore a cancelled match back to completed status.
 */
export async function restoreMatch(matchId: string): Promise<ActionResult> {
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
