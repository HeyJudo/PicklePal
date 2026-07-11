export interface HistoryCursor {
  readonly startedAt: string;
  readonly id: string;
}

interface SessionCursorSource {
  readonly started_at: string;
  readonly id: string;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ISO_TIMESTAMP_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

export function parseHistoryCursor(value: unknown): HistoryCursor | null {
  if (!value || typeof value !== "object") return null;

  const candidate = value as Partial<HistoryCursor>;
  if (
    typeof candidate.id !== "string" ||
    typeof candidate.startedAt !== "string" ||
    !UUID_PATTERN.test(candidate.id) ||
    !ISO_TIMESTAMP_PATTERN.test(candidate.startedAt) ||
    Number.isNaN(Date.parse(candidate.startedAt))
  ) {
    return null;
  }

  return { id: candidate.id, startedAt: candidate.startedAt };
}

export function historyCursorFilter(cursor: HistoryCursor): string {
  return [
    `started_at.lt.${cursor.startedAt}`,
    `and(started_at.eq.${cursor.startedAt},id.lt.${cursor.id})`,
  ].join(",");
}

export function nextHistoryCursor(
  sessions: readonly SessionCursorSource[],
): HistoryCursor | null {
  const finalSession = sessions.at(-1);
  return finalSession
    ? { id: finalSession.id, startedAt: finalSession.started_at }
    : null;
}
