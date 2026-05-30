"use server";

import { createServerClient } from "@/lib/supabase";
import type { Session, Match, Player } from "@/lib/supabase";
import { computeSessionSummary, computeSessionAwards } from "@/lib/stats";
import type { SessionSummary, SessionAwards } from "@/lib/stats";

export interface SessionDetailResult {
  readonly session: Session | null;
  readonly summary: SessionSummary | null;
  readonly awards: SessionAwards | null;
  readonly matches: readonly Match[];
  readonly playerNames: Record<string, string>;
  readonly error?: string;
}

/**
 * Fetch session detail with summary and awards.
 */
export async function getSessionDetail(
  groupSlug: string,
  sessionId: string,
): Promise<SessionDetailResult> {
  const supabase = createServerClient();

  // Get group ID from slug
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: group, error: groupError } = await (supabase as any)
    .from("groups")
    .select("id")
    .eq("slug", groupSlug)
    .single();

  if (groupError || !group) {
    return { session: null, summary: null, awards: null, matches: [], playerNames: {}, error: "Group not found" };
  }

  // Fetch the session
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: session, error: sessionError } = await (supabase as any)
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("group_id", group.id)
    .single();

  if (sessionError || !session) {
    return { session: null, summary: null, awards: null, matches: [], playerNames: {}, error: "Session not found" };
  }

  // Fetch matches for this session
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: matches } = await (supabase as any)
    .from("matches")
    .select("*")
    .eq("session_id", sessionId)
    .order("completed_at", { ascending: false });

  const allMatches: Match[] = matches ?? [];

  // Fetch players for name lookup and awards
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: players } = await (supabase as any)
    .from("players")
    .select("*")
    .eq("group_id", group.id);

  const allPlayers: Player[] = players ?? [];
  const playerNames: Record<string, string> = {};
  for (const p of allPlayers) {
    playerNames[p.id] = p.display_name;
  }

  // Compute summary and awards
  const summary = computeSessionSummary(session as Session, allMatches);
  const awards = computeSessionAwards(allPlayers, allMatches);

  return {
    session: session as Session,
    summary,
    awards,
    matches: allMatches,
    playerNames,
  };
}
