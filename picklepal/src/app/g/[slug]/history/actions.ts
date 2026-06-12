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
  readonly players: readonly Player[];
  readonly error?: string;
}

export interface SessionOption {
  readonly id: string;
  readonly title: string | null;
  readonly started_at: string;
}

/**
 * Fetch match history for a group, grouped by session (newest first).
 * When includeCancelled is true (admin mode), returns cancelled matches too.
 * Includes player name lookup for display.
 */
export async function getMatchHistory(
  groupSlug: string,
  options: { includeCancelled?: boolean } = {},
): Promise<HistoryResult> {
  const supabase = createServerClient();

  // Get group ID from slug
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: group, error: groupError } = await (supabase as any)
    .from("groups")
    .select("id")
    .eq("slug", groupSlug)
    .single();

  if (groupError || !group) {
    return { sessionGroups: [], players: [], error: "Group not found" };
  }

  // Fetch all sessions (newest first)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sessions, error: sessionsError } = await (supabase as any)
    .from("sessions")
    .select("*")
    .eq("group_id", group.id)
    .order("started_at", { ascending: false });

  if (sessionsError || !sessions || sessions.length === 0) {
    return { sessionGroups: [], players: [] };
  }

  // Fetch matches for these sessions
  const sessionIds = sessions.map((s: Session) => s.id);

  const statusFilter = options.includeCancelled
    ? ["completed", "cancelled"]
    : ["completed"];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: matches, error: matchesError } = await (supabase as any)
    .from("matches")
    .select("*")
    .in("session_id", sessionIds)
    .in("status", statusFilter)
    .order("played_at", { ascending: false });

  if (matchesError) {
    return { sessionGroups: [], players: [], error: "Failed to load matches" };
  }

  // Fetch all players: name lookup needs inactive players too (old matches),
  // while the form only gets active ones
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: players } = await (supabase as any)
    .from("players")
    .select("*")
    .eq("group_id", group.id)
    .order("display_name", { ascending: true });

  const playerNameMap: Record<string, string> = {};
  if (players) {
    for (const p of players as Player[]) {
      playerNameMap[p.id] = p.display_name;
    }
  }

  const activePlayers = ((players ?? []) as Player[]).filter((p) => p.is_active);

  // Group matches by session
  const matchesBySession = new Map<string, MatchWithPlayers[]>();
  for (const match of (matches ?? []) as Match[]) {
    const sessionMatches = matchesBySession.get(match.session_id) ?? [];
    sessionMatches.push({ ...match, playerNames: playerNameMap });
    matchesBySession.set(match.session_id, sessionMatches);
  }

  // Build session groups (only include sessions that have visible matches)
  const sessionGroups: SessionGroup[] = [];
  for (const session of sessions as Session[]) {
    const sessionMatches = matchesBySession.get(session.id);
    if (sessionMatches && sessionMatches.length > 0) {
      sessionGroups.push({ session, matches: sessionMatches });
    }
  }

  return { sessionGroups, players: activePlayers };
}

/**
 * Fetch recent live sessions for the session picker in PastMatchForm.
 * Returns up to 15 sessions with source='live', newest first.
 */
export async function getRecentSessionOptions(groupSlug: string): Promise<readonly SessionOption[]> {
  const supabase = createServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: group } = await (supabase as any)
    .from("groups")
    .select("id")
    .eq("slug", groupSlug)
    .single();

  if (!group) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sessions } = await (supabase as any)
    .from("sessions")
    .select("id, title, started_at")
    .eq("group_id", group.id)
    .eq("source", "live")
    .eq("status", "completed")
    .order("started_at", { ascending: false })
    .limit(15);

  return (sessions ?? []) as SessionOption[];
}
