"use client";

import { useState, useCallback } from "react";
import { StartSessionForm } from "./StartSessionForm";
import { ActiveSession } from "./ActiveSession";
import { PositionConfirmation } from "./PositionConfirmation";
import { LiveScoring } from "./LiveScoring";
import { MatchResult } from "./MatchResult";
import { GameDayRecap } from "./GameDayRecap";
import { OverlayRenderer } from "@/components/share";
import { endSession, getSessionRecap } from "./actions";
import type { MatchStartConfig } from "./PositionConfirmation";
import type { CompletedMatchData } from "./MatchResult";
import type { Matchup } from "@/lib/matchmaking";
import {
  clearRecoverableMatch,
  getRecoverableMatch,
  rebuildHistoryFromRecovery,
  saveRecoverableMatch,
} from "@/lib/offline";
import type { RecoverableMatch } from "@/lib/offline";
import {
  createMatch,
  processRally,
  isDoublesState,
} from "@/lib/engine";
import type { MatchHistory, DoublesMatchState, SinglesMatchState } from "@/lib/engine";
import type { SessionPlayerStatus } from "@/lib/supabase";

type LiveStep = "idle" | "active" | "positions" | "scoring" | "result" | "recap" | "overlay";

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
  readonly avatar_url: string | null;
}

interface SessionPlayerEntry {
  readonly playerId: string;
  readonly status: SessionPlayerStatus;
}

interface LivePageClientProps {
  readonly groupSlug: string;
  readonly initialSession: SessionData | null;
  readonly players: readonly Player[];
  readonly initialSessionPlayers: readonly SessionPlayerEntry[];
}

export function LivePageClient({
  groupSlug,
  initialSession,
  players,
  initialSessionPlayers,
}: LivePageClientProps) {
  const [activeSession, setActiveSession] = useState<SessionData | null>(
    initialSession,
  );
  const [sessionPlayers, setSessionPlayers] = useState<readonly SessionPlayerEntry[]>(
    initialSessionPlayers,
  );
  const [currentMatchup, setCurrentMatchup] = useState<Matchup | null>(null);
  const [matchConfig, setMatchConfig] = useState<MatchStartConfig | null>(null);
  const [matchLocalId, setMatchLocalId] = useState<string | null>(null);
  const [recoveredHistory, setRecoveredHistory] = useState<MatchHistory | null>(null);
  const [recoverableMatch, setRecoverableMatch] =
    useState<RecoverableMatch | null>(() =>
      initialSession ? getRecoverableMatch(initialSession.id) : null,
    );
  const [completedMatch, setCompletedMatch] = useState<CompletedMatchData | null>(null);
  const [recapData, setRecapData] = useState<{
    gamesPlayed: number;
    playerCount: number;
    durationMinutes: number | null;
    awards: import("@/lib/stats").SessionAwards;
    playerNames: Record<string, string>;
  } | null>(null);
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

  const handlePlayerStatusChanged = useCallback(
    (playerId: string, newStatus: SessionPlayerStatus) => {
      setSessionPlayers((prev) => {
        if (newStatus === "removed") {
          return prev.filter((sp) => sp.playerId !== playerId);
        }
        const existing = prev.find((sp) => sp.playerId === playerId);
        if (existing) {
          return prev.map((sp) =>
            sp.playerId === playerId ? { ...sp, status: newStatus } : sp,
          );
        }
        // Late arrival — add new entry
        return [...prev, { playerId, status: newStatus }];
      });
    },
    [],
  );

  const handleSessionEnded = async () => {
    // End the session in the database
    if (activeSession) {
      await endSession(activeSession.id);

      // Fetch recap data for the slideshow
      const recapResult = await getSessionRecap(activeSession.id);
      if (recapResult.success && recapResult.data) {
        setRecapData(recapResult.data);
        setStep("recap");
        return;
      }
    }

    // Fallback: if recap fetch fails, just reload
    setActiveSession(null);
    setCurrentMatchup(null);
    setMatchConfig(null);
    setMatchLocalId(null);
    setRecoveredHistory(null);
    setRecoverableMatch(null);
    setCompletedMatch(null);
    setStep("idle");
    window.location.reload();
  };

  const handleRecapDone = () => {
    setStep("overlay");
  };

  const handleOverlayDone = () => {
    setActiveSession(null);
    setCurrentMatchup(null);
    setMatchConfig(null);
    setMatchLocalId(null);
    setRecoveredHistory(null);
    setRecoverableMatch(null);
    setCompletedMatch(null);
    setRecapData(null);
    setStep("idle");
    window.location.reload();
  };

  const handleMatchConfirmed = (matchup: Matchup) => {
    setCurrentMatchup(matchup);
    setStep("positions");
  };

  const handlePositionsConfirmed = (config: MatchStartConfig) => {
    if (!activeSession) return;

    const nextMatchLocalId = createLocalMatchId();
    setMatchConfig(config);
    setMatchLocalId(nextMatchLocalId);
    setRecoveredHistory(null);
    saveRecoverableMatch({
      sessionId: activeSession.id,
      matchLocalId: nextMatchLocalId,
      config,
      targetScore: activeSession.target_score,
      winBy: activeSession.win_by,
      createdAt: new Date().toISOString(),
    });
    setStep("scoring");
  };

  const handleMatchComplete = (completedHistory: MatchHistory) => {
    setCompletedMatch(buildCompletedMatchData(completedHistory));
    setStep("result");
  };

  const handleNextMatch = () => {
    setMatchConfig(null);
    setMatchLocalId(null);
    setRecoveredHistory(null);
    setRecoverableMatch(null);
    setCurrentMatchup(null);
    setCompletedMatch(null);
    setStep("active");
  };

  const handleBackToQueue = () => {
    setCurrentMatchup(null);
    setMatchConfig(null);
    setMatchLocalId(null);
    setRecoveredHistory(null);
    setStep("active");
  };

  const handleResumeRecoveredMatch = () => {
    if (!recoverableMatch) return;

    const history = rebuildHistoryFromRecovery(recoverableMatch);
    setMatchConfig(recoverableMatch.config);
    setMatchLocalId(recoverableMatch.matchLocalId);
    setRecoveredHistory(history);
    setRecoverableMatch(null);

    if (history.currentState.isComplete) {
      setCompletedMatch(buildCompletedMatchData(history));
      setStep("result");
    } else {
      setStep("scoring");
    }
  };

  const handleDiscardRecoveredMatch = () => {
    if (!recoverableMatch) return;

    clearRecoverableMatch(
      recoverableMatch.sessionId,
      recoverableMatch.matchLocalId,
    );
    setRecoverableMatch(null);
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

      {recoverableMatch && step === "active" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-800">
            Unsaved match found
          </p>
          <p className="mt-1 text-sm text-amber-700">
            Resume the local match saved on this device, or discard it and keep
            building the queue.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={handleResumeRecoveredMatch}
              className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary/90"
            >
              Resume
            </button>
            <button
              onClick={handleDiscardRecoveredMatch}
              className="rounded-lg border border-amber-300 px-3 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100"
            >
              Discard
            </button>
          </div>
        </div>
      )}

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
          sessionPlayers={sessionPlayers}
          onSessionEnded={handleSessionEnded}
          onMatchConfirmed={handleMatchConfirmed}
          onPlayerStatusChanged={handlePlayerStatusChanged}
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
      {step === "scoring" && matchConfig && activeSession && matchLocalId && (
        <LiveScoring
          config={matchConfig}
          sessionId={activeSession.id}
          matchLocalId={matchLocalId}
          initialHistory={recoveredHistory ?? undefined}
          players={players}
          targetScore={activeSession.target_score}
          winBy={activeSession.win_by}
          onMatchComplete={handleMatchComplete}
        />
      )}

      {/* Step: Result */}
      {step === "result" && completedMatch && activeSession && (
        <MatchResult
          matchData={completedMatch}
          sessionId={activeSession.id}
          matchLocalId={matchLocalId}
          players={players}
          targetScore={activeSession.target_score}
          winBy={activeSession.win_by}
          onNextMatch={handleNextMatch}
          onEndSession={handleSessionEnded}
        />
      )}

      {/* Step: Recap slideshow */}
      {step === "recap" && recapData && activeSession && (
        <GameDayRecap
          data={recapData}
          sessionId={activeSession.id}
          groupSlug={groupSlug}
          onDone={handleRecapDone}
        />
      )}

      {/* Step: Overlay download */}
      {step === "overlay" && recapData && activeSession && (
        <div className="fixed inset-0 z-[100] bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center px-4">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold text-white">Share Your Day</h2>
            <p className="text-sm text-white/60 mt-1">
              Download the overlay and add it to your photo
            </p>
          </div>

          <OverlayRenderer
            data={{
              sessionTitle: activeSession.title ?? "Game Day",
              date: new Date(activeSession.started_at).toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
                year: "numeric",
              }),
              matchCount: recapData.gamesPlayed,
              playerCount: recapData.playerCount,
              mvpName: recapData.awards.mvp?.displayName ?? null,
            }}
          />

          <button
            onClick={handleOverlayDone}
            className="mt-6 text-sm text-white/50 hover:text-white/80 transition-colors cursor-pointer"
          >
            Skip & Finish
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Helper: Build Rally Events from History ─────────────────────────────────

function createLocalMatchId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function buildCompletedMatchData(history: MatchHistory): CompletedMatchData {
  const rallyEvents = buildRallyEvents(history);
  const state = history.currentState;
  const input = history.initialInput;

  const teamAIds =
    input.matchType === "doubles"
      ? [...input.teamAPlayerIds]
      : [input.teamAPlayerId];
  const teamBIds =
    input.matchType === "doubles"
      ? [...input.teamBPlayerIds]
      : [input.teamBPlayerId];

  return {
    matchType: input.matchType,
    teamAPlayerIds: teamAIds,
    teamBPlayerIds: teamBIds,
    teamAScore: state.teamAScore,
    teamBScore: state.teamBScore,
    winner: state.winner!,
    startingServerPlayerId: input.startingServerPlayerId,
    totalRallies: history.rallyWinners.length,
    rallyEvents,
  };
}

function buildRallyEvents(history: MatchHistory) {
  let replayState = createMatch(history.initialInput);
  const events = [];

  for (let i = 0; i < history.rallyWinners.length; i++) {
    const isDoubles = isDoublesState(replayState);
    const serverPlayerId = isDoubles
      ? (replayState as DoublesMatchState).serverState.serverPlayerId
      : (replayState as SinglesMatchState).serverState.serverPlayerId;
    const serverNumber = isDoubles
      ? (replayState as DoublesMatchState).serverState.serverNumber
      : null;

    const result = processRally(replayState, history.rallyWinners[i], i + 1);

    events.push({
      sequenceNumber: i + 1,
      rallyWinnerTeam: history.rallyWinners[i],
      resultingTeamAScore: result.newState.teamAScore,
      resultingTeamBScore: result.newState.teamBScore,
      serverPlayerId,
      serverNumber,
      sideOutOccurred: result.sideOutOccurred,
    });

    replayState = result.newState;
  }

  return events;
}
