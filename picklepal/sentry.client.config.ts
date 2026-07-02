import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

// No-op when DSN is not configured — keeps the build clean in dev/CI
if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    // Replay is disabled by default — enable only when explicitly needed
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
  });
}
