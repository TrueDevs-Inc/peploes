import { defineConfig } from "@playwright/test";

import { FAKE_RESDIARY } from "./e2e/booking-fixtures";

const baseURL = "http://127.0.0.1:3107";
const resDiaryDownURL = "http://127.0.0.1:3108";
const unavailableSpec = /booking-unavailable\.spec\.ts/;
const sandboxSpec = /booking-sandbox\.spec\.ts/;

const preloads =
  "bun build e2e/mock-sanity.ts e2e/mock-resdiary.ts --target=node --outdir=.next/e2e --entry-naming='[name].mjs'";
const startServer = (port: number) =>
  `node --import ./.next/e2e/mock-sanity.mjs --import ./.next/e2e/mock-resdiary.mjs node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port ${port}`;

function serverEnv(resDiaryUrl: string): Record<string, string> {
  return Object.fromEntries([
    ["SANITY_PROJECT_ID", "testproject"],
    ["SANITY_DATASET", "development"],
    ["SANITY_API_VERSION", "2026-10-06"],
    ["RESDIARY_API_URL", resDiaryUrl],
    ["RESDIARY_MICROSITE_NAME", FAKE_RESDIARY.micrositeName],
    ["RESDIARY_CHANNEL_CODE", "ONLINE"],
    ["RESDIARY_USERNAME", "e2e-user"],
    ["RESDIARY_PASSWORD", "e2e-password"],
    ["BOOKING_HOLD_SECRET", "e2e-only-hold-secret-0123456789abcdef"],
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
      testIgnore: [unavailableSpec, sandboxSpec],
      use: { viewport: { width: 1440, height: 900 } },
    },
    {
      name: "phone",
      testIgnore: [
        unavailableSpec,
        sandboxSpec,
        "**/desktop-navigation.spec.ts",
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
        "**/desktop-navigation.spec.ts",
      ],
      use: {
        viewport: { width: 320, height: 740 },
        isMobile: true,
        hasTouch: true,
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
