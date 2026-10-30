import * as Sentry from "@sentry/nextjs";

import { scrubBreadcrumb, scrubEvent, scrubSpan } from "./src/lib/sentry-scrub";

const isProd = process.env.NODE_ENV === "production";
const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || "";

try {
  Sentry.init({
    dsn,
    enabled: Boolean(dsn) && process.env.VERCEL_ENV === "production",
    environment: process.env.VERCEL_ENV || "development",
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
