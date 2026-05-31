import type { ServerNumber, Team } from "@/lib/engine";

const STORAGE_PREFIX = "picklepal:offline-rallies";

export interface OfflineRallyEvent {
  readonly sessionId: string;
  readonly matchLocalId: string;
  readonly sequenceNumber: number;
  readonly rallyWinnerTeam: Team;
  readonly resultingTeamAScore: number;
  readonly resultingTeamBScore: number;
  readonly serverPlayerId: string;
  readonly serverNumber: ServerNumber | null;
  readonly sideOutOccurred: boolean;
  readonly scorerPlayerId: string | null;
  readonly createdAt: string;
}

export interface OfflineRallyQueueOptions {
  readonly storage?: Storage | null;
}

export function appendOfflineRallyEvent(
  event: OfflineRallyEvent,
  options: OfflineRallyQueueOptions = {},
): readonly OfflineRallyEvent[] {
  const storage = resolveStorage(options.storage);
  if (!storage) return [];

  const queue = getOfflineRallyEvents(event.sessionId, event.matchLocalId, {
    storage,
  });
  const nextQueue = [...queue, event];
  storage.setItem(getQueueKey(event.sessionId, event.matchLocalId), JSON.stringify(nextQueue));
  return nextQueue;
}

export function getOfflineRallyEvents(
  sessionId: string,
  matchLocalId: string,
  options: OfflineRallyQueueOptions = {},
): readonly OfflineRallyEvent[] {
  const storage = resolveStorage(options.storage);
  if (!storage) return [];

  const key = getQueueKey(sessionId, matchLocalId);
  const rawValue = storage.getItem(key);
  if (!rawValue) return [];

  try {
    const parsed = JSON.parse(rawValue);
    return isOfflineRallyEventArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function removeLastOfflineRallyEvent(
  sessionId: string,
  matchLocalId: string,
  options: OfflineRallyQueueOptions = {},
): OfflineRallyEvent | null {
  const storage = resolveStorage(options.storage);
  if (!storage) return null;

  const queue = getOfflineRallyEvents(sessionId, matchLocalId, { storage });
  if (queue.length === 0) return null;

  const removed = queue[queue.length - 1];
  const nextQueue = queue.slice(0, -1);
  const key = getQueueKey(sessionId, matchLocalId);

  if (nextQueue.length === 0) {
    storage.removeItem(key);
  } else {
    storage.setItem(key, JSON.stringify(nextQueue));
  }

  return removed;
}

export function clearOfflineRallyQueue(
  sessionId: string,
  matchLocalId: string,
  options: OfflineRallyQueueOptions = {},
): void {
  const storage = resolveStorage(options.storage);
  storage?.removeItem(getQueueKey(sessionId, matchLocalId));
}

export function getOfflineRallyQueueKey(
  sessionId: string,
  matchLocalId: string,
): string {
  return getQueueKey(sessionId, matchLocalId);
}

function getQueueKey(sessionId: string, matchLocalId: string): string {
  return `${STORAGE_PREFIX}:${sessionId}:${matchLocalId}`;
}

function resolveStorage(storage: Storage | null | undefined): Storage | null {
  if (storage !== undefined) return storage;
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

function isOfflineRallyEventArray(value: unknown): value is readonly OfflineRallyEvent[] {
  return Array.isArray(value) && value.every(isOfflineRallyEvent);
}

function isOfflineRallyEvent(value: unknown): value is OfflineRallyEvent {
  if (!value || typeof value !== "object") return false;

  const event = value as Partial<OfflineRallyEvent>;
  return (
    typeof event.sessionId === "string" &&
    typeof event.matchLocalId === "string" &&
    typeof event.sequenceNumber === "number" &&
    (event.rallyWinnerTeam === "A" || event.rallyWinnerTeam === "B") &&
    typeof event.resultingTeamAScore === "number" &&
    typeof event.resultingTeamBScore === "number" &&
    typeof event.serverPlayerId === "string" &&
    (event.serverNumber === 1 ||
      event.serverNumber === 2 ||
      event.serverNumber === null) &&
    typeof event.sideOutOccurred === "boolean" &&
    (event.scorerPlayerId === null ||
      event.scorerPlayerId === undefined ||
      typeof event.scorerPlayerId === "string") &&
    typeof event.createdAt === "string"
  );
}
