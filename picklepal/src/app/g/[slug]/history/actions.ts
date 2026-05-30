"use server";

import { createServerClient } from "@/lib/supabase";
import type { Match, Session, Player } from "@/lib/supabase";

export interface MatchWithPlayers extends Match {
  readonly playerNames: Record<string, string>;
}

export interface SessionGroup {
  readonly session: Session;
  readonly matches: readonly MatchWithPlayers[];
}

interface HistoryResult {
  readonly sessionGroups: readonly SessionGroup[];
  readonly error?: string;
}

/**
 * Fetch match history for a group, grouped by session (newest first).
 * Includes player name lookup for display.
 */
export async function getMatchHistory(groupSlug: string): Promise<HistoryResult> {
  const supabase = createServerClient();

  // Get group ID from slug
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: group, error: groupError } = await (supabase as any)
    .from("groups")
    .select("id")
    .eq("slug", groupSlug)
    .single();

  if (groupError || !group) {
    return { sessionGroups: [], error: "Group not found" };
  }

  // Fetch all sessions (newest first)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sessions, error: sessionsError } = await (supabase as any)
    .from("sessions")
    .select("*")
    .eq("group_id", group.id)
    .order("started_at", { ascending: false });

  if (sessionsError || !sessions || sessions.length === 0) {
    return { sessionGroups: [] };
  }

  // Fetch all completed matches for these sessions
  const sessionIds = sessions.map((s: Session) => s.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: matches, error: matchesError } = await (supabase as any)
    .from("matches")
    .select("*")
    .in("session_id", sessionIds)
    .eq("status", "completed")
    .order("completed_at", { ascending: false });

  if (matchesError) {
    return { sessionGroups: [], error: "Failed to load matches" };
  }

  // Fetch all players for name lookup
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: players } = await (supabase as any)
    .from("players")
    .select("id, display_name")
    .eq("group_id", group.id);

  const playerNameMap: Record<string, string> = {};
  if (players) {
    for (const p of players as Pick<Player, "id" | "display_name">[]) {
      playerNameMap[p.id] = p.display_name;
    }
  }

  // Group matches by session
  const matchesBySession = new Map<string, MatchWithPlayers[]>();
  for (const match of (matches ?? []) as Match[]) {
    const sessionMatches = matchesBySession.get(match.session_id) ?? [];
    sessionMatches.push({ ...match, playerNames: playerNameMap });
    matchesBySession.set(match.session_id, sessionMatches);
  }

  // Build session groups (only include sessions that have completed matches)
  const sessionGroups: SessionGroup[] = [];
  for (const session of sessions as Session[]) {
    const sessionMatches = matchesBySession.get(session.id);
    if (sessionMatches && sessionMatches.length > 0) {
      sessionGroups.push({ session, matches: sessionMatches });
    }
  }

  return { sessionGroups };
}
