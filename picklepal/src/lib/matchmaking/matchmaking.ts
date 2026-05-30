/**
 * Matchmaking Engine
 *
 * Fair random matchup generation for pickleball sessions.
 * Balances games played, minimizes repeated teammates/opponents,
 * and rotates sit-outs fairly.
 *
 * Pure functions — no React, no Supabase.
 */

import type {
  GenerateMatchupInput,
  Matchup,
  MatchmakingState,
  MatchType,
  PlayerSession,
} from "./types";

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Create initial matchmaking state for a session.
 */
export function createMatchmakingState(
  playerIds: readonly string[],
  matchType: MatchType,
): MatchmakingState {
  const playerSessions = new Map<string, PlayerSession>();

  for (const playerId of playerIds) {
    playerSessions.set(playerId, {
      playerId,
      gamesPlayed: 0,
      gamesSatOut: 0,
      lastSatRound: -1,
      teammates: new Map(),
      opponents: new Map(),
    });
  }

  return {
    players: playerIds,
    matchType,
    round: 0,
    playerSessions,
  };
}

/**
 * Generate the next matchup from current state.
 * Returns the matchup and updated state.
 */
export function generateNextMatchup(
  state: MatchmakingState,
): { matchup: Matchup; newState: MatchmakingState } {
  const nextRound = state.round + 1;
  const playersPerMatch = state.matchType === "doubles" ? 4 : 2;

  if (state.players.length < playersPerMatch) {
    throw new Error(
      `Need at least ${playersPerMatch} players for ${state.matchType}`,
    );
  }

  // Step 1: Select who sits out (fair rotation)
  const sittingOut = selectSitOuts(state, playersPerMatch);
  const activePlayers = state.players.filter((p) => !sittingOut.includes(p));

  // Step 2: Form teams from active players
  const { teamA, teamB } =
    state.matchType === "doubles"
      ? formDoublesTeams(activePlayers, state)
      : formSinglesTeams(activePlayers, state);

  const matchup: Matchup = { teamA, teamB, sittingOut };

  // Step 3: Update state
  const newPlayerSessions = new Map(state.playerSessions);

  // Update playing players
  for (const playerId of [...teamA, ...teamB]) {
    const prev = newPlayerSessions.get(playerId)!;
    const newTeammates = new Map(prev.teammates);
    const newOpponents = new Map(prev.opponents);

    // Track teammates
    const myTeam = teamA.includes(playerId) ? teamA : teamB;
    const otherTeam = teamA.includes(playerId) ? teamB : teamA;

    for (const mate of myTeam) {
      if (mate !== playerId) {
        newTeammates.set(mate, (newTeammates.get(mate) ?? 0) + 1);
      }
    }
    for (const opp of otherTeam) {
      newOpponents.set(opp, (newOpponents.get(opp) ?? 0) + 1);
    }

    newPlayerSessions.set(playerId, {
      ...prev,
      gamesPlayed: prev.gamesPlayed + 1,
      teammates: newTeammates,
      opponents: newOpponents,
    });
  }

  // Update sitting-out players
  for (const playerId of sittingOut) {
    const prev = newPlayerSessions.get(playerId)!;
    newPlayerSessions.set(playerId, {
      ...prev,
      gamesSatOut: prev.gamesSatOut + 1,
      lastSatRound: nextRound,
    });
  }

  const newState: MatchmakingState = {
    ...state,
    round: nextRound,
    playerSessions: newPlayerSessions,
  };

  return { matchup, newState };
}

/**
 * Generate a matchup from scratch (stateless convenience function).
 * Builds state from previous matchups if provided.
 */
export function generateMatchup(input: GenerateMatchupInput): Matchup {
  let state = createMatchmakingState(input.playerIds, input.matchType);

  // Replay previous matchups to build state
  if (input.previousMatchups) {
    for (const prev of input.previousMatchups) {
      state = applyMatchupToState(state, prev);
    }
  }

  const { matchup } = generateNextMatchup(state);
  return matchup;
}

// ─── Sit-Out Selection ───────────────────────────────────────────────────────

function selectSitOuts(
  state: MatchmakingState,
  playersPerMatch: number,
): string[] {
  const totalPlayers = state.players.length;
  const sitOutCount = totalPlayers - playersPerMatch;

  if (sitOutCount <= 0) return [];

  // Sort players by: fewest sit-outs first, then longest since last sit-out
  const ranked = [...state.players].sort((a, b) => {
    const sessionA = state.playerSessions.get(a)!;
    const sessionB = state.playerSessions.get(b)!;

    // Primary: fewest games sat out
    const satDiff = sessionA.gamesSatOut - sessionB.gamesSatOut;
    if (satDiff !== 0) return satDiff;

    // Secondary: longest since last sat (lower lastSatRound = sat longer ago)
    const lastSatDiff = sessionA.lastSatRound - sessionB.lastSatRound;
    if (lastSatDiff !== 0) return lastSatDiff;

    // Tertiary: most games played (give them a break)
    const playedDiff = sessionB.gamesPlayed - sessionA.gamesPlayed;
    if (playedDiff !== 0) return playedDiff;

    // Random tiebreaker
    return Math.random() - 0.5;
  });

  // Players who should sit: those with fewest sit-outs
  // But ensure no one sits twice before everyone has sat once
  return ranked.slice(0, sitOutCount);
}

// ─── Team Formation ──────────────────────────────────────────────────────────

function formDoublesTeams(
  activePlayers: string[],
  state: MatchmakingState,
): { teamA: string[]; teamB: string[] } {
  // For 4 players, find the pairing that minimizes repeated teammates
  // Try all possible 2v2 combinations and score them
  const players = [...activePlayers].slice(0, 4);

  if (players.length < 4) {
    throw new Error("Need exactly 4 active players for doubles");
  }

  // All possible ways to split 4 players into 2 teams of 2
  // There are 3 unique splits: (01 vs 23), (02 vs 13), (03 vs 12)
  const splits: Array<{ teamA: [number, number]; teamB: [number, number] }> = [
    { teamA: [0, 1], teamB: [2, 3] },
    { teamA: [0, 2], teamB: [1, 3] },
    { teamA: [0, 3], teamB: [1, 2] },
  ];

  let bestScore = Infinity;

  for (const split of splits) {
    const score = scoreSplit(
      [players[split.teamA[0]], players[split.teamA[1]]],
      [players[split.teamB[0]], players[split.teamB[1]]],
      state,
    );
    if (score < bestScore) {
      bestScore = score;
    }
  }

  // Add randomness: if multiple splits have similar scores, pick randomly
  const goodSplits = splits.filter((split) => {
    const score = scoreSplit(
      [players[split.teamA[0]], players[split.teamA[1]]],
      [players[split.teamB[0]], players[split.teamB[1]]],
      state,
    );
    return score <= bestScore + 1;
  });

  const chosen = goodSplits[Math.floor(Math.random() * goodSplits.length)];

  return {
    teamA: [players[chosen.teamA[0]], players[chosen.teamA[1]]],
    teamB: [players[chosen.teamB[0]], players[chosen.teamB[1]]],
  };
}

function formSinglesTeams(
  activePlayers: string[],
  state: MatchmakingState,
): { teamA: string[]; teamB: string[] } {
  const players = [...activePlayers].slice(0, 2);

  if (players.length < 2) {
    throw new Error("Need exactly 2 active players for singles");
  }

  // Shuffle to add randomness
  if (Math.random() > 0.5) {
    players.reverse();
  }

  return {
    teamA: [players[0]],
    teamB: [players[1]],
  };
}

// ─── Scoring ─────────────────────────────────────────────────────────────────

function scoreSplit(
  teamA: string[],
  teamB: string[],
  state: MatchmakingState,
): number {
  let score = 0;

  // Penalize repeated teammates
  for (let i = 0; i < teamA.length; i++) {
    for (let j = i + 1; j < teamA.length; j++) {
      const session = state.playerSessions.get(teamA[i])!;
      score += (session.teammates.get(teamA[j]) ?? 0) * 3;
    }
  }
  for (let i = 0; i < teamB.length; i++) {
    for (let j = i + 1; j < teamB.length; j++) {
      const session = state.playerSessions.get(teamB[i])!;
      score += (session.teammates.get(teamB[j]) ?? 0) * 3;
    }
  }

  // Penalize repeated opponents (less weight than teammates)
  for (const a of teamA) {
    for (const b of teamB) {
      const session = state.playerSessions.get(a)!;
      score += (session.opponents.get(b) ?? 0) * 2;
    }
  }

  return score;
}

// ─── State Helpers ───────────────────────────────────────────────────────────

function applyMatchupToState(
  state: MatchmakingState,
  matchup: Matchup,
): MatchmakingState {
  const nextRound = state.round + 1;
  const newPlayerSessions = new Map(state.playerSessions);

  for (const playerId of [...matchup.teamA, ...matchup.teamB]) {
    const prev = newPlayerSessions.get(playerId);
    if (!prev) continue;

    const newTeammates = new Map(prev.teammates);
    const newOpponents = new Map(prev.opponents);

    const myTeam = matchup.teamA.includes(playerId)
      ? matchup.teamA
      : matchup.teamB;
    const otherTeam = matchup.teamA.includes(playerId)
      ? matchup.teamB
      : matchup.teamA;

    for (const mate of myTeam) {
      if (mate !== playerId) {
        newTeammates.set(mate, (newTeammates.get(mate) ?? 0) + 1);
      }
    }
    for (const opp of otherTeam) {
      newOpponents.set(opp, (newOpponents.get(opp) ?? 0) + 1);
    }

    newPlayerSessions.set(playerId, {
      ...prev,
      gamesPlayed: prev.gamesPlayed + 1,
      teammates: newTeammates,
      opponents: newOpponents,
    });
  }

  for (const playerId of matchup.sittingOut) {
    const prev = newPlayerSessions.get(playerId);
    if (!prev) continue;

    newPlayerSessions.set(playerId, {
      ...prev,
      gamesSatOut: prev.gamesSatOut + 1,
      lastSatRound: nextRound,
    });
  }

  return {
    ...state,
    round: nextRound,
    playerSessions: newPlayerSessions,
  };
}
