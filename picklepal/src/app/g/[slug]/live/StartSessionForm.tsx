"use client";

import { useState, useTransition } from "react";
import { PlayerAvatar } from "@/components/players";
import { startSession } from "./actions";

interface Player {
  readonly id: string;
  readonly display_name: string;
  readonly color: string | null;
  readonly avatar_url: string | null;
}

interface StartSessionFormProps {
  readonly groupSlug: string;
  readonly players: readonly Player[];
  readonly onSessionStarted: (sessionId: string) => void;
  readonly defaultMatchType?: "singles" | "doubles";
  readonly defaultTargetScore?: number;
  readonly defaultWinBy?: number;
}

export function StartSessionForm({
  groupSlug,
  players,
  onSessionStarted,
  defaultMatchType,
  defaultTargetScore,
  defaultWinBy,
}: StartSessionFormProps) {
  const [isPending, startTransition] = useTransition();

  // Session settings
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(
    () => new Set(players.map((p) => p.id)),
  );
  const [matchType, setMatchType] = useState<"singles" | "doubles">(defaultMatchType ?? "doubles");
  const [targetScore, setTargetScore] = useState(defaultTargetScore ?? 11);
  const [winBy, setWinBy] = useState(defaultWinBy ?? 2);
  const [trackScorers, setTrackScorers] = useState(false);
  const [error, setError] = useState("");

  // Step: "settings" or "players"
  const [step, setStep] = useState<"settings" | "players">("players");

  const togglePlayer = (playerId: string) => {
    setSelectedPlayerIds((prev) => {
      const next = new Set(prev);
      if (next.has(playerId)) {
        next.delete(playerId);
      } else {
        next.add(playerId);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedPlayerIds(new Set(players.map((p) => p.id)));
  };

  const deselectAll = () => {
    setSelectedPlayerIds(new Set());
  };

  const minPlayers = matchType === "doubles" ? 4 : 2;
  const canStart = selectedPlayerIds.size >= minPlayers;

  const handleStartSession = () => {
    setError("");
    startTransition(async () => {
      const result = await startSession({
        groupSlug,
        matchType,
        targetScore,
        winBy,
        trackScorers,
        presentPlayerIds: Array.from(selectedPlayerIds),
      });

      if (result.success && result.data) {
        onSessionStarted(result.data.id);
      } else {
        setError(result.error ?? "Failed to start session");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Player Selection */}
      {step === "players" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-2xl text-text-primary leading-tight">
              Who&apos;s playing today?
            </h3>
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="text-xs font-semibold text-court-green hover:text-court-green-dark cursor-pointer"
              >
                All
              </button>
              <span className="text-text-muted">|</span>
              <button
                onClick={deselectAll}
                className="text-xs font-semibold text-court-green hover:text-court-green-dark cursor-pointer"
              >
                None
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {players.map((player) => {
              const isSelected = selectedPlayerIds.has(player.id);
              return (
                <button
                  key={player.id}
                  onClick={() => togglePlayer(player.id)}
                  className={`flex items-center gap-3 rounded-xl border p-3 transition-all cursor-pointer ${
                    isSelected
                      ? "border-court-green bg-court-green/10 ring-1 ring-court-green/30"
                      : "border-border bg-surface hover:border-court-green/40"
                  }`}
                >
                  <PlayerAvatar
                    displayName={player.display_name}
                    color={player.color}
                    avatarUrl={player.avatar_url}
                    size="sm"
                  />
                  <span className="text-sm font-medium text-text-primary truncate">
                    {player.display_name}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="text-sm text-text-muted">
            {selectedPlayerIds.size} selected
            {selectedPlayerIds.size < minPlayers && (
              <span className="text-red-500">
                {" "}
                (need at least {minPlayers} for {matchType})
              </span>
            )}
          </p>

          <button
            onClick={() => setStep("settings")}
            disabled={!canStart}
            className="w-full rounded-xl bg-court-green px-4 py-4 text-base font-bold text-white hover:bg-court-green-dark transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-court-green/20"
          >
            Next: Game Settings
          </button>
        </div>
      )}

      {/* Settings */}
      {step === "settings" && (
        <div className="space-y-4">
          <button
            onClick={() => setStep("players")}
            className="text-sm text-court-green hover:text-court-green-dark cursor-pointer font-medium"
          >
            ← Back to player selection
          </button>

          <h3 className="font-display text-2xl text-text-primary leading-tight">
            Game Settings
          </h3>

          {/* Match Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">
              Match Type
            </label>
            <div className="flex gap-2">
              {(["doubles", "singles"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setMatchType(type)}
                  className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                    matchType === type
                      ? "border-court-green bg-court-green/10 text-court-green"
                      : "border-border text-text-secondary hover:border-court-green/40"
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Target Score */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">
              Target Score
            </label>
            <div className="flex gap-2">
              {[11, 15, 21].map((score) => (
                <button
                  key={score}
                  onClick={() => setTargetScore(score)}
                  className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                    targetScore === score
                      ? "border-court-green bg-court-green/10 text-court-green"
                      : "border-border text-text-secondary hover:border-court-green/40"
                  }`}
                >
                  {score}
                </button>
              ))}
            </div>
          </div>

          {/* Win By */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">
              Win By
            </label>
            <div className="flex gap-2">
              {[1, 2, 3].map((wb) => (
                <button
                  key={wb}
                  onClick={() => setWinBy(wb)}
                  className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                    winBy === wb
                      ? "border-court-green bg-court-green/10 text-court-green"
                      : "border-border text-text-secondary hover:border-court-green/40"
                  }`}
                >
                  {wb}
                </button>
              ))}
            </div>
          </div>

          {/* Track Scorers */}
          <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <div>
              <p className="text-sm font-medium text-text-primary">
                Track individual scorers
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                Tap player avatars to record who scored each point
              </p>
            </div>
            <button
              type="button"
              onClick={() => setTrackScorers(!trackScorers)}
              className={`relative h-6 w-11 rounded-full transition-colors cursor-pointer ${
                trackScorers ? "bg-court-green" : "bg-border"
              }`}
              role="switch"
              aria-checked={trackScorers}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  trackScorers ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          {/* Start Button */}
          <button
            onClick={handleStartSession}
            disabled={isPending || !canStart}
            className="w-full rounded-xl bg-court-green px-4 py-4 text-base font-bold text-white hover:bg-court-green-dark transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-court-green/20"
          >
            {isPending
              ? "Starting..."
              : !canStart
                ? `Need at least ${minPlayers} players`
                : "Start Game Day"}
          </button>

          {!canStart && (
            <p className="text-sm text-red-500 text-center">
              Go back and select at least {minPlayers} players for {matchType}.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
