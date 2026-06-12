import { describe, it, expect } from "vitest";
import {
  validateManualMatchScores,
  validateTeams,
  validatePlayedDate,
  playedDateToTimestamp,
} from "../validation";

// ─── validateManualMatchScores ────────────────────────────────────────────────

describe("validateManualMatchScores", () => {
  it("accepts a standard win (11-7, target 11, winBy 2)", () => {
    expect(validateManualMatchScores(11, 7, 11, 2)).toBeNull();
  });

  it("accepts a deuce win (12-10, target 11, winBy 2)", () => {
    expect(validateManualMatchScores(12, 10, 11, 2)).toBeNull();
  });

  it("rejects 12-9 for target 11 winBy 2 (loser below target-1)", () => {
    expect(validateManualMatchScores(12, 9, 11, 2)).not.toBeNull();
  });

  it("rejects tied score", () => {
    expect(validateManualMatchScores(11, 11, 11, 2)).not.toBeNull();
  });

  it("rejects winner below target score", () => {
    expect(validateManualMatchScores(9, 7, 11, 2)).not.toBeNull();
  });

  it("rejects negative scores", () => {
    expect(validateManualMatchScores(-1, 11, 11, 2)).not.toBeNull();
  });

  it("rejects insufficient win margin (11-10, winBy 2)", () => {
    expect(validateManualMatchScores(11, 10, 11, 2)).not.toBeNull();
  });

  it("accepts winBy 1 (11-10 ok)", () => {
    expect(validateManualMatchScores(11, 10, 11, 1)).toBeNull();
  });

  it("accepts target 21 standard win (21-15)", () => {
    expect(validateManualMatchScores(21, 15, 21, 2)).toBeNull();
  });
});

// ─── validateTeams ────────────────────────────────────────────────────────────

describe("validateTeams", () => {
  it("accepts valid doubles teams", () => {
    expect(validateTeams("doubles", ["a", "b"], ["c", "d"])).toBeNull();
  });

  it("accepts valid singles teams", () => {
    expect(validateTeams("singles", ["a"], ["b"])).toBeNull();
  });

  it("rejects doubles with wrong player count", () => {
    expect(validateTeams("doubles", ["a"], ["c", "d"])).not.toBeNull();
  });

  it("rejects singles with extra players", () => {
    expect(validateTeams("singles", ["a", "b"], ["c"])).not.toBeNull();
  });

  it("rejects duplicate player across teams", () => {
    expect(validateTeams("doubles", ["a", "b"], ["a", "c"])).not.toBeNull();
  });

  it("rejects duplicate player within a team", () => {
    expect(validateTeams("doubles", ["a", "a"], ["c", "d"])).not.toBeNull();
  });
});

// ─── validatePlayedDate ───────────────────────────────────────────────────────

describe("validatePlayedDate", () => {
  const now = new Date("2025-06-15T12:00:00.000Z"); // injected reference

  it("accepts today's date", () => {
    expect(validatePlayedDate("2025-06-15", now)).toBeNull();
  });

  it("accepts a date in the past", () => {
    expect(validatePlayedDate("2024-01-01", now)).toBeNull();
  });

  it("rejects a clearly future date", () => {
    expect(validatePlayedDate("2025-06-30", now)).not.toBeNull();
  });

  it("rejects bad format (slashes)", () => {
    expect(validatePlayedDate("2025/06/15", now)).not.toBeNull();
  });

  it("rejects empty string", () => {
    expect(validatePlayedDate("", now)).not.toBeNull();
  });
});

// ─── playedDateToTimestamp ────────────────────────────────────────────────────

describe("playedDateToTimestamp", () => {
  it("returns noon-UTC ISO string", () => {
    expect(playedDateToTimestamp("2025-06-10")).toBe("2025-06-10T12:00:00.000Z");
  });

  it("preserves the calendar date as the date portion", () => {
    const ts = playedDateToTimestamp("2024-12-31");
    expect(ts.startsWith("2024-12-31")).toBe(true);
  });
});
