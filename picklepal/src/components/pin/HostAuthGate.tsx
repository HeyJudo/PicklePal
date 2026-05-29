"use client";

import { useCallback, useState } from "react";
import { useHostAuth } from "@/hooks/useHostAuth";
import { PinModal } from "./PinModal";

interface HostAuthGateProps {
  readonly groupSlug: string;
  readonly children: React.ReactNode;
  /** Fallback UI shown when not authenticated (e.g., a locked button) */
  readonly fallback?: React.ReactNode;
}

/**
 * Wraps content that requires host authentication.
 * Shows children if authenticated, otherwise shows fallback + PIN modal on interaction.
 *
 * Usage:
 * ```tsx
 * <HostAuthGate groupSlug={slug} fallback={<LockedButton />}>
 *   <AdminPanel />
 * </HostAuthGate>
 * ```
 */
export function HostAuthGate({
  groupSlug,
  children,
  fallback,
}: HostAuthGateProps) {
  const { isHost, grantAccess } = useHostAuth(groupSlug);
  const [showModal, setShowModal] = useState(false);

  const handleRequestAccess = useCallback(() => {
    setShowModal(true);
  }, []);

  const handleSuccess = useCallback(() => {
    grantAccess();
    setShowModal(false);
  }, [grantAccess]);

  const handleClose = useCallback(() => {
    setShowModal(false);
  }, []);

  if (isHost) {
    return <>{children}</>;
  }

  return (
    <>
      {fallback ? (
        <div onClick={handleRequestAccess} className="cursor-pointer">
          {fallback}
        </div>
      ) : (
        <button
          type="button"
          onClick={handleRequestAccess}
          className="inline-flex items-center gap-2 rounded-lg bg-court-green px-4 py-2.5 text-sm font-medium text-text-inverse transition-colors hover:bg-court-green-dark"
        >
          <LockIcon className="w-4 h-4" />
          Unlock Host Mode
        </button>
      )}

      <PinModal
        groupSlug={groupSlug}
        isOpen={showModal}
        onSuccess={handleSuccess}
        onClose={handleClose}
      />
    </>
  );
}

function LockIcon({ className }: { readonly className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
