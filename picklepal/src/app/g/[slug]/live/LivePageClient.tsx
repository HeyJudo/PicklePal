"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import Link from "next/link";
import { StartSessionForm } from "./StartSessionForm";
import { ActiveSession } from "./ActiveSession";
import { PositionConfirmation } from "./PositionConfirmation";
import { LiveScoring } from "./LiveScoring";
import { MatchResult } from "./MatchResult";
import { MatchQueue } from "./MatchQueue";
import { SessionPlayerList } from "./SessionPlayerList";
import { SessionMatchHistory } from "./SessionMatchHistory";
import { GameDayRecap } from "./GameDayRecap";
import { RecordMatchForm } from "./RecordMatchForm";
import { ActiveMatchBanner } from "./ActiveMatchBanner";
import { ViewOnlyScoring } from "./ViewOnlyScoring";
import { OverlayRenderer, RecapShareButton, SessionRecapShareButton, MvpShareButton } from "@/components/share";
import { BeltMedallion } from "@/components/belts/BeltMedallion";
import { getBeltMeta } from "@/components/belts/BeltBadge";
import { endSession, getSessionRecap, getSessionMatches } from "./actions";
import { createActiveMatch, completeActiveMatch } from "./active-match-actions";
import type { MatchStartConfig } from "./PositionConfirmation";
import type { CompletedMatchData } from "./MatchResult";
import {
  createMatchmakingState,
  generateNextMatchup,
  generateQueue,
  shuffleMatchup,
} from "@/lib/matchmaking";
import type { Matchup, MatchmakingState } from "@/lib/matchmaking";
import type { SessionMatchData } from "./actions";
import type { MatchSnapshot } from "@/lib/supabase";
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
import type { GroupSettings } from "@/lib/supabase";

type LiveStep = "idle" | "active" | "positions" | "scoring" | "result" | "recap" | "overlay" | "viewing";

/** Staleness threshold in milliseconds (30 seconds) */
const HEARTBEAT_STALE_MS = 30_000;

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

interface ActiveMatchInfo {
  readonly id: string;
  readonly matchType: string;
  readonly teamAPlayerIds: string[];
  readonly teamBPlayerIds: string[];
  readonly scorerClerkUserId: string | null;
  readonly scorerHeartbeatAt: string | null;
  readonly currentSnapshot: MatchSnapshot | null;
  readonly startingServerPlayerId: string | null;
  readonly targetScore: number;
  readonly winBy: number;
  readonly startedAt: string | null;
}

interface LivePageClientProps {
  readonly groupSlug: string;
  /** Display name of the group, used in share card. */
  readonly groupName?: string;
  readonly initialSession: SessionData | null;
  readonly players: readonly Player[];
  readonly initialSessionPlayers: readonly SessionPlayerEntry[];
  readonly initialSessionMatches: readonly SessionMatchData[];
  readonly leaderboardEntries: readonly LeaderboardEntry[];
  readonly groupSettings: GroupSettings | null;
  readonly clerkUserId: string | null;
  readonly isAdmin: boolean;
  readonly initialActiveMatch: ActiveMatchInfo | null;
  /** Player ID of the current King of the Kitchen belt holder, if any */
  readonly kingHolderId?: string | null;
  /** Currently active belt reigns for compact display in the leaderboard panel */
  readonly currentBelts?: readonly import("@/lib/belts/recomputeBelts").CurrentBelt[];
}

export function LivePageClient({
  groupSlug,
  groupName,
  initialSession,
  players,
  initialSessionPlayers,
  initialSessionMatches,
  leaderboardEntries,
  groupSettings,
  clerkUserId,
  isAdmin,
  initialActiveMatch,
  kingHolderId,
  currentBelts,
}: LivePageClientProps) {
  const [activeSession, setActiveSession] = useState<SessionData | null>(initialSession);
  const [sessionPlayers, setSessionPlayers] = useState<readonly SessionPlayerEntry[]>(initialSessionPlayers);
  const [sessionMatches, setSessionMatches] = useState<readonly SessionMatchData[]>(initialSessionMatches);
  const [confirmEndDesktop, setConfirmEndDesktop] = useState(false);
  const [currentMatchup, setCurrentMatchup] = useState<Matchup | null>(null);
  // Matchmaking queue state (lifted from MatchQueue)
  const [matchQueue, setMatchQueue] = useState<Matchup[]>([]);
  const [matchmakingEngineState, setMatchmakingEngineState] = useState<MatchmakingState | null>(null);
  const [matchConfig, setMatchConfig] = useState<MatchStartConfig | null>(null);
  const [matchLocalId, setMatchLocalId] = useState<string | null>(null);
  const [recoveredHistory, setRecoveredHistory] = useState<MatchHistory | null>(null);
  const [recoverableMatch, setRecoverableMatch] = useState<RecoverableMatch | null>(() =>
    initialSession ? getRecoverableMatch(initialSession.id) : null,
  );
  const [completedMatch, setCompletedMatch] = useState<CompletedMatchData | null>(null);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(initialActiveMatch?.id ?? null);
  const [dbActiveMatch, setDbActiveMatch] = useState<ActiveMatchInfo | null>(initialActiveMatch);
  const [activeMatchStartedAt, setActiveMatchStartedAt] = useState<string | null>(initialActiveMatch?.startedAt ?? null);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [recapData, setRecapData] = useState<{
    gamesPlayed: number;
    playerCount: number;
    durationMinutes: number | null;
    awards: import("@/lib/stats").SessionAwards;
    playerNames: Record<string, string>;
  } | null>(null);
  const [step, setStep] = useState<LiveStep>(() => {
    if (!initialSession) return "idle";
    // Auto-resume detection on mount
    if (initialActiveMatch && clerkUserId) {
      const iAmScorer = initialActiveMatch.scorerClerkUserId === clerkUserId;
      const heartbeatFresh = isHeartbeatFresh(initialActiveMatch.scorerHeartbeatAt);

      if (iAmScorer && heartbeatFresh) {
        // Auto-resume: I'm the scorer and heartbeat is fresh
        return "scoring";
      }
      if (iAmScorer && !heartbeatFresh) {
        // Ambiguous: I'm the scorer but heartbeat is stale — show prompt
        return "active";
      }
      if (!iAmScorer) {
        // Someone else is scoring — show banner in active step
        return "active";
      }
    }
    return "active";
  });
  const [showRecordMatch, setShowRecordMatch] = useState(false);

  // Derived state
  const activePlayerIds = useMemo(
    () => new Set(sessionPlayers.filter((sp) => sp.status === "active").map((sp) => sp.playerId)),
    [sessionPlayers],
  );
  const activePlayersForMatchmaking = useMemo(
    () => players.filter((p) => activePlayerIds.has(p.id)),
    [players, activePlayerIds],
  );
  const matchType = activeSession?.default_match_type === "singles" ? "singles" : "doubles";

  // ── Matchmaking queue initialization & roster-change regeneration ───────────
  // Re-run whenever the set of active players changes (join, bench, activate)
  useEffect(() => {
    if (!activeSession || activePlayersForMatchmaking.length === 0) return;
    const playerIds = activePlayersForMatchmaking.map((p) => p.id);
    const newState = createMatchmakingState(playerIds, matchType, {
      sessionId: activeSession.id,
    });
    const queue = generateQueue(newState, 3);
    setMatchmakingEngineState(newState);
    setMatchQueue(queue);
  // ponytail: stringify so effect only fires on actual player set changes, not reference churn
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSession?.id, activePlayersForMatchmaking.map((p) => p.id).join(","), matchType]);

  // Belt-on-the-line: King holder is in the current match roster
  const beltOnTheLine = useMemo(() => {
    if (!kingHolderId || !matchConfig) return false;
    const roster = [...(matchConfig.teamA ?? []), ...(matchConfig.teamB ?? [])];
    return roster.includes(kingHolderId);
  }, [kingHolderId, matchConfig]);

  // ── Auto-resume from DB active match ────────────────────────────────────────

  // Set up matchConfig and history for auto-resume when step is "scoring" on mount
  useEffect(() => {
    if (!initialActiveMatch || !clerkUserId) return;
    const iAmScorer = initialActiveMatch.scorerClerkUserId === clerkUserId;
    const heartbeatFresh = isHeartbeatFresh(initialActiveMatch.scorerHeartbeatAt);

    if (iAmScorer && heartbeatFresh && !matchConfig) {
      // Auto-resume: rebuild config from DB match
      const config: MatchStartConfig = {
        teamA: initialActiveMatch.teamAPlayerIds,
        teamB: initialActiveMatch.teamBPlayerIds,
        startingServerPlayerId: initialActiveMatch.startingServerPlayerId ?? initialActiveMatch.teamAPlayerIds[0],
        matchType: initialActiveMatch.matchType as "singles" | "doubles",
      };
      setMatchConfig(config);
      setMatchLocalId(initialActiveMatch.id);
      setActiveMatchId(initialActiveMatch.id);
      setActiveMatchStartedAt(initialActiveMatch.startedAt ?? null);

      // Rebuild history from snapshot rally count
      const snapshot = initialActiveMatch.currentSnapshot;
      if (snapshot && snapshot.rallyCount > 0) {
        // We have a snapshot — rebuild history using local rally queue if available
        const localMatch = initialSession ? getRecoverableMatch(initialSession.id) : null;
        if (localMatch && localMatch.matchLocalId === initialActiveMatch.id) {
          // Use local recovery data for exact state
          const history = rebuildHistoryFromRecovery(localMatch);
          setRecoveredHistory(history);
        } else {
          // No local recovery found — rebuild from DB snapshot by replaying rally events
          // We can't reconstruct exact rally-by-rally state, but we can fetch rally_events from DB
          // For now, show the resume prompt so the scorer can confirm
          setStep("active");
          setShowResumePrompt(true);
          return;
        }
      }
    }

    if (iAmScorer && !heartbeatFresh) {
      // Show resume prompt for stale heartbeat
      setShowResumePrompt(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Determine active match relationship for banner/view-only
  const activeMatchRelation = useMemo(() => {
    if (!dbActiveMatch) return "none" as const;
    if (clerkUserId && dbActiveMatch.scorerClerkUserId === clerkUserId) return "scorer" as const;
    return "viewer" as const;
  }, [dbActiveMatch, clerkUserId]);

  const isActiveMatchHeartbeatStale = useMemo(() => {
    if (!dbActiveMatch) return false;
    return !isHeartbeatFresh(dbActiveMatch.scorerHeartbeatAt);
  }, [dbActiveMatch]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  // ── Queue handlers ───────────────────────────────────────────────────────────

  const handleShuffle = useCallback(() => {
    if (!matchmakingEngineState || matchQueue.length === 0) return;
    const alt = shuffleMatchup(matchQueue[0], matchmakingEngineState);
    if (alt) {
      setMatchQueue((prev) => [alt, ...prev.slice(1)]);
    }
    // If alt is null, no alternative — queue unchanged (silent, per plan)
  }, [matchmakingEngineState, matchQueue]);

  // canShuffle: true when no scoring has started (step is "active", no rallies recorded)
  // ponytail: once step leaves "active" scoring has started; simplest proxy
  const canShuffle = step === "active";

  const handleSessionStarted = (sessionId: string) => {
    setActiveSession({
      id: sessionId, title: null, status: "active", default_match_type: "doubles",
      target_score: 11, win_by: 2, track_scorers: false, started_at: new Date().toISOString(),
    });
    window.location.reload();
  };

  const handlePlayerStatusChanged = useCallback(
    (playerId: string, newStatus: SessionPlayerStatus) => {
      setSessionPlayers((prev) => {
        if (newStatus === "removed") return prev.filter((sp) => sp.playerId !== playerId);
        const existing = prev.find((sp) => sp.playerId === playerId);
        if (existing) return prev.map((sp) => sp.playerId === playerId ? { ...sp, status: newStatus } : sp);
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
    window.location.reload();
  };

  const handleRecapDone = () => setStep("overlay");

  const handleOverlayDone = () => {
    setActiveSession(null);
    setRecapData(null);
    setStep("idle");
    window.location.reload();
  };

  const handleMatchConfirmed = (matchup: Matchup) => {
    setCurrentMatchup(matchup);
    setStep("positions");
  };

  const handlePositionsConfirmed = async (config: MatchStartConfig) => {
    if (!activeSession) return;
    let matchLocalIdToUse = createLocalMatchId();

    // Create active match in DB before entering scoring
    const result = await createActiveMatch({
      sessionId: activeSession.id,
      matchType: config.matchType,
      teamAPlayerIds: config.teamA,
      teamBPlayerIds: config.teamB,
      startingServerPlayerId: config.startingServerPlayerId,
      targetScore: activeSession.target_score,
      winBy: activeSession.win_by,
    });

    if (result.success && result.data) {
      setActiveMatchId(result.data.matchId);
      // Use DB match ID as the local match ID so auto-resume can find it
      matchLocalIdToUse = result.data.matchId;
      setActiveMatchStartedAt(new Date().toISOString());
    }
    // If DB creation fails, still allow local scoring (offline resilience)

    setMatchConfig(config);
    setMatchLocalId(matchLocalIdToUse);
    setRecoveredHistory(null);
    saveRecoverableMatch({
      sessionId: activeSession.id, matchLocalId: matchLocalIdToUse, config,
      targetScore: activeSession.target_score, winBy: activeSession.win_by,
      createdAt: new Date().toISOString(),
    });
    setStep("scoring");
  };

  const handleMatchComplete = async (completedHistory: MatchHistory, lastFlushedSequence: number) => {
    const matchData = buildCompletedMatchData(completedHistory, activeMatchStartedAt);
    setCompletedMatch(matchData);

    // If we have an active DB match, transition it to completed
    if (activeMatchId) {
      const rallyEvents = buildRallyEvents(completedHistory);
      // Only send rallies not yet flushed during the match — the rest are already in the DB
      const unflushedRallyEvents = rallyEvents.filter(
        (e) => e.sequenceNumber > lastFlushedSequence,
      );
      await completeActiveMatch({
        matchId: activeMatchId,
        teamAScore: matchData.teamAScore,
        teamBScore: matchData.teamBScore,
        winningTeam: matchData.winner,
        losingTeam: matchData.winner === "A" ? "B" : "A",
        rallyEvents: unflushedRallyEvents,
      });
    }

    setStep("result");
  };

  const handleNextMatch = async () => {
    if (activeSession) {
      const result = await getSessionMatches(activeSession.id);
      if (result.success && result.data) setSessionMatches(result.data);
    }
    setMatchConfig(null); setMatchLocalId(null); setRecoveredHistory(null);
    setRecoverableMatch(null); setCurrentMatchup(null); setCompletedMatch(null);
    setActiveMatchId(null); setDbActiveMatch(null); setActiveMatchStartedAt(null);

    // Advance queue: promote on-deck cards forward, append a new on-deck
    // Engine state is advanced by applying the completed matchup then generating one more
    setMatchQueue((prevQueue) => {
      if (prevQueue.length === 0) return prevQueue;
      const shifted = prevQueue.slice(1);
      // Append a new on-deck if engine state available
      if (matchmakingEngineState) {
        try {
          // Project state forward through all queued matchups to find what comes next
          const { matchup: newSlot, newState } = generateNextMatchup(matchmakingEngineState);
          setMatchmakingEngineState(newState);
          return [...shifted, newSlot];
        } catch {
          // Not enough players — just return shifted
        }
      }
      return shifted;
    });

    setStep("active");
  };

  const handleBackToQueue = () => {
    setCurrentMatchup(null); setMatchConfig(null); setMatchLocalId(null);
    setRecoveredHistory(null); setStep("active");
  };

  const handleRecordMatchSuccess = async () => {
    setShowRecordMatch(false);
    if (activeSession) {
      const result = await getSessionMatches(activeSession.id);
      if (result.success && result.data) setSessionMatches(result.data);
    }
  };

  const handleRecordMatchClick = () => {
    setShowRecordMatch(true);
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

  // ── Phase 6b/6c: Resume & View-Only Handlers ───────────────────────────────

  const handleResumeFromDb = () => {
    if (!dbActiveMatch || !activeSession) return;
    const config: MatchStartConfig = {
      teamA: dbActiveMatch.teamAPlayerIds,
      teamB: dbActiveMatch.teamBPlayerIds,
      startingServerPlayerId: dbActiveMatch.startingServerPlayerId ?? dbActiveMatch.teamAPlayerIds[0],
      matchType: dbActiveMatch.matchType as "singles" | "doubles",
    };
    setMatchConfig(config);
    setMatchLocalId(dbActiveMatch.id);
    setActiveMatchId(dbActiveMatch.id);
    setActiveMatchStartedAt(dbActiveMatch.startedAt ?? null);
    setShowResumePrompt(false);

    // Try local rally queue for exact state
    const localMatch = getRecoverableMatch(activeSession.id);
    if (localMatch && localMatch.matchLocalId === dbActiveMatch.id) {
      const history = rebuildHistoryFromRecovery(localMatch);
      setRecoveredHistory(history);
    } else {
      // No local recovery — save recoverable match metadata for future navigations
      saveRecoverableMatch({
        sessionId: activeSession.id,
        matchLocalId: dbActiveMatch.id,
        config,
        targetScore: dbActiveMatch.targetScore,
        winBy: dbActiveMatch.winBy,
        createdAt: new Date().toISOString(),
      });
      // recoveredHistory stays null — LiveScoring will start fresh from 0-0
      // but activeMatchId ensures snapshot sync continues from where it was
    }

    setStep("scoring");
  };

  const handleDismissResumePrompt = () => {
    setShowResumePrompt(false);
  };

  const handleViewActiveMatch = () => {
    setStep("viewing");
  };

  const handleTakeOverComplete = () => {
    // After takeover, reload to get fresh state as the new scorer
    window.location.reload();
  };

  const handleViewMatchEnded = async () => {
    // Match ended while viewing — refresh matches and go back to active
    setDbActiveMatch(null);
    setActiveMatchId(null);
    if (activeSession) {
      const result = await getSessionMatches(activeSession.id);
      if (result.success && result.data) setSessionMatches(result.data);
    }
    setStep("active");
  };

  // ── Full-screen steps (early returns) ───────────────────────────────────────

  if (step === "recap" && recapData && activeSession) {
    return (
      <GameDayRecap
        data={recapData}
        sessionId={activeSession.id}
        groupSlug={groupSlug}
        groupName={groupName}
        sessionDate={new Date(activeSession.started_at).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })}
        onDone={handleRecapDone}
      />
    );
  }

  if (step === "overlay" && recapData && activeSession) {
    const overlayDate = new Date(activeSession.started_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const overlayGroupName = groupName ?? groupSlug;

    return (
      <div className="fixed inset-0 z-[100] bg-gradient-to-b from-court-green-dark via-[#1a3a26] to-[#0e2018] flex flex-col items-center justify-start px-4 py-8 overflow-y-auto">
        {/* Header — one headline + one subtitle, no duplication below */}
        <div className="mb-5 text-center w-full max-w-lg">
          <h2 className="font-display text-3xl text-white">Share Your Day</h2>
          <p className="text-xs text-white/50 mt-1.5">Transparent 9:16 stickers - layer over any photo in your story.</p>
        </div>

        {/* Two share cards — side-by-side on sm+, stacked on mobile */}
        <div className="w-full max-w-lg flex flex-col sm:flex-row items-start justify-center gap-6">
          {/* MVP card — only when MVP exists */}
          {recapData.awards.mvp && (
            <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-ball-yellow/70 uppercase tracking-widest">MVP</p>
              <MvpShareButton
                mvp={recapData.awards.mvp}
                date={overlayDate}
              />
            </div>
          )}

          {/* Recap card */}
          <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">Recap</p>
            <SessionRecapShareButton
              groupName={overlayGroupName}
              date={overlayDate}
              awards={recapData.awards}
              gamesPlayed={recapData.gamesPlayed}
              playerCount={recapData.playerCount}
              durationMinutes={recapData.durationMinutes}
              playerNames={recapData.playerNames}
            />
          </div>
        </div>

        <button onClick={handleOverlayDone} className="mt-8 text-sm text-white/50 hover:text-white/80 transition-colors cursor-pointer">
          Skip &amp; Finish
        </button>
      </div>
    );
  }

  // ── No session (idle) ───────────────────────────────────────────────────────

  if (!activeSession || step === "idle") {
    return (
      <div className="max-w-2xl">
        <header className="mb-6">
          <h1 className="font-display text-3xl text-text-primary leading-tight">Game Day</h1>
          <p className="text-text-secondary mt-1 text-sm">
            Start a session and score matches in real time.
          </p>
        </header>
        {!isAdmin ? (
          <div className="rounded-xl border border-border bg-surface-muted p-8 text-center">
            <p className="text-text-muted text-sm">No active game day. Check back when the organizer starts a session.</p>
          </div>
        ) : players.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface-muted p-8 text-center">
            <p className="text-text-muted text-sm">No players yet. Add players from the Players tab first.</p>
          </div>
        ) : (
          <StartSessionForm
            groupSlug={groupSlug}
            players={players}
            onSessionStarted={handleSessionStarted}
            defaultMatchType={groupSettings?.default_match_type}
            defaultTargetScore={groupSettings?.default_target_score}
            defaultWinBy={groupSettings?.default_win_by}
          />
        )}
      </div>
    );
  }

  // ── Active session — mobile single-column ───────────────────────────────────

  const mobileView = (
    <div className="lg:hidden">
      {/* Full-screen steps: positions, scoring, result replace ActiveSession entirely */}
      {step === "positions" && currentMatchup && (
        <PositionConfirmation
          matchup={currentMatchup} players={players}
          matchType={matchType as "singles" | "doubles"}
          onConfirm={handlePositionsConfirmed} onBack={handleBackToQueue}
        />
      )}
      {step === "scoring" && matchConfig && matchLocalId && (
        <>
          {/* 👑 Belt on the line banner — mobile */}
          {beltOnTheLine && (
            <div className="flex items-center gap-2 rounded-xl border border-ball-yellow/50 bg-ball-yellow/10 px-4 py-2.5 mb-2">
              <BeltMedallion beltType="king_of_the_kitchen" size="sm" />
              <span className="text-sm font-semibold text-court-green-dark">Belt on the line!</span>
            </div>
          )}
          <LiveScoring
            config={matchConfig} sessionId={activeSession.id}
            matchLocalId={matchLocalId} initialHistory={recoveredHistory ?? undefined}
            players={players} targetScore={activeSession.target_score}
            winBy={activeSession.win_by} trackScorers={activeSession.track_scorers}
            activeMatchId={activeMatchId}
            startedAt={activeMatchStartedAt}
            onMatchComplete={handleMatchComplete}
          />
        </>
      )}
      {step === "result" && completedMatch && (
        <MatchResult
          matchData={completedMatch} sessionId={activeSession.id}
          matchLocalId={matchLocalId} players={players}
          targetScore={activeSession.target_score} winBy={activeSession.win_by}
          activeMatchId={activeMatchId}
          onNextMatch={handleNextMatch} onEndSession={handleSessionEnded}
        />
      )}
      {/* View-only scoring (another admin is scoring) */}
      {step === "viewing" && dbActiveMatch && (
        <ViewOnlyScoring
          matchId={dbActiveMatch.id}
          sessionId={activeSession.id}
          initialSnapshot={dbActiveMatch.currentSnapshot}
          matchType={dbActiveMatch.matchType as "singles" | "doubles"}
          teamAPlayerIds={dbActiveMatch.teamAPlayerIds}
          teamBPlayerIds={dbActiveMatch.teamBPlayerIds}
          players={players}
          targetScore={dbActiveMatch.targetScore}
          onMatchEnded={handleViewMatchEnded}
        />
      )}
      {/* Active step: show session overview + queue + record match */}
      {step === "active" && (
        <div className="space-y-6">
          {/* Resume prompt — stale heartbeat, I am scorer */}
          {showResumePrompt && dbActiveMatch && activeMatchRelation === "scorer" && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
              <p className="text-sm font-semibold text-amber-800">Resume your match?</p>
              <p className="text-xs text-amber-700">
                You have an active match in progress. Your scoring session may have been interrupted.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleResumeFromDb}
                  className="rounded-lg bg-court-green px-3 py-1.5 text-xs font-semibold text-white hover:bg-court-green-dark transition-colors cursor-pointer"
                >
                  Resume Scoring
                </button>
                <button
                  onClick={handleDismissResumePrompt}
                  className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
          {/* Active match banner — someone else is scoring */}
          {dbActiveMatch && activeMatchRelation === "viewer" && (
            <ActiveMatchBanner
              matchId={dbActiveMatch.id}
              sessionId={activeSession.id}
              snapshot={dbActiveMatch.currentSnapshot}
              teamAPlayerIds={dbActiveMatch.teamAPlayerIds}
              teamBPlayerIds={dbActiveMatch.teamBPlayerIds}
              players={players}
              isHeartbeatStale={isActiveMatchHeartbeatStale}
              isAdmin={isAdmin}
              onTakeOver={handleTakeOverComplete}
              onViewMatch={handleViewActiveMatch}
            />
          )}
          <ActiveSession
            groupSlug={groupSlug}
            session={activeSession}
            players={players}
            sessionPlayers={sessionPlayers}
            sessionMatches={sessionMatches}
            isHost={isAdmin}
            onSessionEnded={handleSessionEnded}
            onMatchConfirmed={handleMatchConfirmed}
            onPlayerStatusChanged={handlePlayerStatusChanged}
            matchQueue={matchQueue}
            matchmakingState={matchmakingEngineState ?? createMatchmakingState(activePlayersForMatchmaking.map((p) => p.id), matchType)}
            matchType={matchType}
            canShuffle={canShuffle}
            onShuffle={handleShuffle}
          />
          {/* Record Past Match — admin only, utility action, low visual weight */}
          {isAdmin && !showRecordMatch && (
            <div className="flex items-center border-t border-border-muted pt-3">
              <button
                type="button"
                onClick={handleRecordMatchClick}
                className="text-xs font-medium text-text-muted hover:text-court-green transition-colors cursor-pointer"
              >
                + Record past match
              </button>
            </div>
          )}
          {isAdmin && showRecordMatch && (
            <RecordMatchForm
              sessionId={activeSession.id}
              players={activePlayersForMatchmaking}
              defaultMatchType={matchType as "singles" | "doubles"}
              defaultTargetScore={activeSession.target_score}
              defaultWinBy={activeSession.win_by}
              onSuccess={handleRecordMatchSuccess}
              onCancel={() => setShowRecordMatch(false)}
            />
          )}
        </div>
      )}
    </div>
  );

  // ── Active session — desktop 3-column ───────────────────────────────────────

  const desktopView = (
    <div className="hidden lg:grid lg:grid-cols-[260px_1fr_260px] lg:gap-8 lg:items-start">
      {/* LEFT SIDEBAR — session context */}
      <aside className="space-y-4 sticky top-6">
        {/* Session status — branded gradient hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-court-green-dark via-court-green to-sky-blue-dark px-4 py-4">
          {/* Court lines watermark */}
          <div className="absolute inset-0 opacity-[0.07]" aria-hidden="true">
            <svg viewBox="0 0 260 140" preserveAspectRatio="xMidYMid slice" className="w-full h-full" fill="none" stroke="white" strokeWidth="1.5">
              <rect x="10" y="10" width="240" height="120" rx="2" />
              <line x1="130" y1="10" x2="130" y2="130" strokeWidth="2" />
              <line x1="80" y1="10" x2="80" y2="130" strokeDasharray="4 4" />
              <line x1="180" y1="10" x2="180" y2="130" strokeDasharray="4 4" />
              <line x1="10" y1="70" x2="80" y2="70" />
              <line x1="180" y1="70" x2="250" y2="70" />
            </svg>
          </div>

          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ball-yellow opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-ball-yellow" />
              </span>
              <span className="text-[11px] font-label font-semibold text-white/60 uppercase tracking-widest">
                Game Day Active
              </span>
            </div>

            <p className="font-display text-xl text-white leading-tight">
              {activeSession.title ?? "Game Day"}
            </p>

            <div className="flex items-center gap-3 mt-2.5">
              <div>
                <p className="font-display text-lg text-ball-yellow leading-none tabular-nums">
                  {activeSession.target_score}
                </p>
                <p className="text-white/50 text-[9px] font-label font-semibold uppercase tracking-widest mt-0.5">
                  {matchType === "doubles" ? "Doubles" : "Singles"}
                </p>
              </div>
              <div className="w-px h-6 bg-white/15" aria-hidden="true" />
              <div>
                <p className="font-display text-lg text-ball-yellow leading-none tabular-nums">
                  {activeSession.win_by}
                </p>
                <p className="text-white/50 text-[9px] font-label font-semibold uppercase tracking-widest mt-0.5">
                  Win by
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Players panel */}
        <SessionPlayerList
          sessionId={activeSession.id}
          players={players}
          sessionPlayers={sessionPlayers}
          isHost={isAdmin}
          onPlayerStatusChanged={handlePlayerStatusChanged}
        />

        {/* Completed matches */}
        <SessionMatchHistory matches={sessionMatches} players={players} />

        {/* End session — utility footer with inline confirm */}
        {isAdmin && (
          <div className="flex items-center justify-end border-t border-border-muted pt-3 min-h-[28px]">
            {!confirmEndDesktop ? (
              <button
                onClick={() => setConfirmEndDesktop(true)}
                className="text-xs font-medium text-text-muted hover:text-red-500 transition-colors cursor-pointer"
              >
                End Game Day
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-xs text-text-muted">End the session?</span>
                <button
                  onClick={() => setConfirmEndDesktop(false)}
                  className="text-xs font-medium text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSessionEnded}
                  className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                >
                  Yes, end it
                </button>
              </div>
            )}
          </div>
        )}
      </aside>

      {/* CENTER — main action area */}
      <main className="min-w-0 space-y-5">
        {/* Recovery banner */}
        {recoverableMatch && step === "active" && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-amber-800">Unsaved match found</p>
              <p className="text-xs text-amber-700 mt-0.5">Resume or discard?</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={handleResumeRecoveredMatch} className="rounded-lg bg-court-green px-3 py-1.5 text-xs font-semibold text-white hover:bg-court-green-dark cursor-pointer">Resume</button>
              <button onClick={handleDiscardRecoveredMatch} className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 cursor-pointer">Discard</button>
            </div>
          </div>
        )}

        {/* Queue step — generate/preview matchup */}
        {step === "active" && (
          <MatchQueue
            players={activePlayersForMatchmaking}
            queue={matchQueue}
            matchmakingState={matchmakingEngineState ?? createMatchmakingState(activePlayersForMatchmaking.map((p) => p.id), matchType)}
            matchType={matchType}
            isHost={isAdmin}
            canShuffle={canShuffle}
            onShuffle={handleShuffle}
            onMatchSelected={handleMatchConfirmed}
          />
        )}

        {/* Position confirmation */}
        {step === "positions" && currentMatchup && (
          <PositionConfirmation
            matchup={currentMatchup} players={players}
            matchType={matchType as "singles" | "doubles"}
            onConfirm={handlePositionsConfirmed} onBack={handleBackToQueue}
          />
        )}

        {/* Live scoring */}
        {step === "scoring" && matchConfig && matchLocalId && (
          <>
            {/* 👑 Belt on the line banner — desktop */}
            {beltOnTheLine && (
              <div className="flex items-center gap-2 rounded-xl border border-ball-yellow/50 bg-ball-yellow/10 px-4 py-2.5 mb-2">
                <BeltMedallion beltType="king_of_the_kitchen" size="sm" />
                <span className="text-sm font-semibold text-court-green-dark">Belt on the line!</span>
              </div>
            )}
            <LiveScoring
              config={matchConfig} sessionId={activeSession.id}
              matchLocalId={matchLocalId} initialHistory={recoveredHistory ?? undefined}
              players={players} targetScore={activeSession.target_score}
              winBy={activeSession.win_by} trackScorers={activeSession.track_scorers}
              activeMatchId={activeMatchId}
              startedAt={activeMatchStartedAt}
              onMatchComplete={handleMatchComplete}
            />
          </>
        )}

        {/* Match result */}
        {step === "result" && completedMatch && (
          <MatchResult
            matchData={completedMatch} sessionId={activeSession.id}
            matchLocalId={matchLocalId} players={players}
            targetScore={activeSession.target_score} winBy={activeSession.win_by}
            activeMatchId={activeMatchId}
            onNextMatch={handleNextMatch} onEndSession={handleSessionEnded}
          />
        )}

        {/* View-only scoring (another admin is scoring) */}
        {step === "viewing" && dbActiveMatch && (
          <ViewOnlyScoring
            matchId={dbActiveMatch.id}
            sessionId={activeSession.id}
            initialSnapshot={dbActiveMatch.currentSnapshot}
            matchType={dbActiveMatch.matchType as "singles" | "doubles"}
            teamAPlayerIds={dbActiveMatch.teamAPlayerIds}
            teamBPlayerIds={dbActiveMatch.teamBPlayerIds}
            players={players}
            targetScore={dbActiveMatch.targetScore}
            onMatchEnded={handleViewMatchEnded}
          />
        )}

        {/* Resume prompt — stale heartbeat, I am scorer (desktop) */}
        {step === "active" && showResumePrompt && dbActiveMatch && activeMatchRelation === "scorer" && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
            <p className="text-sm font-semibold text-amber-800">Resume your match?</p>
            <p className="text-xs text-amber-700">
              You have an active match in progress. Your scoring session may have been interrupted.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleResumeFromDb}
                className="rounded-lg bg-court-green px-3 py-1.5 text-xs font-semibold text-white hover:bg-court-green-dark transition-colors cursor-pointer"
              >
                Resume Scoring
              </button>
              <button
                onClick={handleDismissResumePrompt}
                className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Active match banner — someone else is scoring (desktop) */}
        {step === "active" && dbActiveMatch && activeMatchRelation === "viewer" && (
          <ActiveMatchBanner
            matchId={dbActiveMatch.id}
            sessionId={activeSession.id}
            snapshot={dbActiveMatch.currentSnapshot}
            teamAPlayerIds={dbActiveMatch.teamAPlayerIds}
            teamBPlayerIds={dbActiveMatch.teamBPlayerIds}
            players={players}
            isHeartbeatStale={isActiveMatchHeartbeatStale}
            isAdmin={isAdmin}
            onTakeOver={handleTakeOverComplete}
            onViewMatch={handleViewActiveMatch}
          />
        )}

        {/* Record Past Match — admin only, utility action, low visual weight */}
        {isAdmin && step === "active" && !showRecordMatch && (
          <div className="flex items-center border-t border-border-muted pt-1">
            <button
              type="button"
              onClick={handleRecordMatchClick}
              className="text-xs font-medium text-text-muted hover:text-court-green transition-colors cursor-pointer"
            >
              + Record past match
            </button>
          </div>
        )}
        {isAdmin && step === "active" && showRecordMatch && (
          <RecordMatchForm
            sessionId={activeSession.id}
            players={activePlayersForMatchmaking}
            defaultMatchType={matchType as "singles" | "doubles"}
            defaultTargetScore={activeSession.target_score}
            defaultWinBy={activeSession.win_by}
            onSuccess={handleRecordMatchSuccess}
            onCancel={() => setShowRecordMatch(false)}
          />
        )}
      </main>

      {/* RIGHT SIDEBAR — standings */}
      <aside className="space-y-4 sticky top-6">
        <LiveLeaderboardPanel
          entries={leaderboardEntries}
          groupSlug={groupSlug}
          sessionMatches={sessionMatches}
          players={players}
          currentBelts={currentBelts}
        />
      </aside>
    </div>
  );

  return (
    <>
      {mobileView}
      {desktopView}
    </>
  );
}

// ─── Live Leaderboard Panel ───────────────────────────────────────────────────

interface LiveLeaderboardPanelProps {
  readonly entries: readonly LeaderboardEntry[];
  readonly groupSlug: string;
  readonly sessionMatches: readonly SessionMatchData[];
  readonly players: readonly Player[];
  readonly currentBelts?: readonly import("@/lib/belts/recomputeBelts").CurrentBelt[];
}

function LiveLeaderboardPanel({ entries, groupSlug, sessionMatches, players, currentBelts }: LiveLeaderboardPanelProps) {
  const playerMap = new Map(players.map((p) => [p.id, p]));

  return (
    <div className="space-y-4">
      {/* Compact belt strip */}
      {currentBelts && currentBelts.length > 0 && (
        <div className="rounded-xl border border-ball-yellow/30 bg-ball-yellow/5 px-3 py-2.5 space-y-2">
          <p className="text-[10px] font-label font-semibold text-text-muted uppercase tracking-widest">Belts</p>
          {currentBelts.map((belt) => {
            const meta = getBeltMeta(belt.beltType);
            const subjectName =
              belt.beltType === "pickler" && belt.subjectPlayerId
                ? playerMap.get(belt.subjectPlayerId)?.display_name
                : undefined;
            const holderNames = belt.holderPlayerIds
              .map((id) => playerMap.get(id)?.display_name ?? "?")
              .join(", ");
            return (
              <div key={`${belt.beltType}-${belt.subjectPlayerId ?? ""}`} className="flex items-center gap-2 text-xs">
                <BeltMedallion beltType={belt.beltType} size="sm" />
                <span className="font-semibold text-court-green-dark">{meta.label}</span>
                {holderNames && (
                  <span className="text-text-muted truncate">
                    · {holderNames}
                    {subjectName && <span> owns {subjectName}</span>}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
      {/* Standings */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-text-primary">Standings</h3>
          <Link href={`/g/${groupSlug}/board`} className="text-xs font-semibold text-court-green hover:text-court-green-dark transition-colors">
            Full board →
          </Link>
        </div>
        {entries.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-xs text-text-muted">No matches yet</p>
          </div>
        ) : (
          <ul className="divide-y divide-border-muted">
            {entries.slice(0, 8).map((entry, i) => {
              const isFirst = i === 0 && entry.isQualified;
              return (
                <li
                  key={entry.playerId}
                  className={`flex items-center gap-2.5 px-4 py-2 ${isFirst ? "bg-ball-yellow" : ""}`}
                >
                  <span className="w-5 text-center shrink-0">
                    {entry.isQualified && entry.rank !== null && entry.rank <= 3 ? (
                      <span className={`text-xs font-bold ${isFirst ? "text-court-green-dark" : entry.rank === 2 ? "text-text-muted" : "text-hype-orange/70"}`}>
                        {["#1","#2","#3"][entry.rank - 1]}
                      </span>
                    ) : (
                      <span className={`text-[11px] font-semibold ${isFirst ? "text-court-green-dark" : "text-text-muted"}`}>
                        {entry.isQualified && entry.rank !== null ? entry.rank : "—"}
                      </span>
                    )}
                  </span>
                  <div
                    className="h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                    style={{ backgroundColor: entry.color ?? "#64748B" }}
                  >
                    {entry.displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className={`flex-1 text-xs font-semibold truncate ${isFirst ? "text-court-green-dark" : "text-text-primary"}`}>
                    {entry.displayName}
                  </span>
                  <div className="text-right shrink-0">
                    <span className={`tabular-nums ${isFirst ? "font-display text-base text-court-green-dark" : "text-xs font-semibold text-text-primary"}`}>
                      {entry.isQualified ? `${(entry.winRate * 100).toFixed(0)}%` : `${entry.gamesPlayed}gp`}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Today's games */}
      {sessionMatches.length > 0 && (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-xs font-semibold text-text-primary">
              Today · {sessionMatches.length} {sessionMatches.length === 1 ? "game" : "games"}
            </h3>
          </div>
          <ul className="divide-y divide-border-muted">
            {sessionMatches.slice(0, 5).map((match) => {
              const isAWin = match.winning_team === "A";
              const getName = (id: string) => playerMap.get(id)?.display_name.split(" ")[0] ?? "?";
              return (
                <li key={match.id} className="px-4 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-text-secondary truncate">
                      {match.team_a_player_ids.map(getName).join(" & ")}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className={`text-xs font-bold tabular-nums ${isAWin ? "text-court-green" : "text-text-primary"}`}>{match.team_a_score}</span>
                      <span className="text-[10px] text-text-muted">–</span>
                      <span className={`text-xs font-bold tabular-nums ${!isAWin ? "text-court-green" : "text-text-primary"}`}>{match.team_b_score}</span>
                    </div>
                    <span className="text-xs text-text-secondary truncate text-right">
                      {match.team_b_player_ids.map(getName).join(" & ")}
                    </span>
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
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function buildCompletedMatchData(
  history: MatchHistory,
  startedAt?: string | null,
): CompletedMatchData {
  const rallyEvents = buildRallyEvents(history);
  const state = history.currentState;
  const input = history.initialInput;
  const teamAIds = input.matchType === "doubles" ? [...input.teamAPlayerIds] : [input.teamAPlayerId];
  const teamBIds = input.matchType === "doubles" ? [...input.teamBPlayerIds] : [input.teamBPlayerId];
  const durationSeconds = startedAt
    ? Math.max(0, Math.round((Date.now() - new Date(startedAt).getTime()) / 1000))
    : null;
  return {
    matchType: input.matchType, teamAPlayerIds: teamAIds, teamBPlayerIds: teamBIds,
    teamAScore: state.teamAScore, teamBScore: state.teamBScore,
    winner: state.winner!, startingServerPlayerId: input.startingServerPlayerId,
    totalRallies: history.rallyWinners.length, rallyEvents, durationSeconds,
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
      sequenceNumber: i + 1, rallyWinnerTeam: history.rallyWinners[i],
      resultingTeamAScore: result.newState.teamAScore, resultingTeamBScore: result.newState.teamBScore,
      serverPlayerId, serverNumber, sideOutOccurred: result.sideOutOccurred,
    });
    replayState = result.newState;
  }
  return events;
}

/**
 * Check if a heartbeat timestamp is fresh (within 30 seconds).
 * Returns false if null/undefined (treat as stale).
 */
function isHeartbeatFresh(heartbeatAt: string | null | undefined): boolean {
  if (!heartbeatAt) return false;
  const age = Date.now() - new Date(heartbeatAt).getTime();
  return age < HEARTBEAT_STALE_MS;
}
