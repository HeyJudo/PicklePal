"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { StartSessionForm } from "./StartSessionForm";
import { ActiveSession } from "./ActiveSession";
import { PositionConfirmation } from "./PositionConfirmation";
import { LiveScoring } from "./LiveScoring";
import { MatchResult } from "./MatchResult";
import { GameDayRecap } from "./GameDayRecap";
import { OverlayRenderer } from "@/components/share";
import { endSession, getSessionRecap, getSessionMatches } from "./actions";
import type { MatchStartConfig } from "./PositionConfirmation";
import type { CompletedMatchData } from "./MatchResult";
import type { Matchup } from "@/lib/matchmaking";
import type { SessionMatchData } from "./actions";
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
import type { LeaderboardEntry } from "@/lib/stats";

type LiveStep = "idle" | "active" | "positions" | "scoring" | "result" | "recap" | "overlay";

interface SessionData {
  readonly id: string;
  readonly title: string | null;
  readonly status: string;
  readonly default_match_type: string;
  readonly target_score: number;
  readonly win_by: number;
  readonly track_scorers: boolean;
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
  readonly initialSessionMatches: readonly SessionMatchData[];
  readonly leaderboardEntries: readonly LeaderboardEntry[];
}

export function LivePageClient({
  groupSlug,
  initialSession,
  players,
  initialSessionPlayers,
  initialSessionMatches,
  leaderboardEntries,
}: LivePageClientProps) {
  const [activeSession, setActiveSession] = useState<SessionData | null>(initialSession);
  const [sessionPlayers, setSessionPlayers] = useState<readonly SessionPlayerEntry[]>(initialSessionPlayers);
  const [sessionMatches, setSessionMatches] = useState<readonly SessionMatchData[]>(initialSessionMatches);
  const [currentMatchup, setCurrentMatchup] = useState<Matchup | null>(null);
  const [matchConfig, setMatchConfig] = useState<MatchStartConfig | null>(null);
  const [matchLocalId, setMatchLocalId] = useState<string | null>(null);
  const [recoveredHistory, setRecoveredHistory] = useState<MatchHistory | null>(null);
  const [recoverableMatch, setRecoverableMatch] = useState<RecoverableMatch | null>(() =>
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
      track_scorers: false,
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
        return [...prev, { playerId, status: newStatus }];
      });
    },
    [],
  );

  const handleSessionEnded = async () => {
    if (activeSession) {
      await endSession(activeSession.id);
      const recapResult = await getSessionRecap(activeSession.id);
      if (recapResult.success && recapResult.data) {
        setRecapData(recapResult.data);
        setStep("recap");
        return;
      }
    }
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

  const handleRecapDone = () => setStep("overlay");

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

  const handleNextMatch = async () => {
    if (activeSession) {
      const result = await getSessionMatches(activeSession.id);
      if (result.success && result.data) {
        setSessionMatches(result.data);
      }
    }
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
    clearRecoverableMatch(recoverableMatch.sessionId, recoverableMatch.matchLocalId);
    setRecoverableMatch(null);
  };

  const matchType = activeSession?.default_match_type === "singles" ? "singles" : "doubles";

  // recap and overlay are handled by early returns before reaching JSX

  if (step === "recap" && recapData && activeSession) {
    return (
      <GameDayRecap
        data={recapData}
        sessionId={activeSession.id}
        groupSlug={groupSlug}
        onDone={handleRecapDone}
      />
    );
  }

  if (step === "overlay" && recapData && activeSession) {
    return (
      <div className="fixed inset-0 z-[100] bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center px-4">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold text-white">Share Your Day</h2>
          <p className="text-sm text-white/60 mt-1">Download the overlay and add it to your photo</p>
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
          Skip &amp; Finish
        </button>
      </div>
    );
  }

  // The main content area (steps: idle, active, positions, scoring, result)
  const mainContent = (
    <div className="space-y-5">
      {/* Page header — only show on non-scoring steps */}
      {step !== "scoring" && (
        <header>
          <h1 className="text-2xl font-bold text-text-primary">Live</h1>
          <p className="text-text-secondary mt-1 text-sm">
            {activeSession
              ? "Game Day is in progress."
              : "Start a Game Day session and score matches in real time."}
          </p>
        </header>
      )}

      {/* Unsaved match recovery banner */}
      {recoverableMatch && step === "active" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-800">Unsaved match found</p>
          <p className="mt-1 text-sm text-amber-700">
            Resume the local match saved on this device, or discard it.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={handleResumeRecoveredMatch}
              className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary/90 cursor-pointer"
            >
              Resume
            </button>
            <button
              onClick={handleDiscardRecoveredMatch}
              className="rounded-lg border border-amber-300 px-3 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100 cursor-pointer"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {/* idle */}
      {step === "idle" && !activeSession && (
        players.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface-muted p-8 text-center">
            <p className="text-text-muted text-sm">
              No players yet. Add players from the Players tab first.
            </p>
          </div>
        ) : (
          <StartSessionForm
            groupSlug={groupSlug}
            players={players}
            onSessionStarted={handleSessionStarted}
          />
        )
      )}

      {/* active */}
      {step === "active" && activeSession && (
        <ActiveSession
          groupSlug={groupSlug}
          session={activeSession}
          players={players}
          sessionPlayers={sessionPlayers}
          sessionMatches={sessionMatches}
          onSessionEnded={handleSessionEnded}
          onMatchConfirmed={handleMatchConfirmed}
          onPlayerStatusChanged={handlePlayerStatusChanged}
        />
      )}

      {/* positions */}
      {step === "positions" && currentMatchup && (
        <PositionConfirmation
          matchup={currentMatchup}
          players={players}
          matchType={matchType as "singles" | "doubles"}
          onConfirm={handlePositionsConfirmed}
          onBack={handleBackToQueue}
        />
      )}

      {/* scoring */}
      {step === "scoring" && matchConfig && activeSession && matchLocalId && (
        <LiveScoring
          config={matchConfig}
          sessionId={activeSession.id}
          matchLocalId={matchLocalId}
          initialHistory={recoveredHistory ?? undefined}
          players={players}
          targetScore={activeSession.target_score}
          winBy={activeSession.win_by}
          trackScorers={activeSession.track_scorers}
          onMatchComplete={handleMatchComplete}
        />
      )}

      {/* result */}
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
    </div>
  );

  // ── Desktop 3-column layout (lg+) ────────────────────────────────────────
  // Only shown when a session is active on desktop. On mobile, stays single-column.
  const showDesktopLayout = !!activeSession;

  return (
    <>
      {/* Mobile: single column */}
      <div className={showDesktopLayout ? "lg:hidden" : ""}>
        {mainContent}
      </div>

      {/* Desktop 3-column: Queue | Court/Main | Leaderboard */}
      {showDesktopLayout && (
        <div className="hidden lg:grid lg:grid-cols-[300px_1fr_260px] lg:gap-6 lg:items-start">
          {/* ── Left: Queue + Players ── */}
          <aside className="space-y-4">
            {/* Session badge */}
            {activeSession && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-court-green opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-court-green" />
                  </span>
                  <span className="text-xs font-semibold text-court-green">Game Day Active</span>
                </div>
                <p className="text-sm font-bold text-text-primary">
                  {activeSession.title ?? "Game Day"}
                </p>
                <p className="text-xs text-text-muted mt-0.5">
                  {matchType === "doubles" ? "Doubles" : "Singles"} · To {activeSession.target_score}
                </p>
              </div>
            )}

            {/* Recovery banner */}
            {recoverableMatch && step === "active" && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-800">Unsaved match found</p>
                <p className="mt-1 text-xs text-amber-700">Resume or discard?</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    onClick={handleResumeRecoveredMatch}
                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 cursor-pointer"
                  >
                    Resume
                  </button>
                  <button
                    onClick={handleDiscardRecoveredMatch}
                    className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 cursor-pointer"
                  >
                    Discard
                  </button>
                </div>
              </div>
            )}

            {/* Queue + players (only when on active step) */}
            {step === "active" && activeSession && (
              <ActiveSession
                groupSlug={groupSlug}
                session={activeSession}
                players={players}
                sessionPlayers={sessionPlayers}
                sessionMatches={sessionMatches}
                onSessionEnded={handleSessionEnded}
                onMatchConfirmed={handleMatchConfirmed}
                onPlayerStatusChanged={handlePlayerStatusChanged}
              />
            )}

            {/* On positions step only: back link is safe (no match data committed yet) */}
            {step === "positions" && (
              <button
                onClick={handleBackToQueue}
                className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
                Back to queue
              </button>
            )}
          </aside>

          {/* ── Center: Scoring / Positions / Result ── */}
          <main className="min-w-0">
            {step === "positions" && currentMatchup && (
              <PositionConfirmation
                matchup={currentMatchup}
                players={players}
                matchType={matchType as "singles" | "doubles"}
                onConfirm={handlePositionsConfirmed}
                onBack={handleBackToQueue}
              />
            )}
            {step === "scoring" && matchConfig && activeSession && matchLocalId && (
              <LiveScoring
                config={matchConfig}
                sessionId={activeSession.id}
                matchLocalId={matchLocalId}
                initialHistory={recoveredHistory ?? undefined}
                players={players}
                targetScore={activeSession.target_score}
                winBy={activeSession.win_by}
                trackScorers={activeSession.track_scorers}
                onMatchComplete={handleMatchComplete}
              />
            )}
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
            {step === "active" && (
              <DesktopCourtPlaceholder />
            )}
          </main>

          {/* ── Right: Live Leaderboard ── */}
          <aside className="space-y-4">
            <LiveLeaderboardPanel
              entries={leaderboardEntries}
              groupSlug={groupSlug}
              sessionMatches={sessionMatches}
              players={players}
            />
          </aside>
        </div>
      )}

      {/* Desktop idle state (no session) */}
      {!showDesktopLayout && (
        <div className="hidden lg:block max-w-2xl">
          {mainContent}
        </div>
      )}
    </>
  );
}

// ─── Desktop Court Placeholder ────────────────────────────────────────────────
// Shown in the center column when on the "active" (queue) step
function DesktopCourtPlaceholder() {
  return (
    <div className="rounded-2xl border border-border bg-surface-muted flex flex-col items-center justify-center min-h-[360px] p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-court-green/10 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-court-green" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </div>
      <p className="text-base font-semibold text-text-primary">Ready to play</p>
      <p className="text-sm text-text-muted mt-1">Generate a match from the queue on the left to start scoring.</p>
    </div>
  );
}

// ─── Live Leaderboard Panel ───────────────────────────────────────────────────
interface LiveLeaderboardPanelProps {
  readonly entries: readonly LeaderboardEntry[];
  readonly groupSlug: string;
  readonly sessionMatches: readonly SessionMatchData[];
  readonly players: readonly Player[];
}

function LiveLeaderboardPanel({
  entries,
  groupSlug,
  sessionMatches,
  players,
}: LiveLeaderboardPanelProps) {
  const playerMap = new Map(players.map((p) => [p.id, p]));

  return (
    <div className="space-y-4">
      {/* Standings card */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-text-primary">Standings</h3>
          <Link
            href={`/g/${groupSlug}/board`}
            className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Full board →
          </Link>
        </div>

        {entries.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-xs text-text-muted">No matches yet</p>
          </div>
        ) : (
          <ul className="divide-y divide-border-muted">
            {entries.slice(0, 8).map((entry) => (
              <li key={entry.playerId} className="flex items-center gap-3 px-4 py-2.5">
                {/* Rank */}
                <span className="w-5 text-center shrink-0">
                  {entry.isQualified && entry.rank !== null && entry.rank <= 3 ? (
                    <span className="text-base leading-none">
                      {["🥇","🥈","🥉"][entry.rank - 1]}
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-text-muted">
                      {entry.isQualified && entry.rank !== null ? entry.rank : "—"}
                    </span>
                  )}
                </span>
                {/* Avatar */}
                <div
                  className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                  style={{ backgroundColor: entry.color ?? "#64748B" }}
                >
                  {entry.displayName.charAt(0).toUpperCase()}
                </div>
                {/* Name */}
                <span className="flex-1 text-sm font-medium text-text-primary truncate">
                  {entry.displayName}
                </span>
                {/* Win rate */}
                <div className="text-right shrink-0">
                  <span className="text-xs font-semibold text-text-primary">
                    {entry.isQualified
                      ? `${(entry.winRate * 100).toFixed(0)}%`
                      : `${entry.gamesPlayed}gp`}
                  </span>
                  <p className="text-[10px] text-text-muted">
                    {entry.wins}W {entry.losses}L
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Today's matches card */}
      {sessionMatches.length > 0 && (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-text-primary">
              Today · {sessionMatches.length} {sessionMatches.length === 1 ? "game" : "games"}
            </h3>
          </div>
          <ul className="divide-y divide-border-muted">
            {sessionMatches.slice(0, 5).map((match) => {
              const isAWin = match.winning_team === "A";
              const getFirstName = (id: string) =>
                playerMap.get(id)?.display_name.split(" ")[0] ?? "?";
              return (
                <li key={match.id} className="px-4 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 flex-wrap">
                        {match.team_a_player_ids.map((id) => (
                          <span key={id} className="text-xs text-text-secondary truncate">
                            {getFirstName(id)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-sm font-bold tabular-nums ${isAWin ? "text-court-green" : "text-text-primary"}`}>
                        {match.team_a_score}
                      </span>
                      <span className="text-xs text-text-muted">–</span>
                      <span className={`text-sm font-bold tabular-nums ${!isAWin ? "text-court-green" : "text-text-primary"}`}>
                        {match.team_b_score}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 text-right">
                      <div className="flex items-center gap-1 flex-wrap justify-end">
                        {match.team_b_player_ids.map((id) => (
                          <span key={id} className="text-xs text-text-secondary truncate">
                            {getFirstName(id)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
