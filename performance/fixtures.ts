import {
  screenEmulationMetrics,
  throttling,
  userAgents,
} from "lighthouse/core/config/constants.js";
import { STATIC_PATHS, type TRoute } from "./manifest";
import type { TProfile } from "./validate";

const content = {
  id: "published-id",
  revision: "revision-1",
  updatedAt: "2026-11-06T00:00:00.000Z",
  hash: "a".repeat(64),
  imageHash: "b".repeat(64),
  noIndex: false,
  bodyImages: 2,
} as const;
export const route = (path: string): TRoute => ({
  path,
  heading: "Published content",
  requiredText: ["Published"],
  hero: false,
  ...(path === "/visit-contact" ? { map: "interactive" as const } : {}),
  ...(path.startsWith("/menus")
    ? {
        menu:
          new URL(path, "https://test.invalid").searchParams.get("menu") ??
          "lunch",
      }
    : {}),
  ...(path.startsWith("/journal/") || path.startsWith("/seasonal/")
    ? { content, hero: true }
    : {}),
});
export const manifestInput = () => ({
  cms: { projectId: "testproject", dataset: "test", apiVersion: "2026-11-06" },
  version: 1,
  status: "ready",
  routes: [...STATIC_PATHS, "/journal/probe", "/seasonal/probe"].map(route),
});
export const snapshot = (current: TRoute) => ({
  heading: "Published content",
  text: "Published restaurant information. ".repeat(12),
  menu: current.menu ?? null,
  heroLoaded: true,
  bookingAvailable: true,
  mapLoaded: true,
  consentStored: false,
  consentVisible: true,
});
const metric = { numericValue: 100 };

export function report(
  current: TRoute,
  score = 0.9,
  profile: TProfile = "mobile",
) {
  const url = new URL(current.path, "https://test.invalid").href;
  return {
    lighthouseVersion: "13.6.0",
    requestedUrl: url,
    finalDisplayedUrl: url,
    finalUrl: url,
    fetchTime: "2026-11-06T00:00:00.000Z",
    configSettings: {
      formFactor: profile,
      throttlingMethod: "simulate",
      screenEmulation: screenEmulationMetrics[profile],
      throttling:
        profile === "mobile"
          ? throttling.mobileSlow4G
          : throttling.desktopDense4G,
      emulatedUserAgent: userAgents[profile],
      disableStorageReset: false,
      blockedUrlPatterns: null,
    },
    categories: { performance: { score } },
    audits: {
      "representative-content": {
        score: 1,
        details: { snapshot: snapshot(current) },
      },
      "network-requests": {
        details: {
          items: [{ url, statusCode: 200, resourceType: "Document" }],
        },
      },
      "largest-contentful-paint": metric,
      "total-blocking-time": metric,
      "cumulative-layout-shift": metric,
      "first-contentful-paint": metric,
      "speed-index": metric,
      "server-response-time": metric,
    },
  };
}
export const population = {
  origin: "https://test.invalid",
  profile: "mobile",
} as const;
export const runs = () =>
  manifestInput().routes.flatMap((current) =>
    [0.89, 0.9, 0.91].map((score, index) => ({
      path: current.path,
      run: index + 1,
      report: report(current, score),
    })),
  );
