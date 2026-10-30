import { defineConfig } from "@playwright/test";

import base from "./playwright.config";

// Provider values are compiled into the browser bundle, so this spec needs its
// own production build with synthetic provider variables: run
// `bun run test:e2e:analytics`.
const port = 3108;
const baseURL = `http://127.0.0.1:${port}`;
const mainServer = Array.isArray(base.webServer)
  ? base.webServer[0]
  : base.webServer;

export default defineConfig({
  ...base,
  testMatch: "**/analytics.spec.ts",
  projects: base.projects
    ?.filter((project) => project.name === "desktop")
    .map(({ testIgnore: _ignored, ...project }) => project),
  webServer: {
    ...mainServer,
    command: `bun build e2e/mock-sanity.ts e2e/mock-resdiary.ts --target=node --outdir=.next/e2e --entry-naming='[name].mjs' && node --import ./.next/e2e/mock-sanity.mjs --import ./.next/e2e/mock-resdiary.mjs node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port ${port}`,
    url: baseURL,
  },
  use: {
    ...base.use,
    baseURL,
    // posthog-js drops events from "Headless" user agents and webdriver
    // browsers (the harness also masks navigator.webdriver); present an
    // ordinary Chrome string so real SDK delivery is exercised.
    userAgent:
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  },
});
