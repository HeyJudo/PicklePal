"use client";

import { useState, useTransition } from "react";
import { saveCompletedMatch } from "./actions";
import { clearOfflineRallyQueue } from "@/lib/offline";

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
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const playerMap = new Map(players.map((p) => [p.id, p]));
  const getPlayerName = (id: string) =>
    playerMap.get(id)?.display_name ?? "?";
  const getPlayerColor = (id: string) =>
    playerMap.get(id)?.color ?? "#6366f1";

  const winner = matchData.winner;
  const loser = winner === "A" ? "B" : "A";
  const winnerIds = winner === "A" ? matchData.teamAPlayerIds : matchData.teamBPlayerIds;
  const loserIds = loser === "A" ? matchData.teamAPlayerIds : matchData.teamBPlayerIds;

  const handleSave = () => {
    setError("");
    startTransition(async () => {
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
        setSaved(true);
      } else {
        setError(result.error ?? "Failed to save match");
      }
    });
  };

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
      {error && <p className="text-sm text-red-500 text-center">{error}</p>}

      {!saved ? (
        <button
          onClick={handleSave}
          disabled={isPending}
          className="w-full rounded-xl bg-primary px-4 py-3.5 text-base font-semibold text-white hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save Match"}
        </button>
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
