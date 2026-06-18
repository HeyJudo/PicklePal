"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { PlayerAvatar } from "@/components/players";
import {
  createMatchHistory,
  recordRally,
  undoRally,
  canUndo,
  isDoublesState,
  createMatch,
  processRally,
} from "@/lib/engine";
import type {
  MatchHistory,
  DoublesMatchState,
  SinglesMatchState,
  Team,
} from "@/lib/engine";
import {
  appendOfflineRallyEvent,
  getOfflineRallyEvents,
  getSyncDisplay,
  removeLastOfflineRallyEvent,
} from "@/lib/offline";
import { updateMatchSnapshot } from "./active-match-actions";
import { formatClock } from "@/lib/format/duration";
import type { MatchStartConfig } from "./PositionConfirmation";

interface Player {
  readonly id: string;
  readonly display_name: string;
  readonly color: string | null;
  readonly avatar_url: string | null;
}

interface LiveScoringProps {
  readonly config: MatchStartConfig;
  readonly sessionId: string;
  readonly matchLocalId: string;
  readonly initialHistory?: MatchHistory;
  readonly players: readonly Player[];
  readonly targetScore: number;
  readonly winBy: number;
  readonly trackScorers?: boolean;
  readonly activeMatchId: string | null;
  readonly startedAt?: string | null;
  readonly onMatchComplete: (history: MatchHistory) => void;
}

export function LiveScoring({
  config,
  sessionId,
  matchLocalId,
  initialHistory,
  players,
  targetScore,
  winBy,
  trackScorers = false,
  activeMatchId,
  startedAt,
  onMatchComplete,
}: LiveScoringProps) {
  const [history, setHistory] = useState<MatchHistory>(() => {
    if (initialHistory) return initialHistory;

    if (config.matchType === "doubles") {
      return createMatchHistory({
        matchType: "doubles",
        teamAPlayerIds: config.teamA as [string, string],
        teamBPlayerIds: config.teamB as [string, string],
        startingServerPlayerId: config.startingServerPlayerId,
        targetScore,
        winBy,
      });
    }
    return createMatchHistory({
      matchType: "singles",
      teamAPlayerId: config.teamA[0],
      teamBPlayerId: config.teamB[0],
      startingServerPlayerId: config.startingServerPlayerId,
      targetScore,
      winBy,
    });
  });
  const [pendingRallyCount, setPendingRallyCount] = useState(() =>
    getOfflineRallyEvents(sessionId, matchLocalId).length,
  );
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [bouncedPlayerId, setBouncedPlayerId] = useState<string | null>(null);
  const [scorerLog, setScorerLog] = useState<(string | null)[]>([]);
  // Live count-up timer: capture a fallback start time when scoring begins
  // Use null initially; the effect will set it on first mount
  const matchStartFallback = useRef<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Live count-up timer — ticks every second, stops when match is complete
  useEffect(() => {
    if (history.currentState.isComplete) return;

    // Initialize fallback start time on first run (avoids calling Date.now during render)
    if (matchStartFallback.current === null) {
      matchStartFallback.current = Date.now();
    }

    const startMs = startedAt
      ? new Date(startedAt).getTime()
      : matchStartFallback.current;

    const tick = () => {
      setElapsedSeconds(Math.floor((Date.now() - startMs) / 1000));
    };
    tick(); // immediate first tick

    const timerId = setInterval(tick, 1000);
    return () => clearInterval(timerId);
  }, [startedAt, history.currentState.isComplete]);

  const state = history.currentState;
  const isDoubles = isDoublesState(state);

  // Sync snapshot to DB every 5 seconds while match is active
  const lastSnapshotRef = useRef<string>("");
  useEffect(() => {
    if (!activeMatchId || history.currentState.isComplete) return;

    const syncSnapshot = async () => {
      const currentState = history.currentState;
      const serverState = isDoublesState(currentState)
        ? (currentState as DoublesMatchState).serverState
        : (currentState as SinglesMatchState).serverState;

      const snapshot = {
        teamAScore: currentState.teamAScore,
        teamBScore: currentState.teamBScore,
        servingTeam: serverState.servingTeam,
        serverPlayerId: serverState.serverPlayerId,
        serverNumber: isDoublesState(currentState)
          ? (serverState as DoublesMatchState["serverState"]).serverNumber
          : null,
        rallyCount: history.rallyWinners.length,
        updatedAt: new Date().toISOString(),
      };

      // Only sync if state actually changed
      const snapshotKey = `${snapshot.teamAScore}-${snapshot.teamBScore}-${snapshot.rallyCount}`;
      if (snapshotKey === lastSnapshotRef.current) return;
      lastSnapshotRef.current = snapshotKey;

      await updateMatchSnapshot(activeMatchId, snapshot);
    };

    const intervalId = setInterval(syncSnapshot, 5000);
    // Also sync immediately on first render / state change
    syncSnapshot();

    return () => clearInterval(intervalId);
  }, [activeMatchId, history]);

  const playerMap = new Map(players.map((p) => [p.id, p]));
  const getPlayer = (id: string) => playerMap.get(id);
  const getPlayerName = (id: string) =>
    playerMap.get(id)?.display_name ?? "?";

  const handleRallyWinner = useCallback(
    (winner: Team, scorerPlayerId: string | null = null) => {
      if (state.isComplete) return;

      const serverState = isDoublesState(history.currentState)
        ? (history.currentState as DoublesMatchState).serverState
        : (history.currentState as SinglesMatchState).serverState;
      const { history: newHistory, result } = recordRally(history, winner);
      setHistory(newHistory);
      setScorerLog((prev) => [...prev, scorerPlayerId]);
      const nextQueue = appendOfflineRallyEvent({
        sessionId,
        matchLocalId,
        sequenceNumber: result.sequenceNumber,
        rallyWinnerTeam: winner,
        resultingTeamAScore: result.newState.teamAScore,
        resultingTeamBScore: result.newState.teamBScore,
        serverPlayerId: serverState.serverPlayerId,
        serverNumber: isDoublesState(history.currentState)
          ? (serverState as DoublesMatchState["serverState"]).serverNumber
          : null,
        sideOutOccurred: result.sideOutOccurred,
        scorerPlayerId,
        createdAt: new Date().toISOString(),
      });
      setPendingRallyCount(nextQueue.length);

      if (newHistory.currentState.isComplete) {
        setTimeout(() => onMatchComplete(newHistory), 600);
      }
    },
    [history, matchLocalId, onMatchComplete, sessionId, state.isComplete],
  );

  const handlePlayerScored = useCallback(
    (playerId: string) => {
      if (state.isComplete) return;

      // Determine which team this player is on
      const team: Team = config.teamA.includes(playerId) ? "A" : "B";

      // Trigger bounce animation
      setBouncedPlayerId(playerId);
      setTimeout(() => setBouncedPlayerId(null), 400);

      // Record the rally with scorer info
      handleRallyWinner(team, playerId);
    },
    [config.teamA, handleRallyWinner, state.isComplete],
  );

  const handleUndo = useCallback(() => {
    if (canUndo(history)) {
      removeLastOfflineRallyEvent(sessionId, matchLocalId);
      setPendingRallyCount((count) => Math.max(0, count - 1));
      setScorerLog((prev) => prev.slice(0, -1));
    }
    setHistory(undoRally(history));
  }, [history, matchLocalId, sessionId]);

  // Server info
  const servingTeam = isDoubles
    ? (state as DoublesMatchState).serverState.servingTeam
    : (state as SinglesMatchState).serverState.servingTeam;

  const serverPlayerId = isDoubles
    ? (state as DoublesMatchState).serverState.serverPlayerId
    : (state as SinglesMatchState).serverState.serverPlayerId;

  const serverNumber = isDoubles
    ? (state as DoublesMatchState).serverState.serverNumber
    : null;

  // Score call
  const scoreCall = isDoubles
    ? `${state.teamAScore}-${state.teamBScore}-${serverNumber}`
    : `${state.teamAScore}-${state.teamBScore}`;

  // Streak detection — count consecutive actual scoring rallies (not side-outs)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const streak = getScoringStreak(history);

  const syncDisplay = getSyncDisplay({
    pendingCount: pendingRallyCount,
    isOnline,
    isSyncing: false,
    retryAttempt: 0,
    hasError: false,
  });

  // Derive court positions for rendering
  // Team A (left side, facing right): top box = left player, bottom box = right player
  // Team B (right side, facing left): top box = right player, bottom box = left player
  const doublesState = isDoubles ? (state as DoublesMatchState) : null;
  const teamATop = doublesState ? doublesState.positions.teamA.left : config.teamA[0];
  const teamABot = doublesState ? doublesState.positions.teamA.right : (config.teamA[1] ?? null);
  const teamBTop = doublesState ? doublesState.positions.teamB.right : config.teamB[0];
  const teamBBot = doublesState ? doublesState.positions.teamB.left : (config.teamB[1] ?? null);

  return (
    <div className="space-y-3">
      {/* Sync Status — compact */}
      <div
        className={`rounded-lg px-3 py-1.5 text-[11px] font-medium flex items-center gap-1.5 ${getSyncToneClass(syncDisplay.tone)}`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${getSyncDotClass(syncDisplay.tone)}`}
        />
        {syncDisplay.label}
      </div>

      {/* Court View — Top-down pickleball court */}
      <div className="relative rounded-2xl overflow-hidden p-3" style={{ backgroundColor: "#8BA86B" }}>
        {/* Court surface */}
        <div className="relative rounded-lg overflow-hidden border-[3px] border-white">
          {/* Court grid: Left service boxes | Kitchen | Right service boxes */}
          <div className="grid grid-cols-[1fr_0.6fr_1fr]">
            {/* Team A side — two service boxes */}
            <div className={`grid grid-rows-2 border-r-[3px] border-white ${streak && streak.team === "A" && streak.count >= 3 ? "streak-fire" : ""}`}>
              {/* Top service box (Team A's LEFT side) */}
              <div className="relative flex items-center justify-center p-3 min-h-[80px]" style={{ backgroundColor: "#4A7FA5" }}>
                {teamATop && (
                  <button
                    type="button"
                    onClick={trackScorers && !state.isComplete ? () => handlePlayerScored(teamATop) : undefined}
                    disabled={!trackScorers || state.isComplete}
                    className={`flex flex-col items-center gap-1 ${trackScorers && !state.isComplete ? "cursor-pointer" : ""}`}
                  >
                    <div className={`rounded-full p-0.5 transition-transform ${serverPlayerId === teamATop ? "ring-2 ring-ball-yellow ring-offset-1" : ""} ${streak && streak.team === "A" && streak.count >= 3 ? "avatar-on-fire" : ""} ${bouncedPlayerId === teamATop ? "scorer-bounce" : ""}`}>
                      <PlayerAvatar
                        displayName={getPlayer(teamATop)?.display_name ?? "?"}
                        color={getPlayer(teamATop)?.color ?? null}
                        avatarUrl={getPlayer(teamATop)?.avatar_url ?? null}
                        size="md"
                      />
                    </div>
                    <span className="text-[10px] font-bold text-white drop-shadow-md">
                      {getPlayerName(teamATop).split(" ")[0]}
                    </span>
                    {serverPlayerId === teamATop && (
                      <span className="text-[8px] font-bold text-ball-yellow bg-black/30 rounded px-1">
                        S{serverNumber ?? ""}
                      </span>
                    )}
                    {trackScorers && !state.isComplete && (
                      <span className="text-[8px] font-medium text-white/50 mt-0.5">Tap to score</span>
                    )}
                  </button>
                )}
              </div>
              {/* Bottom service box (Team A's RIGHT side) */}
              <div className="relative flex items-center justify-center p-3 min-h-[80px] border-t-[3px] border-white" style={{ backgroundColor: "#4A7FA5" }}>
                {teamABot && (
                  <button
                    type="button"
                    onClick={trackScorers && !state.isComplete ? () => handlePlayerScored(teamABot) : undefined}
                    disabled={!trackScorers || state.isComplete}
                    className={`flex flex-col items-center gap-1 ${trackScorers && !state.isComplete ? "cursor-pointer" : ""}`}
                  >
                    <div className={`rounded-full p-0.5 transition-transform ${serverPlayerId === teamABot ? "ring-2 ring-ball-yellow ring-offset-1" : ""} ${streak && streak.team === "A" && streak.count >= 3 ? "avatar-on-fire" : ""} ${bouncedPlayerId === teamABot ? "scorer-bounce" : ""}`}>
                      <PlayerAvatar
                        displayName={getPlayer(teamABot)?.display_name ?? "?"}
                        color={getPlayer(teamABot)?.color ?? null}
                        avatarUrl={getPlayer(teamABot)?.avatar_url ?? null}
                        size="md"
                      />
                    </div>
                    <span className="text-[10px] font-bold text-white drop-shadow-md">
                      {getPlayerName(teamABot).split(" ")[0]}
                    </span>
                    {serverPlayerId === teamABot && (
                      <span className="text-[8px] font-bold text-ball-yellow bg-black/30 rounded px-1">
                        S{serverNumber ?? ""}
                      </span>
                    )}
                    {trackScorers && !state.isComplete && (
                      <span className="text-[8px] font-medium text-white/50 mt-0.5">Tap to score</span>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Kitchen (NVZ) — center */}
            <div className="relative border-r-[3px] border-white" style={{ backgroundColor: "#6BC0D6" }}>
              {/* Net line */}
              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[3px] bg-black/70" />
              {/* Kitchen label */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest rotate-90">
                  NVZ
                </span>
              </div>
            </div>

            {/* Team B side — two service boxes */}
            <div className={`grid grid-rows-2 ${streak && streak.team === "B" && streak.count >= 3 ? "streak-fire" : ""}`}>
              {/* Top service box (Team B's RIGHT side) */}
              <div className="relative flex items-center justify-center p-3 min-h-[80px]" style={{ backgroundColor: "#4A7FA5" }}>
                {teamBTop && (
                  <button
                    type="button"
                    onClick={trackScorers && !state.isComplete ? () => handlePlayerScored(teamBTop) : undefined}
                    disabled={!trackScorers || state.isComplete}
                    className={`flex flex-col items-center gap-1 ${trackScorers && !state.isComplete ? "cursor-pointer" : ""}`}
                  >
                    <div className={`rounded-full p-0.5 transition-transform ${serverPlayerId === teamBTop ? "ring-2 ring-ball-yellow ring-offset-1" : ""} ${streak && streak.team === "B" && streak.count >= 3 ? "avatar-on-fire" : ""} ${bouncedPlayerId === teamBTop ? "scorer-bounce" : ""}`}>
                      <PlayerAvatar
                        displayName={getPlayer(teamBTop)?.display_name ?? "?"}
                        color={getPlayer(teamBTop)?.color ?? null}
                        avatarUrl={getPlayer(teamBTop)?.avatar_url ?? null}
                        size="md"
                      />
                    </div>
                    <span className="text-[10px] font-bold text-white drop-shadow-md">
                      {getPlayerName(teamBTop).split(" ")[0]}
                    </span>
                    {serverPlayerId === teamBTop && (
                      <span className="text-[8px] font-bold text-ball-yellow bg-black/30 rounded px-1">
                        S{serverNumber ?? ""}
                      </span>
                    )}
                    {trackScorers && !state.isComplete && (
                      <span className="text-[8px] font-medium text-white/50 mt-0.5">Tap to score</span>
                    )}
                  </button>
                )}
              </div>
              {/* Bottom service box (Team B's LEFT side) */}
              <div className="relative flex items-center justify-center p-3 min-h-[80px] border-t-[3px] border-white" style={{ backgroundColor: "#4A7FA5" }}>
                {teamBBot && (
                  <button
                    type="button"
                    onClick={trackScorers && !state.isComplete ? () => handlePlayerScored(teamBBot) : undefined}
                    disabled={!trackScorers || state.isComplete}
                    className={`flex flex-col items-center gap-1 ${trackScorers && !state.isComplete ? "cursor-pointer" : ""}`}
                  >
                    <div className={`rounded-full p-0.5 transition-transform ${serverPlayerId === teamBBot ? "ring-2 ring-ball-yellow ring-offset-1" : ""} ${streak && streak.team === "B" && streak.count >= 3 ? "avatar-on-fire" : ""} ${bouncedPlayerId === teamBBot ? "scorer-bounce" : ""}`}>
                      <PlayerAvatar
                        displayName={getPlayer(teamBBot)?.display_name ?? "?"}
                        color={getPlayer(teamBBot)?.color ?? null}
                        avatarUrl={getPlayer(teamBBot)?.avatar_url ?? null}
                        size="md"
                      />
                    </div>
                    <span className="text-[10px] font-bold text-white drop-shadow-md">
                      {getPlayerName(teamBBot).split(" ")[0]}
                    </span>
                    {serverPlayerId === teamBBot && (
                      <span className="text-[8px] font-bold text-ball-yellow bg-black/30 rounded px-1">
                        S{serverNumber ?? ""}
                      </span>
                    )}
                    {trackScorers && !state.isComplete && (
                      <span className="text-[8px] font-medium text-white/50 mt-0.5">Tap to score</span>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Scoreboard overlay — floating on top of court */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center rounded-2xl bg-black/75 backdrop-blur-sm px-5 py-2 shadow-lg">
          <div className="flex items-center gap-2">
            <span className={`font-display text-3xl leading-none tabular-nums ${servingTeam === "A" ? "text-ball-yellow" : "text-white"}`}>
              {state.teamAScore}
            </span>
            <span className="text-white/40 text-base font-medium">–</span>
            <span className={`font-display text-3xl leading-none tabular-nums ${servingTeam === "B" ? "text-ball-yellow" : "text-white"}`}>
              {state.teamBScore}
            </span>
            {isDoubles && (
              <>
                <span className="text-white/30 text-xs">|</span>
                <span className="text-[10px] font-mono text-white/60">{scoreCall}</span>
              </>
            )}
            {streak && streak.count >= 3 && (
              <span className="flex items-center gap-0.5 text-[11px] font-bold text-hype-orange streak-flame">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 23c-4.97 0-9-3.58-9-8 0-3.07 2.25-5.77 4.5-7.5.42-.32 1.02-.06 1.08.47.12 1.04.58 2.03 1.42 2.78.14.12.36.04.38-.13.1-.94.56-2.2 1.62-3.62.28-.37.85-.3 1.03.12C14.23 10.5 16 12.5 16 15c0 .55-.04 1.08-.13 1.58-.04.22.16.4.36.3.56-.28 1.07-.72 1.47-1.28.2-.28.6-.28.73.04.33.82.57 1.74.57 2.86 0 4.42-4.03 8-9 8z"/>
                </svg>
                {streak.count}
              </span>
            )}
          </div>
          {/* Live timer */}
          {!state.isComplete && (
            <div className="flex items-center gap-1 mt-0.5">
              <svg className="h-2.5 w-2.5 text-white/40" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path strokeLinecap="round" d="M12 7v5l3 3" />
              </svg>
              <span className="text-[10px] font-mono text-white/50 tabular-nums">{formatClock(elapsedSeconds)}</span>
            </div>
          )}
        </div>

        {/* Serving team indicator */}
        <div className={`absolute bottom-2 ${servingTeam === "A" ? "left-3" : "right-3"} flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-sm px-2 py-1`}>
          <div className="h-2 w-2 rounded-full bg-ball-yellow animate-pulse" />
          <span className="text-[9px] font-bold text-white uppercase">
            {servingTeam === "A" ? "Team A" : "Team B"} Serving
          </span>
        </div>
      </div>

      {/* Rally Winner Buttons — large touch targets */}
      {!state.isComplete && !trackScorers && (
        <div className="space-y-2.5">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleRallyWinner("A")}
              className="relative rounded-2xl bg-gradient-to-br from-court-green to-court-green-dark px-4 py-7 text-center transition-all active:scale-[0.97] cursor-pointer shadow-lg shadow-court-green/20 hover:shadow-xl hover:shadow-court-green/30"
            >
              <div className="flex items-center justify-center gap-1.5 mb-2">
                {config.teamA.map((id) => {
                  const player = getPlayer(id);
                  return (
                    <PlayerAvatar
                      key={id}
                      displayName={player?.display_name ?? "?"}
                      color={player?.color ?? null}
                      avatarUrl={player?.avatar_url ?? null}
                      size="sm"
                    />
                  );
                })}
              </div>
              <span className="text-sm font-bold text-white/90 leading-tight block truncate">
                {config.teamA.map((id) => getPlayerName(id).split(" ")[0]).join(" & ")}
              </span>
              <span className="text-[10px] font-semibold text-white/60 uppercase tracking-widest mt-0.5 block">
                Point
              </span>
            </button>
            <button
              onClick={() => handleRallyWinner("B")}
              className="relative rounded-2xl bg-gradient-to-br from-sky-blue to-sky-blue-dark px-4 py-7 text-center transition-all active:scale-[0.97] cursor-pointer shadow-lg shadow-sky-blue/20 hover:shadow-xl hover:shadow-sky-blue/30"
            >
              <div className="flex items-center justify-center gap-1.5 mb-2">
                {config.teamB.map((id) => {
                  const player = getPlayer(id);
                  return (
                    <PlayerAvatar
                      key={id}
                      displayName={player?.display_name ?? "?"}
                      color={player?.color ?? null}
                      avatarUrl={player?.avatar_url ?? null}
                      size="sm"
                    />
                  );
                })}
              </div>
              <span className="text-sm font-bold text-white/90 leading-tight block truncate">
                {config.teamB.map((id) => getPlayerName(id).split(" ")[0]).join(" & ")}
              </span>
              <span className="text-[10px] font-semibold text-white/60 uppercase tracking-widest mt-0.5 block">
                Point
              </span>
            </button>
          </div>

          {/* Fault buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleRallyWinner("B")}
              className="rounded-xl border border-hype-red/20 bg-hype-red/5 px-3 py-3 text-center transition-all active:scale-[0.97] cursor-pointer hover:bg-hype-red/10 hover:border-hype-red/40"
            >
              <span className="text-sm font-semibold text-hype-red/80">
                Team A Fault
              </span>
            </button>
            <button
              onClick={() => handleRallyWinner("A")}
              className="rounded-xl border border-hype-red/20 bg-hype-red/5 px-3 py-3 text-center transition-all active:scale-[0.97] cursor-pointer hover:bg-hype-red/10 hover:border-hype-red/40"
            >
              <span className="text-sm font-semibold text-hype-red/80">
                Team B Fault
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Scorer mode hint + fault buttons */}
      {!state.isComplete && trackScorers && (
        <div className="space-y-2.5">
          <p className="text-center text-xs font-medium text-text-muted">
            Tap the player who scored on the court above
          </p>
          {/* Fault buttons still available in scorer mode */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleRallyWinner("B")}
              className="rounded-xl border border-hype-red/20 bg-hype-red/5 px-3 py-3 text-center transition-all active:scale-[0.97] cursor-pointer hover:bg-hype-red/10 hover:border-hype-red/40"
            >
              <span className="text-sm font-semibold text-hype-red/80">
                Team A Fault
              </span>
            </button>
            <button
              onClick={() => handleRallyWinner("A")}
              className="rounded-xl border border-hype-red/20 bg-hype-red/5 px-3 py-3 text-center transition-all active:scale-[0.97] cursor-pointer hover:bg-hype-red/10 hover:border-hype-red/40"
            >
              <span className="text-sm font-semibold text-hype-red/80">
                Team B Fault
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Match Complete */}
      {state.isComplete && (
        <div className="win-pop relative overflow-hidden rounded-2xl border-2 border-ball-yellow bg-gradient-to-br from-ball-yellow/15 via-surface to-court-green/5 p-8 text-center shadow-lg shadow-ball-yellow/10">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-ball-yellow/25 mb-4">
            <svg className="h-6 w-6 text-ball-yellow" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          <p className="font-display text-4xl text-court-green-dark">
            {state.winner === "A"
              ? config.teamA.map((id) => getPlayerName(id).split(" ")[0]).join(" & ")
              : config.teamB.map((id) => getPlayerName(id).split(" ")[0]).join(" & ")} Win!
          </p>
          <div className="flex items-baseline justify-center gap-3 mt-2">
            <span className="font-display text-5xl text-court-green leading-none tabular-nums">
              {state.winner === "A" ? state.teamAScore : state.teamBScore}
            </span>
            <span className="font-score font-bold text-3xl text-text-muted/40 leading-none tabular-nums">
              {state.winner === "A" ? state.teamBScore : state.teamAScore}
            </span>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2">
            {(state.winner === "A" ? config.teamA : config.teamB).map((id) => {
              const player = getPlayer(id);
              return (
                <PlayerAvatar
                  key={id}
                  displayName={player?.display_name ?? "?"}
                  color={player?.color ?? null}
                  avatarUrl={player?.avatar_url ?? null}
                  size="md"
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Footer: Undo + Rally count */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={handleUndo}
          disabled={!canUndo(history)}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-muted transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
          </svg>
          Undo
        </button>
        <span className="text-xs font-medium text-text-muted tabular-nums">
          Rally {history.rallyWinners.length}
        </span>
      </div>
    </div>
  );
}

/**
 * Count consecutive actual scoring rallies (where a point was earned) by the
 * same team from the end of the match. In pickleball side-out scoring, only
 * the serving team can score — winning a rally as the receiving team is just
 * a side-out (no point). This replays the rally history to determine which
 * rallies actually produced points, then counts the trailing streak.
 */
function getScoringStreak(
  history: MatchHistory,
): { team: Team; count: number } | null {
  if (history.rallyWinners.length === 0) return null;

  // Replay rallies to determine which ones resulted in actual points
  const scoringTeams: Team[] = [];
  let state = createMatch(history.initialInput);

  for (let i = 0; i < history.rallyWinners.length; i++) {
    const result = processRally(state, history.rallyWinners[i], i + 1);
    if (result.scoringTeam !== null) {
      scoringTeams.push(result.scoringTeam);
    }
    state = result.newState;
  }

  if (scoringTeams.length === 0) return null;

  // Count consecutive scoring rallies from the end
  const lastScoringTeam = scoringTeams[scoringTeams.length - 1];
  let count = 0;
  for (let i = scoringTeams.length - 1; i >= 0; i--) {
    if (scoringTeams[i] !== lastScoringTeam) break;
    count++;
  }

  return { team: lastScoringTeam, count };
}

function getSyncToneClass(tone: "success" | "pending" | "warning" | "error") {
  switch (tone) {
    case "success":
      return "border border-green-200 bg-green-50 text-green-700";
    case "warning":
      return "border border-amber-200 bg-amber-50 text-amber-700";
    case "error":
      return "border border-red-200 bg-red-50 text-red-700";
    case "pending":
    default:
      return "border border-sky-blue/30 bg-sky-blue/5 text-sky-blue";
  }
}

function getSyncDotClass(tone: "success" | "pending" | "warning" | "error") {
  switch (tone) {
    case "success":
      return "bg-green-500";
    case "warning":
      return "bg-amber-500";
    case "error":
      return "bg-red-500";
    case "pending":
    default:
      return "bg-sky-blue animate-pulse";
  }
}
