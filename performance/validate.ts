import { isDeepStrictEqual } from "node:util";
import {
  screenEmulationMetrics,
  throttling,
  userAgents,
} from "lighthouse/core/config/constants.js";
import { z } from "zod";
import { PerformanceError, type TManifest, type TRoute } from "./manifest";

export const profiles = ["mobile", "desktop"] as const;
export type TProfile = (typeof profiles)[number];
export type TPopulation = {
  readonly origin: string;
  readonly profile: TProfile;
};

const snapshotSchema = z.object({
  heading: z.string(),
  text: z.string(),
  menu: z.string().nullable(),
  heroLoaded: z.boolean(),
  bookingAvailable: z.boolean(),
  mapLoaded: z.boolean(),
  mapFallbackPresent: z.boolean().default(false),
  consentStored: z.boolean(),
});

const metricSchema = z.object({
  numericValue: z.number().finite().nonnegative(),
});
const reportSchema = z.object({
  lighthouseVersion: z.literal("13.6.0"),
  requestedUrl: z.url(),
  finalDisplayedUrl: z.url(),
  finalUrl: z.url(),
  runtimeError: z.unknown().optional(),
  fetchTime: z.iso.datetime(),
  configSettings: z.object({
    formFactor: z.enum(profiles),
    throttlingMethod: z.literal("simulate"),
    screenEmulation: z.unknown(),
    throttling: z.unknown(),
    emulatedUserAgent: z.string(),
    disableStorageReset: z.literal(false),
    blockedUrlPatterns: z.array(z.string()).nullable(),
  }),
  categories: z.object({
    performance: z.object({ score: z.number().finite().min(0).max(1) }),
  }),
  audits: z.object({
    "representative-content": z.object({
      score: z.literal(1),
      details: z.object({ snapshot: snapshotSchema }),
    }),
    "network-requests": z.object({
      details: z.object({
        items: z.array(
          z.object({
            url: z.string(),
            statusCode: z.number(),
            resourceType: z.string().optional(),
          }),
        ),
      }),
    }),
    "largest-contentful-paint": metricSchema,
    "total-blocking-time": metricSchema,
    "cumulative-layout-shift": metricSchema,
    "first-contentful-paint": metricSchema,
    "speed-index": metricSchema,
    "server-response-time": metricSchema,
  }),
});

export function checkContent(input: unknown, route: TRoute) {
  const snapshot = snapshotSchema.parse(input);
  if (
    snapshot.heading !== route.heading ||
    snapshot.text.length < 120 ||
    route.requiredText.some((text) => !snapshot.text.includes(text)) ||
    /application error|internal server error|temporarily unavailable|couldn.t load/i.test(
      snapshot.text,
    )
  ) {
    throw new PerformanceError(
      `Blank, fallback or unexpected content: ${route.path}`,
    );
  }
  if (route.menu && snapshot.menu !== route.menu)
    throw new PerformanceError(`Wrong selected menu: ${route.path}`);
  if (route.hero && !snapshot.heroLoaded)
    throw new PerformanceError(`Hero failed: ${route.path}`);
  if (route.path === "/book-a-table" && !snapshot.bookingAvailable)
    throw new PerformanceError("Booking unavailable.");
  if (route.map === "interactive" && !snapshot.mapLoaded)
    throw new PerformanceError("Configured map unavailable.");
  if (route.map === "static" && !snapshot.mapFallbackPresent)
    throw new PerformanceError("Normal static map fallback missing.");
  if (snapshot.consentStored)
    throw new PerformanceError(
      "Expected a first visit without stored cookie preferences.",
    );
  return snapshot;
}

export function validateReport(
  input: unknown,
  route: TRoute,
  population: TPopulation,
) {
  const { origin, profile } = population;
  const report = reportSchema.parse(input);
  const url = new URL(route.path, origin).href;
  if (report.runtimeError != null)
    throw new PerformanceError(`Lighthouse runtime error: ${route.path}`);
  if (
    report.requestedUrl !== url ||
    report.finalDisplayedUrl !== url ||
    report.finalUrl !== url
  )
    throw new PerformanceError(`Unexpected requested/final URL: ${route.path}`);
  const settings = report.configSettings;
  if (
    settings.formFactor !== profile ||
    settings.emulatedUserAgent !== userAgents[profile] ||
    !isDeepStrictEqual(
      settings.screenEmulation,
      screenEmulationMetrics[profile],
    ) ||
    !isDeepStrictEqual(
      settings.throttling,
      profile === "mobile"
        ? throttling.mobileSlow4G
        : throttling.desktopDense4G,
    ) ||
    (settings.blockedUrlPatterns?.length ?? 0) > 0
  ) {
    throw new PerformanceError(
      `Wrong device/throttling settings: ${route.path}`,
    );
  }
  const document = report.audits["network-requests"].details.items.find(
    (item) => item.url === url && item.resourceType === "Document",
  );
  if (document?.statusCode !== 200)
    throw new PerformanceError(`Bad document HTTP response: ${route.path}`);
  const failedAsset = report.audits["network-requests"].details.items.find(
    (item) =>
      (["Image", "Font"].includes(item.resourceType ?? "") ||
        /^https:\/\/api\.mapbox\.com\//.test(item.url)) &&
      (item.statusCode < 200 || item.statusCode >= 400),
  );
  if (failedAsset)
    throw new PerformanceError(
      `Failed image, font or map request: ${route.path}`,
    );
  checkContent(report.audits["representative-content"].details.snapshot, route);
  return report;
}

const runSchema = z.object({
  path: z.string(),
  run: z.number().int().min(1).max(3),
  report: z.unknown(),
});

export function validatePopulation(
  input: unknown,
  manifest: TManifest,
  population: TPopulation,
) {
  const { profile } = population;
  const runs = z.array(runSchema).length(72).parse(input);
  const seen = new Set<string>();
  const validated = runs.map((run) => {
    const route = manifest.routes.find(
      (candidate) => candidate.path === run.path,
    );
    const key = `${run.path}:${run.run}`;
    if (!route || seen.has(key))
      throw new PerformanceError(`Extra or duplicate run: ${key}`);
    seen.add(key);
    return {
      ...run,
      report: validateReport(run.report, route, population),
    };
  });
  return manifest.routes.map((route) => {
    const reports = validated
      .filter((run) => run.path === route.path)
      .sort((a, b) => a.run - b.run);
    if (reports.length !== 3)
      throw new PerformanceError(`Missing runs: ${route.path}`);
    const scores = reports.map(
      (run) => run.report.categories.performance.score,
    );
    const median = [...scores].sort((a, b) => a - b)[1];
    return {
      path: route.path,
      profile,
      scores,
      median,
      metrics: reports.map(({ report }) =>
        Object.fromEntries(
          Object.entries(report.audits)
            .filter(([, audit]) => "numericValue" in audit)
            .map(([name, audit]) => [
              name,
              "numericValue" in audit ? audit.numericValue : null,
            ]),
        ),
      ),
    };
  });
}
