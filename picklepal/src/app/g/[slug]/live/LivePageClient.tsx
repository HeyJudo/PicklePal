"use client";

import { useState } from "react";
import { StartSessionForm } from "./StartSessionForm";
import { ActiveSession } from "./ActiveSession";
import { PositionConfirmation } from "./PositionConfirmation";
import { LiveScoring } from "./LiveScoring";
import type { MatchStartConfig } from "./PositionConfirmation";
import type { Matchup } from "@/lib/matchmaking";
import type { MatchHistory } from "@/lib/engine";

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
  };

  const handleMatchComplete = (completedHistory: MatchHistory) => {
    // Phase 4e will save the match to DB here
    console.log("Match complete:", completedHistory);
    // For now, go back to queue for next match
    setMatchConfig(null);
    setCurrentMatchup(null);
    setStep("active");
  };

  const handleBackToQueue = () => {
    setCurrentMatchup(null);
    setMatchConfig(null);
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

      {/* Step: Scoring */}
      {step === "scoring" && matchConfig && activeSession && (
        <LiveScoring
          config={matchConfig}
          players={players}
          targetScore={activeSession.target_score}
          winBy={activeSession.win_by}
          onMatchComplete={handleMatchComplete}
        />
      )}
    </div>
  );
}
