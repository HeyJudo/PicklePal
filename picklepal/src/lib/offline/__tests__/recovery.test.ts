import { describe, expect, it } from "vitest";
import type { OfflineRallyEvent } from "../rallyQueue";
import { appendOfflineRallyEvent, getOfflineRallyEvents } from "../rallyQueue";
import {
  clearRecoverableMatch,
  getRecoverableMatch,
  rebuildHistoryFromRecovery,
  saveRecoverableMatch,
} from "../recovery";
import type { RecoverableMatch } from "../recovery";

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

const recoverableMatch: RecoverableMatch = {
  sessionId: "session-1",
  matchLocalId: "match-1",
  config: {
    matchType: "doubles",
    teamA: ["a1", "a2"],
    teamB: ["b1", "b2"],
    startingServerPlayerId: "a1",
  },
  targetScore: 11,
  winBy: 2,
  createdAt: "2026-05-30T00:00:00.000Z",
};

const event: OfflineRallyEvent = {
  sessionId: "session-1",
  matchLocalId: "match-1",
  sequenceNumber: 1,
  rallyWinnerTeam: "A",
  resultingTeamAScore: 1,
  resultingTeamBScore: 0,
  serverPlayerId: "a1",
  serverNumber: 2,
  sideOutOccurred: false,
  createdAt: "2026-05-30T00:00:01.000Z",
};

describe("offline match recovery", () => {
  it("saves and reads recoverable match metadata by session", () => {
    const storage = new MemoryStorage();

    saveRecoverableMatch(recoverableMatch, { storage });

    expect(getRecoverableMatch("session-1", { storage })).toEqual(
      recoverableMatch,
    );
  });

  it("returns null when recoverable metadata is corrupt", () => {
    const storage = new MemoryStorage();
    storage.setItem("picklepal:recoverable-match:session-1", "not-json");

    expect(getRecoverableMatch("session-1", { storage })).toBeNull();
  });

  it("rebuilds match history from locally queued rally events", () => {
    const storage = new MemoryStorage();
    saveRecoverableMatch(recoverableMatch, { storage });
    appendOfflineRallyEvent(event, { storage });
    appendOfflineRallyEvent({ ...event, sequenceNumber: 2, rallyWinnerTeam: "B" }, { storage });

    const history = rebuildHistoryFromRecovery(recoverableMatch, { storage });

    expect(history.rallyWinners).toEqual(["A", "B"]);
    expect(history.currentState.teamAScore).toBe(1);
    expect(history.currentState.teamBScore).toBe(0);
  });

  it("clears recoverable metadata and queued rallies together", () => {
    const storage = new MemoryStorage();
    saveRecoverableMatch(recoverableMatch, { storage });
    appendOfflineRallyEvent(event, { storage });

    clearRecoverableMatch("session-1", "match-1", { storage });

    expect(getRecoverableMatch("session-1", { storage })).toBeNull();
    expect(getOfflineRallyEvents("session-1", "match-1", { storage })).toEqual(
      [],
    );
  });
});
