import type { Match, Player } from "@/lib/supabase";

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Minimum number of head-to-head matches required before dominance can be
 * declared. Set to 4 because 2-3 game "dominance" is noise in a small group;
 * 4 games gives enough signal that a lopsided record is meaningful.
 */
export const MIN_PICKLER_GAMES = 4;

/**
 * Minimum win rate for the dominant player to hold a Pickler belt.
 * 0.7 = 70% — e.g. 3-1 at 4 games passes (0.75), 2-2 fails (0.5).
 */
export const PICKLER_WIN_RATE_THRESHOLD = 0.7;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PicklerEntry {
  /** The player who dominates (belt holder) */
  readonly holderPlayerId: string;
  /** The player being dominated (belt subject) */
  readonly subjectPlayerId: string;
  /** Holder's wins vs the subject */
  readonly wins: number;
  /** Holder's losses vs the subject */
  readonly losses: number;
  /** wins / games */
  readonly winRate: number;
  /** Total head-to-head games between this pair */
  readonly games: number;
}

// ─── computePicklers ──────────────────────────────────────────────────────────

/**
 * For every ordered pair (A, B) where A dominates B head-to-head, return a
 * PicklerEntry. "Dominance" requires:
 *   - games >= MIN_PICKLER_GAMES (currently 4), AND
 *   - A's win rate vs B >= PICKLER_WIN_RATE_THRESHOLD (currently 0.70)
 *
 * Only ONE direction per pair can qualify — if A dominates B then B does not
 * also hold a Pickler over A (since B's win rate vs A would be the complement
 * and would fail the threshold). If neither side clears the threshold no belt
 * is created.
 *
 * Head-to-head is counted as: any completed match where A and B were on
 * OPPOSING teams (works for both singles and doubles). This mirrors the logic
 * in computeRivalryStats — both opponents on the losing team in a doubles match
 * each count as an individual rival.
 */
export function computePicklers(
  players: readonly Player[],
  matches: readonly Match[],
): readonly PicklerEntry[] {
  const completedMatches = matches.filter((m) => m.status === "completed");

  // Accumulator: "holderCandidate:subjectCandidate" → { wins, losses }
  // We accumulate BOTH directions for every pair and decide dominance after.
  const pairMap = new Map<string, { wins: number; losses: number }>();

  const key = (a: string, b: string) => `${a}::${b}`;

  const getAcc = (a: string, b: string) => {
    const k = key(a, b);
    const existing = pairMap.get(k);
    if (existing) return existing;
    const fresh = { wins: 0, losses: 0 };
    pairMap.set(k, fresh);
    return fresh;
  };

  for (const match of completedMatches) {
    const teamAIds = match.team_a_player_ids;
    const teamBIds = match.team_b_player_ids;
    const teamAWon = match.winning_team === "A";

    // For each player on team A, record their result vs each player on team B
    for (const aId of teamAIds) {
      for (const bId of teamBIds) {
        if (teamAWon) {
          // a wins, b loses
          getAcc(aId, bId).wins += 1;
          getAcc(bId, aId).losses += 1;
        } else {
          // b wins, a loses
          getAcc(aId, bId).losses += 1;
          getAcc(bId, aId).wins += 1;
        }
      }
    }
  }

  // Build player id set for fast membership check
  const playerIds = new Set(players.map((p) => p.id));

  const results: PicklerEntry[] = [];

  // Deduplicate: track which unordered pairs we've already processed
  const processedPairs = new Set<string>();

  for (const [k, acc] of pairMap) {
    const [holderCandidate, subjectCandidate] = k.split("::");

    // Only process each unordered pair once
    const pairKey =
      holderCandidate < subjectCandidate
        ? `${holderCandidate}|${subjectCandidate}`
        : `${subjectCandidate}|${holderCandidate}`;
    if (processedPairs.has(pairKey)) continue;
    processedPairs.add(pairKey);

    // Skip if either player isn't in the active player list
    if (!playerIds.has(holderCandidate) || !playerIds.has(subjectCandidate)) continue;

    const reversedKey = key(subjectCandidate, holderCandidate);
    const reverseAcc = pairMap.get(reversedKey) ?? { wins: 0, losses: 0 };

    const fwdGames = acc.wins + acc.losses;
    const fwdWinRate = fwdGames > 0 ? acc.wins / fwdGames : 0;

    const revGames = reverseAcc.wins + reverseAcc.losses;
    const revWinRate = revGames > 0 ? reverseAcc.wins / revGames : 0;

    // Determine if forward direction qualifies
    const fwdQualifies =
      fwdGames >= MIN_PICKLER_GAMES && fwdWinRate >= PICKLER_WIN_RATE_THRESHOLD;
    // Determine if reverse direction qualifies
    const revQualifies =
      revGames >= MIN_PICKLER_GAMES && revWinRate >= PICKLER_WIN_RATE_THRESHOLD;

    // Both cannot qualify simultaneously (complementary win rates), but guard
    // against floating-point edge cases by preferring the higher win rate.
    if (fwdQualifies && (!revQualifies || fwdWinRate >= revWinRate)) {
      results.push({
        holderPlayerId: holderCandidate,
        subjectPlayerId: subjectCandidate,
        wins: acc.wins,
        losses: acc.losses,
        winRate: fwdWinRate,
        games: fwdGames,
      });
    } else if (revQualifies) {
      results.push({
        holderPlayerId: subjectCandidate,
        subjectPlayerId: holderCandidate,
        wins: reverseAcc.wins,
        losses: reverseAcc.losses,
        winRate: revWinRate,
        games: revGames,
      });
    }
  }

  // The DB allows only ONE active Pickler per subject (unique index on
  // (group_id, belt_type, subject_player_id)). If two different players both
  // dominate the same subject, keep only the strongest claim so the weaker
  // one isn't silently dropped on insert. Strongest = higher win rate, then
  // more games, then more wins.
  const bySubject = new Map<string, PicklerEntry>();
  for (const entry of results) {
    const current = bySubject.get(entry.subjectPlayerId);
    if (
      !current ||
      entry.winRate > current.winRate ||
      (entry.winRate === current.winRate && entry.games > current.games) ||
      (entry.winRate === current.winRate && entry.games === current.games && entry.wins > current.wins)
    ) {
      bySubject.set(entry.subjectPlayerId, entry);
    }
  }

  return [...bySubject.values()];
}
