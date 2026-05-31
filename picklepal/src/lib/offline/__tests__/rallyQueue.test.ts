import { describe, expect, it } from "vitest";
import type { OfflineRallyEvent } from "../rallyQueue";
import {
  appendOfflineRallyEvent,
  clearOfflineRallyQueue,
  getOfflineRallyEvents,
  removeLastOfflineRallyEvent,
} from "../rallyQueue";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.values.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

const baseEvent: OfflineRallyEvent = {
  sessionId: "session-1",
  matchLocalId: "match-1",
  sequenceNumber: 1,
  rallyWinnerTeam: "A",
  resultingTeamAScore: 1,
  resultingTeamBScore: 0,
  serverPlayerId: "player-1",
  serverNumber: 2,
  sideOutOccurred: false,
  scorerPlayerId: null,
  createdAt: "2026-05-30T00:00:00.000Z",
};

describe("offline rally queue", () => {
  it("appends rally events without mutating the existing queue", () => {
    const storage = new MemoryStorage();

    appendOfflineRallyEvent(baseEvent, { storage });
    appendOfflineRallyEvent(
      { ...baseEvent, sequenceNumber: 2, rallyWinnerTeam: "B" },
      { storage },
    );

    expect(getOfflineRallyEvents("session-1", "match-1", { storage })).toEqual([
      baseEvent,
      { ...baseEvent, sequenceNumber: 2, rallyWinnerTeam: "B" },
    ]);
  });

  it("keeps queues isolated by session and local match", () => {
    const storage = new MemoryStorage();

    appendOfflineRallyEvent(baseEvent, { storage });
    appendOfflineRallyEvent(
      { ...baseEvent, matchLocalId: "match-2", sequenceNumber: 1 },
      { storage },
    );

    expect(getOfflineRallyEvents("session-1", "match-1", { storage })).toHaveLength(
      1,
    );
    expect(getOfflineRallyEvents("session-1", "match-2", { storage })).toHaveLength(
      1,
    );
  });

  it("removes the most recent rally event for undo", () => {
    const storage = new MemoryStorage();

    appendOfflineRallyEvent(baseEvent, { storage });
    appendOfflineRallyEvent(
      { ...baseEvent, sequenceNumber: 2, rallyWinnerTeam: "B" },
      { storage },
    );

    const removed = removeLastOfflineRallyEvent("session-1", "match-1", {
      storage,
    });

    expect(removed).toEqual({ ...baseEvent, sequenceNumber: 2, rallyWinnerTeam: "B" });
    expect(getOfflineRallyEvents("session-1", "match-1", { storage })).toEqual([
      baseEvent,
    ]);
  });

  it("clears a match queue after it is no longer needed", () => {
    const storage = new MemoryStorage();
    appendOfflineRallyEvent(baseEvent, { storage });

    clearOfflineRallyQueue("session-1", "match-1", { storage });

    expect(getOfflineRallyEvents("session-1", "match-1", { storage })).toEqual([]);
  });

  it("returns an empty queue when stored JSON is corrupt", () => {
    const storage = new MemoryStorage();
    storage.setItem("picklepal:offline-rallies:session-1:match-1", "not-json");

    expect(getOfflineRallyEvents("session-1", "match-1", { storage })).toEqual([]);
  });
});
