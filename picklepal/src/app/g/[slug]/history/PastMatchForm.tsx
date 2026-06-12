"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MatchEntryFields } from "@/components/matches/MatchEntryFields";
import { recordPastMatch } from "@/app/g/[slug]/live/record-match-actions";
import { updateManualMatch } from "@/app/g/[slug]/match-actions";
import type { MatchType } from "@/lib/supabase";
import type { MatchEntryPlayer } from "@/components/matches/MatchEntryFields";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SessionOption {
  readonly id: string;
  readonly title: string | null;
  readonly started_at: string;
}

export interface PastMatchInitial {
  readonly matchId: string;
  readonly matchType: MatchType;
  readonly teamAPlayerIds: readonly string[];
  readonly teamBPlayerIds: readonly string[];
  readonly teamAScore: number;
  readonly teamBScore: number;
  readonly targetScore: number;
  readonly winBy: number;
  readonly playedDate: string; // YYYY-MM-DD
}

interface PastMatchFormProps {
  readonly groupSlug: string;
  readonly players: readonly MatchEntryPlayer[];
  readonly sessionOptions: readonly SessionOption[];
  readonly initialMatch?: PastMatchInitial; // present = edit mode
  readonly onClose: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTodayLocal(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatSessionLabel(session: SessionOption): string {
  const date = new Date(session.started_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${session.title ?? "Game Day"} (${date})`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PastMatchForm({
  groupSlug,
  players,
  sessionOptions,
  initialMatch,
  onClose,
}: PastMatchFormProps) {
  const router = useRouter();
  const isEditMode = !!initialMatch;

  const today = getTodayLocal();

  const [playedDate, setPlayedDate] = useState(initialMatch?.playedDate ?? today);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [matchType, setMatchType] = useState<MatchType>(initialMatch?.matchType ?? "doubles");
  const [teamAPlayerIds, setTeamAPlayerIds] = useState<string[]>(
    initialMatch ? [...initialMatch.teamAPlayerIds] : [],
  );
  const [teamBPlayerIds, setTeamBPlayerIds] = useState<string[]>(
    initialMatch ? [...initialMatch.teamBPlayerIds] : [],
  );
  const [teamAScore, setTeamAScore] = useState(
    initialMatch ? String(initialMatch.teamAScore) : "",
  );
  const [teamBScore, setTeamBScore] = useState(
    initialMatch ? String(initialMatch.teamBScore) : "",
  );
  const [targetScore, setTargetScore] = useState(initialMatch?.targetScore ?? 11);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const winBy = initialMatch?.winBy ?? 2;

  const teamsReady =
    matchType === "doubles"
      ? teamAPlayerIds.length === 2 && teamBPlayerIds.length === 2
      : teamAPlayerIds.length === 1 && teamBPlayerIds.length === 1;

  const canSubmit = teamsReady && teamAScore !== "" && teamBScore !== "" && !isSaving;

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleMatchTypeChange = useCallback((type: MatchType) => {
    setMatchType(type);
    setTeamAPlayerIds([]);
    setTeamBPlayerIds([]);
  }, []);

  const handleSubmit = async () => {
    setError("");
    const scoreA = parseInt(teamAScore, 10);
    const scoreB = parseInt(teamBScore, 10);

    if (isNaN(scoreA) || isNaN(scoreB)) {
      setError("Please enter valid scores for both teams");
      return;
    }

    setIsSaving(true);
    try {
      if (isEditMode && initialMatch) {
        const result = await updateManualMatch({
          matchId: initialMatch.matchId,
          matchType,
          teamAPlayerIds,
          teamBPlayerIds,
          teamAScore: scoreA,
          teamBScore: scoreB,
          targetScore,
          winBy,
          playedDate,
        });

        if (result.success) {
          router.refresh();
          onClose();
        } else {
          setError(result.error ?? "Failed to update match");
        }
      } else {
        const result = await recordPastMatch({
          groupSlug,
          sessionId: selectedSessionId || null,
          playedDate,
          matchType,
          teamAPlayerIds,
          teamBPlayerIds,
          teamAScore: scoreA,
          teamBScore: scoreB,
          targetScore,
          winBy,
        });

        if (result.success) {
          router.refresh();
          onClose();
        } else {
          setError(result.error ?? "Failed to record match");
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="past-match-form-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel — bottom sheet on mobile, centered modal on sm+ */}
      <div className="relative w-full sm:max-w-lg mx-0 sm:mx-4 rounded-t-2xl sm:rounded-2xl bg-surface border border-border shadow-xl max-h-[92dvh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-border bg-surface rounded-t-2xl">
          <div>
            <h2
              id="past-match-form-title"
              className="text-base font-bold text-text-primary"
            >
              {isEditMode ? "Edit Match" : "Add Past Match"}
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              {isEditMode
                ? "Update teams, scores, or played date"
                : "Record a match that was played without live scoring"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-text-muted hover:bg-surface-muted hover:text-text-secondary transition-colors cursor-pointer"
            aria-label="Close"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-5 space-y-5">
          {/* Date picker */}
          <div className="space-y-2">
            <label htmlFor="played-date" className="text-xs font-semibold text-text-secondary">
              Played Date
            </label>
            <input
              id="played-date"
              type="date"
              value={playedDate}
              max={today}
              onChange={(e) => setPlayedDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-muted px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-court-green"
            />
          </div>

          {/* Session picker — create mode only */}
          {!isEditMode && sessionOptions.length > 0 && (
            <div className="space-y-2">
              <label htmlFor="session-select" className="text-xs font-semibold text-text-secondary">
                Session (optional)
              </label>
              <select
                id="session-select"
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface-muted px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-court-green"
              >
                <option value="">No session — group by date</option>
                {sessionOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {formatSessionLabel(s)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Team + score entry */}
          <MatchEntryFields
            matchType={matchType}
            teamAPlayerIds={teamAPlayerIds}
            teamBPlayerIds={teamBPlayerIds}
            teamAScore={teamAScore}
            teamBScore={teamBScore}
            targetScore={targetScore}
            winBy={winBy}
            players={players}
            onMatchTypeChange={handleMatchTypeChange}
            onTeamAChange={setTeamAPlayerIds}
            onTeamBChange={setTeamBPlayerIds}
            onTeamAScoreChange={setTeamAScore}
            onTeamBScoreChange={setTeamBScore}
            onTargetScoreChange={setTargetScore}
          />

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1 pb-safe">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="flex-1 rounded-xl bg-court-green px-4 py-3 text-sm font-bold text-white hover:bg-court-green-dark transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-court-green/20"
            >
              {isSaving
                ? isEditMode
                  ? "Saving..."
                  : "Recording..."
                : isEditMode
                  ? "Save Changes"
                  : "Record Match"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-xl border border-border px-4 py-3 text-sm font-medium text-text-secondary hover:bg-surface-muted transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
