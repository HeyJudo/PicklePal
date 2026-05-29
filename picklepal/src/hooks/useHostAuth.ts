"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

const STORAGE_KEY_PREFIX = "picklepal_host_auth_";
const SESSION_DURATION_MS = 4 * 60 * 60 * 1000; // 4 hours

interface HostAuthSession {
  readonly authenticated: boolean;
  readonly expiresAt: number;
}

function getStorageKey(groupSlug: string): string {
  return `${STORAGE_KEY_PREFIX}${groupSlug}`;
}

function getSession(groupSlug: string): HostAuthSession | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(getStorageKey(groupSlug));
    if (!raw) return null;

    const session: HostAuthSession = JSON.parse(raw);

    // Check expiry
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(getStorageKey(groupSlug));
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

function setSession(groupSlug: string): void {
  const session: HostAuthSession = {
    authenticated: true,
    expiresAt: Date.now() + SESSION_DURATION_MS,
  };
  localStorage.setItem(getStorageKey(groupSlug), JSON.stringify(session));
  // Dispatch storage event for cross-tab sync
  window.dispatchEvent(new Event("host-auth-change"));
}

function clearSession(groupSlug: string): void {
  localStorage.removeItem(getStorageKey(groupSlug));
  window.dispatchEvent(new Event("host-auth-change"));
}

/**
 * Hook to manage host authentication state for a group.
 * Uses localStorage with a 4-hour expiry.
 *
 * Returns:
 * - isHost: whether the current session is authenticated as host
 * - grantAccess: call after successful PIN verification
 * - revokeAccess: call to log out of host mode
 */
export function useHostAuth(groupSlug: string) {
  const subscribe = useCallback(
    (callback: () => void) => {
      const handleChange = () => callback();
      window.addEventListener("storage", handleChange);
      window.addEventListener("host-auth-change", handleChange);
      return () => {
        window.removeEventListener("storage", handleChange);
        window.removeEventListener("host-auth-change", handleChange);
      };
    },
    [],
  );

  const getSnapshot = useCallback(() => {
    const session = getSession(groupSlug);
    return session?.authenticated ?? false;
  }, [groupSlug]);

  const getServerSnapshot = useCallback(() => false, []);

  const isHost = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const grantAccess = useCallback(() => {
    setSession(groupSlug);
  }, [groupSlug]);

  const revokeAccess = useCallback(() => {
    clearSession(groupSlug);
  }, [groupSlug]);

  return useMemo(
    () => ({ isHost, grantAccess, revokeAccess }),
    [isHost, grantAccess, revokeAccess],
  );
}
