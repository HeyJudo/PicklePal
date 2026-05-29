import type { Match, Player } from "@/lib/supabase";
import type { DuoStats } from "./types";

const MIN_DUO_GAMES = 3;

/**
 * Compute duo stats for all doubles pairings in a group.
 *
 * Hottest Duo ranking:
 *   Primary: duo win rate (min 3 games together)
 *   Tiebreaker 1: more wins together
 *   Tiebreaker 2: duo point differential
 */
export function computeDuoStats(
  players: readonly Player[],
  matches: readonly Match[],
): readonly DuoStats[] {
  const doublesMatches = matches.filter(
    (m) => m.status === "completed" && m.match_type === "doubles",
  );

  // Key: sorted "playerA|playerB" → accumulator
  const duoMap = new Map<
    string,
    { wins: number; losses: number; pointsFor: number; pointsAgainst: number }
  >();

  for (const match of doublesMatches) {
    const teamAWon = match.winning_team === "A";

    // Process team A duo
    if (match.team_a_player_ids.length === 2) {
      const key = makeDuoKey(
        match.team_a_player_ids[0],
        match.team_a_player_ids[1],
      );
      const duo = duoMap.get(key) ?? {
        wins: 0,
        losses: 0,
        pointsFor: 0,
        pointsAgainst: 0,
      };
      if (teamAWon) {
        duo.wins += 1;
      } else {
        duo.losses += 1;
      }
      duo.pointsFor += match.team_a_score;
      duo.pointsAgainst += match.team_b_score;
      duoMap.set(key, duo);
    }

    // Process team B duo
    if (match.team_b_player_ids.length === 2) {
      const key = makeDuoKey(
        match.team_b_player_ids[0],
        match.team_b_player_ids[1],
      );
      const duo = duoMap.get(key) ?? {
        wins: 0,
        losses: 0,
        pointsFor: 0,
        pointsAgainst: 0,
      };
      if (!teamAWon) {
        duo.wins += 1;
      } else {
        duo.losses += 1;
      }
      duo.pointsFor += match.team_b_score;
      duo.pointsAgainst += match.team_a_score;
      duoMap.set(key, duo);
    }
  }

  // Build player name lookup
  const playerNameMap = new Map<string, string>();
  for (const player of players) {
    playerNameMap.set(player.id, player.display_name);
  }

  // Convert to DuoStats array
  const duos: DuoStats[] = [];
  for (const [key, stats] of duoMap) {
    const [playerAId, playerBId] = key.split("|");
    const gamesPlayed = stats.wins + stats.losses;
    const winRate = gamesPlayed > 0 ? stats.wins / gamesPlayed : 0;

    duos.push({
      playerAId,
      playerBId,
      playerAName: playerNameMap.get(playerAId) ?? "Unknown",
      playerBName: playerNameMap.get(playerBId) ?? "Unknown",
      wins: stats.wins,
      losses: stats.losses,
      gamesPlayed,
      winRate,
      pointDifferential: stats.pointsFor - stats.pointsAgainst,
    });
  }

  // Sort by Hottest Duo criteria
  duos.sort((a, b) => {
    const aQualified = a.gamesPlayed >= MIN_DUO_GAMES;
    const bQualified = b.gamesPlayed >= MIN_DUO_GAMES;

    if (aQualified && !bQualified) return -1;
    if (!aQualified && bQualified) return 1;

    // Primary: win rate
    if (a.winRate !== b.winRate) return b.winRate - a.winRate;

    // Tiebreaker 1: more wins
    if (a.wins !== b.wins) return b.wins - a.wins;

    // Tiebreaker 2: point differential
    return b.pointDifferential - a.pointDifferential;
  });

  return duos;
}

function makeDuoKey(idA: string, idB: string): string {
  return idA < idB ? `${idA}|${idB}` : `${idB}|${idA}`;
}
