"use client";

import { useState, useCallback } from "react";
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
import type { MatchStartConfig } from "./PositionConfirmation";

interface Player {
  readonly id: string;
  readonly display_name: string;
  readonly color: string | null;
}

interface LiveScoringProps {
  readonly config: MatchStartConfig;
  readonly players: readonly Player[];
  readonly targetScore: number;
  readonly winBy: number;
  readonly onMatchComplete: (history: MatchHistory) => void;
}

export function LiveScoring({
  config,
  players,
  targetScore,
  winBy,
  onMatchComplete,
}: LiveScoringProps) {
  const [history, setHistory] = useState<MatchHistory>(() => {
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

  const playerMap = new Map(players.map((p) => [p.id, p]));
  const getPlayerName = (id: string) =>
    playerMap.get(id)?.display_name ?? "?";
  const getPlayerColor = (id: string) =>
    playerMap.get(id)?.color ?? "#6366f1";

  const state = history.currentState;
  const isDoubles = isDoublesState(state);

  const handleRallyWinner = useCallback(
    (winner: Team) => {
      if (state.isComplete) return;

      const { history: newHistory } = recordRally(history, winner);
      setHistory(newHistory);

      // Check if match just completed
      if (newHistory.currentState.isComplete) {
        // Small delay for the score to render before showing result
        setTimeout(() => onMatchComplete(newHistory), 600);
      }
    },
    [history, state.isComplete, onMatchComplete],
  );

  const handleUndo = useCallback(() => {
    setHistory(undoRally(history));
  }, [history]);

  // Get server info
  const servingTeam = isDoubles
    ? (state as DoublesMatchState).serverState.servingTeam
    : (state as SinglesMatchState).serverState.servingTeam;

  const serverPlayerId = isDoubles
    ? (state as DoublesMatchState).serverState.serverPlayerId
    : (state as SinglesMatchState).serverState.serverPlayerId;

  const serverNumber = isDoubles
    ? (state as DoublesMatchState).serverState.serverNumber
    : null;

  // Score call (e.g., "3-5-2" for doubles or "3-5" for singles)
  const scoreCall = isDoubles
    ? `${state.teamAScore}-${state.teamBScore}-${serverNumber}`
    : `${state.teamAScore}-${state.teamBScore}`;

  return (
    <div className="space-y-4">
      {/* Score Display */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          {/* Team A Score */}
          <div className="text-center">
            <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1">
              Team A
            </p>
            <p
              className={`text-5xl font-bold tabular-nums ${
                servingTeam === "A" ? "text-primary" : "text-text-primary"
              }`}
            >
              {state.teamAScore}
            </p>
            <div className="mt-2 space-y-0.5">
              {config.teamA.map((id) => (
                <div key={id} className="flex items-center justify-center gap-1.5">
                  <div
                    className="h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                    style={{ backgroundColor: getPlayerColor(id) }}
                  >
                    {getPlayerName(id).charAt(0)}
                  </div>
                  <span className="text-xs text-text-secondary">
                    {getPlayerName(id)}
                  </span>
                  {serverPlayerId === id && (
                    <span className="text-[10px] bg-primary/20 text-primary px-1 rounded font-medium">
                      S{serverNumber ?? ""}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Center */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm font-mono text-text-muted">
              {scoreCall}
            </span>
            {servingTeam === "A" && (
              <span className="text-[10px] text-primary font-medium">← Serving</span>
            )}
            {servingTeam === "B" && (
              <span className="text-[10px] text-primary font-medium">Serving →</span>
            )}
          </div>

          {/* Team B Score */}
          <div className="text-center">
            <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1">
              Team B
            </p>
            <p
              className={`text-5xl font-bold tabular-nums ${
                servingTeam === "B" ? "text-primary" : "text-text-primary"
              }`}
            >
              {state.teamBScore}
            </p>
            <div className="mt-2 space-y-0.5">
              {config.teamB.map((id) => (
                <div key={id} className="flex items-center justify-center gap-1.5">
                  <div
                    className="h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                    style={{ backgroundColor: getPlayerColor(id) }}
                  >
                    {getPlayerName(id).charAt(0)}
                  </div>
                  <span className="text-xs text-text-secondary">
                    {getPlayerName(id)}
                  </span>
                  {serverPlayerId === id && (
                    <span className="text-[10px] bg-primary/20 text-primary px-1 rounded font-medium">
                      S{serverNumber ?? ""}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Rally Winner Buttons */}
      {!state.isComplete && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleRallyWinner("A")}
            className="rounded-xl bg-primary/10 border-2 border-primary px-4 py-6 text-center transition-all active:scale-95 cursor-pointer hover:bg-primary/20"
          >
            <span className="text-lg font-bold text-primary">
              Team A Won Rally
            </span>
          </button>
          <button
            onClick={() => handleRallyWinner("B")}
            className="rounded-xl bg-sky-blue/10 border-2 border-sky-blue px-4 py-6 text-center transition-all active:scale-95 cursor-pointer hover:bg-sky-blue/20"
          >
            <span className="text-lg font-bold text-sky-blue">
              Team B Won Rally
            </span>
          </button>
        </div>
      )}

      {/* Match Complete */}
      {state.isComplete && (
        <div className="rounded-xl border-2 border-primary bg-primary/5 p-6 text-center">
          <p className="text-2xl font-bold text-primary">
            {state.winner === "A" ? "Team A" : "Team B"} Wins!
          </p>
          <p className="text-lg text-text-secondary mt-1">
            {state.teamAScore} - {state.teamBScore}
          </p>
        </div>
      )}

      {/* Undo Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleUndo}
          disabled={!canUndo(history)}
          className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:bg-surface-muted transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ↩ Undo
        </button>
        <span className="text-xs text-text-muted">
          Rally {history.rallyWinners.length}
        </span>
      </div>
    </div>
  );
}
