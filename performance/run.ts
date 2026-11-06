import { execFileSync } from "node:child_process";
import { mkdir, open, readFile, unlink } from "node:fs/promises";
import { hostname, platform, release } from "node:os";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { chromium } from "@playwright/test";
import { z } from "zod";
import { collect } from "./collect";
import { verifyContent } from "./content";
import { root, sourceIdentity, writeJson } from "./identity";
import {
  assertRepresentativeContent,
  PerformanceError,
  parseManifest,
  parseOrigin,
  phaseSchema,
  type TPhase,
} from "./manifest";

function auditEnvironment() {
  for (const key of Object.keys(process.env)) {
    if (
      key.startsWith("LHCITEST_") ||
      ([
        "NODE_OPTIONS",
        "CHROME_FLAGS",
        "E2E_BUILD",
        "EMAIL_E2E_BUILD",
      ].includes(key) &&
        process.env[key])
    ) {
      throw new PerformanceError(
        `Audit environment contains disallowed input: ${key}`,
      );
    }
  }
  const node = resolve(
    process.env.AUDIT_NODE_PATH ??
      join(root, ".omo/tools/node-v22.23.4-linux-x64/bin/node"),
  );
  const version = execFileSync(node, ["--version"], {
    encoding: "utf8",
    timeout: 10000,
  }).trim();
  if (version !== "v22.23.4")
    throw new PerformanceError(
      `Audit runtime must be v22.23.4; got ${version}.`,
    );
  return { node, version };
}

async function execute(
  options: {
    readonly origin: string;
    readonly evidence: string;
    readonly manifest: string;
    readonly phase: TPhase;
  },
  signal: AbortSignal,
) {
  const manifest = parseManifest(
    JSON.parse(await readFile(resolve(options.manifest), "utf8")),
  );
  assertRepresentativeContent(manifest, options.phase);
  const response = await fetch(options.origin, {
    redirect: "error",
    signal: AbortSignal.any([signal, AbortSignal.timeout(30000)]),
  });
  if (response.status !== 200)
    throw new PerformanceError(`Production readiness HTTP ${response.status}`);
  const html = await response.text();
  if (
    html.includes("/_next/static/development/") ||
    html.includes("/_next/webpack-hmr")
  )
    throw new PerformanceError("Use next build and next start, not next dev.");
  if (options.phase === "deployment")
    throw new PerformanceError(
      "Deployment acceptance blocked: trusted deployment resolution/allowlist is not configured yet.",
    );
  const { node, version } = auditEnvironment();
  const identity = await sourceIdentity();
  const content = await verifyContent(manifest, signal);
  const buildId = (await readFile(join(root, ".next/BUILD_ID"), "utf8")).trim();
  if (!buildId)
    throw new PerformanceError("A normal production build is required.");
  const browser = await chromium.launch();
  const browserVersion = browser.version();
  await browser.close();
  await writeJson(join(options.evidence, "population.json"), {
    ...identity,
    buildId,
    content,
    origin: options.origin,
    phase: options.phase,
    timestamp: new Date().toISOString(),
    os: { platform: platform(), release: release(), host: hostname() },
    versions: {
      node: version,
      bun: execFileSync("bun", ["--version"], { encoding: "utf8" }).trim(),
      lhci: "0.16.0",
      lighthouse: "13.6.0",
      browser: browserVersion,
      executable: chromium.executablePath(),
    },
    cache:
      "One normal unscored navigation per requested URL; warmed server, fresh browser for every measured run",
    consent: "ordinary first visitor; never preaccepted",
    manifest,
    collection:
      "One Lighthouse CLI invocation per run; LHCI native median assertions. LHCI collect internally retries failed runs, violating the no-selective-retry contract.",
  });
  await collect({
    origin: options.origin,
    evidence: options.evidence,
    manifest,
    node,
    signal,
  });
  const finalContent = await verifyContent(manifest, signal);
  if (JSON.stringify(content) !== JSON.stringify(finalContent))
    throw new PerformanceError(
      "Published content changed during collection; population invalid.",
    );
  const after = await sourceIdentity();
  if (
    identity.head !== after.head ||
    identity.sourceDigest !== after.sourceDigest
  )
    throw new PerformanceError(
      "Source changed during collection; population invalid.",
    );
  await writeJson(join(options.evidence, "result.json"), {
    status:
      options.phase === "diagnostic"
        ? "diagnostic-score-population-valid"
        : "local-score-population-valid",
    representativeAcceptance:
      options.phase === "diagnostic" ? "blocked" : "pending-other-checks",
    deploymentAcceptance: "blocked",
    reports: 144,
    pairs: 48,
  });
}

async function main() {
  const { values } = parseArgs({
    options: {
      origin: { type: "string" },
      phase: { type: "string" },
      evidence: { type: "string" },
      manifest: { type: "string", default: "performance/manifest.json" },
    },
    strict: true,
  });
  const options = z
    .object({
      origin: z.string(),
      phase: phaseSchema,
      evidence: z.string().min(1),
      manifest: z.string(),
    })
    .parse(values);
  const origin = parseOrigin(options.origin);
  const evidence = resolve(options.evidence);
  await mkdir(evidence, { recursive: false });
  const controller = new AbortController();
  const abort = () => controller.abort();
  process.once("SIGINT", abort);
  process.once("SIGTERM", abort);
  const deadline = setTimeout(abort, 88 * 60 * 1000);
  const lockPath = "/tmp/peploes-lighthouse-collection.lock";
  let lock: Awaited<ReturnType<typeof open>> | undefined;
  try {
    lock = await open(lockPath, "wx");
    await lock.writeFile(JSON.stringify({ pid: process.pid, evidence }));
    await execute({ ...options, origin, evidence }, controller.signal);
  } catch (error) {
    await writeJson(join(evidence, "failure.json"), {
      status: "failed",
      message: error instanceof Error ? error.message : "Unknown audit failure",
    });
    throw error;
  } finally {
    clearTimeout(deadline);
    process.removeListener("SIGINT", abort);
    process.removeListener("SIGTERM", abort);
    if (lock) {
      await lock.close();
      await unlink(lockPath);
    }
  }
}

main().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : "Unknown performance command failure"}\n`,
  );
  process.exitCode = 1;
});
