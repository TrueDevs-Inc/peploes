import { defineConfig } from "@playwright/test";
import { E2E_SANITY_WEBHOOK_SECRET } from "./e2e/sanity-webhook";
import { NEWSLETTER_POPUP } from "./src/lib/constants/newsletter-popup";

const baseURL = "http://127.0.0.1:3107";
const emailTestIgnore =
  process.env.EMAIL_E2E_BUILD === "1"
    ? []
    : [
        "**/enquiry-delivery.spec.ts",
        "**/newsletter-delivery.spec.ts",
        "**/newsletter-popup-delivery.spec.ts",
      ];

export function newsletterDismissedState(origin: string) {
  return {
    cookies: [],
    origins: [
      {
        origin,
        localStorage: [{ name: NEWSLETTER_POPUP.dismissedKey, value: "true" }],
      },
    ],
  };
}

export default defineConfig({
  testDir: "./e2e",
  forbidOnly: true,
  workers: 1,
  use: {
    baseURL,
    storageState: newsletterDismissedState(baseURL),
    browserName: "chromium",
    launchOptions: { args: ["--font-render-hinting=none"] },
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop",
      // Needs its own build; see playwright.analytics.config.ts.
      testIgnore: ["**/analytics.spec.ts", ...emailTestIgnore],
      use: { viewport: { width: 1440, height: 900 } },
    },
    {
      name: "phone",
      testIgnore: [
        "**/desktop-navigation.spec.ts",
        "**/analytics.spec.ts",
        ...emailTestIgnore,
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
        "**/desktop-navigation.spec.ts",
        "**/analytics.spec.ts",
        ...emailTestIgnore,
      ],
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
      ["KLAVIYO_PRIVATE_KEY", ""],
      ["KLAVIYO_LIST_ID_NEWSLETTER", ""],
      ["NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN", "pk.e2e-only"],
      ["SANITY_PROJECT_ID", "testproject"],
      ["SANITY_DATASET", "development"],
      ["SANITY_API_VERSION", "2026-10-06"],
      ["SANITY_WEBHOOK_SECRET", E2E_SANITY_WEBHOOK_SECRET],
    ]),
    url: baseURL,
    reuseExistingServer: false,
  },
});
