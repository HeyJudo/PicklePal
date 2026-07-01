import { describe, it, expect } from "vitest";
import {
  createMatchmakingState,
  generateNextMatchup,
  generateMatchup,
  generateQueue,
  shuffleMatchup,
} from "../index";
import { MatchmakingError } from "../index";

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
      expect(session.lastSatRound).toBe(0); // was -1, now 0
      expect(session.sitOutCountdown).toBe(0);
      expect(session.lockState).toBe(false);
      expect(session.joinedRound).toBe(0);
      expect(session.winRate).toBe(0.5);
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

  it("most-played players sit first, minimum-played are protected", () => {
    // After round 1: 4 played (GP=1), 2 sat (GP=0). Round 2 must protect GP=0 players.
    let state = createMatchmakingState(SIX_PLAYERS, "doubles");
    const { matchup: r1, newState: s1 } = generateNextMatchup(state);
    state = s1;

    const satR1 = new Set(r1.sittingOut);

    const { matchup: r2 } = generateNextMatchup(state);

    // Players who sat in round 1 (GP=0) must NOT sit in round 2
    for (const p of r2.sittingOut) {
      expect(satR1.has(p)).toBe(false);
    }
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

  it("balances games played — GP=0 players protected from sitting", () => {
    // After 3 rounds: players who sat in round 1 should still be playing
    // because they have lower gamesPlayed and are protected
    let state = createMatchmakingState(SIX_PLAYERS, "doubles");
    const firstRoundSitters = new Set<string>();

    const { matchup: r1, newState: s1 } = generateNextMatchup(state);
    state = s1;
    for (const p of r1.sittingOut) firstRoundSitters.add(p);

    for (let i = 0; i < 2; i++) {
      const { newState } = generateNextMatchup(state);
      state = newState;
    }

    // First round sitters (GP=0 → then GP=1 from playing) should have played
    // in at least one of rounds 2-3 (since they were protected in round 2)
    for (const p of firstRoundSitters) {
      const session = state.playerSessions.get(p)!;
      // They had GP=0 after round 1 (sat), then were protected → should have played
      expect(session.gamesPlayed).toBeGreaterThanOrEqual(1);
    }
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

  it("protects minimum-played players from sitting out", () => {
    // With 3 players singles (1 sits), protect whoever has fewest games
    let state = createMatchmakingState(THREE_PLAYERS, "singles");

    const { matchup: r1, newState: s1 } = generateNextMatchup(state);
    state = s1;
    const sitter1 = r1.sittingOut[0];

    const { matchup: r2 } = generateNextMatchup(state);

    // Round 2: sitter1 has GP=0, others GP=1. sitter1 must NOT sit again.
    expect(r2.sittingOut[0]).not.toBe(sitter1);
  });
});

describe("Matchmaking: Error Cases", () => {
  it("throws MatchmakingError if not enough players for doubles", () => {
    const state = createMatchmakingState(["p1", "p2", "p3"], "doubles");
    expect(() => generateNextMatchup(state)).toThrow(MatchmakingError);
    expect(() => generateNextMatchup(state)).toThrow("Active pool too small");
  });

  it("throws MatchmakingError if not enough players for singles", () => {
    const state = createMatchmakingState(["p1"], "singles");
    expect(() => generateNextMatchup(state)).toThrow(MatchmakingError);
    expect(() => generateNextMatchup(state)).toThrow("Active pool too small");
  });

  it("MatchmakingError has correct fields", () => {
    const state = createMatchmakingState(["p1", "p2", "p3"], "doubles");
    let err: MatchmakingError | null = null;
    try {
      generateNextMatchup(state);
    } catch (e) {
      err = e as MatchmakingError;
    }
    expect(err).not.toBeNull();
    expect(err!.activePoolSize).toBe(3);
    expect(err!.requiredMinimum).toBe(4);
    expect(err!.deficit).toBe(1);
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

    // Second matchup should protect the players who sat first
    const second = generateMatchup({
      playerIds: SIX_PLAYERS,
      matchType: "doubles",
      previousMatchups: [first],
    });

    // Players who sat in round 1 (GP=0) should NOT sit in round 2
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

describe("Matchmaking: joinedRound tiebreaker", () => {
  it("late arrival (joinedRound > 0) with gamesPlayed=0 is never sit-out when others have more games", () => {
    // Setup: 5 players all with GP=1 + 1 late arrival with GP=0, joinedRound=1
    // Active pool has 6 players, need 4 to play, 2 sit. Late arrival must be protected.
    let state = createMatchmakingState(SIX_PLAYERS, "doubles");

    // Run one round so 4 players have GP=1 and 2 have GP=0 (sat)
    const { newState: s1 } = generateNextMatchup(state);
    state = s1;

    // Simulate a late joiner: add p7 to the pool with GP=0, joinedRound=1
    // We do this by creating fresh state and manually setting joinedRound for late arrivals
    const SEVEN_PLAYERS = [...SIX_PLAYERS, "p7"];
    const sessions = new Map(state.playerSessions);
    sessions.set("p7", {
      playerId: "p7",
      gamesPlayed: 0,
      gamesSatOut: 0,
      lastSatRound: 0,
      sitOutCountdown: 0,
      lockState: false,
      joinedRound: 1, // joined late
      winRate: 0.5,
      teammates: new Map(),
      opponents: new Map(),
    });

    const stateWith7: typeof state = {
      ...state,
      players: SEVEN_PLAYERS,
      playerSessions: sessions,
    };

    // With 7 players, 3 sit per round. p7 has GP=0 with joinedRound=1.
    // Others with GP=0 (the two who sat round 1) also have GP=0, joinedRound=0.
    // The 4 who played have GP=1. Eligible = GP>0 = those 4. p7 is NOT eligible.
    const { matchup } = generateNextMatchup(stateWith7);

    // p7 must NOT be sitting out (GP=0, protected by minimum rule)
    expect(matchup.sittingOut).not.toContain("p7");
  });
});

describe("Matchmaking: generateQueue", () => {
  it("returns array of matchups (default 2 slots)", () => {
    const state = createMatchmakingState(SIX_PLAYERS, "doubles");
    const queue = generateQueue(state);

    expect(Array.isArray(queue)).toBe(true);
    expect(queue).toHaveLength(2);

    for (const matchup of queue) {
      expect(matchup.teamA).toHaveLength(2);
      expect(matchup.teamB).toHaveLength(2);
      expect(matchup.sittingOut).toHaveLength(2);
    }
  });

  it("returns fewer matchups if pool too small after first", () => {
    // 4 players: first slot works, but pool shrinks conceptually — actually stays same size
    // Test with slots=3, 6 players: should return 3
    const state = createMatchmakingState(SIX_PLAYERS, "doubles");
    const queue = generateQueue(state, 3);
    expect(queue).toHaveLength(3);
  });

  it("does not mutate input state", () => {
    const state = createMatchmakingState(SIX_PLAYERS, "doubles");
    generateQueue(state, 2);
    expect(state.round).toBe(0);
  });
});

describe("Matchmaking: shuffleMatchup", () => {
  it("returns a different split from current matchup", () => {
    const state = createMatchmakingState(FOUR_PLAYERS, "doubles");
    const { matchup } = generateNextMatchup(state);

    const shuffled = shuffleMatchup(matchup, state);

    // With 4 players there are 3 splits — at least one alternative exists
    expect(shuffled).not.toBeNull();

    if (shuffled) {
      const currentSet = [
        [...matchup.teamA].sort().join(","),
        [...matchup.teamB].sort().join(","),
      ].sort().join("|");

      const shuffledSet = [
        [...shuffled.teamA].sort().join(","),
        [...shuffled.teamB].sort().join(","),
      ].sort().join("|");

      expect(shuffledSet).not.toBe(currentSet);

      // All same players
      const allCurrent = [...matchup.teamA, ...matchup.teamB].sort();
      const allShuffled = [...shuffled.teamA, ...shuffled.teamB].sort();
      expect(allShuffled).toEqual(allCurrent);
    }
  });

  it("returns null for singles matchups", () => {
    const state = createMatchmakingState(["p1", "p2"], "singles");
    const { matchup } = generateNextMatchup(state);
    expect(shuffleMatchup(matchup, state)).toBeNull();
  });
});
