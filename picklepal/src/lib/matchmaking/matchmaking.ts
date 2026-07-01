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
  MatchupReason,
  PlayerSession,
} from "./types";
import { MatchmakingError } from "./types";

// ─── Deterministic hash (replaces Math.random) ───────────────────────────────

function deterministicHash(
  sessionId: string,
  round: number,
  playerId: string,
): number {
  let h = 0;
  const s = `${sessionId}:${round}:${playerId}`;
  for (let i = 0; i < s.length; i++) h = Math.imul(31, h) + s.charCodeAt(i) | 0;
  return h >>> 0;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Create initial matchmaking state for a session.
 */
export function createMatchmakingState(
  playerIds: readonly string[],
  matchType: MatchType,
  opts?: {
    sessionId?: string;
    balancedMode?: boolean;
    winRates?: Record<string, number>;
  },
): MatchmakingState {
  const playerSessions = new Map<string, PlayerSession>();

  for (const id of playerIds) {
    playerSessions.set(id, {
      playerId: id,
      gamesPlayed: 0,
      gamesSatOut: 0,
      lastSatRound: 0,
      sitOutCountdown: 0,
      lockState: false,
      joinedRound: 0,
      winRate: opts?.winRates?.[id] ?? 0.5,
      teammates: new Map(),
      opponents: new Map(),
    });
  }

  return {
    players: playerIds,
    matchType,
    round: 0,
    playerSessions,
    sessionId: opts?.sessionId ?? "",
    balancedMode: opts?.balancedMode ?? false,
  };
}

/**
 * Generate the next matchup from current state.
 * Returns the matchup and updated state (input state never mutated).
 */
export function generateNextMatchup(
  state: MatchmakingState,
): { matchup: Matchup; newState: MatchmakingState } {
  const nextRound = state.round + 1;
  const playersPerMatch = state.matchType === "doubles" ? 4 : 2;

  // Active pool: only players not in countdown sit-out
  const activePool = state.players.filter(
    (p) => (state.playerSessions.get(p)!.sitOutCountdown === 0),
  );
  const countdownSitOuts = state.players.filter(
    (p) => (state.playerSessions.get(p)!.sitOutCountdown > 0),
  );

  if (activePool.length < playersPerMatch) {
    throw new MatchmakingError(activePool.length, playersPerMatch);
  }

  // Fairness sit-outs from active pool
  const fairnessSitOutCount = activePool.length - playersPerMatch;
  const fairnessSitOuts = selectSitOuts(
    activePool,
    state,
    nextRound,
    fairnessSitOutCount,
  );

  const activePlayers = activePool.filter((p) => !fairnessSitOuts.includes(p));
  const sittingOut = [...countdownSitOuts, ...fairnessSitOuts];

  // Form teams
  const { teamA, teamB } =
    state.matchType === "doubles"
      ? formDoublesTeams(activePlayers, state, nextRound)
      : formSinglesTeams(activePlayers, state, nextRound);

  // Build reasoning
  const reasoning = buildReasoning(teamA, teamB, activePlayers, state);

  const matchup: Matchup = { teamA, teamB, sittingOut, reasoning };

  // Update state
  const newPlayerSessions = new Map(state.playerSessions);

  // Playing players: increment gamesPlayed, track teammates/opponents
  for (const playerId of [...teamA, ...teamB]) {
    const prev = newPlayerSessions.get(playerId)!;
    const newTeammates = new Map(prev.teammates);
    const newOpponents = new Map(prev.opponents);

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

  // Fairness sit-outs: increment gamesSatOut + lastSatRound
  for (const playerId of fairnessSitOuts) {
    const prev = newPlayerSessions.get(playerId)!;
    newPlayerSessions.set(playerId, {
      ...prev,
      gamesSatOut: prev.gamesSatOut + 1,
      lastSatRound: nextRound,
    });
  }

  // Countdown sit-outs: decrement countdown only (no gamesSatOut change)
  for (const playerId of countdownSitOuts) {
    const prev = newPlayerSessions.get(playerId)!;
    newPlayerSessions.set(playerId, {
      ...prev,
      sitOutCountdown: prev.sitOutCountdown - 1,
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
 * Generate a queue of up to `slots` matchups (projected, does NOT mutate input state).
 */
export function generateQueue(
  state: MatchmakingState,
  slots = 2,
): Matchup[] {
  const matchups: Matchup[] = [];
  let current = state;

  for (let i = 0; i < slots; i++) {
    try {
      const { matchup, newState } = generateNextMatchup(current);
      matchups.push(matchup);
      current = newState;
    } catch (e) {
      if (e instanceof MatchmakingError) break;
      throw e;
    }
  }

  return matchups;
}

/**
 * Return an alternative split for the current doubles matchup,
 * or null if no alternative exists.
 */
export function shuffleMatchup(
  currentMatchup: Matchup,
  state: MatchmakingState,
): Matchup | null {
  if (state.matchType !== "doubles") return null;

  const players = [...currentMatchup.teamA, ...currentMatchup.teamB];
  if (players.length !== 4) return null;

  // All 3 possible splits
  const allSplits: Array<[string[], string[]]> = [
    [[players[0], players[1]], [players[2], players[3]]],
    [[players[0], players[2]], [players[1], players[3]]],
    [[players[0], players[3]], [players[1], players[2]]],
  ];

  // Identify current split as a sorted-set pair for comparison
  const currentKey = splitKey(currentMatchup.teamA as string[], currentMatchup.teamB as string[]);

  // Filter out the current split
  const alternatives = allSplits.filter(
    ([a, b]) => splitKey(a, b) !== currentKey,
  );

  if (alternatives.length === 0) return null;

  // Pick the one with lowest diversity score
  let bestScore = Infinity;
  let bestSplit: [string[], string[]] | null = null;

  for (const [a, b] of alternatives) {
    const score = scoreSplit(a, b, state);
    if (score < bestScore) {
      bestScore = score;
      bestSplit = [a, b];
    }
  }

  if (!bestSplit) return null;

  const [teamA, teamB] = bestSplit;
  const reasoning = buildReasoning(teamA, teamB, players, state);

  return {
    teamA,
    teamB,
    sittingOut: currentMatchup.sittingOut,
    reasoning,
  };
}

/**
 * Generate a matchup from scratch (stateless convenience function).
 * Builds state from previous matchups if provided.
 */
export function generateMatchup(input: GenerateMatchupInput): Matchup {
  let state = createMatchmakingState(input.playerIds, input.matchType);

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
  activePool: string[],
  state: MatchmakingState,
  nextRound: number,
  count: number,
): string[] {
  if (count <= 0) return [];

  const sessions = (p: string) => state.playerSessions.get(p)!;

  const minGP = Math.min(...activePool.map((p) => sessions(p).gamesPlayed));
  const maxGP = Math.max(...activePool.map((p) => sessions(p).gamesPlayed));

  // Protect minimum-played: only those above min are eligible to sit
  const eligible =
    maxGP > minGP
      ? activePool.filter((p) => sessions(p).gamesPlayed > minGP)
      : [...activePool];

  // Sort eligible DESCENDING for sit-out selection
  eligible.sort((a, b) => {
    const sA = sessions(a);
    const sB = sessions(b);

    // 1. gamesPlayed DESC (most played sits first)
    if (sB.gamesPlayed !== sA.gamesPlayed) return sB.gamesPlayed - sA.gamesPlayed;

    // 2. joinedRound ASC (joined earlier = protect them = sort them later)
    if (sA.joinedRound !== sB.joinedRound) return sA.joinedRound - sB.joinedRound;

    // 3. (nextRound - lastSatRound) DESC (longest since last sat = sits next)
    const gapA = nextRound - sA.lastSatRound;
    const gapB = nextRound - sB.lastSatRound;
    if (gapB !== gapA) return gapB - gapA;

    // 4. lastSatRound ASC (tiebreak)
    if (sA.lastSatRound !== sB.lastSatRound) return sA.lastSatRound - sB.lastSatRound;

    // 5. deterministic hash (final tiebreak)
    return (
      deterministicHash(state.sessionId, nextRound, a) -
      deterministicHash(state.sessionId, nextRound, b)
    );
  });

  return eligible.slice(0, count);
}

// ─── Team Formation ──────────────────────────────────────────────────────────

function formDoublesTeams(
  activePlayers: string[],
  state: MatchmakingState,
  nextRound: number,
): { teamA: string[]; teamB: string[] } {
  const players = activePlayers.slice(0, 4);

  if (players.length < 4) {
    throw new Error("Need exactly 4 active players for doubles");
  }

  const allSplits: Array<[string[], string[]]> = [
    [[players[0], players[1]], [players[2], players[3]]],
    [[players[0], players[2]], [players[1], players[3]]],
    [[players[0], players[3]], [players[1], players[2]]],
  ];

  // Score all splits by diversity
  const scored = allSplits.map(([a, b]) => ({ a, b, score: scoreSplit(a, b, state) }));
  const bestScore = Math.min(...scored.map((s) => s.score));

  // Exact tie candidates
  const tied = scored.filter((s) => s.score === bestScore);

  let chosen: { a: string[]; b: string[] };

  if (tied.length === 1) {
    chosen = tied[0];
  } else if (state.balancedMode) {
    // Among tied splits, pick lowest team strength differential
    chosen = tied.reduce((best, s) => {
      const diff = teamStrengthDiff(s.a, s.b, state);
      const bestDiff = teamStrengthDiff(best.a, best.b, state);
      return diff < bestDiff ? s : best;
    });
  } else {
    // Deterministic tiebreak: use hash of first player + round
    chosen = tied[
      deterministicHash(state.sessionId, nextRound, players[0]) % tied.length
    ];
  }

  return { teamA: chosen.a, teamB: chosen.b };
}

function formSinglesTeams(
  activePlayers: string[],
  state: MatchmakingState,
  nextRound: number,
): { teamA: string[]; teamB: string[] } {
  const players = activePlayers.slice(0, 2);

  if (players.length < 2) {
    throw new Error("Need exactly 2 active players for singles");
  }

  // Deterministic order instead of Math.random
  const flip = deterministicHash(state.sessionId, nextRound, players[0]) % 2;
  const [a, b] = flip === 0 ? [players[0], players[1]] : [players[1], players[0]];

  return { teamA: [a], teamB: [b] };
}

// ─── Scoring ─────────────────────────────────────────────────────────────────

function scoreSplit(
  teamA: string[],
  teamB: string[],
  state: MatchmakingState,
): number {
  let score = 0;

  // Penalize repeated teammates (×3)
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

  // Penalize repeated opponents (×2)
  for (const a of teamA) {
    for (const b of teamB) {
      const session = state.playerSessions.get(a)!;
      score += (session.opponents.get(b) ?? 0) * 2;
    }
  }

  return score;
}

function teamStrengthDiff(
  teamA: string[],
  teamB: string[],
  state: MatchmakingState,
): number {
  const mean = (ids: string[]) =>
    ids.reduce((sum, id) => sum + (state.playerSessions.get(id)?.winRate ?? 0.5), 0) /
    ids.length;
  return Math.abs(mean(teamA) - mean(teamB));
}

function splitKey(teamA: string[], teamB: string[]): string {
  const sorted = [teamA.slice().sort().join(","), teamB.slice().sort().join(",")].sort();
  return sorted.join("|");
}

// ─── Reasoning ───────────────────────────────────────────────────────────────

function buildReasoning(
  teamA: string[],
  teamB: string[],
  pool: string[],
  state: MatchmakingState,
): MatchupReason[] {
  const reasons: MatchupReason[] = [];
  const playing = [...teamA, ...teamB];

  // "fewest_games_played" — any playing player is at the pool minimum
  const minGP = Math.min(...pool.map((p) => state.playerSessions.get(p)!.gamesPlayed));
  if (playing.some((p) => state.playerSessions.get(p)!.gamesPlayed === minGP)) {
    reasons.push({ key: "fewest_games_played", label: "Fewest games played" });
  }

  // "fewest_repeated_teammates"
  const teammateRepeats = scoreSplitTeammates(teamA, teamB, state);
  if (teammateRepeats === 0) {
    reasons.push({ key: "fewest_repeated_teammates", label: "No repeated teammates" });
  }

  // "fewest_repeated_opponents"
  const opponentRepeats = scoreSplitOpponents(teamA, teamB, state);
  if (opponentRepeats === 0) {
    reasons.push({ key: "fewest_repeated_opponents", label: "No repeated opponents" });
  }

  // "balanced_team_strength"
  if (state.balancedMode && teamStrengthDiff(teamA, teamB, state) <= 0.15) {
    reasons.push({ key: "balanced_team_strength", label: "Balanced team strength" });
  }

  return reasons.slice(0, 3);
}

function scoreSplitTeammates(
  teamA: string[],
  teamB: string[],
  state: MatchmakingState,
): number {
  let score = 0;
  for (let i = 0; i < teamA.length; i++)
    for (let j = i + 1; j < teamA.length; j++)
      score += state.playerSessions.get(teamA[i])!.teammates.get(teamA[j]) ?? 0;
  for (let i = 0; i < teamB.length; i++)
    for (let j = i + 1; j < teamB.length; j++)
      score += state.playerSessions.get(teamB[i])!.teammates.get(teamB[j]) ?? 0;
  return score;
}

function scoreSplitOpponents(
  teamA: string[],
  teamB: string[],
  state: MatchmakingState,
): number {
  let score = 0;
  for (const a of teamA)
    for (const b of teamB)
      score += state.playerSessions.get(a)!.opponents.get(b) ?? 0;
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

    const myTeam = matchup.teamA.includes(playerId) ? matchup.teamA : matchup.teamB;
    const otherTeam = matchup.teamA.includes(playerId) ? matchup.teamB : matchup.teamA;

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

  // Only fairness sit-outs get gamesSatOut incremented
  // (applyMatchupToState assumes all sittingOut are fairness sit-outs — for stateless replay)
  for (const playerId of matchup.sittingOut) {
    const prev = newPlayerSessions.get(playerId);
    if (!prev) continue;
    // ponytail: countdown players not tracked in stateless replay path
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
