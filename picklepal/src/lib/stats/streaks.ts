import type { Match, Player } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlayerStreak {
  readonly playerId: string;
  readonly streak: number;
  /** played_at / completed_at of the most recent win (ISO string), or null if no wins */
  readonly lastWinAt: string | null;
  /** total completed games this player has played */
  readonly gamesPlayed: number;
}

export interface KingOfTheKitchenResult {
  readonly holderId: string;
  readonly streak: number;
  readonly lastWinAt: string | null;
  readonly gamesPlayed: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function matchTimestamp(m: Match): string {
  return (
    (m as { played_at?: string | null }).played_at ??
    m.completed_at ??
    m.created_at
  );
}

// ─── computeWinStreaks ────────────────────────────────────────────────────────

/**
 * For each player, compute their current *trailing* run of consecutive wins
 * across all completed matches sorted chronologically (ascending).
 * Session boundaries are ignored — streaks are season-long.
 */
export function computeWinStreaks(
  players: readonly Player[],
  matches: readonly Match[],
): readonly PlayerStreak[] {
  const completedMatches = matches
    .filter((m) => m.status === "completed")
    .slice()
    .sort((a, b) => matchTimestamp(a).localeCompare(matchTimestamp(b)));

  // For each player accumulate the trailing streak and last-win timestamp
  const streakMap = new Map<
    string,
    { streak: number; lastWinAt: string | null; gamesPlayed: number }
  >();

  for (const player of players) {
    streakMap.set(player.id, { streak: 0, lastWinAt: null, gamesPlayed: 0 });
  }

  // Walk matches in chronological order and update streaks
  for (const match of completedMatches) {
    const teamAIds = match.team_a_player_ids;
    const teamBIds = match.team_b_player_ids;
    const teamAWon = match.winning_team === "A";
    const ts = matchTimestamp(match);

    const updatePlayer = (playerId: string, won: boolean) => {
      const existing = streakMap.get(playerId);
      if (!existing) return;
      streakMap.set(playerId, {
        streak: won ? existing.streak + 1 : 0,
        lastWinAt: won ? ts : existing.lastWinAt,
        gamesPlayed: existing.gamesPlayed + 1,
      });
    };

    for (const pid of teamAIds) updatePlayer(pid, teamAWon);
    for (const pid of teamBIds) updatePlayer(pid, !teamAWon);
  }

  return players.map((p) => {
    const s = streakMap.get(p.id) ?? { streak: 0, lastWinAt: null, gamesPlayed: 0 };
    return { playerId: p.id, streak: s.streak, lastWinAt: s.lastWinAt, gamesPlayed: s.gamesPlayed };
  });
}

// ─── computeKingOfTheKitchen ─────────────────────────────────────────────────

/**
 * Returns the player with the longest active win streak.
 * Tiebreak: most-recent win → most games played overall.
 * Returns null if no player has any wins (streak === 0 for all).
 */
export function computeKingOfTheKitchen(
  players: readonly Player[],
  matches: readonly Match[],
): KingOfTheKitchenResult | null {
  const streaks = computeWinStreaks(players, matches);

  const withStreak = streaks.filter((s) => s.streak > 0);
  if (withStreak.length === 0) return null;

  const sorted = withStreak.slice().sort((a, b) => {
    // Primary: longer streak
    if (b.streak !== a.streak) return b.streak - a.streak;
    // Tiebreak 1: most recent win
    const aTime = a.lastWinAt ?? "";
    const bTime = b.lastWinAt ?? "";
    if (bTime !== aTime) return bTime.localeCompare(aTime);
    // Tiebreak 2: more games played
    return b.gamesPlayed - a.gamesPlayed;
  });

  const winner = sorted[0];
  return {
    holderId: winner.playerId,
    streak: winner.streak,
    lastWinAt: winner.lastWinAt,
    gamesPlayed: winner.gamesPlayed,
  };
}
