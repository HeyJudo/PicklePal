"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Check, Loader2, AlertTriangle } from "lucide-react";
import { updateGroupName, updateGroupSlug } from "./settings-actions";

interface GroupInfoSettingsProps {
  readonly slug: string;
  readonly name: string;
}

export function GroupInfoSettings({ slug, name }: GroupInfoSettingsProps) {
  const router = useRouter();

  // Name editing
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(name);
  const [nameError, setNameError] = useState("");
  const [nameSaved, setNameSaved] = useState(false);
  const [isNamePending, startNameTransition] = useTransition();

  // Slug editing
  const [editingSlug, setEditingSlug] = useState(false);
  const [slugValue, setSlugValue] = useState(slug);
  const [slugError, setSlugError] = useState("");
  const [showSlugWarning, setShowSlugWarning] = useState(false);
  const [isSlugPending, startSlugTransition] = useTransition();

  const handleSaveName = () => {
    setNameError("");
    setNameSaved(false);

    startNameTransition(async () => {
      const result = await updateGroupName(slug, nameValue);
      if (result.success) {
        setNameSaved(true);
        setEditingName(false);
        setTimeout(() => setNameSaved(false), 2000);
      } else {
        setNameError(result.error ?? "Failed to update name");
      }
    });
  };

  const handleSaveSlug = () => {
    if (!showSlugWarning) {
      setShowSlugWarning(true);
      return;
    }

    setSlugError("");
    startSlugTransition(async () => {
      const result = await updateGroupSlug(slug, slugValue);
      if (result.success && result.newSlug) {
        setShowSlugWarning(false);
        setEditingSlug(false);
        router.replace(`/g/${result.newSlug}/settings`);
      } else {
        setSlugError(result.error ?? "Failed to update URL");
      }
    });
  };

  const handleCancelSlug = () => {
    setSlugValue(slug);
    setSlugError("");
    setShowSlugWarning(false);
    setEditingSlug(false);
  };

  return (
    <section className="space-y-4">
      <div>
        <h3 className="font-headline text-base font-semibold text-on-background mb-1">
          Group Info
        </h3>
        <p className="text-sm text-on-surface-variant">
          Update your group&apos;s name and URL. Only the owner can change these.
        </p>
      </div>

      {/* Group Name */}
      <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-on-background">
            Group Name
          </label>
          {!editingName && (
            <button
              type="button"
              onClick={() => setEditingName(true)}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer"
            >
              <Pencil className="h-3 w-3" />
              Edit
            </button>
          )}
        </div>

        {editingName ? (
          <div className="space-y-2">
            <input
              type="text"
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              maxLength={50}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-on-background placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="Group name"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveName}
                disabled={isNamePending || nameValue.trim().length < 2}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isNamePending ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingName(false);
                  setNameValue(name);
                  setNameError("");
                }}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
            {nameError && (
              <p className="text-xs text-red-500">{nameError}</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-on-background">{nameValue}</p>
        )}

        {nameSaved && (
          <div className="flex items-center gap-1 text-xs text-primary">
            <Check className="h-3 w-3" />
            Name updated
          </div>
        )}
      </div>

      {/* Group Slug / URL */}
      <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-on-background">
            Group URL
          </label>
          {!editingSlug && (
            <button
              type="button"
              onClick={() => setEditingSlug(true)}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer"
            >
              <Pencil className="h-3 w-3" />
              Edit
            </button>
          )}
        </div>

        {editingSlug ? (
          <div className="space-y-2">
            <div className="flex items-center gap-1 rounded-lg border border-border bg-background overflow-hidden">
              <span className="shrink-0 pl-3 text-xs text-on-surface-variant">
                /g/
              </span>
              <input
                type="text"
                value={slugValue}
                onChange={(e) => {
                  setSlugValue(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                  setShowSlugWarning(false);
                  setSlugError("");
                }}
                maxLength={40}
                className="flex-1 border-none bg-transparent px-1 py-2 text-sm text-on-background placeholder:text-on-surface-variant/50 focus:outline-none"
                placeholder="group-url"
              />
            </div>

            {showSlugWarning && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-amber-800">
                    Changing the URL will break existing links
                  </p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Anyone with the old link will get a 404. Click Save again to confirm.
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveSlug}
                disabled={isSlugPending || slugValue.trim().length < 3 || slugValue === slug}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSlugPending ? (
                  <span className="flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Saving...
                  </span>
                ) : showSlugWarning ? (
                  "Confirm Change"
                ) : (
                  "Save"
                )}
              </button>
              <button
                type="button"
                onClick={handleCancelSlug}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
            {slugError && (
              <p className="text-xs text-red-500">{slugError}</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-on-surface-variant font-mono">
            /g/{slugValue}
          </p>
        )}
      </div>
    </section>
  );
}
