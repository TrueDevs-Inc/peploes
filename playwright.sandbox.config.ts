import { randomBytes } from "node:crypto";
import { defineConfig } from "@playwright/test";

import { E2E_ENVIRONMENT } from "./e2e/environment";

process.loadEnvFile(".env");
if (
  new URL(process.env.RESDIARY_API_URL ?? "").hostname !== "api.rdbranch.com"
) {
  throw new Error(
    "The sandbox browser test runs only against ResDiary's sandbox.",
  );
}

const baseURL = "http://127.0.0.1:3109";

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./sandbox-test-results",
  testMatch: /booking-sandbox\.spec\.ts/,
  forbidOnly: true,
  workers: 1,
  use: {
    baseURL,
    browserName: "chromium",
    trace: "retain-on-failure",
    viewport: { width: 1440, height: 900 },
  },
  webServer: {
    command:
      "bun build e2e/mock-sanity.ts --target=node --outfile=.next/e2e/mock-sanity.mjs && node --import ./.next/e2e/mock-sanity.mjs node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3109",
    env: Object.fromEntries([
      ...Object.entries(E2E_ENVIRONMENT),
      ["BOOKING_HOLD_SECRET", randomBytes(32).toString("hex")],
      ["BOOKING_ALLOW_HOLD_CANCELLATION", "true"],
    ]),
    url: baseURL,
    reuseExistingServer: false,
  },
});
