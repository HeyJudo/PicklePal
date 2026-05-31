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

  // Streak detection — count consecutive points from the end of rallyWinners
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const streak = getStreak(history.rallyWinners);

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

      {/* Court View — Top-down pickleball court */}
      <div className="relative rounded-2xl overflow-hidden p-3" style={{ backgroundColor: "#8BA86B" }}>
        {/* Court surface */}
        <div className="relative rounded-lg overflow-hidden border-[3px] border-white">
          {/* Court grid: Left service boxes | Kitchen | Right service boxes */}
          <div className="grid grid-cols-[1fr_0.6fr_1fr]">
            {/* Team A side — two service boxes */}
            <div className={`grid grid-rows-2 border-r-[3px] border-white ${streak && streak.team === "A" && streak.count >= 3 ? "streak-fire" : ""}`}>
              {/* Top service box */}
              <div className="relative flex items-center justify-center p-3 min-h-[80px]" style={{ backgroundColor: "#4A7FA5" }}>
                {config.teamA[0] && (
                  <div className="flex flex-col items-center gap-1">
                    <div className={`rounded-full p-0.5 ${serverPlayerId === config.teamA[0] ? "ring-2 ring-ball-yellow ring-offset-1" : ""}`}>
                      <PlayerAvatar
                        displayName={getPlayer(config.teamA[0])?.display_name ?? "?"}
                        color={getPlayer(config.teamA[0])?.color ?? null}
                        avatarUrl={getPlayer(config.teamA[0])?.avatar_url ?? null}
                        size="md"
                      />
                    </div>
                    <span className="text-[10px] font-bold text-white drop-shadow-md">
                      {getPlayerName(config.teamA[0]).split(" ")[0]}
                    </span>
                    {serverPlayerId === config.teamA[0] && (
                      <span className="text-[8px] font-bold text-ball-yellow bg-black/30 rounded px-1">
                        S{serverNumber ?? ""}
                      </span>
                    )}
                  </div>
                )}
              </div>
              {/* Bottom service box */}
              <div className="relative flex items-center justify-center p-3 min-h-[80px] border-t-[3px] border-white" style={{ backgroundColor: "#4A7FA5" }}>
                {config.teamA[1] && (
                  <div className="flex flex-col items-center gap-1">
                    <div className={`rounded-full p-0.5 ${serverPlayerId === config.teamA[1] ? "ring-2 ring-ball-yellow ring-offset-1" : ""}`}>
                      <PlayerAvatar
                        displayName={getPlayer(config.teamA[1])?.display_name ?? "?"}
                        color={getPlayer(config.teamA[1])?.color ?? null}
                        avatarUrl={getPlayer(config.teamA[1])?.avatar_url ?? null}
                        size="md"
                      />
                    </div>
                    <span className="text-[10px] font-bold text-white drop-shadow-md">
                      {getPlayerName(config.teamA[1]).split(" ")[0]}
                    </span>
                    {serverPlayerId === config.teamA[1] && (
                      <span className="text-[8px] font-bold text-ball-yellow bg-black/30 rounded px-1">
                        S{serverNumber ?? ""}
                      </span>
                    )}
                  </div>
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
              {/* Top service box */}
              <div className="relative flex items-center justify-center p-3 min-h-[80px]" style={{ backgroundColor: "#4A7FA5" }}>
                {config.teamB[0] && (
                  <div className="flex flex-col items-center gap-1">
                    <div className={`rounded-full p-0.5 ${serverPlayerId === config.teamB[0] ? "ring-2 ring-ball-yellow ring-offset-1" : ""}`}>
                      <PlayerAvatar
                        displayName={getPlayer(config.teamB[0])?.display_name ?? "?"}
                        color={getPlayer(config.teamB[0])?.color ?? null}
                        avatarUrl={getPlayer(config.teamB[0])?.avatar_url ?? null}
                        size="md"
                      />
                    </div>
                    <span className="text-[10px] font-bold text-white drop-shadow-md">
                      {getPlayerName(config.teamB[0]).split(" ")[0]}
                    </span>
                    {serverPlayerId === config.teamB[0] && (
                      <span className="text-[8px] font-bold text-ball-yellow bg-black/30 rounded px-1">
                        S{serverNumber ?? ""}
                      </span>
                    )}
                  </div>
                )}
              </div>
              {/* Bottom service box */}
              <div className="relative flex items-center justify-center p-3 min-h-[80px] border-t-[3px] border-white" style={{ backgroundColor: "#4A7FA5" }}>
                {config.teamB[1] && (
                  <div className="flex flex-col items-center gap-1">
                    <div className={`rounded-full p-0.5 ${serverPlayerId === config.teamB[1] ? "ring-2 ring-ball-yellow ring-offset-1" : ""}`}>
                      <PlayerAvatar
                        displayName={getPlayer(config.teamB[1])?.display_name ?? "?"}
                        color={getPlayer(config.teamB[1])?.color ?? null}
                        avatarUrl={getPlayer(config.teamB[1])?.avatar_url ?? null}
                        size="md"
                      />
                    </div>
                    <span className="text-[10px] font-bold text-white drop-shadow-md">
                      {getPlayerName(config.teamB[1]).split(" ")[0]}
                    </span>
                    {serverPlayerId === config.teamB[1] && (
                      <span className="text-[8px] font-bold text-ball-yellow bg-black/30 rounded px-1">
                        S{serverNumber ?? ""}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Scoreboard overlay — floating on top of court */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-black/70 backdrop-blur-sm px-4 py-1.5 shadow-lg">
          <span className={`text-xl font-black tabular-nums ${servingTeam === "A" ? "text-ball-yellow" : "text-white"}`}>
            {state.teamAScore}
          </span>
          <span className="text-white/50 text-sm font-medium">–</span>
          <span className={`text-xl font-black tabular-nums ${servingTeam === "B" ? "text-ball-yellow" : "text-white"}`}>
            {state.teamBScore}
          </span>
          {isDoubles && (
            <>
              <span className="text-white/30 text-xs">|</span>
              <span className="text-[10px] font-mono text-white/70">{scoreCall}</span>
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

        {/* Serving team indicator */}
        <div className={`absolute bottom-2 ${servingTeam === "A" ? "left-3" : "right-3"} flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-sm px-2 py-1`}>
          <div className="h-2 w-2 rounded-full bg-ball-yellow animate-pulse" />
          <span className="text-[9px] font-bold text-white uppercase">
            {servingTeam === "A" ? "Team A" : "Team B"} Serving
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

/**
 * Count consecutive scoring rallies by the same team from the end of the list.
 * Returns { team, count } or null if no rallies yet.
 */
function getStreak(
  rallyWinners: readonly Team[],
): { team: Team; count: number } | null {
  if (rallyWinners.length === 0) return null;

  const lastTeam = rallyWinners[rallyWinners.length - 1];
  let count = 0;
  for (let i = rallyWinners.length - 1; i >= 0; i--) {
    if (rallyWinners[i] !== lastTeam) break;
    count++;
  }
  return { team: lastTeam, count };
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
