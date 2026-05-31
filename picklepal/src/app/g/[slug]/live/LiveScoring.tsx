"use client";

import { useState, useCallback, useEffect } from "react";
import { PlayerAvatar } from "@/components/players";
import {
  createMatchHistory,
  recordRally,
  undoRally,
  canUndo,
  isDoublesState,
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

  const playerMap = new Map(players.map((p) => [p.id, p]));
  const getPlayer = (id: string) => playerMap.get(id);
  const getPlayerName = (id: string) =>
    playerMap.get(id)?.display_name ?? "?";

  const state = history.currentState;
  const isDoubles = isDoublesState(state);

  const handleRallyWinner = useCallback(
    (winner: Team) => {
      if (state.isComplete) return;

      const serverState = isDoublesState(history.currentState)
        ? (history.currentState as DoublesMatchState).serverState
        : (history.currentState as SinglesMatchState).serverState;
      const { history: newHistory, result } = recordRally(history, winner);
      setHistory(newHistory);
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
        createdAt: new Date().toISOString(),
      });
      setPendingRallyCount(nextQueue.length);

      if (newHistory.currentState.isComplete) {
        setTimeout(() => onMatchComplete(newHistory), 600);
      }
    },
    [history, matchLocalId, onMatchComplete, sessionId, state.isComplete],
  );

  const handleUndo = useCallback(() => {
    if (canUndo(history)) {
      removeLastOfflineRallyEvent(sessionId, matchLocalId);
      setPendingRallyCount((count) => Math.max(0, count - 1));
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

  const syncDisplay = getSyncDisplay({
    pendingCount: pendingRallyCount,
    isOnline,
    isSyncing: false,
    retryAttempt: 0,
    hasError: false,
  });

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

      {/* Court View */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-court-green/30 bg-gradient-to-b from-court-green/5 via-surface to-sky-blue/5">
        {/* Court center line */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-transparent via-border to-transparent" />

        <div className="relative grid grid-cols-[1fr_auto_1fr] items-stretch">
          {/* Team A Side */}
          <div className="p-4 flex flex-col items-center justify-center gap-3">
            {/* Serving indicator */}
            {servingTeam === "A" && (
              <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-court-green/10 border border-court-green/30 px-2 py-0.5">
                <div className="h-2 w-2 rounded-full bg-ball-yellow animate-pulse" />
                <span className="text-[10px] font-bold text-court-green uppercase tracking-wider">
                  Serve
                </span>
              </div>
            )}

            {/* Score */}
            <p
              className={`text-6xl font-black tabular-nums leading-none ${
                servingTeam === "A"
                  ? "text-court-green drop-shadow-[0_2px_4px_rgba(45,139,78,0.3)]"
                  : "text-text-primary"
              }`}
            >
              {state.teamAScore}
            </p>

            {/* Players */}
            <div className="flex flex-col items-center gap-2 mt-1">
              {config.teamA.map((id) => {
                const player = getPlayer(id);
                const isServer = serverPlayerId === id;
                return (
                  <div
                    key={id}
                    className={`flex items-center gap-2 rounded-full px-2.5 py-1.5 transition-all ${
                      isServer
                        ? "bg-court-green/10 border border-court-green/40 shadow-sm"
                        : "bg-surface-muted border border-transparent"
                    }`}
                  >
                    <PlayerAvatar
                      displayName={player?.display_name ?? "?"}
                      color={player?.color ?? null}
                      avatarUrl={player?.avatar_url ?? null}
                      size="sm"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-text-primary leading-tight">
                        {getPlayerName(id).split(" ")[0]}
                      </span>
                      {isServer && (
                        <span className="text-[9px] font-bold text-court-green uppercase">
                          Server{serverNumber ? ` ${serverNumber}` : ""}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Center Divider */}
          <div className="flex flex-col items-center justify-center py-6 px-2">
            <div className="w-[2px] flex-1 bg-gradient-to-b from-court-green/30 via-border to-sky-blue/30 rounded-full" />
            <div className="my-2 rounded-full bg-surface border border-border shadow-sm px-2.5 py-1.5">
              <span className="text-[11px] font-mono font-bold text-text-secondary tracking-wide">
                {scoreCall}
              </span>
            </div>
            <div className="w-[2px] flex-1 bg-gradient-to-b from-sky-blue/30 via-border to-court-green/30 rounded-full" />
          </div>

          {/* Team B Side */}
          <div className="p-4 flex flex-col items-center justify-center gap-3">
            {/* Serving indicator */}
            {servingTeam === "B" && (
              <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-sky-blue/10 border border-sky-blue/30 px-2 py-0.5">
                <div className="h-2 w-2 rounded-full bg-ball-yellow animate-pulse" />
                <span className="text-[10px] font-bold text-sky-blue uppercase tracking-wider">
                  Serve
                </span>
              </div>
            )}

            {/* Score */}
            <p
              className={`text-6xl font-black tabular-nums leading-none ${
                servingTeam === "B"
                  ? "text-sky-blue drop-shadow-[0_2px_4px_rgba(33,150,243,0.3)]"
                  : "text-text-primary"
              }`}
            >
              {state.teamBScore}
            </p>

            {/* Players */}
            <div className="flex flex-col items-center gap-2 mt-1">
              {config.teamB.map((id) => {
                const player = getPlayer(id);
                const isServer = serverPlayerId === id;
                return (
                  <div
                    key={id}
                    className={`flex items-center gap-2 rounded-full px-2.5 py-1.5 transition-all ${
                      isServer
                        ? "bg-sky-blue/10 border border-sky-blue/40 shadow-sm"
                        : "bg-surface-muted border border-transparent"
                    }`}
                  >
                    <PlayerAvatar
                      displayName={player?.display_name ?? "?"}
                      color={player?.color ?? null}
                      avatarUrl={player?.avatar_url ?? null}
                      size="sm"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-text-primary leading-tight">
                        {getPlayerName(id).split(" ")[0]}
                      </span>
                      {isServer && (
                        <span className="text-[9px] font-bold text-sky-blue uppercase">
                          Server{serverNumber ? ` ${serverNumber}` : ""}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Target score indicator */}
        <div className="absolute bottom-1.5 inset-x-0 flex justify-center">
          <span className="text-[10px] text-text-muted font-medium">
            First to {targetScore}, win by {winBy}
          </span>
        </div>
      </div>

      {/* Rally Winner Buttons — large touch targets */}
      {!state.isComplete && (
        <div className="space-y-2.5">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleRallyWinner("A")}
              className="relative rounded-2xl bg-gradient-to-br from-court-green to-court-green-dark px-4 py-7 text-center transition-all active:scale-[0.97] cursor-pointer shadow-lg shadow-court-green/20 hover:shadow-xl hover:shadow-court-green/30"
            >
              <span className="text-lg font-bold text-white drop-shadow-sm">
                Team A Point
              </span>
              <div className="mt-1 flex items-center justify-center gap-1">
                {config.teamA.map((id) => {
                  const player = getPlayer(id);
                  return (
                    <PlayerAvatar
                      key={id}
                      displayName={player?.display_name ?? "?"}
                      color={player?.color ?? null}
                      avatarUrl={player?.avatar_url ?? null}
                      size="xs"
                    />
                  );
                })}
              </div>
            </button>
            <button
              onClick={() => handleRallyWinner("B")}
              className="relative rounded-2xl bg-gradient-to-br from-sky-blue to-sky-blue-dark px-4 py-7 text-center transition-all active:scale-[0.97] cursor-pointer shadow-lg shadow-sky-blue/20 hover:shadow-xl hover:shadow-sky-blue/30"
            >
              <span className="text-lg font-bold text-white drop-shadow-sm">
                Team B Point
              </span>
              <div className="mt-1 flex items-center justify-center gap-1">
                {config.teamB.map((id) => {
                  const player = getPlayer(id);
                  return (
                    <PlayerAvatar
                      key={id}
                      displayName={player?.display_name ?? "?"}
                      color={player?.color ?? null}
                      avatarUrl={player?.avatar_url ?? null}
                      size="xs"
                    />
                  );
                })}
              </div>
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

      {/* Match Complete */}
      {state.isComplete && (
        <div className="rounded-2xl border-2 border-ball-yellow bg-gradient-to-br from-ball-yellow/10 via-surface to-court-green/5 p-8 text-center shadow-lg">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-ball-yellow/20 mb-3">
            <svg className="h-6 w-6 text-ball-yellow" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          <p className="text-3xl font-black text-text-primary">
            {state.winner === "A" ? "Team A" : "Team B"} Wins!
          </p>
          <p className="text-xl font-bold text-text-secondary mt-1 tabular-nums">
            {state.teamAScore} – {state.teamBScore}
          </p>
          <div className="mt-3 flex items-center justify-center gap-2">
            {(state.winner === "A" ? config.teamA : config.teamB).map((id) => {
              const player = getPlayer(id);
              return (
                <div key={id} className="flex items-center gap-1.5">
                  <PlayerAvatar
                    displayName={player?.display_name ?? "?"}
                    color={player?.color ?? null}
                    avatarUrl={player?.avatar_url ?? null}
                    size="md"
                  />
                </div>
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
