// Human-friendly belt-reign duration formatting.
// Tiers: <1h -> "under an hour"; <24h -> "Nh"; <7d -> "Nd"; <8w -> "Nw"; else "Nmo".
// Months are approximated as 30-day blocks (reigns are not calendar-precise).

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const EIGHT_WEEKS = 8 * WEEK;

export function formatReignDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < HOUR) return "under an hour";
  if (ms < DAY) return `${Math.floor(ms / HOUR)}h`;
  if (ms < WEEK) return `${Math.floor(ms / DAY)}d`;
  if (ms < EIGHT_WEEKS) return `${Math.floor(ms / WEEK)}w`;
  return `${Math.floor(ms / MONTH)}mo`;
}
