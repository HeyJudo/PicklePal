/**
 * Scoring Engine Types
 *
 * Pure TypeScript types for the pickleball scoring state machine.
 * No React, no Supabase, no framework dependencies.
 */

// ─── Enums & Literals ────────────────────────────────────────────────────────

export type Team = "A" | "B";
export type MatchType = "singles" | "doubles";
export type ServerNumber = 1 | 2;
export type CourtSide = "left" | "right";

// ─── Match Configuration ─────────────────────────────────────────────────────

export interface MatchConfig {
  readonly matchType: MatchType;
  readonly targetScore: number;
  readonly winBy: number;
}

// ─── Player Positions (Doubles) ──────────────────────────────────────────────

export interface DoublesPositions {
  /** Team A player on the right (even) court side */
  readonly teamA: { readonly right: string; readonly left: string };
  /** Team B player on the right (even) court side */
  readonly teamB: { readonly right: string; readonly left: string };
}

// ─── Server State ────────────────────────────────────────────────────────────

export interface DoublesServerState {
  readonly servingTeam: Team;
  readonly serverPlayerId: string;
  readonly serverNumber: ServerNumber;
  /** True only at game start (0-0-2 rule) */
  readonly isFirstServiceSequence: boolean;
}

export interface SinglesServerState {
  readonly servingTeam: Team;
  readonly serverPlayerId: string;
  readonly receiverPlayerId: string;
}

// ─── Match State ─────────────────────────────────────────────────────────────

export interface DoublesMatchState {
  readonly config: MatchConfig;
  readonly teamAScore: number;
  readonly teamBScore: number;
  readonly serverState: DoublesServerState;
  readonly positions: DoublesPositions;
  readonly teamAPlayerIds: readonly [string, string];
  readonly teamBPlayerIds: readonly [string, string];
  readonly isComplete: boolean;
  readonly winner: Team | null;
}

export interface SinglesMatchState {
  readonly config: MatchConfig;
  readonly teamAScore: number;
  readonly teamBScore: number;
  readonly serverState: SinglesServerState;
  readonly teamAPlayerId: string;
  readonly teamBPlayerId: string;
  readonly isComplete: boolean;
  readonly winner: Team | null;
}

export type MatchState = DoublesMatchState | SinglesMatchState;

// ─── Rally Result ────────────────────────────────────────────────────────────

export interface RallyResult {
  readonly newState: MatchState;
  readonly scoringTeam: Team | null;
  readonly sideOutOccurred: boolean;
  readonly sequenceNumber: number;
}

// ─── Match Result (final) ────────────────────────────────────────────────────

export interface MatchResult {
  readonly winner: Team;
  readonly loser: Team;
  readonly winnerScore: number;
  readonly loserScore: number;
  readonly totalRallies: number;
}

// ─── Create Match Inputs ─────────────────────────────────────────────────────

export interface CreateDoublesMatchInput {
  readonly matchType: "doubles";
  readonly targetScore?: number;
  readonly winBy?: number;
  /** [rightCourtPlayer, leftCourtPlayer] */
  readonly teamAPlayerIds: readonly [string, string];
  /** [rightCourtPlayer, leftCourtPlayer] */
  readonly teamBPlayerIds: readonly [string, string];
  /** Which player serves first */
  readonly startingServerPlayerId: string;
}

export interface CreateSinglesMatchInput {
  readonly matchType: "singles";
  readonly targetScore?: number;
  readonly winBy?: number;
  readonly teamAPlayerId: string;
  readonly teamBPlayerId: string;
  /** Which player serves first */
  readonly startingServerPlayerId: string;
}

export type CreateMatchInput = CreateDoublesMatchInput | CreateSinglesMatchInput;

// ─── Type Guards ─────────────────────────────────────────────────────────────

export function isDoublesState(state: MatchState): state is DoublesMatchState {
  return state.config.matchType === "doubles";
}

export function isSinglesState(state: MatchState): state is SinglesMatchState {
  return state.config.matchType === "singles";
}
