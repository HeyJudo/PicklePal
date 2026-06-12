import type { Match, Player } from "@/lib/supabase";
import type { MatchSummary, PlayerStats } from "./types";

/**
 * Compute stats for a single player from their match history.
 */
export function computePlayerStats(
  player: Player,
  matches: readonly Match[],
  recentLimit: number = 10,
): PlayerStats {
  const completedMatches = matches.filter((m) => m.status === "completed");

  const playerMatches = completedMatches.filter(
    (m) =>
      m.team_a_player_ids.includes(player.id) ||
      m.team_b_player_ids.includes(player.id),
  );

  let wins = 0;
  let losses = 0;
  let pointsFor = 0;
  let pointsAgainst = 0;

  for (const match of playerMatches) {
    const isTeamA = match.team_a_player_ids.includes(player.id);
    const teamAWon = match.winning_team === "A";
    const playerWon = isTeamA ? teamAWon : !teamAWon;

    if (playerWon) {
      wins += 1;
    } else {
      losses += 1;
    }

    if (isTeamA) {
      pointsFor += match.team_a_score;
      pointsAgainst += match.team_b_score;
    } else {
      pointsFor += match.team_b_score;
      pointsAgainst += match.team_a_score;
    }
  }

  const gamesPlayed = wins + losses;
  const winRate = gamesPlayed > 0 ? wins / gamesPlayed : 0;
  const pointDifferential = pointsFor - pointsAgainst;

  // Recent matches sorted by played date (newest first)
  const recentMatches: readonly MatchSummary[] = playerMatches
    .sort((a, b) => {
      const aTime = (a as { played_at?: string }).played_at ?? a.completed_at ?? a.created_at;
      const bTime = (b as { played_at?: string }).played_at ?? b.completed_at ?? b.created_at;
      return bTime.localeCompare(aTime);
    })
    .slice(0, recentLimit)
    .map((m) => ({
      matchId: m.id,
      matchType: m.match_type,
      source: m.source,
      teamAPlayerIds: m.team_a_player_ids,
      teamBPlayerIds: m.team_b_player_ids,
      teamAScore: m.team_a_score,
      teamBScore: m.team_b_score,
      winningTeam: m.winning_team,
      playedAt: (m as { played_at?: string }).played_at ?? null,
      completedAt: m.completed_at,
    }));

  return {
    playerId: player.id,
    displayName: player.display_name,
    color: player.color,
    wins,
    losses,
    gamesPlayed,
    winRate,
    pointDifferential,
    recentMatches,
  };
}
