export type SyncTone = "success" | "pending" | "warning" | "error";

export interface SyncDisplayInput {
  readonly pendingCount: number;
  readonly isOnline: boolean;
  readonly isSyncing: boolean;
  readonly retryAttempt: number;
  readonly hasError: boolean;
}

export interface SyncDisplay {
  readonly label: string;
  readonly tone: SyncTone;
}

const BASE_RETRY_DELAY_MS = 1000;
const MAX_RETRY_DELAY_MS = 30_000;

export function getSyncDisplay(input: SyncDisplayInput): SyncDisplay {
  if (input.isSyncing) {
    return { label: "Syncing...", tone: "pending" };
  }

  if (!input.isOnline && input.pendingCount > 0) {
    return {
      label: `Offline - ${formatRallyCount(input.pendingCount)} pending`,
      tone: "warning",
    };
  }

  if (input.hasError && input.retryAttempt > 0) {
    return {
      label: `Sync failed - retry ${input.retryAttempt} queued`,
      tone: "error",
    };
  }

  if (input.hasError) {
    return { label: "Sync failed", tone: "error" };
  }

  if (input.pendingCount > 0) {
    return {
      label: `${formatRallyCount(input.pendingCount)} saved locally`,
      tone: "pending",
    };
  }

  return { label: "Synced", tone: "success" };
}

export function getRetryDelayMs(attempt: number): number {
  const safeAttempt = Math.max(1, attempt);
  return Math.min(
    BASE_RETRY_DELAY_MS * 2 ** (safeAttempt - 1),
    MAX_RETRY_DELAY_MS,
  );
}

export function formatSyncErrorMessage(message: string | undefined): string {
  if (!message) {
    return "Could not save match. Match is saved locally and will retry.";
  }

  const normalized = message.toLowerCase();
  if (
    normalized.includes("fetch failed") ||
    normalized.includes("failed to fetch") ||
    normalized.includes("networkerror") ||
    normalized.includes("network error")
  ) {
    return "Could not reach the server. Match is saved locally and will retry.";
  }

  return message;
}

function formatRallyCount(count: number): string {
  return `${count} ${count === 1 ? "rally" : "rallies"}`;
}
