import { describe, expect, it } from "vitest";
import {
  historyCursorFilter,
  nextHistoryCursor,
  parseHistoryCursor,
} from "../pagination";

describe("History cursor pagination", () => {
  it("orders the next page after both timestamp and id", () => {
    expect(
      historyCursorFilter({
        startedAt: "2026-07-10T12:00:00.000Z",
        id: "00000000-0000-0000-0000-000000000123",
      }),
    ).toBe(
      "started_at.lt.2026-07-10T12:00:00.000Z,and(started_at.eq.2026-07-10T12:00:00.000Z,id.lt.00000000-0000-0000-0000-000000000123)",
    );
  });

  it("uses the final displayed session as the next cursor", () => {
    expect(
      nextHistoryCursor([
        { id: "session-2", started_at: "2026-07-10T12:00:00.000Z" },
        { id: "session-1", started_at: "2026-07-09T12:00:00.000Z" },
      ]),
    ).toEqual({ id: "session-1", startedAt: "2026-07-09T12:00:00.000Z" });
  });

  it("returns no cursor for an empty page", () => {
    expect(nextHistoryCursor([])).toBeNull();
  });

  it("rejects forged cursor values before building a database filter", () => {
    expect(
      parseHistoryCursor({
        startedAt: "2026-07-10T12:00:00.000Z,or(id.neq.x)",
        id: "not-a-uuid",
      }),
    ).toBeNull();
  });
});
