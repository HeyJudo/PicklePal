/**
 * Shared duration formatting utilities.
 */

/**
 * Format seconds as M:SS for a live timer display.
 * e.g. 90 => "1:30", 605 => "10:05"
 */
export function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Format match duration in seconds to a human-readable label.
 * null => "—"
 * <60s => "45s"
 * >=60s, <3600s => "14 min"
 * >=3600s => "1h 5m"
 */
export function formatMatchDuration(seconds: number | null): string {
  if (seconds === null) return "—";
  if (seconds < 60) return `${seconds}s`;
  const totalMinutes = Math.round(seconds / 60);
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Format session duration in minutes to a human-readable label.
 * Used for session-level duration display (replaces the inline formatDuration helpers
 * in GameDayRecap.tsx and SessionDetail.tsx which take minutes).
 */
export function formatSessionDuration(minutes: number | null): string {
  if (minutes === null) return "—";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}
