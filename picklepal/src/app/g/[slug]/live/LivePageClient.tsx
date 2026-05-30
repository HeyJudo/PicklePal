"use client";

import { useState } from "react";
import { StartSessionForm } from "./StartSessionForm";
import { ActiveSession } from "./ActiveSession";

interface SessionData {
  readonly id: string;
  readonly title: string | null;
  readonly status: string;
  readonly default_match_type: string;
  readonly target_score: number;
  readonly win_by: number;
  readonly started_at: string;
}

interface Player {
  readonly id: string;
  readonly display_name: string;
  readonly color: string | null;
}

interface LivePageClientProps {
  readonly groupSlug: string;
  readonly initialSession: SessionData | null;
  readonly players: readonly Player[];
}

export function LivePageClient({
  groupSlug,
  initialSession,
  players,
}: LivePageClientProps) {
  const [activeSession, setActiveSession] = useState<SessionData | null>(
    initialSession,
  );

  const handleSessionStarted = (sessionId: string) => {
    // Optimistically show active session
    // In a real scenario we'd refetch, but for now construct from known data
    setActiveSession({
      id: sessionId,
      title: null,
      status: "active",
      default_match_type: "doubles",
      target_score: 11,
      win_by: 2,
      started_at: new Date().toISOString(),
    });
    // Force a page refresh to get fresh server data
    window.location.reload();
  };

  const handleSessionEnded = () => {
    setActiveSession(null);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-text-primary">Live</h1>
        <p className="text-text-secondary mt-1">
          {activeSession
            ? "Game Day is in progress."
            : "Start a Game Day session and score matches in real time."}
        </p>
      </header>

      {activeSession ? (
        <ActiveSession
          groupSlug={groupSlug}
          session={activeSession}
          onSessionEnded={handleSessionEnded}
        />
      ) : (
        <>
          {players.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface-muted p-8 text-center">
              <p className="text-text-muted text-sm">
                No players in this group yet. Add players from the Players tab
                first.
              </p>
            </div>
          ) : (
            <StartSessionForm
              groupSlug={groupSlug}
              players={players}
              onSessionStarted={handleSessionStarted}
            />
          )}
        </>
      )}
    </div>
  );
}
