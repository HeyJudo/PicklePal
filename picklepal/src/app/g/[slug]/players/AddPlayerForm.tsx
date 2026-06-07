"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addPlayer } from "./manage-actions";

interface AddPlayerFormProps {
  readonly groupSlug: string;
}

const PRESET_COLORS = [
  "#2D8B4E", // court green
  "#2196F3", // sky blue
  "#F5C518", // ball yellow
  "#FF6B35", // hype orange
  "#E53935", // hype red
  "#9C27B0", // purple
  "#00BCD4", // teal
  "#FF9800", // amber
  "#607D8B", // blue grey
  "#795548", // brown
];

export function AddPlayerForm({ groupSlug }: AddPlayerFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [isOpen, setIsOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [selectedColor, setSelectedColor] = useState<string>(PRESET_COLORS[0]);
  const [error, setError] = useState("");

  const handleOpen = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setDisplayName("");
    setSelectedColor(PRESET_COLORS[0]);
    setError("");
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setError("");

      startTransition(async () => {
        const result = await addPlayer(groupSlug, displayName, selectedColor);

        if (result.success) {
          handleClose();
          router.refresh();
        } else {
          setError(result.error ?? "Failed to add player");
        }
      });
    },
    [groupSlug, displayName, selectedColor, handleClose, router, startTransition],
  );

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-2 rounded-xl bg-court-green px-4 py-2.5 text-sm font-medium text-text-inverse transition-colors hover:bg-court-green-dark cursor-pointer"
      >
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <line x1="19" y1="8" x2="19" y2="14" />
          <line x1="22" y1="11" x2="16" y2="11" />
        </svg>
        Add Player
      </button>

      {/* Add Player Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-player-title"
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-sm mx-4 rounded-2xl bg-surface p-6 shadow-xl border border-border">
            <h2
              id="add-player-title"
              className="text-lg font-semibold text-text-primary"
            >
              Add Player
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              Add a new player to your crew.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-5">
              {/* Name input */}
              <div>
                <label
                  htmlFor="player-name"
                  className="block text-sm font-medium text-text-primary mb-1.5"
                >
                  Name
                </label>
                <input
                  id="player-name"
                  type="text"
                  placeholder="Player name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={30}
                  autoFocus
                  disabled={isPending}
                  className="w-full rounded-lg border border-border bg-surface-muted px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-court-green focus:border-transparent disabled:opacity-50"
                />
              </div>

              {/* Color picker */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      disabled={isPending}
                      className={`h-8 w-8 rounded-full transition-all cursor-pointer ${
                        selectedColor === color
                          ? "ring-2 ring-offset-2 ring-court-green scale-110"
                          : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`Select color ${color}`}
                    />
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && (
                <p className="text-sm text-hype-red text-center" role="alert">
                  {error}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isPending}
                  className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-muted disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || displayName.trim().length === 0}
                  className="flex-1 rounded-lg bg-court-green px-4 py-2.5 text-sm font-medium text-text-inverse transition-colors hover:bg-court-green-dark disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isPending ? "Adding..." : "Add Player"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
