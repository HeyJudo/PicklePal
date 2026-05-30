import { describe, it, expect } from "vitest";
import {
  createMatch,
  processRally,
  isMatchComplete,
  getMatchResult,
  getServerCourtSide,
  isSinglesState,
} from "../index";
import type { MatchState, RallyResult, SinglesMatchState } from "../types";

// ─── Test Helpers ────────────────────────────────────────────────────────────

function createDefaultSinglesMatch(
  startingServer: string = "alice",
): SinglesMatchState {
  const state = createMatch({
    matchType: "singles",
    teamAPlayerId: "alice",
    teamBPlayerId: "bob",
    startingServerPlayerId: startingServer,
  });
  if (!isSinglesState(state)) throw new Error("Expected singles state");
  return state;
}

/** Simulate N rallies where the same team wins every rally. */
function simulateRallies(
  state: MatchState,
  winner: "A" | "B",
  count: number,
): { state: MatchState; results: RallyResult[] } {
  let current = state;
  const results: RallyResult[] = [];
  for (let i = 0; i < count; i++) {
    const seq = i + 1;
    const result = processRally(current, winner, seq);
    results.push(result);
    current = result.newState;
  }
  return { state: current, results };
}

/** Simulate a specific sequence of rally winners. */
function simulateSequence(
  state: MatchState,
  winners: Array<"A" | "B">,
): { state: MatchState; results: RallyResult[] } {
  let current = state;
  const results: RallyResult[] = [];
  for (let i = 0; i < winners.length; i++) {
    const result = processRally(current, winners[i], i + 1);
    results.push(result);
    current = result.newState;
  }
  return { state: current, results };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Singles: createMatch", () => {
  it("creates initial state with correct defaults", () => {
    const state = createDefaultSinglesMatch();

    expect(state.config.matchType).toBe("singles");
    expect(state.config.targetScore).toBe(11);
    expect(state.config.winBy).toBe(2);
    expect(state.teamAScore).toBe(0);
    expect(state.teamBScore).toBe(0);
    expect(state.isComplete).toBe(false);
    expect(state.winner).toBeNull();
  });

  it("sets server and receiver correctly when Team A starts", () => {
    const state = createDefaultSinglesMatch("alice");

    expect(state.serverState.servingTeam).toBe("A");
    expect(state.serverState.serverPlayerId).toBe("alice");
    expect(state.serverState.receiverPlayerId).toBe("bob");
  });

  it("sets server and receiver correctly when Team B starts", () => {
    const state = createDefaultSinglesMatch("bob");

    expect(state.serverState.servingTeam).toBe("B");
    expect(state.serverState.serverPlayerId).toBe("bob");
    expect(state.serverState.receiverPlayerId).toBe("alice");
  });

  it("accepts custom target score and win-by", () => {
    const state = createMatch({
      matchType: "singles",
      teamAPlayerId: "alice",
      teamBPlayerId: "bob",
      startingServerPlayerId: "alice",
      targetScore: 15,
      winBy: 3,
    }) as SinglesMatchState;

    expect(state.config.targetScore).toBe(15);
    expect(state.config.winBy).toBe(3);
  });

  it("throws if starting server not a valid player", () => {
    expect(() =>
      createMatch({
        matchType: "singles",
        teamAPlayerId: "alice",
        teamBPlayerId: "bob",
        startingServerPlayerId: "unknown",
      }),
    ).toThrow();
  });
});

describe("Singles: Side-Out Scoring", () => {
  it("server scores → point increments, server stays", () => {
    const state = createDefaultSinglesMatch();
    const result = processRally(state, "A", 1);

    expect(result.scoringTeam).toBe("A");
    expect(result.sideOutOccurred).toBe(false);

    const newState = result.newState as SinglesMatchState;
    expect(newState.teamAScore).toBe(1);
    expect(newState.teamBScore).toBe(0);
    expect(newState.serverState.serverPlayerId).toBe("alice");
    expect(newState.serverState.servingTeam).toBe("A");
  });

  it("server loses → side-out, receiver becomes server", () => {
    const state = createDefaultSinglesMatch();
    const result = processRally(state, "B", 1);

    expect(result.scoringTeam).toBeNull();
    expect(result.sideOutOccurred).toBe(true);

    const newState = result.newState as SinglesMatchState;
    expect(newState.teamAScore).toBe(0);
    expect(newState.teamBScore).toBe(0);
    expect(newState.serverState.serverPlayerId).toBe("bob");
    expect(newState.serverState.receiverPlayerId).toBe("alice");
    expect(newState.serverState.servingTeam).toBe("B");
  });

  it("no points scored on side-out", () => {
    const state = createDefaultSinglesMatch();
    const result = processRally(state, "B", 1);
    const newState = result.newState as SinglesMatchState;

    expect(newState.teamAScore).toBe(0);
    expect(newState.teamBScore).toBe(0);
  });

  it("after side-out, new server can score", () => {
    const state = createDefaultSinglesMatch();

    // Side-out to B
    const r1 = processRally(state, "B", 1);
    const s1 = r1.newState as SinglesMatchState;
    expect(s1.serverState.servingTeam).toBe("B");

    // B scores
    const r2 = processRally(s1, "B", 2);
    const s2 = r2.newState as SinglesMatchState;
    expect(s2.teamBScore).toBe(1);
    expect(r2.scoringTeam).toBe("B");
  });
});

describe("Singles: Court Side (Score Parity)", () => {
  it("server on right court at score 0 (even)", () => {
    const state = createDefaultSinglesMatch();
    expect(getServerCourtSide(state)).toBe("right");
  });

  it("server on left court at score 1 (odd)", () => {
    const state = createDefaultSinglesMatch();
    const r1 = processRally(state, "A", 1);
    const s1 = r1.newState as SinglesMatchState;

    // A scored, now A has 1 point (odd) → left court
    expect(getServerCourtSide(s1)).toBe("left");
  });

  it("server on right court at score 2 (even)", () => {
    const state = createDefaultSinglesMatch();
    const r1 = processRally(state, "A", 1);
    const r2 = processRally(r1.newState, "A", 2);
    const s2 = r2.newState as SinglesMatchState;

    // A has 2 points (even) → right court
    expect(getServerCourtSide(s2)).toBe("right");
  });

  it("court side follows new server score after side-out", () => {
    const state = createDefaultSinglesMatch();

    // A scores 3 (odd → left)
    let current: MatchState = state;
    for (let i = 0; i < 3; i++) {
      current = processRally(current, "A", i + 1).newState;
    }

    // Side-out to B (B has 0 points → right court)
    const r = processRally(current, "B", 4);
    const afterSideOut = r.newState as SinglesMatchState;
    expect(afterSideOut.serverState.servingTeam).toBe("B");
    expect(getServerCourtSide(afterSideOut)).toBe("right"); // B score is 0
  });

  it("alternates correctly through multiple scores", () => {
    const state = createDefaultSinglesMatch();

    // A scores 5 times
    let current: MatchState = state;
    const expectedSides: Array<"right" | "left"> = [];

    for (let i = 0; i < 5; i++) {
      const s = current as SinglesMatchState;
      expectedSides.push(getServerCourtSide(s));
      current = processRally(current, "A", i + 1).newState;
    }

    // Score 0→right, 1→left, 2→right, 3→left, 4→right
    expect(expectedSides).toEqual(["right", "left", "right", "left", "right"]);
  });
});

describe("Singles: Win Condition", () => {
  it("game ends at 11-0 (shutout)", () => {
    const state = createDefaultSinglesMatch();
    const { state: final } = simulateRallies(state, "A", 11);

    expect(final.isComplete).toBe(true);
    expect(final.winner).toBe("A");
    expect(final.teamAScore).toBe(11);
    expect(final.teamBScore).toBe(0);
  });

  it("game does NOT end at target without win-by margin", () => {
    // Use target 5 for fast test
    const state = createMatch({
      matchType: "singles",
      teamAPlayerId: "alice",
      teamBPlayerId: "bob",
      startingServerPlayerId: "alice",
      targetScore: 5,
      winBy: 2,
    }) as SinglesMatchState;

    // A scores 4
    let current: MatchState = state;
    let seq = 0;
    for (let i = 0; i < 4; i++) {
      seq++;
      current = processRally(current, "A", seq).newState;
    }
    expect(current.teamAScore).toBe(4);

    // Side-out to B
    seq++;
    current = processRally(current, "B", seq).newState;

    // B scores 4
    for (let i = 0; i < 4; i++) {
      seq++;
      current = processRally(current, "B", seq).newState;
    }
    expect(current.teamBScore).toBe(4);

    // Side-out to A
    seq++;
    current = processRally(current, "A", seq).newState;

    // A scores to 5 → 5-4, NOT complete
    seq++;
    current = processRally(current, "A", seq).newState;
    expect(current.teamAScore).toBe(5);
    expect(current.teamBScore).toBe(4);
    expect(current.isComplete).toBe(false);

    // A scores to 6 → 6-4, complete (win by 2)
    seq++;
    current = processRally(current, "A", seq).newState;
    expect(current.teamAScore).toBe(6);
    expect(current.isComplete).toBe(true);
    expect(current.winner).toBe("A");
  });

  it("custom target score 15 works", () => {
    const state = createMatch({
      matchType: "singles",
      teamAPlayerId: "alice",
      teamBPlayerId: "bob",
      startingServerPlayerId: "alice",
      targetScore: 15,
      winBy: 2,
    }) as SinglesMatchState;

    const { state: final } = simulateRallies(state, "A", 15);
    expect(final.isComplete).toBe(true);
    expect(final.teamAScore).toBe(15);
  });

  it("custom target score 21 works", () => {
    const state = createMatch({
      matchType: "singles",
      teamAPlayerId: "alice",
      teamBPlayerId: "bob",
      startingServerPlayerId: "alice",
      targetScore: 21,
      winBy: 2,
    }) as SinglesMatchState;

    const { state: final } = simulateRallies(state, "A", 21);
    expect(final.isComplete).toBe(true);
    expect(final.teamAScore).toBe(21);
  });

  it("Team B can win", () => {
    const state = createDefaultSinglesMatch(); // A starts serving

    // Side-out to B, then B scores 11
    const winners: Array<"A" | "B"> = ["B"];
    for (let i = 0; i < 11; i++) winners.push("B");

    const { state: final } = simulateSequence(state, winners);

    expect(final.teamBScore).toBe(11);
    expect(final.isComplete).toBe(true);
    expect(final.winner).toBe("B");
  });
});

describe("Singles: Completed Match Behavior", () => {
  it("processRally on completed match is a no-op", () => {
    const state = createDefaultSinglesMatch();
    const { state: completed } = simulateRallies(state, "A", 11);

    const result = processRally(completed, "A", 99);
    expect(result.newState).toBe(completed);
    expect(result.scoringTeam).toBeNull();
    expect(result.sideOutOccurred).toBe(false);
  });

  it("getMatchResult returns correct result", () => {
    const state = createDefaultSinglesMatch();
    const { state: completed } = simulateRallies(state, "A", 11);

    const result = getMatchResult(completed, 11);
    expect(result).not.toBeNull();
    expect(result!.winner).toBe("A");
    expect(result!.loser).toBe("B");
    expect(result!.winnerScore).toBe(11);
    expect(result!.loserScore).toBe(0);
    expect(result!.totalRallies).toBe(11);
  });
});

describe("Singles: Immutability", () => {
  it("processRally does not mutate the input state", () => {
    const state = createDefaultSinglesMatch();
    const originalScore = state.teamAScore;
    const originalServer = state.serverState.serverPlayerId;

    processRally(state, "A", 1);

    expect(state.teamAScore).toBe(originalScore);
    expect(state.serverState.serverPlayerId).toBe(originalServer);
  });

  it("processRally returns a new state object", () => {
    const state = createDefaultSinglesMatch();
    const result = processRally(state, "A", 1);
    expect(result.newState).not.toBe(state);
  });
});

describe("Singles: Full Game Simulation", () => {
  it("simulates a realistic back-and-forth game", () => {
    const state = createDefaultSinglesMatch();

    // A scores 5, side-out, B scores 4, side-out, A scores to 11
    const winners: Array<"A" | "B"> = [];

    // A scores 5
    for (let i = 0; i < 5; i++) winners.push("A");
    // Side-out to B
    winners.push("B");
    // B scores 4
    for (let i = 0; i < 4; i++) winners.push("B");
    // Side-out to A
    winners.push("A");
    // A scores 6 more to reach 11
    for (let i = 0; i < 6; i++) winners.push("A");

    const { state: final } = simulateSequence(state, winners);

    expect(final.teamAScore).toBe(11);
    expect(final.teamBScore).toBe(4);
    expect(final.isComplete).toBe(true);
    expect(final.winner).toBe("A");
  });

  it("multiple side-outs in a row (no scoring)", () => {
    const state = createDefaultSinglesMatch();

    // Alternating side-outs: A loses, B loses, A loses, B loses
    const winners: Array<"A" | "B"> = ["B", "A", "B", "A"];
    const { state: final } = simulateSequence(state, winners);

    // No points scored — just side-outs
    expect(final.teamAScore).toBe(0);
    expect(final.teamBScore).toBe(0);
    expect(final.isComplete).toBe(false);

    // Server should be back to A (started A → B → A → B → A)
    const s = final as SinglesMatchState;
    expect(s.serverState.servingTeam).toBe("A");
  });
});
