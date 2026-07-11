"use client";

import { useState } from "react";
import { Chip } from "@/components/ui/Chip";
import type { MatchmakingState } from "@/lib/matchmaking";

interface Player {
  readonly id: string;
  readonly display_name: string;
  readonly color: string | null;
  readonly avatar_url: string | null;
}

interface GamesPlayedPanelProps {
  readonly players: readonly Player[];
  readonly matchmakingState: MatchmakingState;
}

export function GamesPlayedPanel({
  players,
  matchmakingState,
}: GamesPlayedPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Derive player stats, sort fewest -> most games played
  const playerStats = players.map((p) => {
    const session = matchmakingState.playerSessions.get(p.id);
    return {
      ...p,
      gamesPlayed: session?.gamesPlayed ?? 0,
    };
  }).sort((a, b) => {
    if (a.gamesPlayed !== b.gamesPlayed) {
      return a.gamesPlayed - b.gamesPlayed;
    }
    // Tiebreaker: display name
    return a.display_name.localeCompare(b.display_name);
  });

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-surface-muted hover:bg-surface-hover transition-colors cursor-pointer"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-text-primary">Games Played</span>
          <span className="text-xs text-text-muted">({players.length} active)</span>
        </div>
        <svg
          className={`w-4 h-4 text-text-muted transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isExpanded && (
        <div className="px-4 py-3 border-t border-border space-y-2">
          {playerStats.map((p, index) => {
            const firstLetter = p.display_name.charAt(0).toUpperCase();
            return (
              <div key={p.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-text-muted font-mono w-4 text-right">
                    {index + 1}.
                  </span>
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-sm"
                    style={{ backgroundColor: p.color ?? "#6366f1" }}
                    aria-hidden="true"
                  >
                    {firstLetter}
                  </div>
                  <span className="text-sm font-medium text-text-primary truncate max-w-[120px]">
                    {p.display_name}
                  </span>
                </div>
                
                {p.gamesPlayed === 0 ? (
                  <Chip size="sm" variant="gold">NEW</Chip>
                ) : (
                  <div className="flex items-center gap-1 rounded-full bg-surface-muted px-2 py-0.5 border border-border">
                    <span className="text-xs font-semibold text-text-primary">{p.gamesPlayed}</span>
                    <span className="text-[10px] text-text-muted">games</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
