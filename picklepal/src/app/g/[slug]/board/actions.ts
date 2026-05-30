"use server";

import { createServerClient } from "@/lib/supabase";
import { computeLeaderboard } from "@/lib/stats";
import type { LeaderboardEntry } from "@/lib/stats";

interface LeaderboardResult {
  readonly entries: readonly LeaderboardEntry[];
  readonly error?: string;
}

/**
 * Fetch leaderboard data for a group.
 * Queries all players and completed matches, then computes rankings.
 */
export async function getLeaderboard(groupSlug: string): Promise<LeaderboardResult> {
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

  // Fetch all active players for this group
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: players, error: playersError } = await (supabase as any)
    .from("players")
    .select("*")
    .eq("group_id", group.id)
    .eq("is_active", true)
    .order("display_name");

  if (playersError || !players) {
    return { entries: [], error: "Failed to load players" };
  }

  // Fetch all completed matches for sessions in this group
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sessions } = await (supabase as any)
    .from("sessions")
    .select("id")
    .eq("group_id", group.id);

  if (!sessions || sessions.length === 0) {
    return { entries: computeLeaderboard(players, []) };
  }

  const sessionIds = sessions.map((s: { id: string }) => s.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: matches, error: matchesError } = await (supabase as any)
    .from("matches")
    .select("*")
    .in("session_id", sessionIds)
    .eq("status", "completed");

  if (matchesError) {
    return { entries: [], error: "Failed to load matches" };
  }

  const entries = computeLeaderboard(players, matches ?? []);
  return { entries };
}
