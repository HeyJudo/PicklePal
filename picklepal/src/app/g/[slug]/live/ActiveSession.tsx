"use client";

import { useTransition } from "react";
import { useHostAuth } from "@/hooks/useHostAuth";
import { endSession } from "./actions";

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
  readonly onSessionEnded: () => void;
}

export function ActiveSession({
  groupSlug,
  session,
  onSessionEnded,
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
              {session.default_match_type === "doubles" ? "Doubles" : "Singles"}{" "}
              · To {session.target_score}, win by {session.win_by}
            </p>
          </div>
        </div>
      </div>

      {/* Placeholder for matchup generation (Phase 4b) */}
      <div className="rounded-xl border border-border bg-surface-muted p-8 text-center">
        <p className="text-text-muted text-sm">
          Matchup generation and the scoring loop will be built in Phase 4b–4e.
        </p>
      </div>

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
