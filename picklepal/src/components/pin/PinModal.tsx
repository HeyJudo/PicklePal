"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { verifyHostPin } from "@/app/g/[slug]/actions";

interface PinModalProps {
  readonly groupSlug: string;
  readonly isOpen: boolean;
  readonly onSuccess: () => void;
  readonly onClose: () => void;
}

export function PinModal({
  groupSlug,
  isOpen,
  onSuccess,
  onClose,
}: PinModalProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setPin("");
      setError("");
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setIsVerifying(true);

      try {
        const result = await verifyHostPin(groupSlug, pin);

        if (result.success) {
          onSuccess();
        } else {
          setError(result.error ?? "Verification failed");
          setPin("");
          inputRef.current?.focus();
        }
      } catch {
        setError("Something went wrong. Try again.");
      } finally {
        setIsVerifying(false);
      }
    },
    [groupSlug, pin, onSuccess],
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pin-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm mx-4 rounded-2xl bg-surface p-6 shadow-xl border border-border">
        <h2
          id="pin-modal-title"
          className="text-lg font-semibold text-text-primary text-center"
        >
          Host PIN Required
        </h2>
        <p className="text-sm text-text-secondary text-center mt-1">
          Enter the host PIN to make changes.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="pin-input" className="sr-only">
              Host PIN
            </label>
            <input
              ref={inputRef}
              id="pin-input"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              placeholder="Enter PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              disabled={isVerifying}
              className="w-full rounded-lg border border-border bg-surface-muted px-4 py-3 text-center text-lg font-mono tracking-widest text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-court-green focus:border-transparent disabled:opacity-50"
            />
          </div>

          {error && (
            <p className="text-sm text-hype-red text-center" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isVerifying}
              className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-muted disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isVerifying || pin.length === 0}
              className="flex-1 rounded-lg bg-court-green px-4 py-2.5 text-sm font-medium text-text-inverse transition-colors hover:bg-court-green-dark disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? "Verifying..." : "Confirm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
