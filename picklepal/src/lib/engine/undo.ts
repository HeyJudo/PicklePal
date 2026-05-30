/**
 * Undo Support for the Scoring Engine
 *
 * Undo works by replaying all rally events except the last one
 * from the initial match state. This guarantees correctness since
 * processRally is a pure function.
 */

import type {
  CreateMatchInput,
  MatchState,
  RallyResult,
  Team,
} from "./types";
import { createMatch, processRally } from "./engine";

export interface MatchHistory {
  readonly initialInput: CreateMatchInput;
  readonly rallyWinners: readonly Team[];
  readonly currentState: MatchState;
}

/**
 * Create a new match history (starting point for tracking undo).
 */
export function createMatchHistory(input: CreateMatchInput): MatchHistory {
  return {
    initialInput: input,
    rallyWinners: [],
    currentState: createMatch(input),
  };
}

/**
 * Record a rally and return updated history.
 */
export function recordRally(
  history: MatchHistory,
  rallyWinner: Team,
): { history: MatchHistory; result: RallyResult } {
  const sequenceNumber = history.rallyWinners.length + 1;
  const result = processRally(history.currentState, rallyWinner, sequenceNumber);

  const newHistory: MatchHistory = {
    initialInput: history.initialInput,
    rallyWinners: [...history.rallyWinners, rallyWinner],
    currentState: result.newState,
  };

  return { history: newHistory, result };
}

/**
 * Undo the last rally. Returns the previous state.
 * If no rallies have been played, returns the same history (no-op).
 */
export function undoRally(history: MatchHistory): MatchHistory {
  if (history.rallyWinners.length === 0) {
    return history;
  }

  const previousWinners = history.rallyWinners.slice(0, -1);
  const replayedState = replayFromStart(history.initialInput, previousWinners);

  return {
    initialInput: history.initialInput,
    rallyWinners: previousWinners,
    currentState: replayedState,
  };
}

/**
 * Undo multiple rallies at once.
 * If count exceeds rally count, returns to initial state.
 */
export function undoMultiple(history: MatchHistory, count: number): MatchHistory {
  const targetLength = Math.max(0, history.rallyWinners.length - count);
  const previousWinners = history.rallyWinners.slice(0, targetLength);
  const replayedState = replayFromStart(history.initialInput, previousWinners);

  return {
    initialInput: history.initialInput,
    rallyWinners: previousWinners,
    currentState: replayedState,
  };
}

/**
 * Check if undo is possible (at least one rally has been played).
 */
export function canUndo(history: MatchHistory): boolean {
  return history.rallyWinners.length > 0;
}

/**
 * Get the number of rallies that can be undone.
 */
export function undoDepth(history: MatchHistory): number {
  return history.rallyWinners.length;
}

// ─── Internal ────────────────────────────────────────────────────────────────

function replayFromStart(
  input: CreateMatchInput,
  rallyWinners: readonly Team[],
): MatchState {
  let state = createMatch(input);

  for (let i = 0; i < rallyWinners.length; i++) {
    const result = processRally(state, rallyWinners[i], i + 1);
    state = result.newState;
  }

  return state;
}
