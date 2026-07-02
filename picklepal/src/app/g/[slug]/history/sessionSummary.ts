import type { MatchWithPlayers } from "./actions";

export interface SessionSummary {
  readonly topWinner: { name: string; wins: number } | null;
  readonly closest: { a: number; b: number } | null;
  readonly biggest: { a: number; b: number } | null;
}

/**
 * Derive quick session stats (top winner, closest game, biggest blowout)
 * from a session's matches. Only `status === "completed"` matches count.
 */
export function sessionSummary(matches: readonly MatchWithPlayers[]): SessionSummary {
  const completed = matches.filter((m) => m.status === "completed");
  if (completed.length === 0) {
    return { topWinner: null, closest: null, biggest: null };
  }

  // Tally wins per player id, tracking first-seen order for deterministic tie-break.
  const wins = new Map<string, number>();
  const order: string[] = [];
  for (const m of completed) {
    const winnerIds = m.winning_team === "A" ? m.team_a_player_ids : m.team_b_player_ids;
    for (const id of winnerIds) {
      if (!wins.has(id)) {
        wins.set(id, 0);
        order.push(id);
      }
      wins.set(id, wins.get(id)! + 1);
    }
  }

  let topWinner: SessionSummary["topWinner"] = null;
  let topId: string | null = null;
  for (const id of order) {
    const count = wins.get(id)!;
    if (!topWinner || count > topWinner.wins) {
      topId = id;
      topWinner = { name: completed[0].playerInfo[id]?.name ?? "Unknown", wins: count };
    }
  }
  if (topId) {
    // Resolve name from whichever match actually has this player's info.
    const infoMatch = completed.find((m) => m.playerInfo[topId!]);
    topWinner = { name: infoMatch?.playerInfo[topId]?.name ?? "Unknown", wins: wins.get(topId)! };
  }

  let closest = completed[0];
  let biggest = completed[0];
  let closestMargin = Math.abs(closest.team_a_score - closest.team_b_score);
  let biggestMargin = closestMargin;
  for (const m of completed.slice(1)) {
    const margin = Math.abs(m.team_a_score - m.team_b_score);
    if (margin < closestMargin) {
      closest = m;
      closestMargin = margin;
    }
    if (margin > biggestMargin) {
      biggest = m;
      biggestMargin = margin;
    }
  }

  return {
    topWinner,
    closest: { a: closest.team_a_score, b: closest.team_b_score },
    biggest: { a: biggest.team_a_score, b: biggest.team_b_score },
  };
}
