import { defineConfig } from "@playwright/test";

import { FAKE_RESDIARY } from "./e2e/booking-fixtures";
import { E2E_ENVIRONMENT } from "./e2e/environment";

const baseURL = "http://127.0.0.1:3107";
const resDiaryDownURL = "http://127.0.0.1:3108";
const unavailableSpec = /booking-unavailable\.spec\.ts/;
const sandboxSpec = /booking-sandbox\.spec\.ts/;
const cancellationDisabledSpec = /booking-cancellation-disabled\.spec\.ts/;
const cancellationDisabledURL = "http://127.0.0.1:3110";

const preloads =
  "bun build e2e/mock-sanity.ts e2e/mock-resdiary.ts --target=node --outdir=.next/e2e --entry-naming='[name].mjs'";
const startServer = (port: number) =>
  `node --import ./.next/e2e/mock-sanity.mjs --import ./.next/e2e/mock-resdiary.mjs node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port ${port}`;

function serverEnv(
  resDiaryUrl: string,
  allowHoldCancellation = true,
): Record<string, string> {
  return Object.fromEntries([
    ...Object.entries(E2E_ENVIRONMENT),
    ["RESDIARY_API_URL", resDiaryUrl],
    ["RESDIARY_MICROSITE_NAME", FAKE_RESDIARY.micrositeName],
    ["RESDIARY_CHANNEL_CODE", "ONLINE"],
    ["RESDIARY_USERNAME", "e2e-user"],
    ["RESDIARY_PASSWORD", "e2e-password"],
    ["BOOKING_HOLD_SECRET", "e2e-only-hold-secret-0123456789abcdef"],
    ["BOOKING_ALLOW_HOLD_CANCELLATION", String(allowHoldCancellation)],
  ]);
}

export default defineConfig({
  testDir: "./e2e",
  forbidOnly: true,
  workers: 1,
  use: {
    baseURL,
    browserName: "chromium",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop",
      testIgnore: [
        unavailableSpec,
        sandboxSpec,
        cancellationDisabledSpec,
        "**/analytics.spec.ts",
        "**/booking-analytics.spec.ts",
        "**/sentry.spec.ts",
        "**/seo.spec.ts",
      ],
      use: { viewport: { width: 1440, height: 900 } },
    },
    {
      name: "phone",
      testIgnore: [
        unavailableSpec,
        sandboxSpec,
        cancellationDisabledSpec,
        "**/desktop-navigation.spec.ts",
        "**/analytics.spec.ts",
        "**/booking-analytics.spec.ts",
        "**/sentry.spec.ts",
        "**/seo.spec.ts",
      ],
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "small-phone",
      testIgnore: [
        unavailableSpec,
        sandboxSpec,
        cancellationDisabledSpec,
        "**/desktop-navigation.spec.ts",
        "**/analytics.spec.ts",
        "**/booking-analytics.spec.ts",
        "**/sentry.spec.ts",
        "**/seo.spec.ts",
      ],
      use: {
        viewport: { width: 320, height: 740 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "hold-cancellation-disabled",
      testMatch: cancellationDisabledSpec,
      use: {
        baseURL: cancellationDisabledURL,
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: "resdiary-down",
      testMatch: unavailableSpec,
      use: {
        baseURL: resDiaryDownURL,
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
  webServer: [
    {
      command: `${preloads} && ${startServer(3110)}`,
      env: serverEnv(FAKE_RESDIARY.url, false),
      url: cancellationDisabledURL,
      reuseExistingServer: false,
    },
    {
      command: `${preloads} && ${startServer(3107)}`,
      env: serverEnv(FAKE_RESDIARY.url),
      url: baseURL,
      reuseExistingServer: false,
    },
    {
      command: startServer(3108),
      env: serverEnv(FAKE_RESDIARY.downUrl),
      url: resDiaryDownURL,
      reuseExistingServer: false,
    },
  ],
});
