import {
  breadcrumbsIntegration,
  captureException,
  init,
  withScope,
} from "@sentry/nextjs";

export const clientSentry =
  process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_SENTRY_DSN
    ? { init, breadcrumbsIntegration, captureException, withScope }
    : undefined;
