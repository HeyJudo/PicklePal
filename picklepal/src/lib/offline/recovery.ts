import type { MatchHistory, Team } from "@/lib/engine";
import { createMatchHistory, recordRally } from "@/lib/engine";
import { clearOfflineRallyQueue, getOfflineRallyEvents } from "./rallyQueue";

const STORAGE_PREFIX = "picklepal:recoverable-match";

export interface RecoverableMatch {
  readonly sessionId: string;
  readonly matchLocalId: string;
  readonly config: RecoverableMatchConfig;
  readonly targetScore: number;
  readonly winBy: number;
  readonly createdAt: string;
}

export interface RecoverableMatchConfig {
  readonly teamA: readonly string[];
  readonly teamB: readonly string[];
  readonly startingServerPlayerId: string;
  readonly matchType: "singles" | "doubles";
}

export interface RecoveryOptions {
  readonly storage?: Storage | null;
}

export function saveRecoverableMatch(
  match: RecoverableMatch,
  options: RecoveryOptions = {},
): void {
  const storage = resolveStorage(options.storage);
  storage?.setItem(getRecoveryKey(match.sessionId), JSON.stringify(match));
}

export function getRecoverableMatch(
  sessionId: string,
  options: RecoveryOptions = {},
): RecoverableMatch | null {
  const storage = resolveStorage(options.storage);
  if (!storage) return null;

  const rawValue = storage.getItem(getRecoveryKey(sessionId));
  if (!rawValue) return null;

  try {
    const parsed = JSON.parse(rawValue);
    return isRecoverableMatch(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function rebuildHistoryFromRecovery(
  match: RecoverableMatch,
  options: RecoveryOptions = {},
): MatchHistory {
  const winners = [...getOfflineRallyEvents(match.sessionId, match.matchLocalId, options)]
    .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
    .map((event) => event.rallyWinnerTeam);
  return rebuildHistoryFromWinners(match, winners);
}

/**
 * Rebuilds match history by replaying an ordered rally-winner list.
 * Used to restore live scoring state from DB rally_events when the
 * local rally queue is missing or incomplete.
 */
export function rebuildHistoryFromWinners(
  match: Pick<RecoverableMatch, "config" | "targetScore" | "winBy">,
  winners: readonly Team[],
): MatchHistory {
  return winners.reduce(
    (currentHistory, winner) => recordRally(currentHistory, winner).history,
    createMatchHistory(toCreateMatchInput(match)),
  );
}

export function clearRecoverableMatch(
  sessionId: string,
  matchLocalId: string,
  options: RecoveryOptions = {},
): void {
  const storage = resolveStorage(options.storage);
  storage?.removeItem(getRecoveryKey(sessionId));
  clearOfflineRallyQueue(sessionId, matchLocalId, options);
}

function getRecoveryKey(sessionId: string): string {
  return `${STORAGE_PREFIX}:${sessionId}`;
}

function toCreateMatchInput(match: Pick<RecoverableMatch, "config" | "targetScore" | "winBy">) {
  if (match.config.matchType === "doubles") {
    return {
      matchType: "doubles" as const,
      teamAPlayerIds: match.config.teamA as readonly [string, string],
      teamBPlayerIds: match.config.teamB as readonly [string, string],
      startingServerPlayerId: match.config.startingServerPlayerId,
      targetScore: match.targetScore,
      winBy: match.winBy,
    };
  }

  return {
    matchType: "singles" as const,
    teamAPlayerId: match.config.teamA[0],
    teamBPlayerId: match.config.teamB[0],
    startingServerPlayerId: match.config.startingServerPlayerId,
    targetScore: match.targetScore,
    winBy: match.winBy,
  };
}

function resolveStorage(storage: Storage | null | undefined): Storage | null {
  if (storage !== undefined) return storage;
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

function isRecoverableMatch(value: unknown): value is RecoverableMatch {
  if (!value || typeof value !== "object") return false;

  const match = value as Partial<RecoverableMatch>;
  return (
    typeof match.sessionId === "string" &&
    typeof match.matchLocalId === "string" &&
    isMatchStartConfig(match.config) &&
    typeof match.targetScore === "number" &&
    typeof match.winBy === "number" &&
    typeof match.createdAt === "string"
  );
}

function isMatchStartConfig(value: unknown): value is RecoverableMatchConfig {
  if (!value || typeof value !== "object") return false;

  const config = value as Partial<RecoverableMatchConfig>;
  return (
    (config.matchType === "singles" || config.matchType === "doubles") &&
    Array.isArray(config.teamA) &&
    Array.isArray(config.teamB) &&
    config.teamA.every((id) => typeof id === "string") &&
    config.teamB.every((id) => typeof id === "string") &&
    typeof config.startingServerPlayerId === "string"
  );
}
