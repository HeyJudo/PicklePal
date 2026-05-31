"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useHostAuth } from "@/hooks/useHostAuth";
import { PinModal } from "@/components/pin";
import { PlayerAvatar } from "@/components/players";
import { updatePlayer, uploadPlayerAvatar } from "../manage-actions";
import type { Player } from "@/lib/supabase";

interface EditPlayerFormProps {
  readonly player: Player;
  readonly groupSlug: string;
}

const PRESET_COLORS = [
  "#2D8B4E", "#2196F3", "#F5C518", "#FF6B35", "#E53935",
  "#9C27B0", "#00BCD4", "#FF9800", "#607D8B", "#795548",
];

export function EditPlayerForm({ player, groupSlug }: EditPlayerFormProps) {
  const router = useRouter();
  const { isHost, grantAccess } = useHostAuth(groupSlug);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [displayName, setDisplayName] = useState(player.display_name);
  const [selectedColor, setSelectedColor] = useState<string>(player.color ?? "#64748B");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(player.avatar_url);
  const [pendingFile, setPendingFile] = useState<{ base64: string; type: string } | null>(null);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleOpen = useCallback(() => {
    if (!isHost) {
      setShowPinModal(true);
      return;
    }
    setIsOpen(true);
  }, [isHost]);

  const handlePinSuccess = useCallback(() => {
    grantAccess();
    setShowPinModal(false);
    setIsOpen(true);
  }, [grantAccess]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setDisplayName(player.display_name);
    setSelectedColor(player.color ?? "#64748B");
    setAvatarPreview(player.avatar_url);
    setPendingFile(null);
    setError("");
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [player]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Only JPEG, PNG, and WebP images are allowed");
      return;
    }

    // Validate size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be under 2MB");
      return;
    }

    setError("");

    // Read as base64 for preview and upload
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // result is "data:image/png;base64,..." — extract the base64 part
      const base64 = result.split(",")[1];
      setAvatarPreview(result);
      setPendingFile({ base64, type: file.type });
    };
    reader.readAsDataURL(file);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setError("");

      startTransition(async () => {
        try {
          // Upload avatar first if there's a pending file
          let newAvatarUrl: string | undefined;
          if (pendingFile) {
            setIsUploading(true);
            const uploadResult = await uploadPlayerAvatar(
              groupSlug,
              player.id,
              pendingFile.base64,
              pendingFile.type,
            );
            setIsUploading(false);

            if (!uploadResult.success) {
              setError(uploadResult.error ?? "Failed to upload photo");
              return;
            }
            newAvatarUrl = uploadResult.avatarUrl;
          }

          // Build updates object (only include changed fields)
          const updates: {
            displayName?: string;
            color?: string | null;
            avatarUrl?: string | null;
          } = {};

          if (displayName.trim() !== player.display_name) {
            updates.displayName = displayName.trim();
          }
          if (selectedColor !== (player.color ?? "#64748B")) {
            updates.color = selectedColor;
          }
          if (newAvatarUrl !== undefined) {
            updates.avatarUrl = newAvatarUrl;
          }

          // Only call update if something changed
          if (Object.keys(updates).length > 0) {
            const result = await updatePlayer(groupSlug, player.id, updates);
            if (!result.success) {
              setError(result.error ?? "Failed to update player");
              return;
            }
          }

          setIsOpen(false);
          setPendingFile(null);
          router.refresh();
        } catch (err) {
          console.error("Edit player error:", err);
          setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
          setIsUploading(false);
        }
      });
    },
    [groupSlug, player, displayName, selectedColor, pendingFile, router, startTransition],
  );

  const isDisabled = isPending || isUploading;

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-muted cursor-pointer"
      >
        <svg
          className="h-3.5 w-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
        Edit
      </button>

      {/* PIN Modal */}
      <PinModal
        groupSlug={groupSlug}
        isOpen={showPinModal}
        onSuccess={handlePinSuccess}
        onClose={() => setShowPinModal(false)}
      />

      {/* Edit Player Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-player-title"
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-sm mx-4 rounded-2xl bg-surface p-6 shadow-xl border border-border max-h-[90vh] overflow-y-auto">
            <h2
              id="edit-player-title"
              className="text-lg font-semibold text-text-primary"
            >
              Edit Player
            </h2>

            <form onSubmit={handleSubmit} className="mt-5 space-y-5">
              {/* Avatar upload */}
              <div className="flex flex-col items-center gap-3">
                <PlayerAvatar
                  displayName={displayName || player.display_name}
                  color={selectedColor}
                  avatarUrl={avatarPreview}
                  size="xl"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isDisabled}
                  className="text-sm font-medium text-court-green hover:text-court-green-dark transition-colors cursor-pointer disabled:opacity-50"
                >
                  {avatarPreview ? "Change Photo" : "Upload Photo"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                  aria-label="Upload player photo"
                />
                <p className="text-xs text-text-muted">
                  JPEG, PNG, or WebP. Max 2MB.
                </p>
              </div>

              {/* Name input */}
              <div>
                <label
                  htmlFor="edit-player-name"
                  className="block text-sm font-medium text-text-primary mb-1.5"
                >
                  Name
                </label>
                <input
                  id="edit-player-name"
                  type="text"
                  placeholder="Player name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={30}
                  disabled={isDisabled}
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
                      disabled={isDisabled}
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
                  disabled={isDisabled}
                  className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-muted disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDisabled || displayName.trim().length === 0}
                  className="flex-1 rounded-lg bg-court-green px-4 py-2.5 text-sm font-medium text-text-inverse transition-colors hover:bg-court-green-dark disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isUploading ? "Uploading..." : isPending ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
