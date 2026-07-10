"use client";

import { useMemo, useState, useTransition } from "react";
import { endSession } from "./actions";
import { MatchQueue } from "./MatchQueue";
import { GamesPlayedPanel } from "./GamesPlayedPanel";
import { SessionPlayerList } from "./SessionPlayerList";
import { SessionMatchHistory } from "./SessionMatchHistory";
import type { Matchup, MatchmakingState, MatchType } from "@/lib/matchmaking";
import type { SessionPlayerStatus } from "@/lib/supabase";
import type { SessionMatchData } from "./actions";

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

interface ActiveSessionProps {
  readonly groupSlug: string;
  readonly session: {
    readonly id: string;
    readonly title: string | null;
    readonly default_match_type: string;
    readonly target_score: number;
    readonly win_by: number;
    readonly started_at: string;
  };
  readonly players: readonly Player[];
  readonly sessionPlayers: readonly SessionPlayerEntry[];
  readonly sessionMatches: readonly SessionMatchData[];
  readonly isHost: boolean;
  readonly onSessionEnded: () => void;
  readonly onMatchConfirmed: (matchup: Matchup) => void;
  readonly onPlayerStatusChanged: (playerId: string, newStatus: SessionPlayerStatus) => void;
  // Queue props lifted from MatchQueue
  readonly matchQueue: Matchup[];
  readonly matchmakingState: MatchmakingState;
  readonly matchType: MatchType;
  readonly canShuffle: boolean;
  readonly onShuffle: () => boolean;
}

export function ActiveSession({
  groupSlug,
  session,
  players,
  sessionPlayers,
  sessionMatches,
  isHost,
  onSessionEnded,
  onMatchConfirmed,
  onPlayerStatusChanged,
  matchQueue,
  matchmakingState,
  matchType,
  canShuffle,
  onShuffle,
}: ActiveSessionProps) {
  const [isPending, startTransition] = useTransition();
  const [confirmEnd, setConfirmEnd] = useState(false);

  // Filter to only active players for matchmaking
  const activePlayerIds = useMemo(
    () => new Set(
      sessionPlayers
        .filter((sp) => sp.status === "active")
        .map((sp) => sp.playerId),
    ),
    [sessionPlayers],
  );

  const activePlayersForMatchmaking = useMemo(
    () => players.filter((p) => activePlayerIds.has(p.id)),
    [players, activePlayerIds],
  );

  const handleEndSession = () => {
    startTransition(async () => {
      const result = await endSession(session.id);
      if (result.success) {
        onSessionEnded();
      }
    });
  };

  const startedAt = new Date(session.started_at);
  const timeStr = startedAt.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="space-y-6">
      {/* Session Header — branded gradient hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-court-green-dark via-court-green to-sky-blue-dark px-5 py-4">
        {/* Court lines watermark */}
        <div className="absolute inset-0 opacity-[0.07]" aria-hidden="true">
          <svg viewBox="0 0 400 160" preserveAspectRatio="xMidYMid slice" className="w-full h-full" fill="none" stroke="white" strokeWidth="1.5">
            <rect x="20" y="20" width="360" height="120" rx="2" />
            <line x1="200" y1="20" x2="200" y2="140" strokeWidth="2" />
            <line x1="130" y1="20" x2="130" y2="140" strokeDasharray="4 4" />
            <line x1="270" y1="20" x2="270" y2="140" strokeDasharray="4 4" />
            <line x1="20" y1="80" x2="130" y2="80" />
            <line x1="270" y1="80" x2="380" y2="80" />
          </svg>
        </div>

        <div className="relative">
          {/* Live indicator */}
          <div className="flex items-center gap-2 mb-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ball-yellow opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-ball-yellow" />
            </span>
            <span className="text-[11px] font-label font-semibold text-white/60 uppercase tracking-widest">
              Game Day Active
            </span>
          </div>

          <h2 className="font-display text-2xl text-white leading-tight">
            {session.title ?? "Game Day"}
          </h2>

          {/* Stats row */}
          <div className="flex items-center gap-4 mt-3">
            <div>
              <p className="font-display text-xl text-ball-yellow leading-none tabular-nums">
                {session.target_score}
              </p>
              <p className="text-white/50 text-[10px] font-label font-semibold uppercase tracking-widest mt-0.5">
                {matchType === "doubles" ? "Doubles" : "Singles"}
              </p>
            </div>
            <div className="w-px h-7 bg-white/15" aria-hidden="true" />
            <div>
              <p className="font-display text-xl text-ball-yellow leading-none tabular-nums">
                {session.win_by}
              </p>
              <p className="text-white/50 text-[10px] font-label font-semibold uppercase tracking-widest mt-0.5">
                Win by
              </p>
            </div>
            <div className="w-px h-7 bg-white/15" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-white leading-none">{timeStr}</p>
              <p className="text-white/50 text-[10px] font-label font-semibold uppercase tracking-widest mt-0.5">
                Started
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Match Queue */}
      <MatchQueue
        players={activePlayersForMatchmaking}
        queue={matchQueue}
        matchmakingState={matchmakingState}
        matchType={matchType}
        isHost={isHost}
        canShuffle={canShuffle}
        onShuffle={onShuffle}
        onMatchSelected={onMatchConfirmed}
      />

      {/* Games Played Panel */}
      <GamesPlayedPanel
        players={activePlayersForMatchmaking}
        matchmakingState={matchmakingState}
      />

      {/* Session Player List */}
      <SessionPlayerList
        sessionId={session.id}
        players={players}
        sessionPlayers={sessionPlayers}
        isHost={isHost}
        onPlayerStatusChanged={onPlayerStatusChanged}
        matchmakingState={matchmakingState}
      />

      {/* Completed Matches */}
      <SessionMatchHistory matches={sessionMatches} players={players} />

      {/* End Session — utility footer with inline confirm */}
      {isHost && (
        <div className="flex items-center justify-end border-t border-border-muted pt-3 min-h-[28px]">
          {!confirmEnd ? (
            <button
              onClick={() => setConfirmEnd(true)}
              className="text-xs font-medium text-text-muted hover:text-red-500 transition-colors cursor-pointer"
            >
              End Game Day
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-xs text-text-muted">End the session?</span>
              <button
                onClick={() => setConfirmEnd(false)}
                className="text-xs font-medium text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleEndSession}
                disabled={isPending}
                className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isPending ? "Ending..." : "Yes, end it"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
