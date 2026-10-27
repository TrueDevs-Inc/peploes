import { randomBytes } from "node:crypto";
import { defineConfig } from "@playwright/test";

process.loadEnvFile(".env.local");
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
      ["SANITY_PROJECT_ID", "testproject"],
      ["SANITY_DATASET", "development"],
      ["SANITY_API_VERSION", "2026-10-06"],
      ["BOOKING_HOLD_SECRET", randomBytes(32).toString("hex")],
      ["VERCEL_ENV", "preview"],
    ]),
    url: baseURL,
    reuseExistingServer: false,
  },
});
