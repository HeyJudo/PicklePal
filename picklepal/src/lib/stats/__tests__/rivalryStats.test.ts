import { describe, it, expect } from "vitest";
import { computeRivalryStats, MIN_RIVALRY_GAMES } from "../rivalryStats";
import type { Match, Player } from "@/lib/supabase";

// ─── Test Helpers ─────────────────────────────────────────────────────────────

function makePlayer(id: string, name: string, color?: string): Player {
  return {
    id,
    group_id: "group-1",
    display_name: name,
    avatar_url: null,
    color: color ?? null,
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };
}

function makeMatch(
  overrides: Partial<Match> & {
    id: string;
    teamA: string[];
    teamB: string[];
    scoreA: number;
    scoreB: number;
    winner: "A" | "B";
    type?: "singles" | "doubles";
  },
): Match {
  return {
    id: overrides.id,
    session_id: "session-1",
    match_type: overrides.type ?? "singles",
    status: "completed",
    team_a_player_ids: overrides.teamA,
    team_b_player_ids: overrides.teamB,
    team_a_score: overrides.scoreA,
    team_b_score: overrides.scoreB,
    winning_team: overrides.winner,
    source: "live",
    completed_at: "2024-01-01T00:00:00Z",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    score_snapshot: null,
    server_player_id: null,
  } as unknown as Match;
}

// ─── Players ──────────────────────────────────────────────────────────────────

const alice = makePlayer("alice", "Alice", "#ff0000");
const bob = makePlayer("bob", "Bob", "#00ff00");
const carol = makePlayer("carol", "Carol");
const dave = makePlayer("dave", "Dave");

const ALL_PLAYERS = [alice, bob, carol, dave];

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("computeRivalryStats: singles H2H", () => {
  it("returns empty array when player has no matches", () => {
    const result = computeRivalryStats("alice", ALL_PLAYERS, []);
    expect(result).toHaveLength(0);
  });

  it("tracks win and loss correctly from alice's perspective", () => {
    const matches = [
      makeMatch({ id: "m1", teamA: ["alice"], teamB: ["bob"], scoreA: 11, scoreB: 5, winner: "A" }),
      makeMatch({ id: "m2", teamA: ["alice"], teamB: ["bob"], scoreA: 7, scoreB: 11, winner: "B" }),
      makeMatch({ id: "m3", teamA: ["bob"], teamB: ["alice"], scoreA: 11, scoreB: 3, winner: "A" }),
    ];

    const result = computeRivalryStats("alice", ALL_PLAYERS, matches);
    expect(result).toHaveLength(1);

    const rivalry = result[0];
    expect(rivalry.opponentId).toBe("bob");
    expect(rivalry.opponentName).toBe("Bob");
    expect(rivalry.opponentColor).toBe("#00ff00");
    expect(rivalry.gamesPlayed).toBe(3);
    expect(rivalry.wins).toBe(1);
    expect(rivalry.losses).toBe(2);
    expect(rivalry.winRate).toBeCloseTo(1 / 3);
  });

  it("calculates pointDifferential correctly", () => {
    // Match 1: alice wins 11-5 (alice perspective: +6)
    // Match 2: alice loses 7-11 (alice perspective: -4)
    // Net: +2
    const matches = [
      makeMatch({ id: "m1", teamA: ["alice"], teamB: ["bob"], scoreA: 11, scoreB: 5, winner: "A" }),
      makeMatch({ id: "m2", teamA: ["alice"], teamB: ["bob"], scoreA: 7, scoreB: 11, winner: "B" }),
    ];

    const result = computeRivalryStats("alice", ALL_PLAYERS, matches);
    expect(result).toHaveLength(1);
    expect(result[0].pointDifferential).toBe(2); // (11+7) - (5+11) = 18-16 = 2
  });

  it("computes pointDifferential from correct team side when alice is on team B", () => {
    // alice is on team B, wins 11-8; loses 6-11
    // alice pointsFor: 11+6=17, pointsAgainst: 8+11=19, diff=-2
    const matches = [
      makeMatch({ id: "m1", teamA: ["bob"], teamB: ["alice"], scoreA: 8, scoreB: 11, winner: "B" }),
      makeMatch({ id: "m2", teamA: ["bob"], teamB: ["alice"], scoreA: 11, scoreB: 6, winner: "A" }),
    ];

    const result = computeRivalryStats("alice", ALL_PLAYERS, matches);
    expect(result).toHaveLength(1);
    expect(result[0].wins).toBe(1);
    expect(result[0].losses).toBe(1);
    expect(result[0].pointDifferential).toBe(-2);
  });
});

describe("computeRivalryStats: doubles yields 2 opponents", () => {
  it("accumulates stats against both opponents in a doubles match", () => {
    // alice+bob vs carol+dave — alice wins
    const match = makeMatch({
      id: "m1",
      type: "doubles",
      teamA: ["alice", "bob"],
      teamB: ["carol", "dave"],
      scoreA: 11,
      scoreB: 5,
      winner: "A",
    });

    const result = computeRivalryStats("alice", ALL_PLAYERS, [match]);

    // Should not appear yet — only 1 game each, below MIN_RIVALRY_GAMES (2)
    expect(result).toHaveLength(0);
  });

  it("each doubles match creates rivalry entries for BOTH opposing players", () => {
    // alice+bob vs carol+dave — 2 matches so each opponent reaches MIN_RIVALRY_GAMES
    const matches = [
      makeMatch({ id: "m1", type: "doubles", teamA: ["alice", "bob"], teamB: ["carol", "dave"], scoreA: 11, scoreB: 5, winner: "A" }),
      makeMatch({ id: "m2", type: "doubles", teamA: ["alice", "bob"], teamB: ["carol", "dave"], scoreA: 9, scoreB: 11, winner: "B" }),
    ];

    const result = computeRivalryStats("alice", ALL_PLAYERS, matches);

    // carol and dave should both appear as rivals (2 games each)
    expect(result).toHaveLength(2);
    const ids = result.map((r) => r.opponentId).sort();
    expect(ids).toEqual(["carol", "dave"]);

    // Both should have 2 games played with the same win/loss from alice's perspective
    for (const rivalry of result) {
      expect(rivalry.gamesPlayed).toBe(2);
      expect(rivalry.wins).toBe(1);
      expect(rivalry.losses).toBe(1);
    }
  });

  it("does not count teammates as opponents", () => {
    const matches = [
      makeMatch({ id: "m1", type: "doubles", teamA: ["alice", "bob"], teamB: ["carol", "dave"], scoreA: 11, scoreB: 5, winner: "A" }),
      makeMatch({ id: "m2", type: "doubles", teamA: ["alice", "bob"], teamB: ["carol", "dave"], scoreA: 11, scoreB: 7, winner: "A" }),
    ];

    const result = computeRivalryStats("alice", ALL_PLAYERS, matches);

    // bob is alice's teammate — must NOT appear in rivals
    const bobEntry = result.find((r) => r.opponentId === "bob");
    expect(bobEntry).toBeUndefined();
  });
});

describe("computeRivalryStats: MIN_RIVALRY_GAMES filter", () => {
  it("excludes opponents seen fewer than MIN_RIVALRY_GAMES times", () => {
    expect(MIN_RIVALRY_GAMES).toBe(2);

    const matches = [
      makeMatch({ id: "m1", teamA: ["alice"], teamB: ["bob"], scoreA: 11, scoreB: 5, winner: "A" }),
      // only 1 game vs carol
      makeMatch({ id: "m2", teamA: ["alice"], teamB: ["carol"], scoreA: 11, scoreB: 4, winner: "A" }),
    ];

    const result = computeRivalryStats("alice", ALL_PLAYERS, matches);

    // bob: 1 game — excluded
    // carol: 1 game — excluded
    expect(result).toHaveLength(0);
  });

  it("includes opponents seen exactly MIN_RIVALRY_GAMES times", () => {
    const matches = [
      makeMatch({ id: "m1", teamA: ["alice"], teamB: ["bob"], scoreA: 11, scoreB: 5, winner: "A" }),
      makeMatch({ id: "m2", teamA: ["alice"], teamB: ["bob"], scoreA: 5, scoreB: 11, winner: "B" }),
    ];

    const result = computeRivalryStats("alice", ALL_PLAYERS, matches);
    expect(result).toHaveLength(1);
    expect(result[0].opponentId).toBe("bob");
  });
});

describe("computeRivalryStats: sorting", () => {
  it("sorts by games played desc (biggest rival first)", () => {
    const matches = [
      // bob: 3 games
      makeMatch({ id: "m1", teamA: ["alice"], teamB: ["bob"], scoreA: 11, scoreB: 5, winner: "A" }),
      makeMatch({ id: "m2", teamA: ["alice"], teamB: ["bob"], scoreA: 11, scoreB: 5, winner: "A" }),
      makeMatch({ id: "m3", teamA: ["alice"], teamB: ["bob"], scoreA: 11, scoreB: 5, winner: "A" }),
      // carol: 2 games
      makeMatch({ id: "m4", teamA: ["alice"], teamB: ["carol"], scoreA: 11, scoreB: 5, winner: "A" }),
      makeMatch({ id: "m5", teamA: ["alice"], teamB: ["carol"], scoreA: 11, scoreB: 5, winner: "A" }),
    ];

    const result = computeRivalryStats("alice", ALL_PLAYERS, matches);
    expect(result[0].opponentId).toBe("bob");
    expect(result[1].opponentId).toBe("carol");
  });

  it("uses win rate as tiebreaker when games played is equal", () => {
    // bob: 2 games, 2W 0L (winRate 1.0)
    // carol: 2 games, 1W 1L (winRate 0.5)
    const matches = [
      makeMatch({ id: "m1", teamA: ["alice"], teamB: ["bob"], scoreA: 11, scoreB: 5, winner: "A" }),
      makeMatch({ id: "m2", teamA: ["alice"], teamB: ["bob"], scoreA: 11, scoreB: 3, winner: "A" }),
      makeMatch({ id: "m3", teamA: ["alice"], teamB: ["carol"], scoreA: 11, scoreB: 5, winner: "A" }),
      makeMatch({ id: "m4", teamA: ["alice"], teamB: ["carol"], scoreA: 3, scoreB: 11, winner: "B" }),
    ];

    const result = computeRivalryStats("alice", ALL_PLAYERS, matches);
    expect(result[0].opponentId).toBe("bob");   // higher win rate
    expect(result[1].opponentId).toBe("carol");
  });
});

describe("computeRivalryStats: edge cases", () => {
  it("ignores incomplete (non-completed) matches", () => {
    const match = {
      ...makeMatch({ id: "m1", teamA: ["alice"], teamB: ["bob"], scoreA: 5, scoreB: 0, winner: "A" }),
      status: "active" as const,
    };

    const result = computeRivalryStats("alice", ALL_PLAYERS, [match as unknown as Match]);
    expect(result).toHaveLength(0);
  });

  it("ignores matches the player wasn't in", () => {
    const matches = [
      makeMatch({ id: "m1", teamA: ["bob"], teamB: ["carol"], scoreA: 11, scoreB: 5, winner: "A" }),
      makeMatch({ id: "m2", teamA: ["bob"], teamB: ["carol"], scoreA: 11, scoreB: 5, winner: "A" }),
    ];

    const result = computeRivalryStats("alice", ALL_PLAYERS, matches);
    expect(result).toHaveLength(0);
  });

  it("handles unknown opponents gracefully", () => {
    const matches = [
      makeMatch({ id: "m1", teamA: ["alice"], teamB: ["unknown-id"], scoreA: 11, scoreB: 5, winner: "A" }),
      makeMatch({ id: "m2", teamA: ["alice"], teamB: ["unknown-id"], scoreA: 11, scoreB: 5, winner: "A" }),
    ];

    const result = computeRivalryStats("alice", ALL_PLAYERS, matches);
    expect(result).toHaveLength(1);
    expect(result[0].opponentName).toBe("Unknown");
    expect(result[0].opponentColor).toBeNull();
    expect(result[0].opponentAvatarUrl).toBeNull();
  });

  it("winRate is 0 when all games are losses", () => {
    const matches = [
      makeMatch({ id: "m1", teamA: ["alice"], teamB: ["bob"], scoreA: 3, scoreB: 11, winner: "B" }),
      makeMatch({ id: "m2", teamA: ["alice"], teamB: ["bob"], scoreA: 5, scoreB: 11, winner: "B" }),
    ];

    const result = computeRivalryStats("alice", ALL_PLAYERS, matches);
    expect(result[0].winRate).toBe(0);
  });

  it("winRate is 1 when all games are wins", () => {
    const matches = [
      makeMatch({ id: "m1", teamA: ["alice"], teamB: ["bob"], scoreA: 11, scoreB: 3, winner: "A" }),
      makeMatch({ id: "m2", teamA: ["alice"], teamB: ["bob"], scoreA: 11, scoreB: 5, winner: "A" }),
    ];

    const result = computeRivalryStats("alice", ALL_PLAYERS, matches);
    expect(result[0].winRate).toBe(1);
  });
});
