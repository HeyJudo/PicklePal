import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
};

// Wrap with Sentry only when a DSN is configured.  When no DSN is set the
// build is identical to a plain Next.js build — no source-map upload, no
// Sentry tunnelling route, no performance overhead.
const sentryDsn =
  process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN ?? "";

let exportedConfig: NextConfig = nextConfig;

if (sentryDsn) {
  // Dynamic require so the import doesn't throw when the package is not
  // installed yet (e.g., fresh clone before pnpm install).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { withSentryConfig } = require("@sentry/nextjs");
  exportedConfig = withSentryConfig(nextConfig, {
    silent: true,
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    widenClientFileUpload: true,
    hideSourceMaps: true,
    disableLogger: true,
  });
}

export default exportedConfig;
