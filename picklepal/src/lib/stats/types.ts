/** A single row in the leaderboard */
export interface LeaderboardEntry {
  readonly playerId: string;
  readonly displayName: string;
  readonly color: string | null;
  readonly avatarUrl: string | null;
  readonly wins: number;
  readonly losses: number;
  readonly gamesPlayed: number;
  readonly winRate: number;
  readonly pointDifferential: number;
  readonly isQualified: boolean;
  readonly rank: number | null;
}

/** Player stats for a player detail page */
export interface PlayerStats {
  readonly playerId: string;
  readonly displayName: string;
  readonly color: string | null;
  readonly wins: number;
  readonly losses: number;
  readonly gamesPlayed: number;
  readonly winRate: number;
  readonly pointDifferential: number;
  readonly avgMatchDurationSeconds: number | null;
  readonly longestMatchSeconds: number | null;
  readonly recentMatches: readonly MatchSummary[];
}

/** Minimal match info for display */
export interface MatchSummary {
  readonly matchId: string;
  readonly matchType: string;
  readonly source: string;
  readonly teamAPlayerIds: readonly string[];
  readonly teamBPlayerIds: readonly string[];
  readonly teamAScore: number;
  readonly teamBScore: number;
  readonly winningTeam: string | null;
  readonly playedAt: string | null;
  readonly completedAt: string | null;
  readonly durationSeconds: number | null;
}

/** Duo pairing stats */
export interface DuoStats {
  readonly playerAId: string;
  readonly playerBId: string;
  readonly playerAName: string;
  readonly playerBName: string;
  readonly wins: number;
  readonly losses: number;
  readonly gamesPlayed: number;
  readonly winRate: number;
  readonly pointDifferential: number;
}

/** Head-to-head rivalry stats between this player and a specific opponent */
export interface RivalryStats {
  readonly opponentId: string;
  readonly opponentName: string;
  readonly opponentColor: string | null;
  readonly opponentAvatarUrl: string | null;
  readonly gamesPlayed: number;
  readonly wins: number;
  readonly losses: number;
  readonly winRate: number;
  readonly pointDifferential: number;
}

/** Session summary */
export interface SessionSummary {
  readonly sessionId: string;
  readonly title: string | null;
  readonly gamesPlayed: number;
  readonly playerCount: number;
  readonly startedAt: string;
  readonly endedAt: string | null;
  readonly durationMinutes: number | null;
}
