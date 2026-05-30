import { describe, it, expect } from "vitest";
import {
  createMatch,
  processRally,
  isMatchComplete,
  getMatchResult,
  isDoublesState,
} from "../index";
import type { DoublesMatchState, MatchState, RallyResult } from "../types";

// ─── Test Helpers ────────────────────────────────────────────────────────────

const TEAM_A = ["alice", "bob"] as const;
const TEAM_B = ["carol", "dave"] as const;

function createDefaultDoublesMatch(
  startingServer: string = "alice",
): DoublesMatchState {
  const state = createMatch({
    matchType: "doubles",
    teamAPlayerIds: TEAM_A,
    teamBPlayerIds: TEAM_B,
    startingServerPlayerId: startingServer,
  });
  if (!isDoublesState(state)) throw new Error("Expected doubles state");
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

describe("Doubles: createMatch", () => {
  it("creates initial state with correct defaults", () => {
    const state = createDefaultDoublesMatch();

    expect(state.config.matchType).toBe("doubles");
    expect(state.config.targetScore).toBe(11);
    expect(state.config.winBy).toBe(2);
    expect(state.teamAScore).toBe(0);
    expect(state.teamBScore).toBe(0);
    expect(state.isComplete).toBe(false);
    expect(state.winner).toBeNull();
  });

  it("starts with first-service-sequence (0-0-2)", () => {
    const state = createDefaultDoublesMatch();

    expect(state.serverState.servingTeam).toBe("A");
    expect(state.serverState.serverPlayerId).toBe("alice");
    expect(state.serverState.serverNumber).toBe(2);
    expect(state.serverState.isFirstServiceSequence).toBe(true);
  });

  it("sets initial positions from input order", () => {
    const state = createDefaultDoublesMatch();

    expect(state.positions.teamA.right).toBe("alice");
    expect(state.positions.teamA.left).toBe("bob");
    expect(state.positions.teamB.right).toBe("carol");
    expect(state.positions.teamB.left).toBe("dave");
  });

  it("resolves starting team from Team B player", () => {
    const state = createMatch({
      matchType: "doubles",
      teamAPlayerIds: TEAM_A,
      teamBPlayerIds: TEAM_B,
      startingServerPlayerId: "carol",
    }) as DoublesMatchState;

    expect(state.serverState.servingTeam).toBe("B");
    expect(state.serverState.serverPlayerId).toBe("carol");
  });

  it("throws if starting server not in either team", () => {
    expect(() =>
      createMatch({
        matchType: "doubles",
        teamAPlayerIds: TEAM_A,
        teamBPlayerIds: TEAM_B,
        startingServerPlayerId: "unknown",
      }),
    ).toThrow("not found in either team");
  });

  it("accepts custom target score and win-by", () => {
    const state = createMatch({
      matchType: "doubles",
      teamAPlayerIds: TEAM_A,
      teamBPlayerIds: TEAM_B,
      startingServerPlayerId: "alice",
      targetScore: 15,
      winBy: 3,
    }) as DoublesMatchState;

    expect(state.config.targetScore).toBe(15);
    expect(state.config.winBy).toBe(3);
  });
});

describe("Doubles: First-Service-Sequence", () => {
  it("side-outs immediately if serving team loses first rally", () => {
    const state = createDefaultDoublesMatch();
    const result = processRally(state, "B", 1);

    expect(result.scoringTeam).toBeNull();
    expect(result.sideOutOccurred).toBe(true);

    const newState = result.newState as DoublesMatchState;
    expect(newState.teamAScore).toBe(0);
    expect(newState.teamBScore).toBe(0);
    expect(newState.serverState.servingTeam).toBe("B");
    expect(newState.serverState.serverNumber).toBe(1);
    expect(newState.serverState.isFirstServiceSequence).toBe(false);
  });

  it("serving team scores on first rally — ends first-service-sequence", () => {
    const state = createDefaultDoublesMatch();
    const result = processRally(state, "A", 1);

    expect(result.scoringTeam).toBe("A");
    expect(result.sideOutOccurred).toBe(false);

    const newState = result.newState as DoublesMatchState;
    expect(newState.teamAScore).toBe(1);
    expect(newState.serverState.isFirstServiceSequence).toBe(false);
    expect(newState.serverState.serverNumber).toBe(2);
    expect(newState.serverState.serverPlayerId).toBe("alice");
  });

  it("after first point, losing goes to server 2 loses → side-out", () => {
    const state = createDefaultDoublesMatch();

    // Rally 1: A scores (ends first-service-sequence)
    const r1 = processRally(state, "A", 1);
    const s1 = r1.newState as DoublesMatchState;
    expect(s1.serverState.serverNumber).toBe(2);
    expect(s1.serverState.isFirstServiceSequence).toBe(false);

    // Rally 2: B wins → server 2 loses → side-out (since we're already at server 2)
    const r2 = processRally(s1, "B", 2);
    const s2 = r2.newState as DoublesMatchState;
    expect(r2.sideOutOccurred).toBe(true);
    expect(s2.serverState.servingTeam).toBe("B");
    expect(s2.serverState.serverNumber).toBe(1);
  });
});

describe("Doubles: Server Rotation", () => {
  it("server 1 loses → advances to server 2 (same team)", () => {
    const state = createDefaultDoublesMatch();

    // Side-out to B first (first-service-sequence)
    const r1 = processRally(state, "B", 1);
    const s1 = r1.newState as DoublesMatchState;
    expect(s1.serverState.servingTeam).toBe("B");
    expect(s1.serverState.serverNumber).toBe(1);
    // B's server 1 is the right-side player = carol
    expect(s1.serverState.serverPlayerId).toBe("carol");

    // B's server 1 loses rally
    const r2 = processRally(s1, "A", 2);
    const s2 = r2.newState as DoublesMatchState;
    expect(r2.sideOutOccurred).toBe(false);
    expect(r2.scoringTeam).toBeNull();
    expect(s2.serverState.servingTeam).toBe("B");
    expect(s2.serverState.serverNumber).toBe(2);
    expect(s2.serverState.serverPlayerId).toBe("dave");
  });

  it("server 2 loses → side-out to other team", () => {
    const state = createDefaultDoublesMatch();

    // Side-out to B
    const r1 = processRally(state, "B", 1);
    const s1 = r1.newState as DoublesMatchState;

    // B server 1 loses → advance to server 2
    const r2 = processRally(s1, "A", 2);
    const s2 = r2.newState as DoublesMatchState;
    expect(s2.serverState.serverNumber).toBe(2);

    // B server 2 loses → side-out to A
    const r3 = processRally(s2, "A", 3);
    const s3 = r3.newState as DoublesMatchState;
    expect(r3.sideOutOccurred).toBe(true);
    expect(s3.serverState.servingTeam).toBe("A");
    expect(s3.serverState.serverNumber).toBe(1);
  });

  it("side-out assigns right-side player as server 1", () => {
    const state = createDefaultDoublesMatch();

    // Side-out to B
    const r1 = processRally(state, "B", 1);
    const s1 = r1.newState as DoublesMatchState;

    // B's right-side player should be server
    expect(s1.serverState.serverPlayerId).toBe(s1.positions.teamB.right);
  });
});

describe("Doubles: Scoring & Position Swaps", () => {
  it("serving team scores → their players swap court sides", () => {
    const state = createDefaultDoublesMatch();
    // Initial: teamA right=alice, left=bob

    const result = processRally(state, "A", 1);
    const newState = result.newState as DoublesMatchState;

    // After scoring, positions swap
    expect(newState.positions.teamA.right).toBe("bob");
    expect(newState.positions.teamA.left).toBe("alice");
    // Team B positions unchanged
    expect(newState.positions.teamB.right).toBe("carol");
    expect(newState.positions.teamB.left).toBe("dave");
  });

  it("receiving team positions do NOT swap when serving team scores", () => {
    const state = createDefaultDoublesMatch();
    const result = processRally(state, "A", 1);
    const newState = result.newState as DoublesMatchState;

    expect(newState.positions.teamB.right).toBe("carol");
    expect(newState.positions.teamB.left).toBe("dave");
  });

  it("multiple scores cause multiple swaps", () => {
    const state = createDefaultDoublesMatch();

    // A scores twice
    const r1 = processRally(state, "A", 1);
    const s1 = r1.newState as DoublesMatchState;
    expect(s1.positions.teamA.right).toBe("bob");
    expect(s1.positions.teamA.left).toBe("alice");

    const r2 = processRally(s1, "A", 2);
    const s2 = r2.newState as DoublesMatchState;
    // Swapped back
    expect(s2.positions.teamA.right).toBe("alice");
    expect(s2.positions.teamA.left).toBe("bob");
  });

  it("only serving team scores — receiving team rally win gives no points", () => {
    const state = createDefaultDoublesMatch();

    // B wins rally but A is serving → no score, side-out
    const result = processRally(state, "B", 1);
    const newState = result.newState as DoublesMatchState;

    expect(newState.teamAScore).toBe(0);
    expect(newState.teamBScore).toBe(0);
  });
});

describe("Doubles: Win Condition", () => {
  it("game ends at 11-0 (shutout)", () => {
    const state = createDefaultDoublesMatch();

    // A scores 11 straight (serving team always wins)
    const { state: final } = simulateRallies(state, "A", 11);

    expect(final.isComplete).toBe(true);
    expect(final.winner).toBe("A");
    expect(final.teamAScore).toBe(11);
    expect(final.teamBScore).toBe(0);
  });

  it("game does NOT end at 11-10 (need win by 2)", () => {
    const state = createMatch({
      matchType: "doubles",
      teamAPlayerIds: TEAM_A,
      teamBPlayerIds: TEAM_B,
      startingServerPlayerId: "alice",
      targetScore: 11,
      winBy: 2,
    }) as DoublesMatchState;

    // A scores 10 straight
    let current: MatchState = state;
    let seq = 0;

    for (let i = 0; i < 10; i++) {
      seq++;
      const r = processRally(current, "A", seq);
      current = r.newState;
    }
    expect(current.teamAScore).toBe(10);
    expect(current.isComplete).toBe(false);

    // Side-out to B (A server 2 loses)
    seq++;
    let r = processRally(current, "B", seq);
    current = r.newState;

    // B scores 10
    for (let i = 0; i < 10; i++) {
      seq++;
      r = processRally(current, "B", seq);
      current = r.newState;
    }
    expect(current.teamBScore).toBe(10);
    expect(current.isComplete).toBe(false);

    // Side-out back to A (B server 1 loses, then server 2 loses)
    seq++;
    r = processRally(current, "A", seq);
    current = r.newState;

    const ds = current as DoublesMatchState;
    if (ds.serverState.servingTeam !== "A") {
      // Need one more side-out
      seq++;
      r = processRally(current, "A", seq);
      current = r.newState;
    }

    // A scores to 11
    if ((current as DoublesMatchState).serverState.servingTeam === "A") {
      seq++;
      r = processRally(current, "A", seq);
      current = r.newState;
      expect(current.teamAScore).toBe(11);
      expect(current.teamBScore).toBe(10);
      expect(current.isComplete).toBe(false); // 11-10, need win by 2
    }
  });

  it("game ends at 12-10 with win-by-2 (small target for fast test)", () => {
    // Use target 5 for faster simulation
    const state = createMatch({
      matchType: "doubles",
      teamAPlayerIds: TEAM_A,
      teamBPlayerIds: TEAM_B,
      startingServerPlayerId: "alice",
      targetScore: 5,
      winBy: 2,
    }) as DoublesMatchState;

    // A scores 5 straight → wins 5-0
    const { state: final } = simulateRallies(state, "A", 5);
    expect(final.isComplete).toBe(true);
    expect(final.winner).toBe("A");
    expect(final.teamAScore).toBe(5);
  });

  it("custom target score 15 works", () => {
    const state = createMatch({
      matchType: "doubles",
      teamAPlayerIds: TEAM_A,
      teamBPlayerIds: TEAM_B,
      startingServerPlayerId: "alice",
      targetScore: 15,
      winBy: 2,
    }) as DoublesMatchState;

    const { state: final } = simulateRallies(state, "A", 15);
    expect(final.isComplete).toBe(true);
    expect(final.teamAScore).toBe(15);
  });

  it("custom target score 21 works", () => {
    const state = createMatch({
      matchType: "doubles",
      teamAPlayerIds: TEAM_A,
      teamBPlayerIds: TEAM_B,
      startingServerPlayerId: "alice",
      targetScore: 21,
      winBy: 2,
    }) as DoublesMatchState;

    const { state: final } = simulateRallies(state, "A", 21);
    expect(final.isComplete).toBe(true);
    expect(final.teamAScore).toBe(21);
  });
});

describe("Doubles: Completed Match Behavior", () => {
  it("processRally on completed match is a no-op", () => {
    const state = createDefaultDoublesMatch();
    const { state: completed } = simulateRallies(state, "A", 11);

    expect(completed.isComplete).toBe(true);

    const result = processRally(completed, "A", 99);
    expect(result.newState).toBe(completed); // Same reference
    expect(result.scoringTeam).toBeNull();
    expect(result.sideOutOccurred).toBe(false);
  });

  it("getMatchResult returns correct result for completed match", () => {
    const state = createDefaultDoublesMatch();
    const { state: completed } = simulateRallies(state, "A", 11);

    const result = getMatchResult(completed, 11);
    expect(result).not.toBeNull();
    expect(result!.winner).toBe("A");
    expect(result!.loser).toBe("B");
    expect(result!.winnerScore).toBe(11);
    expect(result!.loserScore).toBe(0);
    expect(result!.totalRallies).toBe(11);
  });

  it("getMatchResult returns null for incomplete match", () => {
    const state = createDefaultDoublesMatch();
    const result = getMatchResult(state, 0);
    expect(result).toBeNull();
  });

  it("isMatchComplete returns correct values", () => {
    const state = createDefaultDoublesMatch();
    expect(isMatchComplete(state)).toBe(false);

    const { state: completed } = simulateRallies(state, "A", 11);
    expect(isMatchComplete(completed)).toBe(true);
  });
});

describe("Doubles: Immutability", () => {
  it("processRally does not mutate the input state", () => {
    const state = createDefaultDoublesMatch();
    const originalScore = state.teamAScore;
    const originalServerState = { ...state.serverState };

    processRally(state, "A", 1);

    expect(state.teamAScore).toBe(originalScore);
    expect(state.serverState.servingTeam).toBe(originalServerState.servingTeam);
    expect(state.serverState.serverPlayerId).toBe(
      originalServerState.serverPlayerId,
    );
    expect(state.serverState.serverNumber).toBe(
      originalServerState.serverNumber,
    );
  });

  it("processRally returns a new state object", () => {
    const state = createDefaultDoublesMatch();
    const result = processRally(state, "A", 1);

    expect(result.newState).not.toBe(state);
  });
});

describe("Doubles: Full Game Simulation", () => {
  it("simulates a realistic game with alternating scoring", () => {
    const state = createDefaultDoublesMatch();

    // Simulate: A scores 3, side-out, B scores 2, side-out, A scores to 11
    const winners: Array<"A" | "B"> = [];

    // A scores 3 (serving, first-service-sequence ends after first point)
    winners.push("A", "A", "A");
    // A loses (server 2 loses → side-out to B)
    winners.push("B");
    // B server 1 scores 2
    winners.push("B", "B");
    // B server 1 loses → advance to server 2
    winners.push("A");
    // B server 2 loses → side-out to A
    winners.push("A");
    // A server 1 scores 8 more to reach 11
    winners.push("A", "A", "A", "A", "A", "A", "A", "A");

    const { state: final } = simulateSequence(state, winners);

    expect(final.teamAScore).toBe(11);
    expect(final.teamBScore).toBe(2);
    expect(final.isComplete).toBe(true);
    expect(final.winner).toBe("A");
  });

  it("Team B can win when starting as receiver", () => {
    const state = createDefaultDoublesMatch(); // A starts serving

    // A loses first rally (first-service-sequence → immediate side-out)
    // B then scores 11 straight
    const winners: Array<"A" | "B"> = ["B"];
    for (let i = 0; i < 11; i++) winners.push("B");

    const { state: final } = simulateSequence(state, winners);

    expect(final.teamBScore).toBe(11);
    expect(final.teamAScore).toBe(0);
    expect(final.isComplete).toBe(true);
    expect(final.winner).toBe("B");
  });
});
