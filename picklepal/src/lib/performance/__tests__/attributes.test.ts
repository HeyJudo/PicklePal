import { describe, expect, it } from "vitest";
import { safeSpanAttributes } from "../attributes";

describe("performance telemetry attributes", () => {
  it("keeps only approved low-cardinality performance fields", () => {
    expect(
      safeSpanAttributes({
        route: "history",
        stage: "matches",
        "cache.domain": "history",
        "cache.hit": false,
        "db.table": "matches",
        "result.count": 20,
        "viewer.kind": "anonymous",
        groupSlug: "secret-club",
        playerName: "Private Player",
        email: "owner@example.com",
        token: "invite-secret",
      }),
    ).toEqual({
      route: "history",
      stage: "matches",
      "cache.domain": "history",
      "cache.hit": false,
      "db.table": "matches",
      "result.count": 20,
      "viewer.kind": "anonymous",
    });
  });

  it("drops unsupported attribute value types", () => {
    expect(
      safeSpanAttributes({
        route: "history",
        "result.count": { value: 20 },
        stage: ["sessions"],
      }),
    ).toEqual({ route: "history" });
  });
});
