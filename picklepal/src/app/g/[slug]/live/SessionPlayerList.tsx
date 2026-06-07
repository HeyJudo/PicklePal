"use client";

import { useState, useTransition } from "react";
import { PlayerAvatar } from "@/components/players";
import {
  benchPlayer,
  activatePlayer,
  removePlayerFromSession,
} from "./session-player-actions";
import type { SessionPlayerStatus } from "@/lib/supabase";

interface Player {
  readonly id: string;
  readonly display_name: string;
  readonly color: string | null;
  readonly avatar_url: string | null;
}

interface SessionPlayerEntry {
  readonly playerId: string;
  readonly status: SessionPlayerStatus;
}

interface SessionPlayerListProps {
  readonly sessionId: string;
  readonly players: readonly Player[];
  readonly sessionPlayers: readonly SessionPlayerEntry[];
  readonly isHost: boolean;
  readonly onPlayerStatusChanged: (
    playerId: string,
    newStatus: SessionPlayerStatus,
  ) => void;
}

export function SessionPlayerList({
  sessionId,
  players,
  sessionPlayers,
  isHost,
  onPlayerStatusChanged,
}: SessionPlayerListProps) {
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);

  const playerMap = new Map(players.map((p) => [p.id, p]));
  const sessionPlayerMap = new Map(
    sessionPlayers.map((sp) => [sp.playerId, sp.status]),
  );

  const activePlayers = sessionPlayers.filter((sp) => sp.status === "active");
  const benchedPlayers = sessionPlayers.filter((sp) => sp.status === "benched");

  // Players in the group roster but NOT in this session (available to add)
  const availableToAdd = players.filter(
    (p) => !sessionPlayerMap.has(p.id),
  );

  const handleBench = (playerId: string) => {
    startTransition(async () => {
      const result = await benchPlayer(sessionId, playerId);
      if (result.success) {
        onPlayerStatusChanged(playerId, "benched");
      }
    });
  };

  const handleActivate = (playerId: string) => {
    startTransition(async () => {
      const result = await activatePlayer(sessionId, playerId);
      if (result.success) {
        onPlayerStatusChanged(playerId, "active");
      }
    });
  };

  const handleRemove = (playerId: string) => {
    startTransition(async () => {
      const result = await removePlayerFromSession(sessionId, playerId);
      if (result.success) {
        onPlayerStatusChanged(playerId, "removed");
      }
    });
  };

  const handleAddLateArrival = (playerId: string) => {
    startTransition(async () => {
      const result = await activatePlayer(sessionId, playerId);
      if (result.success) {
        onPlayerStatusChanged(playerId, "active");
        setShowAddPlayer(false);
      }
    });
  };

  return (
    <div className="rounded-xl border border-border bg-surface">
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-4 cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-text-primary">
            Players
          </h3>
          <span className="rounded-full bg-court-green/10 px-2 py-0.5 text-xs font-medium text-court-green">
            {activePlayers.length} active
          </span>
          {benchedPlayers.length > 0 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              {benchedPlayers.length} benched
            </span>
          )}
        </div>
        <svg
          className={`h-4 w-4 text-text-muted transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
          {/* Active Players */}
          {activePlayers.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
                Active
              </p>
              <div className="flex flex-wrap gap-2">
                {activePlayers.map((sp) => {
                  const player = playerMap.get(sp.playerId);
                  if (!player) return null;
                  return (
                    <PlayerChip
                      key={sp.playerId}
                      player={player}
                      status="active"
                      isHost={isHost}
                      isPending={isPending}
                      onBench={() => handleBench(sp.playerId)}
                      onRemove={() => handleRemove(sp.playerId)}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Benched Players */}
          {benchedPlayers.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
                Benched
              </p>
              <div className="flex flex-wrap gap-2">
                {benchedPlayers.map((sp) => {
                  const player = playerMap.get(sp.playerId);
                  if (!player) return null;
                  return (
                    <PlayerChip
                      key={sp.playerId}
                      player={player}
                      status="benched"
                      isHost={isHost}
                      isPending={isPending}
                      onActivate={() => handleActivate(sp.playerId)}
                      onRemove={() => handleRemove(sp.playerId)}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Add Late Arrival */}
          {availableToAdd.length > 0 && (
            <div className="pt-2 border-t border-border">
              {!showAddPlayer ? (
                <button
                  onClick={() => setShowAddPlayer(true)}
                  className="text-xs font-semibold text-court-green hover:text-court-green-dark cursor-pointer"
                >
                  + Add late arrival
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-text-muted">
                      Select player to add:
                    </p>
                    <button
                      onClick={() => setShowAddPlayer(false)}
                      className="text-xs text-text-muted hover:text-text-secondary cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableToAdd.map((player) => (
                      <button
                        key={player.id}
                        onClick={() => handleAddLateArrival(player.id)}
                        disabled={isPending}
                        className="flex items-center gap-1.5 rounded-full border border-dashed border-court-green/40 bg-court-green/5 px-2.5 py-1.5 text-xs font-medium text-court-green hover:bg-court-green/10 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <PlayerAvatar
                          displayName={player.display_name}
                          color={player.color}
                          avatarUrl={player.avatar_url}
                          size="xs"
                        />
                        {player.display_name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Player Chip Component ───────────────────────────────────────────────────

interface PlayerChipProps {
  readonly player: Player;
  readonly status: "active" | "benched";
  readonly isHost: boolean;
  readonly isPending: boolean;
  readonly onBench?: () => void;
  readonly onActivate?: () => void;
  readonly onRemove?: () => void;
}

function PlayerChip({
  player,
  status,
  isHost,
  isPending,
  onBench,
  onActivate,
  onRemove,
}: PlayerChipProps) {
  const [showActions, setShowActions] = useState(false);

  const chipStyles =
    status === "active"
      ? "border-border bg-surface"
      : "border-amber-200 bg-amber-50";

  return (
    <div className="relative">
      <button
        onClick={() => setShowActions(!showActions)}
        className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-medium transition-colors ${chipStyles} cursor-pointer hover:border-court-green/40`}
      >
        <PlayerAvatar
          displayName={player.display_name}
          color={player.color}
          avatarUrl={player.avatar_url}
          size="xs"
        />
        <span className={status === "benched" ? "text-amber-700" : "text-text-primary"}>
          {player.display_name}
        </span>
        {status === "benched" && (
          <span className="text-[10px] text-amber-500" aria-label="Benched">&#x23F8;</span>
        )}
      </button>

      {/* Action popover */}
      {showActions && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowActions(false)}
            aria-hidden="true"
          />
          <div className="absolute top-full left-0 z-50 mt-1 rounded-lg border border-border bg-surface shadow-lg py-1 min-w-[140px]">
            {status === "active" && onBench && (
              <button
                onClick={() => {
                  onBench();
                  setShowActions(false);
                }}
                disabled={isPending}
                className="w-full px-3 py-2 text-left text-xs font-medium text-amber-700 hover:bg-amber-50 cursor-pointer disabled:opacity-50"
              >
                Bench player
              </button>
            )}
            {status === "benched" && onActivate && (
              <button
                onClick={() => {
                  onActivate();
                  setShowActions(false);
                }}
                disabled={isPending}
                className="w-full px-3 py-2 text-left text-xs font-medium text-green-700 hover:bg-green-50 cursor-pointer disabled:opacity-50"
              >
                Activate player
              </button>
            )}
            {onRemove && (
              <button
                onClick={() => {
                  onRemove();
                  setShowActions(false);
                }}
                disabled={isPending}
                className="w-full px-3 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50 cursor-pointer disabled:opacity-50"
              >
                Remove from session
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
