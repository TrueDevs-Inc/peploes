import { defineConfig } from "@playwright/test";

const baseURL = "http://127.0.0.1:3107";

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
    { name: "desktop", use: { viewport: { width: 1440, height: 900 } } },
    {
      name: "phone",
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "small-phone",
      use: {
        viewport: { width: 320, height: 740 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command:
      "bun build e2e/mock-sanity.ts --target=node --outfile=.next/e2e/mock-sanity.mjs && node --import ./.next/e2e/mock-sanity.mjs node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3107",
    env: Object.fromEntries([
      ["SANITY_PROJECT_ID", "testproject"],
      ["SANITY_DATASET", "development"],
      ["SANITY_API_VERSION", "2026-10-06"],
    ]),
    url: baseURL,
    reuseExistingServer: false,
  },
});
