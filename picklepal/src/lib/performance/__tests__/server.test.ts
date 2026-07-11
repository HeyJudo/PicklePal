import { afterEach, describe, expect, it, vi } from "vitest";
import { traceServerOperation } from "../server";

describe("traceServerOperation", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("executes the operation without telemetry when Sentry is disabled", async () => {
    vi.stubEnv("SENTRY_DSN", "");
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "");

    const result = await traceServerOperation(
      {
        name: "history.matches",
        op: "db.query",
        attributes: { route: "history", groupSlug: "must-not-escape" },
      },
      async () => "result",
    );

    expect(result).toBe("result");
  });
});
