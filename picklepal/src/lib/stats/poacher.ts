import type { Match, Player } from "@/lib/supabase";
import type { LeaderboardEntry } from "./types";
import { computeLeaderboard } from "./leaderboard";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PoacherResult {
  /** Player(s) who won the most-recent match that beat the current #1 */
  readonly holderIds: readonly string[];
  /** The match where the upset happened */
  readonly matchId: string;
  readonly matchPlayedAt: string;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function matchTimestamp(m: Match): string {
  return (
    (m as { played_at?: string | null }).played_at ??
    m.completed_at ??
    m.created_at
  );
}

// ─── computePoacher ──────────────────────────────────────────────────────────

/**
 * The Poacher is held by whoever most recently beat the current #1 win-rate
 * player (rank === 1, qualified).
 *
 * Algorithm:
 *  1. Compute leaderboard to find current #1 qualified player.
 *  2. Walk completed matches in reverse chronological order (newest first).
 *  3. Find the first match where the #1 player was on the LOSING team and
 *     the winning team contained at least one non-#1 player.
 *  4. The winning team's player IDs hold the belt.
 *
 * Returns null if:
 *  - There is no qualified #1 player, or
 *  - The #1 player has never lost a match.
 */
export function computePoacher(
  players: readonly Player[],
  matches: readonly Match[],
  leaderboard?: readonly LeaderboardEntry[],
): PoacherResult | null {
  const entries = leaderboard ?? computeLeaderboard(players, matches);

  // Find current #1 qualified player
  const number1 = entries.find((e) => e.rank === 1 && e.isQualified);
  if (!number1) return null;

  const topId = number1.playerId;

  const completedMatches = matches
    .filter((m) => m.status === "completed")
    .slice()
    .sort((a, b) => matchTimestamp(b).localeCompare(matchTimestamp(a))); // newest first

  for (const match of completedMatches) {
    const teamAIds = match.team_a_player_ids;
    const teamBIds = match.team_b_player_ids;
    const teamAWon = match.winning_team === "A";

    const topOnA = teamAIds.includes(topId);
    const topOnB = teamBIds.includes(topId);

    if (!topOnA && !topOnB) continue; // #1 didn't play this match

    const topWon = (topOnA && teamAWon) || (topOnB && !teamAWon);
    if (topWon) continue; // #1 won — not an upset

    // #1 lost — the winners hold the belt
    const winnerIds = teamAWon ? teamAIds : teamBIds;
    return {
      holderIds: winnerIds,
      matchId: match.id,
      matchPlayedAt: matchTimestamp(match),
    };
  }

  return null;
}
