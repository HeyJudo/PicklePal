"use client";

import { useState, useMemo } from "react";
import { PlayerAvatar } from "@/components/players";
import { recordManualMatch } from "./record-match-actions";
import type { MatchType } from "@/lib/supabase";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Player {
  readonly id: string;
  readonly display_name: string;
  readonly color: string | null;
  readonly avatar_url: string | null;
}

interface RecordMatchFormProps {
  readonly sessionId: string;
  readonly players: readonly Player[];
  readonly defaultMatchType: MatchType;
  readonly defaultTargetScore: number;
  readonly defaultWinBy: number;
  readonly onSuccess: () => void;
  readonly onCancel: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function RecordMatchForm({
  sessionId,
  players,
  defaultMatchType,
  defaultTargetScore,
  defaultWinBy,
  onSuccess,
  onCancel,
}: RecordMatchFormProps) {
  const [matchType, setMatchType] = useState<MatchType>(defaultMatchType);
  const [teamAPlayerIds, setTeamAPlayerIds] = useState<string[]>([]);
  const [teamBPlayerIds, setTeamBPlayerIds] = useState<string[]>([]);
  const [teamAScore, setTeamAScore] = useState("");
  const [teamBScore, setTeamBScore] = useState("");
  const [targetScore, setTargetScore] = useState(defaultTargetScore);
  const [winBy] = useState(defaultWinBy);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const playersPerTeam = matchType === "doubles" ? 2 : 1;

  // Players already selected on either team
  const selectedIds = useMemo(
    () => new Set([...teamAPlayerIds, ...teamBPlayerIds]),
    [teamAPlayerIds, teamBPlayerIds],
  );

  // Available players for selection
  const availablePlayers = useMemo(
    () => players.filter((p) => !selectedIds.has(p.id)),
    [players, selectedIds],
  );

  const teamAFull = teamAPlayerIds.length >= playersPerTeam;
  const teamBFull = teamBPlayerIds.length >= playersPerTeam;
  const teamsReady = teamAFull && teamBFull;

  // ── Player selection ──────────────────────────────────────────────────────

  const handleAddToTeamA = (playerId: string) => {
    if (teamAFull) return;
    setTeamAPlayerIds((prev) => [...prev, playerId]);
  };

  const handleAddToTeamB = (playerId: string) => {
    if (teamBFull) return;
    setTeamBPlayerIds((prev) => [...prev, playerId]);
  };

  const handleRemoveFromTeamA = (playerId: string) => {
    setTeamAPlayerIds((prev) => prev.filter((id) => id !== playerId));
  };

  const handleRemoveFromTeamB = (playerId: string) => {
    setTeamBPlayerIds((prev) => prev.filter((id) => id !== playerId));
  };

  // Reset teams when match type changes
  const handleMatchTypeChange = (newType: MatchType) => {
    setMatchType(newType);
    setTeamAPlayerIds([]);
    setTeamBPlayerIds([]);
    setError("");
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setError("");
    setSuccessMessage("");

    const scoreA = parseInt(teamAScore, 10);
    const scoreB = parseInt(teamBScore, 10);

    if (isNaN(scoreA) || isNaN(scoreB)) {
      setError("Please enter valid scores for both teams");
      return;
    }

    setIsSaving(true);
    try {
      const result = await recordManualMatch({
        sessionId,
        matchType,
        teamAPlayerIds,
        teamBPlayerIds,
        teamAScore: scoreA,
        teamBScore: scoreB,
        targetScore,
        winBy,
      });

      if (result.success) {
        setSuccessMessage("Match recorded!");
        setTimeout(() => onSuccess(), 800);
      } else {
        setError(result.error ?? "Failed to record match");
      }
    } finally {
      setIsSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="rounded-xl border border-border bg-surface p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-text-primary">Record Past Match</h3>
          <p className="text-xs text-text-muted mt-0.5">
            Manually enter a match that was played without live scoring
          </p>
        </div>
        <span className="text-[10px] font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
          Manual
        </span>
      </div>

      {/* Match Type Toggle */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-text-secondary">Match Type</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleMatchTypeChange("doubles")}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
              matchType === "doubles"
                ? "bg-court-green text-white"
                : "bg-surface-muted text-text-secondary hover:bg-surface-muted/80 border border-border"
            }`}
          >
            Doubles
          </button>
          <button
            type="button"
            onClick={() => handleMatchTypeChange("singles")}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
              matchType === "singles"
                ? "bg-court-green text-white"
                : "bg-surface-muted text-text-secondary hover:bg-surface-muted/80 border border-border"
            }`}
          >
            Singles
          </button>
        </div>
      </div>

      {/* Team Selection */}
      <div className="grid grid-cols-2 gap-4">
        {/* Team A */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-text-secondary">
            Team A ({teamAPlayerIds.length}/{playersPerTeam})
          </label>
          <div className="min-h-[48px] rounded-lg border border-border bg-surface-muted p-2 space-y-1.5">
            {teamAPlayerIds.map((id) => {
              const player = players.find((p) => p.id === id);
              if (!player) return null;
              return (
                <div key={id} className="flex items-center gap-1.5">
                  <PlayerAvatar
                    displayName={player.display_name}
                    color={player.color}
                    avatarUrl={player.avatar_url}
                    size="xs"
                  />
                  <span className="text-xs text-text-primary flex-1 truncate">
                    {player.display_name}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFromTeamA(id)}
                    className="text-text-muted hover:text-red-500 transition-colors cursor-pointer"
                    aria-label={`Remove ${player.display_name} from Team A`}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
            {!teamAFull && (
              <p className="text-[10px] text-text-muted italic">
                Select from below
              </p>
            )}
          </div>
        </div>

        {/* Team B */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-text-secondary">
            Team B ({teamBPlayerIds.length}/{playersPerTeam})
          </label>
          <div className="min-h-[48px] rounded-lg border border-border bg-surface-muted p-2 space-y-1.5">
            {teamBPlayerIds.map((id) => {
              const player = players.find((p) => p.id === id);
              if (!player) return null;
              return (
                <div key={id} className="flex items-center gap-1.5">
                  <PlayerAvatar
                    displayName={player.display_name}
                    color={player.color}
                    avatarUrl={player.avatar_url}
                    size="xs"
                  />
                  <span className="text-xs text-text-primary flex-1 truncate">
                    {player.display_name}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFromTeamB(id)}
                    className="text-text-muted hover:text-red-500 transition-colors cursor-pointer"
                    aria-label={`Remove ${player.display_name} from Team B`}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
            {!teamBFull && (
              <p className="text-[10px] text-text-muted italic">
                Select from below
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Available Players */}
      {availablePlayers.length > 0 && (!teamAFull || !teamBFull) && (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-text-secondary">
            Available Players
          </label>
          <div className="flex flex-wrap gap-2">
            {availablePlayers.map((player) => (
              <div
                key={player.id}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-muted px-2.5 py-1.5"
              >
                <PlayerAvatar
                  displayName={player.display_name}
                  color={player.color}
                  avatarUrl={player.avatar_url}
                  size="xs"
                />
                <span className="text-xs text-text-primary">
                  {player.display_name}
                </span>
                <div className="flex gap-1 ml-1">
                  {!teamAFull && (
                    <button
                      type="button"
                      onClick={() => handleAddToTeamA(player.id)}
                      className="text-[10px] font-semibold text-court-green hover:text-court-green-dark transition-colors cursor-pointer px-1"
                      aria-label={`Add ${player.display_name} to Team A`}
                    >
                      → A
                    </button>
                  )}
                  {!teamBFull && (
                    <button
                      type="button"
                      onClick={() => handleAddToTeamB(player.id)}
                      className="text-[10px] font-semibold text-court-green hover:text-court-green-dark transition-colors cursor-pointer px-1"
                      aria-label={`Add ${player.display_name} to Team B`}
                    >
                      → B
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Score Entry */}
      {teamsReady && (
        <div className="space-y-3">
          <label className="text-xs font-semibold text-text-secondary">Final Scores</label>

          {/* Target score selector */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-muted">Playing to:</span>
            <div className="flex gap-1.5">
              {[11, 15, 21].map((target) => (
                <button
                  key={target}
                  type="button"
                  onClick={() => setTargetScore(target)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                    targetScore === target
                      ? "bg-court-green text-white"
                      : "bg-surface-muted text-text-secondary border border-border hover:bg-surface-muted/80"
                  }`}
                >
                  {target}
                </button>
              ))}
            </div>
            <span className="text-xs text-text-muted">win by {winBy}</span>
          </div>

          {/* Score inputs */}
          <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-text-muted">Team A</span>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                max="99"
                value={teamAScore}
                onChange={(e) => setTeamAScore(e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-border bg-surface-muted px-3 py-2.5 text-center text-lg font-bold text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-court-green"
                aria-label="Team A score"
              />
            </div>
            <span className="text-text-muted font-medium pt-5">–</span>
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-text-muted">Team B</span>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                max="99"
                value={teamBScore}
                onChange={(e) => setTeamBScore(e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-border bg-surface-muted px-3 py-2.5 text-center text-lg font-bold text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-court-green"
                aria-label="Team B score"
              />
            </div>
          </div>
        </div>
      )}

      {/* Error / Success */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      {successMessage && (
        <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          {successMessage}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!teamsReady || !teamAScore || !teamBScore || isSaving}
          className="flex-1 rounded-xl bg-court-green px-4 py-3 text-sm font-bold text-white hover:bg-court-green-dark transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-court-green/20"
        >
          {isSaving ? "Saving..." : "Record Match"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="rounded-xl border border-border px-4 py-3 text-sm font-medium text-text-secondary hover:bg-surface-muted transition-colors cursor-pointer disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
