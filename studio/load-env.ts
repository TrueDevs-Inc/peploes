import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";
import { getStudioEnvironmentVariables } from "sanity/cli";

const command = process.argv[2];
const mode =
  process.env.SANITY_ACTIVE_ENV ||
  (process.env.NODE_ENV === "production" ||
  command === "build" ||
  command === "deploy"
    ? "production"
    : "development");

Object.assign(
  process.env,
  getStudioEnvironmentVariables({
    envFile: { envDir: fileURLToPath(new URL(".", import.meta.url)), mode },
  }),
);

const websiteEnvPath = fileURLToPath(new URL("../.env", import.meta.url));
if (existsSync(websiteEnvPath)) {
  loadEnvFile(websiteEnvPath);
}

// Sanity only bundles SANITY_STUDIO_* values; keep the mapping in CLI startup.
if (process.env.SANITY_PROJECT_ID) {
  process.env.SANITY_STUDIO_PROJECT_ID ||= process.env.SANITY_PROJECT_ID;
}
if (process.env.SANITY_DATASET) {
  process.env.SANITY_STUDIO_DATASET ||= process.env.SANITY_DATASET;
}
