/**
 * Matchmaking Types
 *
 * Pure TypeScript types for fair random matchup generation.
 * No React, no Supabase dependencies.
 */

export type MatchType = "singles" | "doubles";

export interface PlayerSession {
  readonly playerId: string;
  readonly gamesPlayed: number;
  readonly gamesSatOut: number;
  readonly lastSatRound: number;
  readonly teammates: ReadonlyMap<string, number>;
  readonly opponents: ReadonlyMap<string, number>;
}

export interface Matchup {
  readonly teamA: readonly string[];
  readonly teamB: readonly string[];
  readonly sittingOut: readonly string[];
}

export interface MatchmakingState {
  readonly players: readonly string[];
  readonly matchType: MatchType;
  readonly round: number;
  readonly playerSessions: ReadonlyMap<string, PlayerSession>;
}

export interface GenerateMatchupInput {
  readonly playerIds: readonly string[];
  readonly matchType: MatchType;
  readonly previousMatchups?: readonly Matchup[];
}
