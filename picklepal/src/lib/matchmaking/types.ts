/**
 * Matchmaking Types
 *
 * Pure TypeScript types for fair random matchup generation.
 * No React, no Supabase dependencies.
 */

export type MatchType = "singles" | "doubles";

export type ReasonKey =
  | "fewest_games_played"
  | "longest_since_last_play"
  | "fewest_repeated_teammates"
  | "fewest_repeated_opponents"
  | "balanced_team_strength";

export interface MatchupReason {
  key: ReasonKey;
  label: string;
}

export interface PlayerSession {
  readonly playerId: string;
  readonly gamesPlayed: number;
  readonly gamesSatOut: number;
  readonly lastSatRound: number; // 0 = never sat
  readonly sitOutCountdown: number; // 0 = eligible, >0 = auto-sit for N more rounds
  readonly lockState: boolean;
  readonly joinedRound: number;
  readonly winRate: number; // 0–1, default 0.5
  readonly teammates: ReadonlyMap<string, number>;
  readonly opponents: ReadonlyMap<string, number>;
}

export interface Matchup {
  readonly teamA: readonly string[];
  readonly teamB: readonly string[];
  readonly sittingOut: readonly string[];
  readonly reasoning: readonly MatchupReason[];
}

export interface MatchmakingState {
  readonly players: readonly string[];
  readonly matchType: MatchType;
  readonly round: number;
  readonly playerSessions: ReadonlyMap<string, PlayerSession>;
  readonly balancedMode: boolean;
  readonly sessionId: string;
}

export interface GenerateMatchupInput {
  readonly playerIds: readonly string[];
  readonly matchType: MatchType;
  readonly previousMatchups?: readonly Matchup[];
}

export class MatchmakingError extends Error {
  readonly activePoolSize: number;
  readonly requiredMinimum: number;
  readonly deficit: number;

  constructor(activePoolSize: number, requiredMinimum: number) {
    const deficit = requiredMinimum - activePoolSize;
    super(
      `Active pool too small: ${activePoolSize} players available, need ${requiredMinimum} (deficit: ${deficit})`,
    );
    this.name = "MatchmakingError";
    this.activePoolSize = activePoolSize;
    this.requiredMinimum = requiredMinimum;
    this.deficit = deficit;
  }
}

/**
 * Prior session statistics for a player, used to seed createMatchmakingState
 * with real history so the fairness algorithm starts with accurate counts.
 */
export interface PriorPlayerStats {
  readonly gamesPlayed: number;
  readonly teammates: Map<string, number>;   // partnerId → count
  readonly opponents: Map<string, number>;   // opponentId → count
}
