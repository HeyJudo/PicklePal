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
  readonly avatar_url: string | null;
}

interface MatchQueueProps {
  readonly players: readonly Player[];
  readonly matchType: MatchType;
  readonly isHost: boolean;
  readonly onMatchSelected: (matchup: Matchup) => void;
}

export function MatchQueue({
  players,
  matchType,
  isHost,
  onMatchSelected,
}: MatchQueueProps) {
  const [state, setState] = useState<MatchmakingState>(() =>
    createMatchmakingState(
      players.map((p) => p.id),
      matchType,
    ),
  );
  const [currentMatchup, setCurrentMatchup] = useState<Matchup | null>(null);
  // Which player slot the host is currently swapping (playerId | null)
  const [swappingPlayerId, setSwappingPlayerId] = useState<string | null>(null);

  const playerMap = new Map(players.map((p) => [p.id, p]));

  const generateNext = useCallback(() => {
    const { matchup, newState } = generateNextMatchup(state);
    setCurrentMatchup(matchup);
    setState(newState);
    setSwappingPlayerId(null);
  }, [state]);

  const regenerate = useCallback(() => {
    const prevState: MatchmakingState = {
      ...state,
      round: state.round > 0 ? state.round - 1 : 0,
    };
    const { matchup, newState } = generateNextMatchup(prevState);
    setCurrentMatchup(matchup);
    setState(newState);
    setSwappingPlayerId(null);
  }, [state]);

  // Swap a playing player with one who is sitting out
  const handleSwap = useCallback(
    (outgoingId: string, incomingId: string) => {
      if (!currentMatchup) return;
      const swap = (arr: readonly string[]) =>
        arr.map((id) => (id === outgoingId ? incomingId : id));
      setCurrentMatchup({
        teamA: swap(currentMatchup.teamA),
        teamB: swap(currentMatchup.teamB),
        sittingOut: currentMatchup.sittingOut
          .filter((id) => id !== incomingId)
          .concat(outgoingId),
      });
      setSwappingPlayerId(null);
    },
    [currentMatchup],
  );

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
      {/* Generate button — shown until a matchup is generated */}
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

      {/* Matchup display — once generated */}
      {currentMatchup && (
        <div className="space-y-4">
          {/* Edit hint for host */}
          {isHost && currentMatchup.sittingOut.length > 0 && (
            <p className="text-xs text-center text-text-muted">
              Tap a player to swap them out
            </p>
          )}

          {/* Teams */}
          <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-start">
            {/* Team A */}
            <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wide text-center">
                Team A
              </p>
              {currentMatchup.teamA.map((id) => (
                <PlayerSlot
                  key={id}
                  name={getPlayerName(id)}
                  color={getPlayerColor(id)}
                  isHost={isHost}
                  canSwap={currentMatchup.sittingOut.length > 0}
                  isSwapping={swappingPlayerId === id}
                  sittingOut={currentMatchup.sittingOut}
                  playerMap={playerMap}
                  onStartSwap={() =>
                    setSwappingPlayerId(swappingPlayerId === id ? null : id)
                  }
                  onSwap={(incomingId) => handleSwap(id, incomingId)}
                />
              ))}
            </div>

            {/* VS */}
            <div className="text-lg font-bold text-text-muted pt-10">vs</div>

            {/* Team B */}
            <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wide text-center">
                Team B
              </p>
              {currentMatchup.teamB.map((id) => (
                <PlayerSlot
                  key={id}
                  name={getPlayerName(id)}
                  color={getPlayerColor(id)}
                  isHost={isHost}
                  canSwap={currentMatchup.sittingOut.length > 0}
                  isSwapping={swappingPlayerId === id}
                  sittingOut={currentMatchup.sittingOut}
                  playerMap={playerMap}
                  onStartSwap={() =>
                    setSwappingPlayerId(swappingPlayerId === id ? null : id)
                  }
                  onSwap={(incomingId) => handleSwap(id, incomingId)}
                />
              ))}
            </div>
          </div>

          {/* Sitting out */}
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
                      className="h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0"
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

      {/* Round info */}
      {state.round > 0 && (
        <p className="text-xs text-text-muted text-center">
          Round {state.round} · {players.length} players
        </p>
      )}
    </div>
  );
}

// ─── Player Slot ─────────────────────────────────────────────────────────────

interface PlayerSlotProps {
  readonly name: string;
  readonly color: string;
  readonly isHost: boolean;
  readonly canSwap: boolean;
  readonly isSwapping: boolean;
  readonly sittingOut: readonly string[];
  readonly playerMap: Map<string, { display_name: string; color: string | null }>;
  readonly onStartSwap: () => void;
  readonly onSwap: (incomingId: string) => void;
}

function PlayerSlot({
  name,
  color,
  isHost,
  canSwap,
  isSwapping,
  sittingOut,
  playerMap,
  onStartSwap,
  onSwap,
}: PlayerSlotProps) {
  const interactive = isHost && canSwap;

  return (
    <div className="relative">
      <button
        onClick={interactive ? onStartSwap : undefined}
        disabled={!interactive}
        className={`flex w-full items-center gap-2 rounded-lg transition-colors ${
          interactive
            ? isSwapping
              ? "bg-primary/10 ring-1 ring-primary/40 px-2 py-1 cursor-pointer"
              : "hover:bg-surface-muted px-2 py-1 cursor-pointer"
            : "cursor-default"
        }`}
      >
        <div
          className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
          style={{ backgroundColor: color }}
        >
          {name.charAt(0)}
        </div>
        <span className="text-sm font-medium text-text-primary truncate flex-1 text-left">
          {name}
        </span>
        {interactive && (
          <svg
            className={`h-3.5 w-3.5 shrink-0 transition-colors ${
              isSwapping ? "text-primary" : "text-text-muted"
            }`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 3M21 7.5H7.5"
            />
          </svg>
        )}
      </button>

      {/* Swap picker dropdown */}
      {isSwapping && (
        <>
          {/* Backdrop to close on outside click */}
          <div
            className="fixed inset-0 z-40"
            onClick={onStartSwap}
            aria-hidden="true"
          />
          <div className="absolute left-0 top-full z-50 mt-1 w-full min-w-[160px] rounded-xl border border-border bg-surface shadow-lg py-1.5">
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
              Swap with
            </p>
            {sittingOut.map((incomingId) => {
              const p = playerMap.get(incomingId);
              if (!p) return null;
              return (
                <button
                  key={incomingId}
                  onClick={() => onSwap(incomingId)}
                  className="flex w-full items-center gap-2 px-3 py-2 hover:bg-surface-muted transition-colors cursor-pointer"
                >
                  <div
                    className="h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                    style={{ backgroundColor: p.color ?? "#6366f1" }}
                  >
                    {p.display_name.charAt(0)}
                  </div>
                  <span className="text-sm text-text-primary">
                    {p.display_name}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
