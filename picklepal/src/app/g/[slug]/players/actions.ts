"use server";

import { createServerClient } from "@/lib/supabase";
import type { Player, Match } from "@/lib/supabase";
import { computePlayerStats, computeDuoStats } from "@/lib/stats";
import type { PlayerStats, DuoStats } from "@/lib/stats";

interface PlayersListResult {
  readonly players: readonly Player[];
  readonly error?: string;
}

interface PlayerDetailResult {
  readonly player: Player | null;
  readonly stats: PlayerStats | null;
  readonly duos: readonly DuoStats[];
  readonly error?: string;
}

/**
 * Fetch all active players for a group (roster page).
 */
export async function getPlayers(groupSlug: string): Promise<PlayersListResult> {
  const supabase = createServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: group, error: groupError } = await (supabase as any)
    .from("groups")
    .select("id")
    .eq("slug", groupSlug)
    .single();

  if (groupError || !group) {
    return { players: [], error: "Group not found" };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: players, error: playersError } = await (supabase as any)
    .from("players")
    .select("*")
    .eq("group_id", group.id)
    .eq("is_active", true)
    .order("display_name");

  if (playersError || !players) {
    return { players: [], error: "Failed to load players" };
  }

  return { players };
}

/**
 * Fetch detailed stats for a single player.
 * Includes overall record, recent matches, and duo partner stats.
 */
export async function getPlayerDetail(
  groupSlug: string,
  playerId: string,
): Promise<PlayerDetailResult> {
  const supabase = createServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: group, error: groupError } = await (supabase as any)
    .from("groups")
    .select("id")
    .eq("slug", groupSlug)
    .single();

  if (groupError || !group) {
    return { player: null, stats: null, duos: [], error: "Group not found" };
  }

  // Fetch the player
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: player, error: playerError } = await (supabase as any)
    .from("players")
    .select("*")
    .eq("id", playerId)
    .eq("group_id", group.id)
    .single();

  if (playerError || !player) {
    return { player: null, stats: null, duos: [], error: "Player not found" };
  }

  // Fetch all players for duo stats
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: allPlayers } = await (supabase as any)
    .from("players")
    .select("*")
    .eq("group_id", group.id)
    .eq("is_active", true);

  // Fetch all completed matches for this group
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sessions } = await (supabase as any)
    .from("sessions")
    .select("id")
    .eq("group_id", group.id);

  if (!sessions || sessions.length === 0) {
    const stats = computePlayerStats(player, []);
    return { player, stats, duos: [] };
  }

  const sessionIds = sessions.map((s: { id: string }) => s.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: matches } = await (supabase as any)
    .from("matches")
    .select("*")
    .in("session_id", sessionIds)
    .eq("status", "completed");

  const allMatches: Match[] = matches ?? [];
  const stats = computePlayerStats(player, allMatches);

  // Compute duo stats and filter to only duos involving this player
  const allDuos = computeDuoStats(allPlayers ?? [], allMatches);
  const playerDuos = allDuos.filter(
    (d) => d.playerAId === playerId || d.playerBId === playerId,
  );

  return { player, stats, duos: playerDuos };
}
