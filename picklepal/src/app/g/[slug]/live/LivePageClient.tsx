"use client";

import { useState } from "react";
import { StartSessionForm } from "./StartSessionForm";
import { ActiveSession } from "./ActiveSession";
import type { Matchup } from "@/lib/matchmaking";

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
  const [activeMatchup, setActiveMatchup] = useState<Matchup | null>(null);

  const handleSessionStarted = (sessionId: string) => {
    setActiveSession({
      id: sessionId,
      title: null,
      status: "active",
      default_match_type: "doubles",
      target_score: 11,
      win_by: 2,
      started_at: new Date().toISOString(),
    });
    window.location.reload();
  };

  const handleSessionEnded = () => {
    setActiveSession(null);
    setActiveMatchup(null);
  };

  const handleMatchConfirmed = (matchup: Matchup) => {
    setActiveMatchup(matchup);
    // Phase 4c/4d will use this to show position confirmation → scoring
    console.log("Match confirmed:", matchup);
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
          players={players}
          onSessionEnded={handleSessionEnded}
          onMatchConfirmed={handleMatchConfirmed}
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
