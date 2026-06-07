"use client";

import { useState } from "react";
import { PlayerAvatar } from "@/components/players";
import { takeOverScoring } from "./active-match-actions";
import type { MatchSnapshot } from "@/lib/supabase";

interface Player {
  readonly id: string;
  readonly display_name: string;
  readonly color: string | null;
  readonly avatar_url: string | null;
}

interface ActiveMatchBannerProps {
  readonly matchId: string;
  readonly snapshot: MatchSnapshot | null;
  readonly teamAPlayerIds: readonly string[];
  readonly teamBPlayerIds: readonly string[];
  readonly players: readonly Player[];
  readonly isHeartbeatStale: boolean;
  readonly isAdmin: boolean;
  readonly onTakeOver: () => void;
  readonly onViewMatch: () => void;
}

export function ActiveMatchBanner({
  matchId,
  snapshot,
  teamAPlayerIds,
  teamBPlayerIds,
  players,
  isHeartbeatStale,
  isAdmin,
  onTakeOver,
  onViewMatch,
}: ActiveMatchBannerProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isTakingOver, setIsTakingOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const playerMap = new Map(players.map((p) => [p.id, p]));
  const getPlayerName = (id: string) =>
    playerMap.get(id)?.display_name.split(" ")[0] ?? "?";

  const handleTakeOver = async () => {
    setIsTakingOver(true);
    setError(null);
    const result = await takeOverScoring(matchId);
    if (result.success) {
      onTakeOver();
    } else {
      setError(result.error ?? "Failed to take over");
    }
    setIsTakingOver(false);
    setShowConfirm(false);
  };

  return (
    <div className="rounded-xl border border-court-green/30 bg-court-green/5 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-court-green opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-court-green" />
        </span>
        <span className="text-sm font-semibold text-court-green">Match In Progress</span>
        {isHeartbeatStale && (
          <span className="ml-auto text-[10px] font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
            Scorer inactive
          </span>
        )}
      </div>

      {/* Teams and Score */}
      <div className="flex items-center justify-between gap-3">
        {/* Team A */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <div className="flex -space-x-1.5">
            {teamAPlayerIds.map((id) => {
              const player = playerMap.get(id);
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
          <span className="text-xs font-medium text-text-secondary truncate">
            {teamAPlayerIds.map(getPlayerName).join(" & ")}
          </span>
        </div>

        {/* Score */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="font-display text-2xl leading-none tabular-nums text-text-primary">
            {snapshot?.teamAScore ?? 0}
          </span>
          <span className="text-sm text-text-muted">–</span>
          <span className="font-display text-2xl leading-none tabular-nums text-text-primary">
            {snapshot?.teamBScore ?? 0}
          </span>
        </div>

        {/* Team B */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
          <span className="text-xs font-medium text-text-secondary truncate text-right">
            {teamBPlayerIds.map(getPlayerName).join(" & ")}
          </span>
          <div className="flex -space-x-1.5">
            {teamBPlayerIds.map((id) => {
              const player = playerMap.get(id);
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
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onViewMatch}
          className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-text-primary hover:bg-surface-muted transition-colors cursor-pointer"
        >
          <span className="flex items-center justify-center gap-1.5">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            View Live
          </span>
        </button>

        {isAdmin && isHeartbeatStale && !showConfirm && (
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            className="flex-1 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-colors cursor-pointer"
          >
            Take Over Scoring
          </button>
        )}
      </div>

      {/* Confirm takeover */}
      {showConfirm && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
          <p className="text-xs text-amber-800">
            The current scorer appears disconnected. Taking over will make you the active scorer for this match.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTakeOver}
              disabled={isTakingOver}
              className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isTakingOver ? "Taking over..." : "Confirm Take Over"}
            </button>
            <button
              type="button"
              onClick={() => setShowConfirm(false)}
              className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
