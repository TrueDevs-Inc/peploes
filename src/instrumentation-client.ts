import * as Sentry from "@sentry/nextjs";

import { scrubBreadcrumb, scrubEvent, scrubSpan } from "./lib/sentry-scrub";

const isProd = process.env.NODE_ENV === "production";
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || "";

try {
  Sentry.init({
    dsn,
    enabled:
      Boolean(dsn) &&
      process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT === "production",
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || "development",
    sendDefaultPii: false,
    tracesSampleRate: isProd ? 0.15 : 1.0,
    profilesSampleRate: 0,
    debug: false,
    integrations: [
      Sentry.breadcrumbsIntegration({ console: false, dom: false }),
    ],
    beforeBreadcrumb: scrubBreadcrumb,
    beforeSendSpan: scrubSpan,
    beforeSend: scrubEvent,
    beforeSendTransaction: scrubEvent,
  });
} catch (error) {
  console.error("Failed to initialize Sentry (client)", error);
}
