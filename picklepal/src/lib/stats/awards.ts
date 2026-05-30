import type { Match, Player } from "@/lib/supabase";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MvpAward {
  readonly playerId: string;
  readonly displayName: string;
  readonly color: string | null;
  readonly score: number;
  readonly wins: number;
  readonly gamesPlayed: number;
  readonly pointDifferential: number;
}

export interface HottestDuoAward {
  readonly playerAId: string;
  readonly playerBId: string;
  readonly playerAName: string;
  readonly playerBName: string;
  readonly wins: number;
  readonly losses: number;
  readonly gamesPlayed: number;
  readonly winRate: number;
}

export interface BestMatchAward {
  readonly matchId: string;
  readonly teamAPlayerIds: readonly string[];
  readonly teamBPlayerIds: readonly string[];
  readonly teamAScore: number;
  readonly teamBScore: number;
  readonly scoreDifference: number;
  readonly combinedScore: number;
}

export interface SessionAwards {
  readonly mvp: MvpAward | null;
  readonly hottestDuo: HottestDuoAward | null;
  readonly bestMatch: BestMatchAward | null;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MVP_MIN_GAMES = 2;
const DUO_MIN_GAMES = 2; // Relaxed for per-session (spec says 3 for all-time)

// ─── MVP of the Day ──────────────────────────────────────────────────────────

/**
 * MVP score = (session wins × 3) + session point differential + session games played
 * Eligibility: min 2 games in session
 */
function computeMvp(
  players: readonly Player[],
  sessionMatches: readonly Match[],
): MvpAward | null {
  const playerStats = new Map<
    string,
    { wins: number; gamesPlayed: number; pointsFor: number; pointsAgainst: number }
  >();

  for (const match of sessionMatches) {
    const teamAWon = match.winning_team === "A";

    for (const id of match.team_a_player_ids) {
      const stats = playerStats.get(id) ?? { wins: 0, gamesPlayed: 0, pointsFor: 0, pointsAgainst: 0 };
      stats.gamesPlayed += 1;
      if (teamAWon) stats.wins += 1;
      stats.pointsFor += match.team_a_score;
      stats.pointsAgainst += match.team_b_score;
      playerStats.set(id, stats);
    }

    for (const id of match.team_b_player_ids) {
      const stats = playerStats.get(id) ?? { wins: 0, gamesPlayed: 0, pointsFor: 0, pointsAgainst: 0 };
      stats.gamesPlayed += 1;
      if (!teamAWon) stats.wins += 1;
      stats.pointsFor += match.team_b_score;
      stats.pointsAgainst += match.team_a_score;
      playerStats.set(id, stats);
    }
  }

  // Build player name/color lookup
  const playerMap = new Map<string, Player>();
  for (const p of players) {
    playerMap.set(p.id, p);
  }

  // Score and rank eligible players
  let bestMvp: MvpAward | null = null;

  for (const [playerId, stats] of playerStats) {
    if (stats.gamesPlayed < MVP_MIN_GAMES) continue;

    const pointDiff = stats.pointsFor - stats.pointsAgainst;
    const mvpScore = stats.wins * 3 + pointDiff + stats.gamesPlayed;
    const player = playerMap.get(playerId);

    if (!bestMvp || mvpScore > bestMvp.score) {
      bestMvp = {
        playerId,
        displayName: player?.display_name ?? "Unknown",
        color: player?.color ?? null,
        score: mvpScore,
        wins: stats.wins,
        gamesPlayed: stats.gamesPlayed,
        pointDifferential: pointDiff,
      };
    }
  }

  return bestMvp;
}

// ─── Hottest Duo ─────────────────────────────────────────────────────────────

function computeHottestDuo(
  players: readonly Player[],
  sessionMatches: readonly Match[],
): HottestDuoAward | null {
  const doublesMatches = sessionMatches.filter((m) => m.match_type === "doubles");

  if (doublesMatches.length === 0) return null;

  const duoMap = new Map<string, { wins: number; losses: number }>();

  for (const match of doublesMatches) {
    const teamAWon = match.winning_team === "A";

    if (match.team_a_player_ids.length === 2) {
      const key = makeDuoKey(match.team_a_player_ids[0], match.team_a_player_ids[1]);
      const duo = duoMap.get(key) ?? { wins: 0, losses: 0 };
      if (teamAWon) duo.wins += 1;
      else duo.losses += 1;
      duoMap.set(key, duo);
    }

    if (match.team_b_player_ids.length === 2) {
      const key = makeDuoKey(match.team_b_player_ids[0], match.team_b_player_ids[1]);
      const duo = duoMap.get(key) ?? { wins: 0, losses: 0 };
      if (!teamAWon) duo.wins += 1;
      else duo.losses += 1;
      duoMap.set(key, duo);
    }
  }

  // Player name lookup
  const nameMap = new Map<string, string>();
  for (const p of players) {
    nameMap.set(p.id, p.display_name);
  }

  // Find best duo
  let best: HottestDuoAward | null = null;

  for (const [key, stats] of duoMap) {
    const gamesPlayed = stats.wins + stats.losses;
    if (gamesPlayed < DUO_MIN_GAMES) continue;

    const winRate = stats.wins / gamesPlayed;
    const [playerAId, playerBId] = key.split("|");

    const candidate: HottestDuoAward = {
      playerAId,
      playerBId,
      playerAName: nameMap.get(playerAId) ?? "Unknown",
      playerBName: nameMap.get(playerBId) ?? "Unknown",
      wins: stats.wins,
      losses: stats.losses,
      gamesPlayed,
      winRate,
    };

    if (!best) {
      best = candidate;
    } else if (winRate > best.winRate) {
      best = candidate;
    } else if (winRate === best.winRate && stats.wins > best.wins) {
      best = candidate;
    }
  }

  return best;
}

// ─── Best Match ──────────────────────────────────────────────────────────────

/**
 * Best Match: lowest absolute score difference.
 * Tiebreaker: highest combined score.
 */
function computeBestMatch(sessionMatches: readonly Match[]): BestMatchAward | null {
  if (sessionMatches.length === 0) return null;

  let best: BestMatchAward | null = null;

  for (const match of sessionMatches) {
    const scoreDifference = Math.abs(match.team_a_score - match.team_b_score);
    const combinedScore = match.team_a_score + match.team_b_score;

    const candidate: BestMatchAward = {
      matchId: match.id,
      teamAPlayerIds: match.team_a_player_ids,
      teamBPlayerIds: match.team_b_player_ids,
      teamAScore: match.team_a_score,
      teamBScore: match.team_b_score,
      scoreDifference,
      combinedScore,
    };

    if (!best) {
      best = candidate;
    } else if (scoreDifference < best.scoreDifference) {
      best = candidate;
    } else if (
      scoreDifference === best.scoreDifference &&
      combinedScore > best.combinedScore
    ) {
      best = candidate;
    }
  }

  return best;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Compute all session awards from completed matches in a session.
 */
export function computeSessionAwards(
  players: readonly Player[],
  sessionMatches: readonly Match[],
): SessionAwards {
  const completed = sessionMatches.filter((m) => m.status === "completed");

  return {
    mvp: computeMvp(players, completed),
    hottestDuo: computeHottestDuo(players, completed),
    bestMatch: computeBestMatch(completed),
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeDuoKey(idA: string, idB: string): string {
  return idA < idB ? `${idA}|${idB}` : `${idB}|${idA}`;
}
