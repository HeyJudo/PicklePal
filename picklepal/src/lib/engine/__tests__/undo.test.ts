import { describe, it, expect } from "vitest";
import {
  createMatchHistory,
  recordRally,
  undoRally,
  undoMultiple,
  canUndo,
  undoDepth,
  isSinglesState,
} from "../index";
import type { DoublesMatchState, SinglesMatchState } from "../types";

// ─── Test Helpers ────────────────────────────────────────────────────────────

function createDoublesHistory() {
  return createMatchHistory({
    matchType: "doubles",
    teamAPlayerIds: ["alice", "bob"],
    teamBPlayerIds: ["carol", "dave"],
    startingServerPlayerId: "alice",
  });
}

function createSinglesHistory() {
  return createMatchHistory({
    matchType: "singles",
    teamAPlayerId: "alice",
    teamBPlayerId: "bob",
    startingServerPlayerId: "alice",
  });
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Undo: createMatchHistory", () => {
  it("creates history with initial state and empty rally list", () => {
    const history = createDoublesHistory();

    expect(history.rallyWinners).toHaveLength(0);
    expect(history.currentState.teamAScore).toBe(0);
    expect(history.currentState.teamBScore).toBe(0);
    expect(history.currentState.isComplete).toBe(false);
  });

  it("works for singles", () => {
    const history = createSinglesHistory();

    expect(history.rallyWinners).toHaveLength(0);
    expect(isSinglesState(history.currentState)).toBe(true);
  });
});

describe("Undo: recordRally", () => {
  it("records a rally and updates state", () => {
    const history = createDoublesHistory();
    const { history: updated, result } = recordRally(history, "A");

    expect(updated.rallyWinners).toHaveLength(1);
    expect(updated.rallyWinners[0]).toBe("A");
    expect(updated.currentState.teamAScore).toBe(1);
    expect(result.scoringTeam).toBe("A");
    expect(result.sequenceNumber).toBe(1);
  });

  it("records multiple rallies sequentially", () => {
    let history = createDoublesHistory();

    const { history: h1 } = recordRally(history, "A");
    const { history: h2 } = recordRally(h1, "A");
    const { history: h3 } = recordRally(h2, "A");

    expect(h3.rallyWinners).toHaveLength(3);
    expect(h3.currentState.teamAScore).toBe(3);
  });

  it("does not mutate original history", () => {
    const history = createDoublesHistory();
    recordRally(history, "A");

    expect(history.rallyWinners).toHaveLength(0);
    expect(history.currentState.teamAScore).toBe(0);
  });
});

describe("Undo: undoRally", () => {
  it("undo after 1 rally returns to initial state", () => {
    const history = createDoublesHistory();
    const { history: afterRally } = recordRally(history, "A");

    expect(afterRally.currentState.teamAScore).toBe(1);

    const undone = undoRally(afterRally);

    expect(undone.rallyWinners).toHaveLength(0);
    expect(undone.currentState.teamAScore).toBe(0);
    expect(undone.currentState.teamBScore).toBe(0);
  });

  it("undo after N rallies returns to state N-1", () => {
    let history = createDoublesHistory();

    // Record 5 rallies (A scores 5)
    for (let i = 0; i < 5; i++) {
      const { history: h } = recordRally(history, "A");
      history = h;
    }
    expect(history.currentState.teamAScore).toBe(5);
    expect(history.rallyWinners).toHaveLength(5);

    // Undo one
    const undone = undoRally(history);
    expect(undone.rallyWinners).toHaveLength(4);
    expect(undone.currentState.teamAScore).toBe(4);
  });

  it("undo at initial state is a no-op (returns same reference)", () => {
    const history = createDoublesHistory();
    const undone = undoRally(history);

    expect(undone).toBe(history);
  });

  it("multiple undos back to start", () => {
    let history = createDoublesHistory();

    // Record 3 rallies
    for (let i = 0; i < 3; i++) {
      const { history: h } = recordRally(history, "A");
      history = h;
    }

    // Undo all 3
    let current = history;
    for (let i = 0; i < 3; i++) {
      current = undoRally(current);
    }

    expect(current.rallyWinners).toHaveLength(0);
    expect(current.currentState.teamAScore).toBe(0);
    expect(current.currentState.teamBScore).toBe(0);
  });

  it("undo restores server state correctly (doubles)", () => {
    const history = createDoublesHistory();

    // A scores (first-service-sequence ends)
    const { history: h1 } = recordRally(history, "A");
    const s1 = h1.currentState as DoublesMatchState;
    expect(s1.serverState.isFirstServiceSequence).toBe(false);

    // Undo → back to first-service-sequence
    const undone = undoRally(h1);
    const s0 = undone.currentState as DoublesMatchState;
    expect(s0.serverState.isFirstServiceSequence).toBe(true);
    expect(s0.serverState.serverNumber).toBe(2);
  });

  it("undo restores positions correctly (doubles)", () => {
    const history = createDoublesHistory();

    // A scores → positions swap
    const { history: h1 } = recordRally(history, "A");
    const s1 = h1.currentState as DoublesMatchState;
    expect(s1.positions.teamA.right).toBe("bob"); // swapped

    // Undo → positions restored
    const undone = undoRally(h1);
    const s0 = undone.currentState as DoublesMatchState;
    expect(s0.positions.teamA.right).toBe("alice"); // original
    expect(s0.positions.teamA.left).toBe("bob");
  });

  it("undo works for singles", () => {
    let history = createSinglesHistory();

    // A scores 3
    for (let i = 0; i < 3; i++) {
      const { history: h } = recordRally(history, "A");
      history = h;
    }
    expect(history.currentState.teamAScore).toBe(3);

    // Undo one
    const undone = undoRally(history);
    expect(undone.currentState.teamAScore).toBe(2);
  });

  it("undo after side-out restores previous server", () => {
    const history = createSinglesHistory();

    // Side-out (B wins rally while A is serving)
    const { history: h1 } = recordRally(history, "B");
    const s1 = h1.currentState as SinglesMatchState;
    expect(s1.serverState.servingTeam).toBe("B");

    // Undo → A is serving again
    const undone = undoRally(h1);
    const s0 = undone.currentState as SinglesMatchState;
    expect(s0.serverState.servingTeam).toBe("A");
    expect(s0.serverState.serverPlayerId).toBe("alice");
  });

  it("undo a completed game makes it incomplete again", () => {
    let history = createDoublesHistory();

    // A scores 11 (shutout)
    for (let i = 0; i < 11; i++) {
      const { history: h } = recordRally(history, "A");
      history = h;
    }
    expect(history.currentState.isComplete).toBe(true);
    expect(history.currentState.winner).toBe("A");

    // Undo last rally → game is no longer complete
    const undone = undoRally(history);
    expect(undone.currentState.isComplete).toBe(false);
    expect(undone.currentState.winner).toBeNull();
    expect(undone.currentState.teamAScore).toBe(10);
  });
});

describe("Undo: undoMultiple", () => {
  it("undoes multiple rallies at once", () => {
    let history = createDoublesHistory();

    for (let i = 0; i < 5; i++) {
      const { history: h } = recordRally(history, "A");
      history = h;
    }

    const undone = undoMultiple(history, 3);
    expect(undone.rallyWinners).toHaveLength(2);
    expect(undone.currentState.teamAScore).toBe(2);
  });

  it("undoing more than available returns to initial state", () => {
    let history = createDoublesHistory();

    for (let i = 0; i < 3; i++) {
      const { history: h } = recordRally(history, "A");
      history = h;
    }

    const undone = undoMultiple(history, 100);
    expect(undone.rallyWinners).toHaveLength(0);
    expect(undone.currentState.teamAScore).toBe(0);
  });

  it("undoing 0 returns equivalent state", () => {
    let history = createDoublesHistory();
    const { history: h1 } = recordRally(history, "A");

    const undone = undoMultiple(h1, 0);
    expect(undone.rallyWinners).toHaveLength(1);
    expect(undone.currentState.teamAScore).toBe(1);
  });
});

describe("Undo: canUndo & undoDepth", () => {
  it("canUndo is false at start", () => {
    const history = createDoublesHistory();
    expect(canUndo(history)).toBe(false);
  });

  it("canUndo is true after recording a rally", () => {
    const history = createDoublesHistory();
    const { history: h1 } = recordRally(history, "A");
    expect(canUndo(h1)).toBe(true);
  });

  it("canUndo is false after undoing all rallies", () => {
    const history = createDoublesHistory();
    const { history: h1 } = recordRally(history, "A");
    const undone = undoRally(h1);
    expect(canUndo(undone)).toBe(false);
  });

  it("undoDepth returns correct count", () => {
    let history = createDoublesHistory();
    expect(undoDepth(history)).toBe(0);

    for (let i = 0; i < 7; i++) {
      const { history: h } = recordRally(history, "A");
      history = h;
    }
    expect(undoDepth(history)).toBe(7);

    const undone = undoRally(history);
    expect(undoDepth(undone)).toBe(6);
  });
});

describe("Undo: Record after undo (redo-like behavior)", () => {
  it("can record new rallies after undoing", () => {
    let history = createDoublesHistory();

    // Record 3 rallies for A
    for (let i = 0; i < 3; i++) {
      const { history: h } = recordRally(history, "A");
      history = h;
    }
    expect(history.currentState.teamAScore).toBe(3);

    // Undo 2
    history = undoMultiple(history, 2);
    expect(history.currentState.teamAScore).toBe(1);

    // Record new rally for B (side-out since A is still serving at server 2)
    const { history: h2 } = recordRally(history, "B");
    // This should be a side-out (A server 2 loses)
    expect(h2.rallyWinners).toHaveLength(2);
    expect(h2.rallyWinners[1]).toBe("B");
  });
});
