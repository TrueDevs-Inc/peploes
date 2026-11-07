import { copyFile, mkdir, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { chromium } from "@playwright/test";
import {
  screenEmulationMetrics,
  userAgents,
} from "lighthouse/core/config/constants.js";
import { root, sha256, writeJson } from "./identity";
import { PerformanceError, type TManifest, type TRoute } from "./manifest";
import { runCommand } from "./process";
import { redactArtifacts } from "./redact";
import {
  profiles,
  type TProfile,
  validatePopulation,
  validateReport,
} from "./validate";

const require = createRequire(import.meta.url);
const lhci = require.resolve("@lhci/cli/src/cli.js");
const lighthouse = join(
  dirname(require.resolve("lighthouse/package.json")),
  "cli/index.js",
);

export interface ICollection {
  readonly origin: string;
  readonly evidence: string;
  readonly manifest: TManifest;
  readonly node: string;
  readonly signal: AbortSignal;
}

async function warm(url: string, screenshot: string, profile: TProfile) {
  const browser = await chromium.launch();
  try {
    const screen = screenEmulationMetrics[profile];
    if (!screen)
      throw new PerformanceError(
        `Lighthouse screen preset unavailable: ${profile}`,
      );
    const page = await browser.newPage({
      viewport: { width: screen.width, height: screen.height },
      deviceScaleFactor: screen.deviceScaleFactor,
      isMobile: screen.mobile,
      userAgent: userAgents[profile],
    });
    const response = await page.goto(url, {
      waitUntil: "load",
      timeout: 60000,
    });
    if (response?.status() !== 200 || page.url() !== url)
      throw new PerformanceError(`Readiness HTTP/redirect failed: ${url}`);
    await page.screenshot({ path: screenshot });
  } finally {
    await browser.close();
  }
}

async function measure(
  route: TRoute,
  settings: ICollection & {
    readonly profile: TProfile;
    readonly runDir: string;
  },
) {
  const { node, profile, signal, runDir, origin } = settings;
  const base = join(runDir, "report");
  const args = [
    node,
    lighthouse,
    new URL(route.path, origin).href,
    "--chrome-flags=--headless=new",
    `--config-path=${join(root, profile === "desktop" ? "performance/lighthouse.desktop.config.mjs" : "performance/lighthouse.config.mjs")}`,
    "--only-categories=performance,readiness",
    "--throttling-method=simulate",
    "--output=json",
    "--output=html",
    `--output-path=${base}`,
    "--save-assets",
  ];
  const env: NodeJS.ProcessEnv = { ...process.env };
  env.PATH = `${dirname(node)}:${process.env.PATH}`;
  env.CHROME_PATH = chromium.executablePath();
  const code = await runCommand(args, {
    cwd: root,
    log: join(runDir, "collector.txt"),
    env,
    signal,
    timeoutMs: 180000,
  }).finally(() => redactArtifacts(runDir));
  if (code !== 0)
    throw new PerformanceError(
      `Collector failed (${code}): ${profile} ${route.path}. Retain the whole failed attempt.`,
    );
  const reportPath = `${base}.report.json`;
  const report = JSON.parse(await readFile(reportPath, "utf8"));
  validateReport(report, route, { origin, profile });
  return { reportPath, report };
}

async function collectProfile(settings: ICollection, profile: TProfile) {
  const { manifest, origin, evidence, node, signal } = settings;
  const population = join(evidence, profile);
  await mkdir(join(population, ".lighthouseci"), { recursive: true });
  const runs = [];
  for (const [index, route] of manifest.routes.entries()) {
    signal.throwIfAborted();
    const id = `${String(index + 1).padStart(2, "0")}-${sha256(route.path).slice(0, 10)}`;
    await warm(
      new URL(route.path, origin).href,
      join(population, `${id}-warm.png`),
      profile,
    );
    for (const run of [1, 2, 3]) {
      const runDir = join(population, `${id}-run-${run}`);
      await mkdir(runDir);
      const { report, reportPath } = await measure(route, {
        ...settings,
        profile,
        runDir,
      });
      runs.push({ path: route.path, run, report });
      await copyFile(
        reportPath,
        join(population, ".lighthouseci", `lhr-${index + 1}-${run}.json`),
      );
      await writeJson(join(runDir, "identity.json"), {
        requestedUrl: new URL(route.path, origin).href,
        profile,
        run,
      });
    }
  }
  const summary = validatePopulation(runs, manifest, { origin, profile });
  await writeJson(join(population, "summary.json"), summary);
  const env = { ...process.env };
  env.PATH = `${dirname(node)}:${process.env.PATH}`;
  const code = await runCommand(
    [
      node,
      lhci,
      "assert",
      `--config=${join(root, "performance/lighthouserc.cjs")}`,
    ],
    {
      cwd: population,
      log: join(population, "assert.txt"),
      env,
      signal,
      timeoutMs: 60000,
    },
  );
  return { summary, passed: code === 0 };
}

export async function collect(settings: ICollection) {
  const summaries = [];
  let passed = true;
  for (const profile of profiles) {
    const result = await collectProfile(settings, profile);
    summaries.push(...result.summary);
    passed = passed && result.passed;
  }
  await writeJson(join(settings.evidence, "summary.json"), summaries);
  if (!passed)
    throw new PerformanceError(
      "Native LHCI median assertion failed. All reports retained.",
    );
}
