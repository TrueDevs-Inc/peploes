export const E2E_ENVIRONMENT = Object.fromEntries([
  ["NODE_ENV", "production"],
  ["SENTRY_DSN", ""],
  ["NEXT_PUBLIC_SENTRY_DSN", ""],
  ["SENTRY_AUTH_TOKEN", ""],
  ["GA_API_SECRET", ""],
  ["NEXT_PUBLIC_GA_MEASUREMENT_ID", ""],
  ["NEXT_PUBLIC_POSTHOG_KEY", ""],
  ["NEXT_PUBLIC_POSTHOG_HOST", ""],
  ["NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN", "pk.e2e-only"],
  ["SANITY_PROJECT_ID", "testproject"],
  ["SANITY_DATASET", "development"],
  ["SANITY_API_VERSION", "2026-10-06"],
]);

export const REPORTING_ENVIRONMENT = Object.fromEntries([
  ...Object.entries(E2E_ENVIRONMENT),
  ["SENTRY_ENVIRONMENT", "e2e"],
  ["SENTRY_RELEASE", "peploes-e2e"],
  ["SENTRY_DSN", "https://public@sentry.e2e.test/1"],
  ["NEXT_PUBLIC_SENTRY_DSN", "https://public@sentry.e2e.test/1"],
  ["NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-TEST000000"],
  ["NEXT_PUBLIC_POSTHOG_KEY", "phc_test_synthetic"],
  ["NEXT_PUBLIC_POSTHOG_HOST", "https://eu.i.posthog.com"],
]);
