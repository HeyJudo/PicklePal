import { describe, expect, it } from "vitest";
import {
  formatSyncErrorMessage,
  getRetryDelayMs,
  getSyncDisplay,
} from "../syncStatus";

describe("offline sync status", () => {
  it("shows synced when no local events are pending", () => {
    expect(
      getSyncDisplay({
        pendingCount: 0,
        isOnline: true,
        isSyncing: false,
        retryAttempt: 0,
        hasError: false,
      }),
    ).toEqual({
      label: "Synced",
      tone: "success",
    });
  });

  it("shows locally saved pending rallies while online", () => {
    expect(
      getSyncDisplay({
        pendingCount: 3,
        isOnline: true,
        isSyncing: false,
        retryAttempt: 0,
        hasError: false,
      }),
    ).toEqual({
      label: "3 rallies saved locally",
      tone: "pending",
    });
  });

  it("shows offline pending state when the browser is offline", () => {
    expect(
      getSyncDisplay({
        pendingCount: 2,
        isOnline: false,
        isSyncing: false,
        retryAttempt: 0,
        hasError: false,
      }),
    ).toEqual({
      label: "Offline - 2 rallies pending",
      tone: "warning",
    });
  });

  it("shows retrying when a sync error has a retry attempt", () => {
    expect(
      getSyncDisplay({
        pendingCount: 4,
        isOnline: true,
        isSyncing: false,
        retryAttempt: 2,
        hasError: true,
      }),
    ).toEqual({
      label: "Sync failed - retry 2 queued",
      tone: "error",
    });
  });

  it("caps exponential retry backoff at thirty seconds", () => {
    expect(getRetryDelayMs(1)).toBe(1000);
    expect(getRetryDelayMs(2)).toBe(2000);
    expect(getRetryDelayMs(10)).toBe(30000);
  });

  it("hides raw fetch errors behind a friendly offline sync message", () => {
    expect(formatSyncErrorMessage("TypeError: fetch failed")).toBe(
      "Could not reach the server. Match is saved locally and will retry.",
    );
  });

  it("keeps readable server messages unchanged", () => {
    expect(formatSyncErrorMessage("A session is already completed")).toBe(
      "A session is already completed",
    );
  });
});
