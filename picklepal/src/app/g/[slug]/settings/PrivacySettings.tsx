"use client";

import { useState, useTransition, useEffect } from "react";
import { Globe, Lock, Loader2, Check } from "lucide-react";
import { getGroupPrivacyMode, setGroupPrivacyMode } from "./privacy-actions";
import type { PrivacyMode } from "@/lib/privacy";

interface PrivacySettingsProps {
  slug: string;
}

export function PrivacySettings({ slug }: PrivacySettingsProps) {
  const [mode, setMode] = useState<PrivacyMode>("public_link");
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const result = await getGroupPrivacyMode(slug);
      setMode(result.privacyMode);
      setLoading(false);
    }
    load();
  }, [slug]);

  const handleChange = (newMode: PrivacyMode) => {
    if (newMode === mode) return;

    setMode(newMode);
    setSaved(false);

    startTransition(async () => {
      const result = await setGroupPrivacyMode(slug, newMode);
      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        // Revert on failure
        setMode(mode);
      }
    });
  };

  if (loading) {
    return (
      <section className="space-y-4">
        <h3 className="font-headline text-base font-semibold text-on-background">
          Group Privacy
        </h3>
        <div className="flex items-center gap-2 text-sm text-on-surface-variant">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading...
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div>
        <h3 className="font-headline text-base font-semibold text-on-background mb-1">
          Group Privacy
        </h3>
        <p className="text-sm text-on-surface-variant">
          Control who can see your group&apos;s leaderboard, history, and player stats.
        </p>
      </div>

      <div className="space-y-2">
        {/* Public Link option */}
        <button
          type="button"
          onClick={() => handleChange("public_link")}
          disabled={isPending}
          className={`cursor-pointer w-full flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all duration-200 ${
            mode === "public_link"
              ? "border-primary bg-primary/5"
              : "border-border bg-surface hover:border-on-surface-variant/30"
          } disabled:opacity-70`}
        >
          <div
            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
              mode === "public_link" ? "bg-primary/15" : "bg-surface-container-high"
            }`}
          >
            <Globe
              className={`h-4.5 w-4.5 ${
                mode === "public_link" ? "text-primary" : "text-on-surface-variant"
              }`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p
                className={`text-sm font-semibold ${
                  mode === "public_link" ? "text-primary" : "text-on-background"
                }`}
              >
                Public Link
              </p>
              {mode === "public_link" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  <Check className="h-2.5 w-2.5" />
                  Active
                </span>
              )}
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Anyone with the group link can view leaderboards, match history, and player stats. 
              Only admins can score, manage players, and run sessions.
            </p>
          </div>
        </button>

        {/* Private option */}
        <button
          type="button"
          onClick={() => handleChange("private")}
          disabled={isPending}
          className={`cursor-pointer w-full flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all duration-200 ${
            mode === "private"
              ? "border-primary bg-primary/5"
              : "border-border bg-surface hover:border-on-surface-variant/30"
          } disabled:opacity-70`}
        >
          <div
            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
              mode === "private" ? "bg-primary/15" : "bg-surface-container-high"
            }`}
          >
            <Lock
              className={`h-4.5 w-4.5 ${
                mode === "private" ? "text-primary" : "text-on-surface-variant"
              }`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p
                className={`text-sm font-semibold ${
                  mode === "private" ? "text-primary" : "text-on-background"
                }`}
              >
                Private
              </p>
              {mode === "private" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  <Check className="h-2.5 w-2.5" />
                  Active
                </span>
              )}
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Only signed-in group admins can view the group. Non-members see a 
              &quot;private group&quot; message. Good for groups that want to keep stats internal.
            </p>
          </div>
        </button>
      </div>

      {/* Saving indicator */}
      {isPending && (
        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
          <Loader2 className="h-3 w-3 animate-spin" />
          Saving...
        </div>
      )}
      {saved && (
        <div className="flex items-center gap-2 text-xs text-primary">
          <Check className="h-3 w-3" />
          Privacy updated
        </div>
      )}
    </section>
  );
}
