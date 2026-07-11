import type { MatchType } from "@/lib/supabase";

// ─── Score validation ─────────────────────────────────────────────────────────

/**
 * Validate manual match scores against target score and win-by rules.
 * Returns an error string, or null if valid.
 */
export function validateManualMatchScores(
  teamAScore: number,
  teamBScore: number,
  targetScore: number,
  winBy: number,
): string | null {
  if (teamAScore < 0 || teamBScore < 0) {
    return "Scores cannot be negative";
  }

  if (teamAScore === teamBScore) {
    return "Scores cannot be tied — there must be a winner";
  }

  const winnerScore = Math.max(teamAScore, teamBScore);
  const loserScore = Math.min(teamAScore, teamBScore);
  const scoreDiff = winnerScore - loserScore;

  // Winner must reach at least target score
  if (winnerScore < targetScore) {
    return `Winner must score at least ${targetScore} points`;
  }

  // Must win by required margin
  if (scoreDiff < winBy) {
    return `Winner must win by at least ${winBy} points`;
  }

  // If winner exceeded target, both players must have been at target-1 or higher
  // (deuce scenario: e.g., 12-10 is valid for target 11 win-by-2)
  if (winnerScore > targetScore && loserScore < targetScore - 1) {
    return `Invalid score: if winner has ${winnerScore}, loser should be at least ${targetScore - 1}`;
  }

  return null;
}

// ─── Team validation ──────────────────────────────────────────────────────────

/**
 * Validate team player counts and check for duplicate players.
 * Returns an error string, or null if valid.
 */
export function validateTeams(
  matchType: MatchType,
  teamAIds: readonly string[],
  teamBIds: readonly string[],
): string | null {
  if (matchType === "doubles") {
    if (teamAIds.length !== 2 || teamBIds.length !== 2) {
      return "Doubles requires exactly 2 players per team";
    }
  } else {
    if (teamAIds.length !== 1 || teamBIds.length !== 1) {
      return "Singles requires exactly 1 player per team";
    }
  }

  const allIds = [...teamAIds, ...teamBIds];
  const uniqueIds = new Set(allIds);
  if (uniqueIds.size !== allIds.length) {
    return "A player cannot be on both teams";
  }

  return null;
}

// ─── Date validation ──────────────────────────────────────────────────────────

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validate a played date string (YYYY-MM-DD).
 * Rejects future dates based on UTC+14 (the most-ahead timezone).
 * @param dateStr - Date in YYYY-MM-DD format
 * @param now - Injected for testing; defaults to new Date()
 * Returns an error string, or null if valid.
 */
export function validatePlayedDate(dateStr: string, now?: Date): string | null {
  if (!DATE_REGEX.test(dateStr)) {
    return "Date must be in YYYY-MM-DD format";
  }

  const [year, month, day] = dateStr.split("-").map(Number);
  if (!year || !month || !day) {
    return "Invalid date";
  }

  // Reject dates past "today anywhere on earth" = UTC+14
  const ref = now ?? new Date();
  // Today's date at UTC+14 offset
  const utcPlus14Ms = ref.getTime() + 14 * 60 * 60 * 1000;
  const utcPlus14 = new Date(utcPlus14Ms);
  const maxYear = utcPlus14.getUTCFullYear();
  const maxMonth = utcPlus14.getUTCMonth() + 1;
  const maxDay = utcPlus14.getUTCDate();

  // Compare calendar dates
  if (year > maxYear) return "Date cannot be in the future";
  if (year === maxYear && month > maxMonth) return "Date cannot be in the future";
  if (year === maxYear && month === maxMonth && day > maxDay) return "Date cannot be in the future";

  return null;
}

// ─── Date → timestamp ─────────────────────────────────────────────────────────

/**
 * Convert a YYYY-MM-DD date string to a noon-UTC ISO timestamp.
 * Stored as noon UTC so the calendar date renders correctly for UTC-12…UTC+11.
 */
export function playedDateToTimestamp(dateStr: string): string {
  return `${dateStr}T12:00:00.000Z`;
}
