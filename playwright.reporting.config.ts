import { defineConfig } from "@playwright/test";

import { REPORTING_ENVIRONMENT } from "./e2e/environment";
import base, { newsletterDismissedState } from "./playwright.config";

const port = 3108;
const baseURL = `http://127.0.0.1:${port}`;
const mainServer = Array.isArray(base.webServer)
  ? base.webServer[0]
  : base.webServer;

export default defineConfig({
  ...base,
  testMatch: [
    "**/analytics.spec.ts",
    "**/booking-analytics.spec.ts",
    "**/sentry.spec.ts",
    "**/seo.spec.ts",
  ],
  projects: base.projects
    ?.filter((project) => project.name === "desktop")
    .map(({ testIgnore: _ignored, ...project }) => project),
  webServer: {
    ...mainServer,
    env: { ...mainServer?.env, ...REPORTING_ENVIRONMENT },
    command: `bun build e2e/mock-sanity.ts e2e/mock-resdiary.ts --target=node --outdir=.next/e2e --entry-naming='[name].mjs' && node --import ./.next/e2e/mock-sanity.mjs --import ./.next/e2e/mock-resdiary.mjs node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port ${port}`,
    url: baseURL,
  },
  use: {
    ...base.use,
    baseURL,
    storageState: newsletterDismissedState(baseURL),
    userAgent:
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  },
});
