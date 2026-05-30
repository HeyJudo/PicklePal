"use client";

import { useTransition } from "react";
import { useHostAuth } from "@/hooks/useHostAuth";
import { endSession } from "./actions";
import { MatchQueue } from "./MatchQueue";
import type { Matchup } from "@/lib/matchmaking";

interface Player {
  readonly id: string;
  readonly display_name: string;
  readonly color: string | null;
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
  readonly onSessionEnded: () => void;
  readonly onMatchConfirmed: (matchup: Matchup) => void;
}

export function ActiveSession({
  groupSlug,
  session,
  players,
  onSessionEnded,
  onMatchConfirmed,
}: ActiveSessionProps) {
  const { isHost } = useHostAuth(groupSlug);
  const [isPending, startTransition] = useTransition();

  const handleEndSession = () => {
    if (!isHost) return;

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

  const matchType = session.default_match_type === "singles" ? "singles" : "doubles";

  return (
    <div className="space-y-6">
      {/* Session Header */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium text-green-700">
                Game Day Active
              </span>
            </div>
            <h2 className="mt-1 text-xl font-bold text-text-primary">
              {session.title ?? "Game Day"}
            </h2>
            <p className="text-sm text-text-muted mt-0.5">
              Started at {timeStr} ·{" "}
              {matchType === "doubles" ? "Doubles" : "Singles"}{" "}
              · To {session.target_score}, win by {session.win_by}
            </p>
          </div>
        </div>
      </div>

      {/* Match Queue */}
      <MatchQueue
        players={players}
        matchType={matchType}
        onMatchSelected={onMatchConfirmed}
      />

      {/* End Session */}
      {isHost && (
        <button
          onClick={handleEndSession}
          disabled={isPending}
          className="w-full rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50"
        >
          {isPending ? "Ending..." : "End Game Day"}
        </button>
      )}
    </div>
  );
}
