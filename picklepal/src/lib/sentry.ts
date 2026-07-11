/**
 * Lightweight Sentry helper — complete no-op when SENTRY_DSN / NEXT_PUBLIC_SENTRY_DSN is unset.
 * Import `captureException` from here (not directly from @sentry/nextjs) so callers get the
 * no-op behaviour automatically in dev/CI.
 */

const DSN =
  process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN ?? "";

export function isSentryEnabled(): boolean {
  return DSN.length > 0;
}

/**
 * Capture an exception via Sentry.  Safe to call even when Sentry is not configured.
 */
export async function captureException(
  error: unknown,
  context?: Record<string, unknown>,
): Promise<void> {
  if (!isSentryEnabled()) return;
  try {
    const Sentry = await import("@sentry/nextjs");
    if (context) {
      Sentry.withScope((scope) => {
        scope.setExtras(context);
        Sentry.captureException(error);
      });
    } else {
      Sentry.captureException(error);
    }
  } catch {
    // Never throw from error-reporting code
  }
}
