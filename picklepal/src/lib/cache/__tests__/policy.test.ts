import { describe, expect, it } from "vitest";
import {
  cacheTag,
  domainsForMutation,
  tagsForMutation,
  type CacheDomain,
} from "../policy";

describe("cache policy", () => {
  it("builds stable group-scoped and session-scoped tags", () => {
    expect(cacheTag("history", "group-123")).toBe("group:group-123:history");
    expect(cacheTag("recap", "group-123", "session-456")).toBe(
      "group:group-123:recap:session-456",
    );
  });

  it("invalidates every match-derived view after a match result changes", () => {
    expect(domainsForMutation("match-result")).toEqual<readonly CacheDomain[]>([
      "history",
      "dashboard",
      "leaderboard",
      "sessions",
      "belts",
      "recap",
    ]);
  });

  it("keeps group metadata edits isolated from match-derived views", () => {
    expect(domainsForMutation("group-metadata")).toEqual<readonly CacheDomain[]>([
      "group-meta",
    ]);
  });

  it("invalidates player presentation wherever roster data is rendered", () => {
    expect(domainsForMutation("player-roster")).toEqual<readonly CacheDomain[]>([
      "players",
      "history",
      "dashboard",
      "leaderboard",
      "sessions",
      "belts",
      "recap",
    ]);
  });

  it("never treats access or active scoring state as a shared cache domain", () => {
    expect(() => cacheTag("access" as CacheDomain, "group-123")).toThrow(
      "Unsupported cache domain",
    );
    expect(() => cacheTag("active-match" as CacheDomain, "group-123")).toThrow(
      "Unsupported cache domain",
    );
  });

  it("builds the exact invalidation tags for a match result", () => {
    expect(tagsForMutation("match-result", "group-123", "session-456")).toEqual([
      "group:group-123:history",
      "group:group-123:dashboard",
      "group:group-123:leaderboard",
      "group:group-123:sessions",
      "group:group-123:belts",
      "group:group-123:recap:session-456",
    ]);
  });
});
