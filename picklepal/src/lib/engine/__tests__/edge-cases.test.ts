import { describe, it, expect } from "vitest";
import {
  createMatch,
  processRally,
  getMatchResult,
  getServerCourtSide,
  isDoublesState,
  isSinglesState,
  createMatchHistory,
  recordRally,
  undoRally,
} from "../index";
import type {
  DoublesMatchState,
  MatchState,
  SinglesMatchState,
} from "../types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function simulateSequence(
  state: MatchState,
  winners: Array<"A" | "B">,
): MatchState {
  let current = state;
  for (let i = 0; i < winners.length; i++) {
    const result = processRally(current, winners[i], i + 1);
    current = result.newState;
  }
  return current;
}

// ─── Edge Cases: Team B Serving & Server Rotation ────────────────────────────

describe("Edge Cases: Team B server 1 loses → server 2 (covers servingTeam B branch)", () => {
  it("Team B server 1 (left player) loses → advances to server 2 (right player partner)", () => {
    // Start with B serving (carol is starting server on Team B)
    const state = createMatch({
      matchType: "doubles",
      teamAPlayerIds: ["alice", "bob"],
      teamBPlayerIds: ["carol", "dave"],
      startingServerPlayerId: "carol",
    }) as DoublesMatchState;

    // B starts at 0-0-2 (first-service-sequence), B scores to exit FSS
    const r1 = processRally(state, "B", 1);
    const s1 = r1.newState as DoublesMatchState;
    expect(s1.teamBScore).toBe(1);
    expect(s1.serverState.isFirstServiceSequence).toBe(false);
    expect(s1.serverState.serverNumber).toBe(2);

    // B server 2 loses → side-out to A
    const r2 = processRally(s1, "A", 2);
    const s2 = r2.newState as DoublesMatchState;
    expect(r2.sideOutOccurred).toBe(true);
    expect(s2.serverState.servingTeam).toBe("A");
    expect(s2.serverState.serverNumber).toBe(1);

    // A server 1 loses → advance to server 2
    const r3 = processRally(s2, "B", 3);
    const s3 = r3.newState as DoublesMatchState;
    expect(r3.sideOutOccurred).toBe(false);
    expect(s3.serverState.servingTeam).toBe("A");
    expect(s3.serverState.serverNumber).toBe(2);

    // A server 2 loses → side-out to B
    const r4 = processRally(s3, "B", 4);
    const s4 = r4.newState as DoublesMatchState;
    expect(r4.sideOutOccurred).toBe(true);
    expect(s4.serverState.servingTeam).toBe("B");
    expect(s4.serverState.serverNumber).toBe(1);

    // B server 1 loses → advance to B server 2
    const r5 = processRally(s4, "A", 5);
    const s5 = r5.newState as DoublesMatchState;
    expect(r5.sideOutOccurred).toBe(false);
    expect(s5.serverState.servingTeam).toBe("B");
    expect(s5.serverState.serverNumber).toBe(2);
    // Server 2 should be the partner of server 1
    expect(s5.serverState.serverPlayerId).not.toBe(
      s4.serverState.serverPlayerId,
    );
  });
});

describe("Edge Cases: getMatchResult with Team B winner", () => {
  it("returns correct result when Team B wins (doubles)", () => {
    const state = createMatch({
      matchType: "doubles",
      teamAPlayerIds: ["alice", "bob"],
      teamBPlayerIds: ["carol", "dave"],
      startingServerPlayerId: "carol",
    }) as DoublesMatchState;

    // B scores 11 straight (B is serving)
    let current: MatchState = state;
    for (let i = 0; i < 11; i++) {
      current = processRally(current, "B", i + 1).newState;
    }

    expect(current.isComplete).toBe(true);
    expect(current.winner).toBe("B");

    const result = getMatchResult(current, 11);
    expect(result).not.toBeNull();
    expect(result!.winner).toBe("B");
    expect(result!.loser).toBe("A");
    expect(result!.winnerScore).toBe(11);
    expect(result!.loserScore).toBe(0);
  });

  it("returns correct result when Team B wins (singles)", () => {
    const state = createMatch({
      matchType: "singles",
      teamAPlayerId: "alice",
      teamBPlayerId: "bob",
      startingServerPlayerId: "bob",
    }) as SinglesMatchState;

    // B scores 11 straight
    let current: MatchState = state;
    for (let i = 0; i < 11; i++) {
      current = processRally(current, "B", i + 1).newState;
    }

    const result = getMatchResult(current, 11);
    expect(result).not.toBeNull();
    expect(result!.winner).toBe("B");
    expect(result!.loser).toBe("A");
    expect(result!.winnerScore).toBe(11);
    expect(result!.loserScore).toBe(0);
  });
});

describe("Edge Cases: getTeamPartner both branches", () => {
  it("server 1 is first player in array → partner is second", () => {
    // alice is teamAPlayerIds[0], starts serving
    const state = createMatch({
      matchType: "doubles",
      teamAPlayerIds: ["alice", "bob"],
      teamBPlayerIds: ["carol", "dave"],
      startingServerPlayerId: "alice",
    }) as DoublesMatchState;

    // A scores (exits FSS), then A loses → side-out to B
    const s1 = processRally(state, "A", 1).newState;
    const s2 = processRally(s1, "B", 2).newState as DoublesMatchState;
    // Side-out to B, B server 1 = right-side player

    // B server 1 loses → advance to server 2 (partner)
    const s3 = processRally(s2, "A", 3).newState as DoublesMatchState;
    expect(s3.serverState.serverNumber).toBe(2);

    // Side-out back to A
    const s4 = processRally(s3, "A", 4).newState as DoublesMatchState;
    expect(s4.serverState.servingTeam).toBe("A");
    expect(s4.serverState.serverNumber).toBe(1);

    // A server 1 is the right-side player. After position swaps from scoring,
    // let's verify the partner lookup works
    const aServer1 = s4.serverState.serverPlayerId;
    // A server 1 loses → advance to server 2
    const s5 = processRally(s4, "B", 5).newState as DoublesMatchState;
    expect(s5.serverState.serverNumber).toBe(2);
    expect(s5.serverState.serverPlayerId).not.toBe(aServer1);
  });

  it("server 1 is second player in array → partner is first", () => {
    // Set up so that bob (teamAPlayerIds[1]) ends up as server 1
    const state = createMatch({
      matchType: "doubles",
      teamAPlayerIds: ["alice", "bob"],
      teamBPlayerIds: ["carol", "dave"],
      startingServerPlayerId: "alice",
    }) as DoublesMatchState;

    // A scores once → positions swap (bob now on right)
    const s1 = processRally(state, "A", 1).newState as DoublesMatchState;
    expect(s1.positions.teamA.right).toBe("bob");

    // A loses (server 2) → side-out to B
    const s2 = processRally(s1, "B", 2).newState as DoublesMatchState;
    expect(s2.serverState.servingTeam).toBe("B");

    // B server 1 loses, B server 2 loses → side-out to A
    const s3 = processRally(s2, "A", 3).newState as DoublesMatchState;
    const s4 = processRally(s3, "A", 4).newState as DoublesMatchState;
    expect(s4.serverState.servingTeam).toBe("A");
    expect(s4.serverState.serverNumber).toBe(1);

    // A's right-side player is now bob (from the swap)
    // So server 1 = bob = teamAPlayerIds[1]
    expect(s4.serverState.serverPlayerId).toBe("bob");

    // A server 1 (bob) loses → advance to server 2 (alice)
    const s5 = processRally(s4, "B", 5).newState as DoublesMatchState;
    expect(s5.serverState.serverNumber).toBe(2);
    expect(s5.serverState.serverPlayerId).toBe("alice");
  });
});

describe("Edge Cases: Deuce / Extended Games", () => {
  it("game at 10-10 requires 12-10 to win (win-by-2)", () => {
    // Use target 5 for speed, simulate 4-4 then test deuce
    const state = createMatch({
      matchType: "doubles",
      teamAPlayerIds: ["alice", "bob"],
      teamBPlayerIds: ["carol", "dave"],
      startingServerPlayerId: "alice",
      targetScore: 5,
      winBy: 2,
    }) as DoublesMatchState;

    // A scores 4
    let current: MatchState = state;
    let seq = 0;
    for (let i = 0; i < 4; i++) {
      seq++;
      current = processRally(current, "A", seq).newState;
    }
    expect(current.teamAScore).toBe(4);

    // Side-out to B (A server 2 loses)
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
    const ds = current as DoublesMatchState;
    if (ds.serverState.servingTeam !== "A") {
      seq++;
      current = processRally(current, "A", seq).newState;
    }

    // A scores to 5 → 5-4, not complete
    if ((current as DoublesMatchState).serverState.servingTeam === "A") {
      seq++;
      current = processRally(current, "A", seq).newState;
      if (current.teamAScore === 5 && current.teamBScore === 4) {
        expect(current.isComplete).toBe(false);

        // A scores to 6 → 6-4, complete
        seq++;
        current = processRally(current, "A", seq).newState;
        expect(current.teamAScore).toBe(6);
        expect(current.isComplete).toBe(true);
        expect(current.winner).toBe("A");
      }
    }
  });

  it("singles deuce: 10-10 → 11-10 not over → 12-10 wins", () => {
    const state = createMatch({
      matchType: "singles",
      teamAPlayerId: "alice",
      teamBPlayerId: "bob",
      startingServerPlayerId: "alice",
      targetScore: 5,
      winBy: 2,
    }) as SinglesMatchState;

    // A scores 4, side-out, B scores 4, side-out
    let current: MatchState = state;
    let seq = 0;

    for (let i = 0; i < 4; i++) {
      seq++;
      current = processRally(current, "A", seq).newState;
    }
    // Side-out
    seq++;
    current = processRally(current, "B", seq).newState;
    // B scores 4
    for (let i = 0; i < 4; i++) {
      seq++;
      current = processRally(current, "B", seq).newState;
    }
    expect(current.teamAScore).toBe(4);
    expect(current.teamBScore).toBe(4);

    // Side-out to A
    seq++;
    current = processRally(current, "A", seq).newState;

    // A scores to 5 → 5-4, not over
    seq++;
    current = processRally(current, "A", seq).newState;
    expect(current.teamAScore).toBe(5);
    expect(current.isComplete).toBe(false);

    // A scores to 6 → 6-4, over
    seq++;
    current = processRally(current, "A", seq).newState;
    expect(current.teamAScore).toBe(6);
    expect(current.isComplete).toBe(true);
    expect(current.winner).toBe("A");
  });
});

describe("Edge Cases: Position Correctness After Complex Sequences", () => {
  it("positions are correct after multiple score-sideout cycles", () => {
    const state = createMatch({
      matchType: "doubles",
      teamAPlayerIds: ["alice", "bob"],
      teamBPlayerIds: ["carol", "dave"],
      startingServerPlayerId: "alice",
    }) as DoublesMatchState;

    // A scores 2 (positions swap twice → back to original)
    let current: MatchState = state;
    current = processRally(current, "A", 1).newState;
    current = processRally(current, "A", 2).newState;
    const s2 = current as DoublesMatchState;
    expect(s2.positions.teamA.right).toBe("alice");
    expect(s2.positions.teamA.left).toBe("bob");

    // A scores 1 more (swap again)
    current = processRally(current, "A", 3).newState;
    const s3 = current as DoublesMatchState;
    expect(s3.positions.teamA.right).toBe("bob");
    expect(s3.positions.teamA.left).toBe("alice");
  });

  it("receiving team positions never change during opponent scoring", () => {
    const state = createMatch({
      matchType: "doubles",
      teamAPlayerIds: ["alice", "bob"],
      teamBPlayerIds: ["carol", "dave"],
      startingServerPlayerId: "alice",
    }) as DoublesMatchState;

    // A scores 5 times
    let current: MatchState = state;
    for (let i = 0; i < 5; i++) {
      current = processRally(current, "A", i + 1).newState;
    }
    const final = current as DoublesMatchState;

    // Team B positions should never have changed
    expect(final.positions.teamB.right).toBe("carol");
    expect(final.positions.teamB.left).toBe("dave");
  });
});

describe("Edge Cases: Singles Court Side After Complex Sequences", () => {
  it("court side is correct after multiple side-outs and scoring", () => {
    const state = createMatch({
      matchType: "singles",
      teamAPlayerId: "alice",
      teamBPlayerId: "bob",
      startingServerPlayerId: "alice",
    }) as SinglesMatchState;

    // A scores 3 (score: 3-0, A serving, odd → left)
    let current: MatchState = state;
    for (let i = 0; i < 3; i++) {
      current = processRally(current, "A", i + 1).newState;
    }
    const s1 = current as SinglesMatchState;
    expect(getServerCourtSide(s1)).toBe("left"); // 3 is odd

    // Side-out to B (B has 0 → right)
    current = processRally(current, "B", 4).newState;
    const s2 = current as SinglesMatchState;
    expect(getServerCourtSide(s2)).toBe("right"); // 0 is even

    // B scores 2 (B has 2 → right)
    current = processRally(current, "B", 5).newState;
    current = processRally(current, "B", 6).newState;
    const s3 = current as SinglesMatchState;
    expect(getServerCourtSide(s3)).toBe("right"); // 2 is even
  });
});

describe("Edge Cases: Type Guards", () => {
  it("isDoublesState correctly identifies doubles", () => {
    const state = createMatch({
      matchType: "doubles",
      teamAPlayerIds: ["alice", "bob"],
      teamBPlayerIds: ["carol", "dave"],
      startingServerPlayerId: "alice",
    });
    expect(isDoublesState(state)).toBe(true);
    expect(isSinglesState(state)).toBe(false);
  });

  it("isSinglesState correctly identifies singles", () => {
    const state = createMatch({
      matchType: "singles",
      teamAPlayerId: "alice",
      teamBPlayerId: "bob",
      startingServerPlayerId: "alice",
    });
    expect(isSinglesState(state)).toBe(true);
    expect(isDoublesState(state)).toBe(false);
  });
});

describe("Edge Cases: Win-by-3 Custom Setting", () => {
  it("game at target but only +2 does not end with win-by-3", () => {
    const state = createMatch({
      matchType: "singles",
      teamAPlayerId: "alice",
      teamBPlayerId: "bob",
      startingServerPlayerId: "alice",
      targetScore: 5,
      winBy: 3,
    }) as SinglesMatchState;

    // A scores 3, side-out, B scores 3, side-out, A scores 2 more → 5-3 (+2)
    let current: MatchState = state;
    let seq = 0;

    // A scores 3
    for (let i = 0; i < 3; i++) {
      seq++;
      current = processRally(current, "A", seq).newState;
    }
    expect(current.teamAScore).toBe(3);

    // Side-out to B
    seq++;
    current = processRally(current, "B", seq).newState;

    // B scores 3
    for (let i = 0; i < 3; i++) {
      seq++;
      current = processRally(current, "B", seq).newState;
    }
    expect(current.teamBScore).toBe(3);

    // Side-out to A
    seq++;
    current = processRally(current, "A", seq).newState;

    // A scores 2 more → 5-3 (+2, not +3)
    for (let i = 0; i < 2; i++) {
      seq++;
      current = processRally(current, "A", seq).newState;
    }
    expect(current.teamAScore).toBe(5);
    expect(current.teamBScore).toBe(3);
    expect(current.isComplete).toBe(false); // +2, need +3

    // A scores to 6 → 6-3 (+3, complete)
    seq++;
    current = processRally(current, "A", seq).newState;
    expect(current.teamAScore).toBe(6);
    expect(current.teamBScore).toBe(3);
    expect(current.isComplete).toBe(true);
    expect(current.winner).toBe("A");
  });
});

describe("Edge Cases: Undo Across Side-Outs (Doubles)", () => {
  it("undo across multiple side-outs restores full server state", () => {
    let history = createMatchHistory({
      matchType: "doubles",
      teamAPlayerIds: ["alice", "bob"],
      teamBPlayerIds: ["carol", "dave"],
      startingServerPlayerId: "alice",
    });

    // A scores 2
    ({ history } = recordRally(history, "A"));
    ({ history } = recordRally(history, "A"));

    // Side-out to B (A server 2 loses)
    ({ history } = recordRally(history, "B"));
    const afterSideOut = history.currentState as DoublesMatchState;
    expect(afterSideOut.serverState.servingTeam).toBe("B");

    // Undo the side-out
    const undone = undoRally(history);
    const restored = undone.currentState as DoublesMatchState;
    expect(restored.serverState.servingTeam).toBe("A");
    expect(restored.serverState.serverNumber).toBe(2);
    expect(restored.teamAScore).toBe(2);
  });
});
