import type { Match, Session } from "@/lib/supabase";
import type { SessionSummary } from "./types";

/**
 * Compute a summary for a session from its matches.
 */
export function computeSessionSummary(
  session: Session,
  matches: readonly Match[],
): SessionSummary {
  const sessionMatches = matches.filter(
    (m) => m.session_id === session.id && m.status === "completed",
  );

  // Collect unique player IDs across all matches
  const playerIds = new Set<string>();
  for (const match of sessionMatches) {
    for (const id of match.team_a_player_ids) playerIds.add(id);
    for (const id of match.team_b_player_ids) playerIds.add(id);
  }

  // Calculate duration
  let durationMinutes: number | null = null;
  if (session.ended_at) {
    const start = new Date(session.started_at).getTime();
    const end = new Date(session.ended_at).getTime();
    durationMinutes = Math.round((end - start) / 60_000);
  }

  return {
    sessionId: session.id,
    title: session.title,
    gamesPlayed: sessionMatches.length,
    playerCount: playerIds.size,
    startedAt: session.started_at,
    endedAt: session.ended_at,
    durationMinutes,
  };
}
