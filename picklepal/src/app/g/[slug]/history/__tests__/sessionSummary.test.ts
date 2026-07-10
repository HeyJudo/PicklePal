import { describe, it, expect } from "vitest";
import { sessionSummary } from "../sessionSummary";
import type { MatchSummary, PlayerInfoMap } from "../actions";

const playerInfo: PlayerInfoMap = {
  p1: { name: "Thea", color: null, avatarUrl: null },
  p2: { name: "Mike", color: null, avatarUrl: null },
  p3: { name: "Sam", color: null, avatarUrl: null },
  p4: { name: "Lee", color: null, avatarUrl: null },
};

function makeMatch(overrides: Partial<MatchSummary>): MatchSummary {
  return {
    id: "m1",
    session_id: "s1",
    match_type: "doubles",
    status: "completed",
    team_a_player_ids: ["p1", "p2"],
    team_b_player_ids: ["p3", "p4"],
    team_a_score: 11,
    team_b_score: 5,
    winning_team: "A",
    losing_team: "B",
    target_score: 11,
    win_by: 2,
    source: "manual",
    played_at: "2026-01-01",
    started_at: null,
    completed_at: null,
    duration_seconds: null,
    created_at: "2026-01-01",
    ...overrides,
  };
}

describe("sessionSummary", () => {
  it("returns nulls when there are no completed matches", () => {
    const result = sessionSummary([makeMatch({ status: "cancelled" })], playerInfo);
    expect(result).toEqual({ topWinner: null, closest: null, biggest: null });
  });

  it("tallies wins per player and picks the top winner", () => {
    const matches = [
      makeMatch({ id: "m1", winning_team: "A", team_a_score: 11, team_b_score: 5 }),
      makeMatch({ id: "m2", winning_team: "A", team_a_score: 11, team_b_score: 9 }),
      makeMatch({
        id: "m3",
        winning_team: "B",
        team_a_player_ids: ["p1", "p5"],
        team_b_player_ids: ["p3", "p4"],
        team_a_score: 8,
        team_b_score: 11,
      }),
    ];
    const result = sessionSummary(matches, playerInfo);
    // p1 and p2 both won m1+m2 (2 wins); p3/p4 won m3 too (p3,p4: 1 win)
    expect(result.topWinner?.wins).toBe(2);
    expect(["Thea", "Mike"]).toContain(result.topWinner?.name);
  });

  it("picks closest and biggest margin matches", () => {
    const matches = [
      makeMatch({ id: "m1", team_a_score: 11, team_b_score: 9 }), // margin 2
      makeMatch({ id: "m2", team_a_score: 11, team_b_score: 1 }), // margin 10
      makeMatch({ id: "m3", team_a_score: 11, team_b_score: 6 }), // margin 5
    ];
    const result = sessionSummary(matches, playerInfo);
    expect(result.closest).toEqual({ a: 11, b: 9 });
    expect(result.biggest).toEqual({ a: 11, b: 1 });
  });
});
