"use client";

import { useCallback, useEffect, useState } from "react";
import { saveCompletedMatch } from "./actions";
import { formatMatchDuration } from "@/lib/format/duration";
import {
  clearRecoverableMatch,
  formatSyncErrorMessage,
  getOfflineRallyEvents,
  getRetryDelayMs,
  getSyncDisplay,
} from "@/lib/offline";

interface Player {
  readonly id: string;
  readonly display_name: string;
  readonly color: string | null;
}

interface RallyEventData {
  readonly sequenceNumber: number;
  readonly rallyWinnerTeam: string;
  readonly resultingTeamAScore: number;
  readonly resultingTeamBScore: number;
  readonly serverPlayerId: string;
  readonly serverNumber: number | null;
  readonly sideOutOccurred: boolean;
}

export interface CompletedMatchData {
  readonly matchType: "singles" | "doubles";
  readonly teamAPlayerIds: readonly string[];
  readonly teamBPlayerIds: readonly string[];
  readonly teamAScore: number;
  readonly teamBScore: number;
  readonly winner: "A" | "B";
  readonly startingServerPlayerId: string;
  readonly totalRallies: number;
  readonly durationSeconds?: number | null;
  readonly rallyEvents: readonly RallyEventData[];
}

interface MatchResultProps {
  readonly matchData: CompletedMatchData;
  readonly sessionId: string;
  readonly matchLocalId: string | null;
  readonly players: readonly Player[];
  readonly targetScore: number;
  readonly winBy: number;
  readonly activeMatchId: string | null;
  readonly onNextMatch: () => void;
  readonly onEndSession: () => void;
}

export function MatchResult({
  matchData,
  sessionId,
  matchLocalId,
  players,
  targetScore,
  winBy,
  activeMatchId,
  onNextMatch,
  onEndSession,
}: MatchResultProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [pendingRallyCount, setPendingRallyCount] = useState(() =>
    matchLocalId
      ? getOfflineRallyEvents(sessionId, matchLocalId).length
      : matchData.rallyEvents.length,
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const playerMap = new Map(players.map((p) => [p.id, p]));
  const getPlayerName = (id: string) =>
    playerMap.get(id)?.display_name ?? "?";
  const getPlayerColor = (id: string) =>
    playerMap.get(id)?.color ?? "#6366f1";

  const winner = matchData.winner;
  const loser = winner === "A" ? "B" : "A";
  const winnerIds = winner === "A" ? matchData.teamAPlayerIds : matchData.teamBPlayerIds;
  const loserIds = loser === "A" ? matchData.teamAPlayerIds : matchData.teamBPlayerIds;

  const attemptSave = useCallback(async () => {
    if (saved || isSaving) return;

    // If match was already completed via activeMatchId flow, mark as saved
    if (activeMatchId) {
      setSaved(true);
      setPendingRallyCount(0);
      if (matchLocalId) {
        clearRecoverableMatch(sessionId, matchLocalId);
      }
      return;
    }

    if (!isOnline) {
      setError("Waiting for connection to sync match");
      setRetryAttempt((attempt) => Math.max(1, attempt));
      return;
    }

    setIsSaving(true);
    setError("");
    try {
      const result = await saveCompletedMatch({
        sessionId,
        matchType: matchData.matchType,
        teamAPlayerIds: [...matchData.teamAPlayerIds],
        teamBPlayerIds: [...matchData.teamBPlayerIds],
        teamAScore: matchData.teamAScore,
        teamBScore: matchData.teamBScore,
        winningTeam: winner,
        losingTeam: loser,
        startingServerPlayerId: matchData.startingServerPlayerId,
        targetScore,
        winBy,
        rallyEvents: [...matchData.rallyEvents],
        durationSeconds: matchData.durationSeconds ?? null,
      });

      if (result.success) {
        if (matchLocalId) {
          clearRecoverableMatch(sessionId, matchLocalId);
        }
        setPendingRallyCount(0);
        setRetryAttempt(0);
        setSaved(true);
      } else {
        setError(formatSyncErrorMessage(result.error));
        setRetryAttempt((attempt) => attempt + 1);
      }
    } finally {
      setIsSaving(false);
    }
  }, [
    activeMatchId,
    isOnline,
    isSaving,
    loser,
    matchData,
    matchLocalId,
    saved,
    sessionId,
    targetScore,
    winBy,
    winner,
  ]);

  useEffect(() => {
    if (saved || isSaving || !error || !isOnline || retryAttempt === 0) return;

    const timer = window.setTimeout(() => {
      void attemptSave();
    }, getRetryDelayMs(retryAttempt));

    return () => window.clearTimeout(timer);
  }, [attemptSave, error, isOnline, isSaving, retryAttempt, saved]);

  const handleSave = () => {
    void attemptSave();
  };

  const syncDisplay = getSyncDisplay({
    pendingCount: pendingRallyCount,
    isOnline,
    isSyncing: isSaving,
    retryAttempt,
    hasError: Boolean(error),
  });

  const winnerScore = winner === "A" ? matchData.teamAScore : matchData.teamBScore;
  const loserScore = winner === "A" ? matchData.teamBScore : matchData.teamAScore;

  return (
    <div className="space-y-4">
      {/* Win Celebration Banner */}
      <div className="win-pop relative overflow-hidden rounded-2xl border-2 border-ball-yellow bg-gradient-to-br from-ball-yellow/20 via-surface to-court-green/5 p-8 text-center shadow-lg shadow-ball-yellow/10">
        {/* Court lines watermark */}
        <div className="absolute inset-0 opacity-[0.04]" aria-hidden="true">
          <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="20" y="20" width="360" height="160" rx="2" />
            <line x1="200" y1="20" x2="200" y2="180" strokeWidth="2" />
            <line x1="130" y1="20" x2="130" y2="180" strokeDasharray="4 4" />
            <line x1="270" y1="20" x2="270" y2="180" strokeDasharray="4 4" />
            <line x1="20" y1="100" x2="130" y2="100" />
            <line x1="270" y1="100" x2="380" y2="100" />
          </svg>
        </div>

        <div className="relative">
          {/* Star icon */}
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-ball-yellow/25 mb-4">
            <svg className="h-6 w-6 text-ball-yellow" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>

          {/* Winner avatars */}
          <div className="flex items-center justify-center gap-4 mb-5">
            {winnerIds.map((id) => (
              <div key={id} className="flex flex-col items-center gap-1.5">
                <div
                  className="h-14 w-14 rounded-full flex items-center justify-center text-xl font-bold text-white ring-4 ring-ball-yellow/40 shadow-lg"
                  style={{ backgroundColor: getPlayerColor(id) }}
                >
                  {getPlayerName(id).charAt(0)}
                </div>
                <span className="text-sm font-bold text-text-primary">
                  {getPlayerName(id)}
                </span>
              </div>
            ))}
          </div>

          {/* Big Anton score: winner vs loser */}
          <div className="flex items-baseline justify-center gap-3 mb-2">
            <span className="font-display text-6xl text-court-green leading-none tabular-nums">
              {winnerScore}
            </span>
            <span className="font-score font-bold text-4xl text-text-muted/40 leading-none tabular-nums">
              {loserScore}
            </span>
          </div>

          <p className="font-display text-2xl text-court-green-dark">
            {winnerIds.map((id) => getPlayerName(id).split(" ")[0]).join(" & ")} Win!
          </p>
          <p className="text-xs text-text-muted mt-2 tabular-nums">
            {matchData.totalRallies} rallies played
            {matchData.durationSeconds != null && (
              <>
                {" · "}
                <span className="inline-flex items-center gap-0.5">
                  <svg className="inline h-3 w-3 mb-px" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" />
                    <path strokeLinecap="round" d="M12 7v5l3 3" />
                  </svg>
                  {formatMatchDuration(matchData.durationSeconds)}
                </span>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Loser — faded */}
      <div className="rounded-xl border border-border-muted bg-surface-muted px-4 py-3">
        <div className="flex items-center justify-center gap-3">
          {loserIds.map((id) => (
            <div key={id} className="flex items-center gap-2">
              <div
                className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white/70 shrink-0"
                style={{ backgroundColor: getPlayerColor(id) }}
              >
                {getPlayerName(id).charAt(0)}
              </div>
              <span className="text-sm text-text-muted/70">
                {getPlayerName(id)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Sync status */}
      <div
        className={`rounded-lg border px-3 py-2 text-xs font-medium flex items-center gap-1.5 ${getSyncToneClass(syncDisplay.tone)}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${getSyncDotClass(syncDisplay.tone)}`} />
        {syncDisplay.label}
      </div>

      {error && <p className="text-sm text-red-500 text-center">{error}</p>}

      {!saved ? (
        <div className="space-y-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full rounded-xl bg-court-green px-4 py-4 text-base font-bold text-white hover:bg-court-green-dark transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-court-green/20"
          >
            {isSaving ? "Saving..." : retryAttempt > 0 ? "Retry Sync" : "Save Match"}
          </button>
          {!isOnline && (
            <p className="text-xs text-text-muted text-center">
              Saved locally — will sync when back online.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-1.5 text-sm text-court-green font-semibold">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Match saved
          </div>
          <button
            onClick={onNextMatch}
            className="w-full rounded-xl bg-court-green px-4 py-4 text-base font-bold text-white hover:bg-court-green-dark transition-all active:scale-[0.98] cursor-pointer shadow-lg shadow-court-green/20"
          >
            Next Match
          </button>
          <button
            onClick={onEndSession}
            className="w-full rounded-xl border border-border px-4 py-3 text-sm font-medium text-text-secondary hover:bg-surface-muted transition-colors cursor-pointer"
          >
            End Game Day
          </button>
        </div>
      )}
    </div>
  );
}

function getSyncToneClass(tone: "success" | "pending" | "warning" | "error") {
  switch (tone) {
    case "success":
      return "border-court-green/30 bg-court-green/5 text-court-green-dark";
    case "warning":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "error":
      return "border-red-200 bg-red-50 text-red-700";
    case "pending":
    default:
      return "border-sky-blue/30 bg-sky-blue/10 text-sky-blue";
  }
}

function getSyncDotClass(tone: "success" | "pending" | "warning" | "error") {
  switch (tone) {
    case "success":
      return "bg-court-green";
    case "warning":
      return "bg-amber-500";
    case "error":
      return "bg-red-500";
    case "pending":
    default:
      return "bg-sky-blue animate-pulse";
  }
}
