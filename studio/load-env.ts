import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";

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
