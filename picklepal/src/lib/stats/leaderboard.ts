import type { Match, Player } from "@/lib/supabase";
import type { LeaderboardEntry } from "./types";

const MIN_GAMES_QUALIFIED = 3;

interface PlayerAccumulator {
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
}

/**
 * Compute leaderboard from completed matches and player roster.
 *
 * Ranking:
 *   Primary: win rate (qualified players only, min 3 games)
 *   Tiebreaker 1: more games played
 *   Tiebreaker 2: point differential
 */
export function computeLeaderboard(
  players: readonly Player[],
  matches: readonly Match[],
): readonly LeaderboardEntry[] {
  const completedMatches = matches.filter((m) => m.status === "completed");
  const statsMap = new Map<string, PlayerAccumulator>();

  // Initialize all players
  for (const player of players) {
    statsMap.set(player.id, { wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0 });
  }

  // Accumulate stats from completed matches
  for (const match of completedMatches) {
    const teamAIds = match.team_a_player_ids;
    const teamBIds = match.team_b_player_ids;
    const teamAWon = match.winning_team === "A";

    for (const playerId of teamAIds) {
      const stats = statsMap.get(playerId);
      if (!stats) continue;
      if (teamAWon) {
        stats.wins += 1;
      } else {
        stats.losses += 1;
      }
      stats.pointsFor += match.team_a_score;
      stats.pointsAgainst += match.team_b_score;
    }

    for (const playerId of teamBIds) {
      const stats = statsMap.get(playerId);
      if (!stats) continue;
      if (!teamAWon) {
        stats.wins += 1;
      } else {
        stats.losses += 1;
      }
      stats.pointsFor += match.team_b_score;
      stats.pointsAgainst += match.team_a_score;
    }
  }

  // Build entries
  const entries: LeaderboardEntry[] = players.map((player) => {
    const stats = statsMap.get(player.id) ?? {
      wins: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
    };
    const gamesPlayed = stats.wins + stats.losses;
    const winRate = gamesPlayed > 0 ? stats.wins / gamesPlayed : 0;
    const pointDifferential = stats.pointsFor - stats.pointsAgainst;
    const isQualified = gamesPlayed >= MIN_GAMES_QUALIFIED;

    return {
      playerId: player.id,
      displayName: player.display_name,
      color: player.color,
      avatarUrl: player.avatar_url,
      wins: stats.wins,
      losses: stats.losses,
      gamesPlayed,
      winRate,
      pointDifferential,
      isQualified,
      rank: null, // assigned after sorting
    };
  });

  // Sort: qualified first, then by win rate → games played → point diff
  entries.sort((a, b) => {
    // Qualified players always rank above unqualified
    if (a.isQualified && !b.isQualified) return -1;
    if (!a.isQualified && b.isQualified) return 1;

    // Primary: win rate (descending)
    if (a.winRate !== b.winRate) return b.winRate - a.winRate;

    // Tiebreaker 1: more games played (descending)
    if (a.gamesPlayed !== b.gamesPlayed) return b.gamesPlayed - a.gamesPlayed;

    // Tiebreaker 2: point differential (descending)
    return b.pointDifferential - a.pointDifferential;
  });

  // Assign ranks (only to qualified players)
  let currentRank = 1;
  return entries.map((entry) => ({
    ...entry,
    rank: entry.isQualified ? currentRank++ : null,
  }));
}
