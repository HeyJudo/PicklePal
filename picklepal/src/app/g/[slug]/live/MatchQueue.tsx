"use client";

import { useState, useCallback } from "react";
import {
  createMatchmakingState,
  generateNextMatchup,
} from "@/lib/matchmaking";
import type { MatchmakingState, Matchup, MatchType } from "@/lib/matchmaking";

interface Player {
  readonly id: string;
  readonly display_name: string;
  readonly color: string | null;
}

interface MatchQueueProps {
  readonly players: readonly Player[];
  readonly matchType: MatchType;
  readonly onMatchSelected: (matchup: Matchup) => void;
}

export function MatchQueue({
  players,
  matchType,
  onMatchSelected,
}: MatchQueueProps) {
  const [state, setState] = useState<MatchmakingState>(() =>
    createMatchmakingState(
      players.map((p) => p.id),
      matchType,
    ),
  );
  const [currentMatchup, setCurrentMatchup] = useState<Matchup | null>(null);

  const playerMap = new Map(players.map((p) => [p.id, p]));

  const generateNext = useCallback(() => {
    const { matchup, newState } = generateNextMatchup(state);
    setCurrentMatchup(matchup);
    setState(newState);
  }, [state]);

  const regenerate = useCallback(() => {
    // Re-generate from same state (don't advance round)
    const prevState: MatchmakingState = {
      ...state,
      round: state.round > 0 ? state.round - 1 : 0,
    };
    const { matchup, newState } = generateNextMatchup(prevState);
    setCurrentMatchup(matchup);
    setState(newState);
  }, [state]);

  const handleConfirm = () => {
    if (currentMatchup) {
      onMatchSelected(currentMatchup);
    }
  };

  const getPlayerName = (id: string) =>
    playerMap.get(id)?.display_name ?? "Unknown";

  const getPlayerColor = (id: string) =>
    playerMap.get(id)?.color ?? "#6366f1";

  const minPlayers = matchType === "doubles" ? 4 : 2;
  const hasEnoughPlayers = players.length >= minPlayers;

  return (
    <div className="space-y-4">
      {/* Generate Button */}
      {!currentMatchup && (
        <>
          <button
            onClick={generateNext}
            disabled={!hasEnoughPlayers}
            className="w-full rounded-xl bg-primary px-4 py-3.5 text-base font-semibold text-white hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Generate Next Match
          </button>
          {!hasEnoughPlayers && (
            <p className="text-sm text-amber-600 text-center">
              Need at least {minPlayers} active players for {matchType}.
              Activate benched players or add a late arrival.
            </p>
          )}
        </>
      )}

      {/* Current Matchup Display */}
      {currentMatchup && (
        <div className="space-y-4">
          {/* Teams */}
          <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
            {/* Team A */}
            <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wide text-center">
                Team A
              </p>
              {currentMatchup.teamA.map((id) => (
                <div key={id} className="flex items-center gap-2">
                  <div
                    className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                    style={{ backgroundColor: getPlayerColor(id) }}
                  >
                    {getPlayerName(id).charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-text-primary truncate">
                    {getPlayerName(id)}
                  </span>
                </div>
              ))}
            </div>

            {/* VS */}
            <div className="text-lg font-bold text-text-muted">vs</div>

            {/* Team B */}
            <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wide text-center">
                Team B
              </p>
              {currentMatchup.teamB.map((id) => (
                <div key={id} className="flex items-center gap-2">
                  <div
                    className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                    style={{ backgroundColor: getPlayerColor(id) }}
                  >
                    {getPlayerName(id).charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-text-primary truncate">
                    {getPlayerName(id)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bench */}
          {currentMatchup.sittingOut.length > 0 && (
            <div className="rounded-xl border border-border bg-surface-muted p-3">
              <p className="text-xs font-medium text-text-muted mb-2">
                Sitting out this round:
              </p>
              <div className="flex flex-wrap gap-2">
                {currentMatchup.sittingOut.map((id) => (
                  <div
                    key={id}
                    className="flex items-center gap-1.5 rounded-full bg-surface border border-border px-2.5 py-1"
                  >
                    <div
                      className="h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                      style={{ backgroundColor: getPlayerColor(id) }}
                    >
                      {getPlayerName(id).charAt(0)}
                    </div>
                    <span className="text-xs text-text-secondary">
                      {getPlayerName(id)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleConfirm}
              className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary/90 transition-colors cursor-pointer"
            >
              Confirm & Start
            </button>
            <button
              onClick={regenerate}
              className="rounded-xl border border-border px-4 py-3 text-sm font-medium text-text-secondary hover:bg-surface-muted transition-colors cursor-pointer"
            >
              Shuffle
            </button>
          </div>
        </div>
      )}

      {/* Round Info */}
      {state.round > 0 && (
        <p className="text-xs text-text-muted text-center">
          Round {state.round} · {players.length} players
        </p>
      )}
    </div>
  );
}
