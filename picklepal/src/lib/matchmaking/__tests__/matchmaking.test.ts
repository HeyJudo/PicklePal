import { describe, it, expect } from "vitest";
import {
  createMatchmakingState,
  generateNextMatchup,
  generateMatchup,
} from "../index";

const SIX_PLAYERS = ["p1", "p2", "p3", "p4", "p5", "p6"];
const FOUR_PLAYERS = ["p1", "p2", "p3", "p4"];
const THREE_PLAYERS = ["p1", "p2", "p3"];

describe("Matchmaking: createMatchmakingState", () => {
  it("initializes state with all players at zero", () => {
    const state = createMatchmakingState(SIX_PLAYERS, "doubles");

    expect(state.players).toEqual(SIX_PLAYERS);
    expect(state.matchType).toBe("doubles");
    expect(state.round).toBe(0);

    for (const playerId of SIX_PLAYERS) {
      const session = state.playerSessions.get(playerId)!;
      expect(session.gamesPlayed).toBe(0);
      expect(session.gamesSatOut).toBe(0);
      expect(session.lastSatRound).toBe(-1);
    }
  });
});

describe("Matchmaking: Doubles (6 players)", () => {
  it("generates matchup with 4 playing and 2 sitting", () => {
    const state = createMatchmakingState(SIX_PLAYERS, "doubles");
    const { matchup } = generateNextMatchup(state);

    expect(matchup.teamA).toHaveLength(2);
    expect(matchup.teamB).toHaveLength(2);
    expect(matchup.sittingOut).toHaveLength(2);

    // All 6 players accounted for
    const allPlayers = [
      ...matchup.teamA,
      ...matchup.teamB,
      ...matchup.sittingOut,
    ];
    expect(new Set(allPlayers).size).toBe(6);
  });

  it("no player sits twice before all have sat once", () => {
    let state = createMatchmakingState(SIX_PLAYERS, "doubles");

    const satCounts = new Map<string, number>();
    for (const p of SIX_PLAYERS) satCounts.set(p, 0);

    // Run 3 rounds (6 players, 2 sit per round → everyone should sit once)
    for (let i = 0; i < 3; i++) {
      const { matchup, newState } = generateNextMatchup(state);
      state = newState;

      for (const p of matchup.sittingOut) {
        satCounts.set(p, (satCounts.get(p) ?? 0) + 1);
      }
    }

    // After 3 rounds with 2 sitting each, all 6 should have sat exactly once
    for (const [, count] of satCounts) {
      expect(count).toBe(1);
    }
  });

  it("balances games played over multiple rounds", () => {
    let state = createMatchmakingState(SIX_PLAYERS, "doubles");

    // Run 6 rounds
    for (let i = 0; i < 6; i++) {
      const { newState } = generateNextMatchup(state);
      state = newState;
    }

    // Check games played — should be relatively balanced
    const gamesPlayed = SIX_PLAYERS.map(
      (p) => state.playerSessions.get(p)!.gamesPlayed,
    );
    const min = Math.min(...gamesPlayed);
    const max = Math.max(...gamesPlayed);

    // Difference should be at most 1 (perfect balance)
    expect(max - min).toBeLessThanOrEqual(1);
  });

  it("all players in matchup are from the player list", () => {
    const state = createMatchmakingState(SIX_PLAYERS, "doubles");
    const { matchup } = generateNextMatchup(state);

    for (const p of [...matchup.teamA, ...matchup.teamB, ...matchup.sittingOut]) {
      expect(SIX_PLAYERS).toContain(p);
    }
  });

  it("no duplicate players in a matchup", () => {
    const state = createMatchmakingState(SIX_PLAYERS, "doubles");
    const { matchup } = generateNextMatchup(state);

    const allPlayers = [
      ...matchup.teamA,
      ...matchup.teamB,
      ...matchup.sittingOut,
    ];
    expect(new Set(allPlayers).size).toBe(allPlayers.length);
  });
});

describe("Matchmaking: Doubles (exactly 4 players)", () => {
  it("no one sits out when exactly 4 players", () => {
    const state = createMatchmakingState(FOUR_PLAYERS, "doubles");
    const { matchup } = generateNextMatchup(state);

    expect(matchup.teamA).toHaveLength(2);
    expect(matchup.teamB).toHaveLength(2);
    expect(matchup.sittingOut).toHaveLength(0);
  });
});

describe("Matchmaking: Singles", () => {
  it("generates matchup with 2 playing and rest sitting", () => {
    const state = createMatchmakingState(SIX_PLAYERS, "singles");
    const { matchup } = generateNextMatchup(state);

    expect(matchup.teamA).toHaveLength(1);
    expect(matchup.teamB).toHaveLength(1);
    expect(matchup.sittingOut).toHaveLength(4);
  });

  it("works with exactly 2 players (no sit-outs)", () => {
    const state = createMatchmakingState(["p1", "p2"], "singles");
    const { matchup } = generateNextMatchup(state);

    expect(matchup.teamA).toHaveLength(1);
    expect(matchup.teamB).toHaveLength(1);
    expect(matchup.sittingOut).toHaveLength(0);
  });

  it("rotates sit-outs fairly with 3 players", () => {
    let state = createMatchmakingState(THREE_PLAYERS, "singles");

    const satCounts = new Map<string, number>();
    for (const p of THREE_PLAYERS) satCounts.set(p, 0);

    // Run 3 rounds — each player should sit once
    for (let i = 0; i < 3; i++) {
      const { matchup, newState } = generateNextMatchup(state);
      state = newState;

      for (const p of matchup.sittingOut) {
        satCounts.set(p, (satCounts.get(p) ?? 0) + 1);
      }
    }

    for (const [, count] of satCounts) {
      expect(count).toBe(1);
    }
  });
});

describe("Matchmaking: Error Cases", () => {
  it("throws if not enough players for doubles", () => {
    const state = createMatchmakingState(["p1", "p2", "p3"], "doubles");
    expect(() => generateNextMatchup(state)).toThrow("Need at least 4");
  });

  it("throws if not enough players for singles", () => {
    const state = createMatchmakingState(["p1"], "singles");
    expect(() => generateNextMatchup(state)).toThrow("Need at least 2");
  });
});

describe("Matchmaking: generateMatchup (stateless)", () => {
  it("generates a valid matchup without previous state", () => {
    const matchup = generateMatchup({
      playerIds: SIX_PLAYERS,
      matchType: "doubles",
    });

    expect(matchup.teamA).toHaveLength(2);
    expect(matchup.teamB).toHaveLength(2);
    expect(matchup.sittingOut).toHaveLength(2);
  });

  it("considers previous matchups for fairness", () => {
    // First matchup
    const first = generateMatchup({
      playerIds: SIX_PLAYERS,
      matchType: "doubles",
    });

    // Second matchup should have different sit-outs
    const second = generateMatchup({
      playerIds: SIX_PLAYERS,
      matchType: "doubles",
      previousMatchups: [first],
    });

    // The players who sat in round 1 should NOT sit in round 2
    for (const p of first.sittingOut) {
      expect(second.sittingOut).not.toContain(p);
    }
  });
});

describe("Matchmaking: State Updates", () => {
  it("increments round after each matchup", () => {
    let state = createMatchmakingState(SIX_PLAYERS, "doubles");

    const { newState: s1 } = generateNextMatchup(state);
    expect(s1.round).toBe(1);

    const { newState: s2 } = generateNextMatchup(s1);
    expect(s2.round).toBe(2);
  });

  it("tracks games played correctly", () => {
    const state = createMatchmakingState(SIX_PLAYERS, "doubles");
    const { matchup, newState } = generateNextMatchup(state);

    for (const p of [...matchup.teamA, ...matchup.teamB]) {
      expect(newState.playerSessions.get(p)!.gamesPlayed).toBe(1);
    }
    for (const p of matchup.sittingOut) {
      expect(newState.playerSessions.get(p)!.gamesPlayed).toBe(0);
    }
  });

  it("tracks sit-outs correctly", () => {
    const state = createMatchmakingState(SIX_PLAYERS, "doubles");
    const { matchup, newState } = generateNextMatchup(state);

    for (const p of matchup.sittingOut) {
      expect(newState.playerSessions.get(p)!.gamesSatOut).toBe(1);
      expect(newState.playerSessions.get(p)!.lastSatRound).toBe(1);
    }
    for (const p of [...matchup.teamA, ...matchup.teamB]) {
      expect(newState.playerSessions.get(p)!.gamesSatOut).toBe(0);
    }
  });

  it("does not mutate original state", () => {
    const state = createMatchmakingState(SIX_PLAYERS, "doubles");
    generateNextMatchup(state);

    expect(state.round).toBe(0);
    for (const p of SIX_PLAYERS) {
      expect(state.playerSessions.get(p)!.gamesPlayed).toBe(0);
    }
  });
});
