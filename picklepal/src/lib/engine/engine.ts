/**
 * Pickleball Scoring Engine
 *
 * Pure functions for match state transitions.
 * No React, no Supabase, no side effects.
 *
 * Core API:
 *   createMatch(input) → MatchState
 *   processRally(state, rallyWinner) → RallyResult
 *   isMatchComplete(state) → boolean
 *   getMatchResult(state, totalRallies) → MatchResult
 */

import type {
  CreateDoublesMatchInput,
  CreateMatchInput,
  CreateSinglesMatchInput,
  DoublesMatchState,
  DoublesPositions,
  DoublesServerState,
  MatchResult,
  MatchState,
  RallyResult,
  SinglesMatchState,
  SinglesServerState,
  Team,
} from "./types";
import { isDoublesState } from "./types";

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_TARGET_SCORE = 11;
const DEFAULT_WIN_BY = 2;

// ─── Create Match ────────────────────────────────────────────────────────────

export function createMatch(input: CreateMatchInput): MatchState {
  if (input.matchType === "doubles") {
    return createDoublesMatch(input);
  }
  return createSinglesMatch(input);
}

function createDoublesMatch(input: CreateDoublesMatchInput): DoublesMatchState {
  const targetScore = input.targetScore ?? DEFAULT_TARGET_SCORE;
  const winBy = input.winBy ?? DEFAULT_WIN_BY;

  const startingTeam = resolveStartingTeam(
    input.startingServerPlayerId,
    input.teamAPlayerIds,
    input.teamBPlayerIds,
  );

  const serverState: DoublesServerState = {
    servingTeam: startingTeam,
    serverPlayerId: input.startingServerPlayerId,
    // Game starts at 0-0-2 (first-service-sequence)
    serverNumber: 2,
    isFirstServiceSequence: true,
  };

  const positions: DoublesPositions = {
    teamA: { right: input.teamAPlayerIds[0], left: input.teamAPlayerIds[1] },
    teamB: { right: input.teamBPlayerIds[0], left: input.teamBPlayerIds[1] },
  };

  return {
    config: { matchType: "doubles", targetScore, winBy },
    teamAScore: 0,
    teamBScore: 0,
    serverState,
    positions,
    teamAPlayerIds: input.teamAPlayerIds,
    teamBPlayerIds: input.teamBPlayerIds,
    isComplete: false,
    winner: null,
  };
}

function createSinglesMatch(input: CreateSinglesMatchInput): SinglesMatchState {
  const targetScore = input.targetScore ?? DEFAULT_TARGET_SCORE;
  const winBy = input.winBy ?? DEFAULT_WIN_BY;

  if (
    input.startingServerPlayerId !== input.teamAPlayerId &&
    input.startingServerPlayerId !== input.teamBPlayerId
  ) {
    throw new Error(
      `Starting server player "${input.startingServerPlayerId}" not found in either team`,
    );
  }

  const isTeamA = input.startingServerPlayerId === input.teamAPlayerId;
  const startingTeam: Team = isTeamA ? "A" : "B";

  const serverState: SinglesServerState = {
    servingTeam: startingTeam,
    serverPlayerId: input.startingServerPlayerId,
    receiverPlayerId: isTeamA ? input.teamBPlayerId : input.teamAPlayerId,
  };

  return {
    config: { matchType: "singles", targetScore, winBy },
    teamAScore: 0,
    teamBScore: 0,
    serverState,
    teamAPlayerId: input.teamAPlayerId,
    teamBPlayerId: input.teamBPlayerId,
    isComplete: false,
    winner: null,
  };
}

// ─── Process Rally ───────────────────────────────────────────────────────────

export function processRally(
  state: MatchState,
  rallyWinner: Team,
  sequenceNumber: number,
): RallyResult {
  if (state.isComplete) {
    return {
      newState: state,
      scoringTeam: null,
      sideOutOccurred: false,
      sequenceNumber,
    };
  }

  if (isDoublesState(state)) {
    return processDoublesRally(state, rallyWinner, sequenceNumber);
  }
  return processSinglesRally(state, rallyWinner, sequenceNumber);
}

function processDoublesRally(
  state: DoublesMatchState,
  rallyWinner: Team,
  sequenceNumber: number,
): RallyResult {
  const { serverState } = state;
  const servingTeam = serverState.servingTeam;

  // Serving team wins the rally → they score a point
  if (rallyWinner === servingTeam) {
    const newScoreA = state.teamAScore + (servingTeam === "A" ? 1 : 0);
    const newScoreB = state.teamBScore + (servingTeam === "B" ? 1 : 0);

    // Serving team players swap court sides when they score
    const newPositions = swapServingTeamPositions(state.positions, servingTeam);

    const newState: DoublesMatchState = {
      ...state,
      teamAScore: newScoreA,
      teamBScore: newScoreB,
      positions: newPositions,
      serverState: {
        ...serverState,
        // First-service-sequence ends after first point scored
        isFirstServiceSequence: false,
      },
      ...checkWinCondition(
        newScoreA,
        newScoreB,
        state.config.targetScore,
        state.config.winBy,
      ),
    };

    return {
      newState,
      scoringTeam: servingTeam,
      sideOutOccurred: false,
      sequenceNumber,
    };
  }

  // Receiving team wins the rally → no point scored, server transition
  if (serverState.isFirstServiceSequence) {
    // First-service-sequence: only one server before first side-out
    // Side-out immediately (skip server 2)
    const newServerState = sideOut(state);

    const newState: DoublesMatchState = {
      ...state,
      serverState: newServerState,
    };

    return {
      newState,
      scoringTeam: null,
      sideOutOccurred: true,
      sequenceNumber,
    };
  }

  if (serverState.serverNumber === 1) {
    // Server 1 loses → advance to server 2
    const server2PlayerId = getTeamPartner(
      serverState.serverPlayerId,
      servingTeam === "A" ? state.teamAPlayerIds : state.teamBPlayerIds,
    );

    const newServerState: DoublesServerState = {
      servingTeam,
      serverPlayerId: server2PlayerId,
      serverNumber: 2,
      isFirstServiceSequence: false,
    };

    const newState: DoublesMatchState = {
      ...state,
      serverState: newServerState,
    };

    return {
      newState,
      scoringTeam: null,
      sideOutOccurred: false,
      sequenceNumber,
    };
  }

  // Server 2 loses → side-out
  const newServerState = sideOut(state);

  const newState: DoublesMatchState = {
    ...state,
    serverState: newServerState,
  };

  return {
    newState,
    scoringTeam: null,
    sideOutOccurred: true,
    sequenceNumber,
  };
}

function processSinglesRally(
  state: SinglesMatchState,
  rallyWinner: Team,
  sequenceNumber: number,
): RallyResult {
  const { serverState } = state;
  const servingTeam = serverState.servingTeam;

  // Serving team wins → they score
  if (rallyWinner === servingTeam) {
    const newScoreA = state.teamAScore + (servingTeam === "A" ? 1 : 0);
    const newScoreB = state.teamBScore + (servingTeam === "B" ? 1 : 0);

    // Server stays, no receiver change — court side is derived from score
    const newState: SinglesMatchState = {
      ...state,
      teamAScore: newScoreA,
      teamBScore: newScoreB,
      ...checkWinCondition(
        newScoreA,
        newScoreB,
        state.config.targetScore,
        state.config.winBy,
      ),
    };

    return {
      newState,
      scoringTeam: servingTeam,
      sideOutOccurred: false,
      sequenceNumber,
    };
  }

  // Receiving team wins → side-out (no point)
  const newServerState: SinglesServerState = {
    servingTeam: servingTeam === "A" ? "B" : "A",
    serverPlayerId: serverState.receiverPlayerId,
    receiverPlayerId: serverState.serverPlayerId,
  };

  const newState: SinglesMatchState = {
    ...state,
    serverState: newServerState,
  };

  return {
    newState,
    scoringTeam: null,
    sideOutOccurred: true,
    sequenceNumber,
  };
}

// ─── Query Functions ─────────────────────────────────────────────────────────

export function isMatchComplete(state: MatchState): boolean {
  return state.isComplete;
}

export function getMatchResult(
  state: MatchState,
  totalRallies: number,
): MatchResult | null {
  if (!state.isComplete || state.winner === null) {
    return null;
  }

  const winner = state.winner;
  const loser: Team = winner === "A" ? "B" : "A";

  return {
    winner,
    loser,
    winnerScore: winner === "A" ? state.teamAScore : state.teamBScore,
    loserScore: loser === "A" ? state.teamAScore : state.teamBScore,
    totalRallies,
  };
}

/**
 * Get the court side the server should be on (singles).
 * Even score = right court, odd score = left court.
 */
export function getServerCourtSide(state: SinglesMatchState): "right" | "left" {
  const serverScore =
    state.serverState.servingTeam === "A"
      ? state.teamAScore
      : state.teamBScore;
  return serverScore % 2 === 0 ? "right" : "left";
}

// ─── Helpers (private) ───────────────────────────────────────────────────────

function resolveStartingTeam(
  startingServerPlayerId: string,
  teamAPlayerIds: readonly [string, string],
  teamBPlayerIds: readonly [string, string],
): Team {
  if (teamAPlayerIds.includes(startingServerPlayerId)) return "A";
  if (teamBPlayerIds.includes(startingServerPlayerId)) return "B";
  throw new Error(
    `Starting server player "${startingServerPlayerId}" not found in either team`,
  );
}

function checkWinCondition(
  scoreA: number,
  scoreB: number,
  targetScore: number,
  winBy: number,
): { isComplete: boolean; winner: Team | null } {
  if (scoreA >= targetScore && scoreA - scoreB >= winBy) {
    return { isComplete: true, winner: "A" };
  }
  if (scoreB >= targetScore && scoreB - scoreA >= winBy) {
    return { isComplete: true, winner: "B" };
  }
  return { isComplete: false, winner: null };
}

function swapServingTeamPositions(
  positions: DoublesPositions,
  servingTeam: Team,
): DoublesPositions {
  if (servingTeam === "A") {
    return {
      ...positions,
      teamA: { right: positions.teamA.left, left: positions.teamA.right },
    };
  }
  return {
    ...positions,
    teamB: { right: positions.teamB.left, left: positions.teamB.right },
  };
}

function sideOut(state: DoublesMatchState): DoublesServerState {
  const receivingTeam: Team =
    state.serverState.servingTeam === "A" ? "B" : "A";

  // The player on the right side of the receiving team becomes server 1
  const receivingPositions =
    receivingTeam === "A" ? state.positions.teamA : state.positions.teamB;
  const newServerPlayerId = receivingPositions.right;

  return {
    servingTeam: receivingTeam,
    serverPlayerId: newServerPlayerId,
    serverNumber: 1,
    isFirstServiceSequence: false,
  };
}

function getTeamPartner(
  playerId: string,
  teamPlayerIds: readonly [string, string],
): string {
  return teamPlayerIds[0] === playerId ? teamPlayerIds[1] : teamPlayerIds[0];
}
