"use client";

import { useState } from "react";
import { StartSessionForm } from "./StartSessionForm";
import { ActiveSession } from "./ActiveSession";
import { PositionConfirmation } from "./PositionConfirmation";
import type { MatchStartConfig } from "./PositionConfirmation";
import type { Matchup } from "@/lib/matchmaking";

type LiveStep = "idle" | "active" | "positions" | "scoring";

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
  const [currentMatchup, setCurrentMatchup] = useState<Matchup | null>(null);
  const [matchConfig, setMatchConfig] = useState<MatchStartConfig | null>(null);
  const [step, setStep] = useState<LiveStep>(initialSession ? "active" : "idle");

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
    setCurrentMatchup(null);
    setMatchConfig(null);
    setStep("idle");
  };

  const handleMatchConfirmed = (matchup: Matchup) => {
    setCurrentMatchup(matchup);
    setStep("positions");
  };

  const handlePositionsConfirmed = (config: MatchStartConfig) => {
    setMatchConfig(config);
    setStep("scoring");
    // Phase 4d will render the live scoring screen here
    console.log("Match starting with config:", config);
  };

  const handleBackToQueue = () => {
    setCurrentMatchup(null);
    setStep("active");
  };

  const matchType =
    activeSession?.default_match_type === "singles" ? "singles" : "doubles";

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

      {/* Step: No session */}
      {step === "idle" && !activeSession && (
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

      {/* Step: Active session — matchup queue */}
      {step === "active" && activeSession && (
        <ActiveSession
          groupSlug={groupSlug}
          session={activeSession}
          players={players}
          onSessionEnded={handleSessionEnded}
          onMatchConfirmed={handleMatchConfirmed}
        />
      )}

      {/* Step: Position confirmation */}
      {step === "positions" && currentMatchup && (
        <PositionConfirmation
          matchup={currentMatchup}
          players={players}
          matchType={matchType as "singles" | "doubles"}
          onConfirm={handlePositionsConfirmed}
          onBack={handleBackToQueue}
        />
      )}

      {/* Step: Scoring (Phase 4d placeholder) */}
      {step === "scoring" && matchConfig && (
        <div className="rounded-xl border border-border bg-surface-muted p-8 text-center space-y-2">
          <p className="text-text-primary font-semibold">
            Match in progress...
          </p>
          <p className="text-text-muted text-sm">
            Live court scoring will be built in Phase 4d.
          </p>
          <button
            onClick={handleBackToQueue}
            className="mt-4 rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:bg-surface cursor-pointer"
          >
            ← Back to queue
          </button>
        </div>
      )}
    </div>
  );
}
