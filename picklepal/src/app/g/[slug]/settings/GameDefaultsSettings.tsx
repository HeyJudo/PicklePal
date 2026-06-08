"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { updateGameDefaults } from "./settings-actions";
import type { GroupSettings } from "@/lib/supabase";

interface GameDefaultsSettingsProps {
  readonly slug: string;
  readonly settings: GroupSettings;
}

export function GameDefaultsSettings({ slug, settings }: GameDefaultsSettingsProps) {
  const [matchType, setMatchType] = useState<"singles" | "doubles">(settings.default_match_type);
  const [targetScore, setTargetScore] = useState(settings.default_target_score);
  const [winBy, setWinBy] = useState(settings.default_win_by);
  const [threshold, setThreshold] = useState(settings.qualification_threshold);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const hasChanges =
    matchType !== settings.default_match_type ||
    targetScore !== settings.default_target_score ||
    winBy !== settings.default_win_by ||
    threshold !== settings.qualification_threshold;

  const handleSave = () => {
    setError("");
    setSaved(false);

    startTransition(async () => {
      const result = await updateGameDefaults(slug, {
        default_match_type: matchType,
        default_target_score: targetScore,
        default_win_by: winBy,
        qualification_threshold: threshold,
      });

      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        setError(result.error ?? "Failed to save settings");
      }
    });
  };

  return (
    <section className="space-y-4">
      <div>
        <h3 className="font-headline text-base font-semibold text-on-background mb-1">
          Game Defaults
        </h3>
        <p className="text-sm text-on-surface-variant">
          Set the default game settings for new sessions. Players can still override these when starting a Game Day.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4 space-y-5">
        {/* Match Type */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-on-background">
            Match Type
          </label>
          <div className="flex gap-2">
            {(["doubles", "singles"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setMatchType(type)}
                className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                  matchType === type
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-on-surface-variant hover:border-primary/40"
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Target Score */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-on-background">
            Target Score
          </label>
          <div className="flex gap-2">
            {[11, 15, 21].map((score) => (
              <button
                key={score}
                type="button"
                onClick={() => setTargetScore(score)}
                className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                  targetScore === score
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-on-surface-variant hover:border-primary/40"
                }`}
              >
                {score}
              </button>
            ))}
          </div>
        </div>

        {/* Win By */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-on-background">
            Win By
          </label>
          <div className="flex gap-2">
            {[1, 2, 3].map((wb) => (
              <button
                key={wb}
                type="button"
                onClick={() => setWinBy(wb)}
                className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                  winBy === wb
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-on-surface-variant hover:border-primary/40"
                }`}
              >
                {wb}
              </button>
            ))}
          </div>
        </div>

        {/* Qualification Threshold */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-on-background">
            Leaderboard Qualification
          </label>
          <p className="text-xs text-on-surface-variant">
            Minimum games a player must complete to appear on the leaderboard.
          </p>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              max={20}
              value={threshold}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 1 && val <= 20) {
                  setThreshold(val);
                }
              }}
              className="w-20 rounded-lg border border-border bg-background px-3 py-2 text-sm text-on-background text-center focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            <span className="text-sm text-on-surface-variant">
              {threshold === 1 ? "game" : "games"}
            </span>
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending || !hasChanges}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving...
              </span>
            ) : (
              "Save Defaults"
            )}
          </button>

          {saved && (
            <span className="flex items-center gap-1 text-xs text-primary">
              <Check className="h-3 w-3" />
              Saved
            </span>
          )}

          {error && (
            <span className="text-xs text-red-500">{error}</span>
          )}
        </div>
      </div>
    </section>
  );
}
