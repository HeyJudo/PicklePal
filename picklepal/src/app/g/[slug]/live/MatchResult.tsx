"use client";

import { useCallback, useEffect, useState } from "react";
import { saveCompletedMatch } from "./actions";
import {
  clearOfflineRallyQueue,
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
  readonly rallyEvents: readonly RallyEventData[];
}

interface MatchResultProps {
  readonly matchData: CompletedMatchData;
  readonly sessionId: string;
  readonly matchLocalId: string | null;
  readonly players: readonly Player[];
  readonly targetScore: number;
  readonly winBy: number;
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
      });

      if (result.success) {
        if (matchLocalId) {
          clearOfflineRallyQueue(sessionId, matchLocalId);
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

  return (
    <div className="space-y-6">
      {/* Winner Banner */}
      <div className="rounded-xl border-2 border-primary bg-primary/5 p-8 text-center">
        <p className="text-sm font-medium text-text-muted uppercase tracking-wide mb-2">
          Winner
        </p>
        <div className="flex items-center justify-center gap-3 mb-3">
          {winnerIds.map((id) => (
            <div key={id} className="flex flex-col items-center gap-1">
              <div
                className="h-12 w-12 rounded-full flex items-center justify-center text-lg font-bold text-white"
                style={{ backgroundColor: getPlayerColor(id) }}
              >
                {getPlayerName(id).charAt(0)}
              </div>
              <span className="text-sm font-semibold text-text-primary">
                {getPlayerName(id)}
              </span>
            </div>
          ))}
        </div>
        <p className="text-4xl font-bold text-primary">
          {matchData.teamAScore} - {matchData.teamBScore}
        </p>
        <p className="text-sm text-text-muted mt-2">
          {matchData.totalRallies} rallies
        </p>
      </div>

      {/* Loser */}
      <div className="rounded-xl border border-border bg-surface-muted p-4 text-center">
        <div className="flex items-center justify-center gap-3">
          {loserIds.map((id) => (
            <div key={id} className="flex items-center gap-2">
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ backgroundColor: getPlayerColor(id) }}
              >
                {getPlayerName(id).charAt(0)}
              </div>
              <span className="text-sm text-text-secondary">
                {getPlayerName(id)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Save & Actions */}
      <div
        className={`rounded-lg border px-3 py-2 text-xs font-medium ${getSyncToneClass(
          syncDisplay.tone,
        )}`}
      >
        {syncDisplay.label}
      </div>

      {error && <p className="text-sm text-red-500 text-center">{error}</p>}

      {!saved ? (
        <div className="space-y-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full rounded-xl bg-primary px-4 py-3.5 text-base font-semibold text-white hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : retryAttempt > 0 ? "Retry Now" : "Save Match"}
          </button>
          {!isOnline && (
            <p className="text-xs text-text-muted text-center">
              Match is saved locally. Keep this screen open and it will retry when
              you are back online.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-green-600 text-center font-medium">
            ✓ Match saved
          </p>
          <button
            onClick={onNextMatch}
            className="w-full rounded-xl bg-primary px-4 py-3.5 text-base font-semibold text-white hover:bg-primary/90 transition-colors cursor-pointer"
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
      return "border-green-200 bg-green-50 text-green-700";
    case "warning":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "error":
      return "border-red-200 bg-red-50 text-red-700";
    case "pending":
    default:
      return "border-sky-blue/30 bg-sky-blue/10 text-sky-blue";
  }
}
