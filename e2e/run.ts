import { spawnSync } from "node:child_process";

import { E2E_ENVIRONMENT, REPORTING_ENVIRONMENT } from "./environment";

const suite = process.argv[2];
const config = new Map([
  ["default", "playwright.config.ts"],
  ["reporting", "playwright.reporting.config.ts"],
  ["sandbox", "playwright.sandbox.config.ts"],
]).get(suite);

if (!config) throw new Error("Choose default, reporting or sandbox E2E tests.");

const env = {
  ...process.env,
  ...(suite === "reporting" ? REPORTING_ENVIRONMENT : E2E_ENVIRONMENT),
};

for (const args of [
  ["run", "build:e2e"],
  ["x", "playwright", "test", "--config", config, ...process.argv.slice(3)],
]) {
  const result = spawnSync(process.execPath, args, { env, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
