import type { Match, Player } from "@/lib/supabase";
import type { RivalryStats } from "./types";

export const MIN_RIVALRY_GAMES = 2;

/**
 * Compute head-to-head rivalry stats for a single player against all opponents.
 *
 * An "opponent" is any player on the OPPOSITE team in a completed match.
 * For doubles, a single match yields up to 2 opponents (both players on the
 * opposing team are counted individually).
 *
 * Ranking:
 *   Primary: games played desc (most-faced opponent = biggest rival)
 *   Tiebreaker: win rate desc
 */
export function computeRivalryStats(
  playerId: string,
  players: readonly Player[],
  matches: readonly Match[],
): readonly RivalryStats[] {
  const completedMatches = matches.filter((m) => m.status === "completed");

  // Accumulator map: opponentId → running totals
  const rivalMap = new Map<
    string,
    { wins: number; losses: number; pointsFor: number; pointsAgainst: number }
  >();

  for (const match of completedMatches) {
    const onTeamA = match.team_a_player_ids.includes(playerId);
    const onTeamB = match.team_b_player_ids.includes(playerId);

    // Skip if this player wasn't in this match
    if (!onTeamA && !onTeamB) continue;

    const teamAWon = match.winning_team === "A";
    const playerWon = onTeamA ? teamAWon : !teamAWon;

    // Points from this player's team perspective
    const ptsFor = onTeamA ? match.team_a_score : match.team_b_score;
    const ptsAgainst = onTeamA ? match.team_b_score : match.team_a_score;

    // The opposing team's player ids
    // In doubles, this yields up to 2 opponents per match
    const opponentIds = onTeamA
      ? match.team_b_player_ids
      : match.team_a_player_ids;

    for (const opponentId of opponentIds) {
      const acc = rivalMap.get(opponentId) ?? {
        wins: 0,
        losses: 0,
        pointsFor: 0,
        pointsAgainst: 0,
      };
      if (playerWon) {
        acc.wins += 1;
      } else {
        acc.losses += 1;
      }
      acc.pointsFor += ptsFor;
      acc.pointsAgainst += ptsAgainst;
      rivalMap.set(opponentId, acc);
    }
  }

  // Build player lookup: id → player metadata
  const playerMap = new Map<string, Player>();
  for (const player of players) {
    playerMap.set(player.id, player);
  }

  // Convert accumulator to RivalryStats[], apply MIN_RIVALRY_GAMES filter
  const rivalries: RivalryStats[] = [];
  for (const [opponentId, acc] of rivalMap) {
    const gamesPlayed = acc.wins + acc.losses;
    if (gamesPlayed < MIN_RIVALRY_GAMES) continue;

    const opponent = playerMap.get(opponentId);
    const winRate = gamesPlayed > 0 ? acc.wins / gamesPlayed : 0;

    rivalries.push({
      opponentId,
      opponentName: opponent?.display_name ?? "Unknown",
      opponentColor: opponent?.color ?? null,
      opponentAvatarUrl: opponent?.avatar_url ?? null,
      gamesPlayed,
      wins: acc.wins,
      losses: acc.losses,
      winRate,
      pointDifferential: acc.pointsFor - acc.pointsAgainst,
    });
  }

  // Sort: games played desc (biggest rival first), then win rate desc as tiebreaker
  rivalries.sort((a, b) => {
    if (a.gamesPlayed !== b.gamesPlayed) return b.gamesPlayed - a.gamesPlayed;
    return b.winRate - a.winRate;
  });

  return rivalries;
}
