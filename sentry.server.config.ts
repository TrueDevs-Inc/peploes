import * as Sentry from "@sentry/nextjs";

import { scrubBreadcrumb, scrubEvent, scrubSpan } from "./src/lib/sentry-scrub";

const isProd = process.env.NODE_ENV === "production";
const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || "";

try {
  Sentry.init({
    dsn,
    enabled: isProd && Boolean(dsn),
    environment:
      process.env.SENTRY_ENVIRONMENT || process.env.VERCEL_ENV || "development",
    release:
      process.env.SENTRY_RELEASE ||
      process.env.VERCEL_GIT_COMMIT_SHA ||
      undefined,
    sendDefaultPii: false,
    includeLocalVariables: false,
    tracesSampleRate: isProd ? 0.15 : 1.0,
    profilesSampleRate: 0,
    debug: false,
    beforeBreadcrumb: scrubBreadcrumb,
    beforeSendSpan: scrubSpan,
    beforeSend: scrubEvent,
    beforeSendTransaction: scrubEvent,
  });
} catch (e) {
  console.error("Sentry server init failed:", e);
}
