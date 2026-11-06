import { screenEmulationMetrics } from "lighthouse/core/config/constants.js";
import { describe, expect, it } from "vitest";
import {
  manifestInput,
  population,
  report,
  route,
  runs,
  snapshot,
} from "./fixtures";
import {
  assertRepresentativeContent,
  parseManifest,
  parseOrigin,
} from "./manifest";
import { checkContent, validatePopulation, validateReport } from "./validate";

describe("representative manifest", () => {
  it.each(["baseline", "candidate", "deployment"] as const)(
    "rejects noindex development content for %s acceptance",
    (phase) => {
      const input = manifestInput();
      const detail = input.routes[22];
      if (!detail.content) throw new Error("Missing fixture detail");
      input.routes[22] = {
        ...detail,
        content: { ...detail.content, noIndex: true },
      };
      expect(() =>
        assertRepresentativeContent(parseManifest(input), phase),
      ).toThrow(/requires indexable/);
    },
  );
  it("allows noindex published content only as a diagnostic", () => {
    const input = manifestInput();
    const detail = input.routes[22];
    if (!detail.content) throw new Error("Missing fixture detail");
    input.routes[22] = {
      ...detail,
      content: { ...detail.content, noIndex: true },
    };
    expect(() =>
      assertRepresentativeContent(parseManifest(input), "diagnostic"),
    ).not.toThrow();
  });
  it("accepts indexable published detail identities for representative scoring", () => {
    expect(() =>
      assertRepresentativeContent(parseManifest(manifestInput()), "baseline"),
    ).not.toThrow();
  });
  it("rejects blocked or incomplete coverage", () => {
    const input = manifestInput();
    input.routes.pop();
    expect(() => parseManifest(input)).toThrow();
    expect(() =>
      parseManifest({ ...manifestInput(), status: "blocked" }),
    ).toThrow();
  });
  it("rejects a query collision even with 24 rows", () => {
    const input = manifestInput();
    input.routes[7] = input.routes[8];
    expect(() => parseManifest(input)).toThrow(/unique/);
  });
  it("rejects details lacking publication identity", () => {
    const input = manifestInput();
    input.routes[22] = { ...route("/journal/probe"), content: undefined };
    expect(() => parseManifest(input)).toThrow(/identity/);
  });
  it.each([
    "https://user:secret@example.com",
    "https://example.com/path",
    "https://example.com?token=x",
    "http://example.com",
  ])("rejects unsafe origin %s", (origin) => {
    expect(() => parseOrigin(origin)).toThrow();
  });
});

describe("complete report populations", () => {
  it.each(["mobile", "desktop"] as const)(
    "retains outliers and query variants for %s",
    (profile) => {
      const input = runs().map((run) => ({
        ...run,
        report: report(
          route(run.path),
          run.report.categories.performance.score,
          profile,
        ),
      }));
      const summary = validatePopulation(
        input,
        parseManifest(manifestInput()),
        { ...population, profile },
      );
      expect(summary).toHaveLength(24);
      expect(
        summary.find((row) => row.path === "/menus?menu=wine"),
      ).toMatchObject({ scores: [0.89, 0.9, 0.91], median: 0.9 });
    },
  );
  it("rejects missing runs", () => {
    const input = runs();
    input.pop();
    expect(() =>
      validatePopulation(input, parseManifest(manifestInput()), population),
    ).toThrow();
  });
  it("rejects duplicated runs", () => {
    const input = runs();
    input[1] = input[0];
    expect(() =>
      validatePopulation(input, parseManifest(manifestInput()), population),
    ).toThrow(/duplicate/);
  });
  it("rejects extra runs", () => {
    const input = runs();
    input.push(input[0]);
    expect(() =>
      validatePopulation(input, parseManifest(manifestInput()), population),
    ).toThrow();
  });
  it("rejects an unrequested route", () => {
    const input = runs();
    input[0] = { ...input[0], path: "/unrequested" };
    expect(() =>
      validatePopulation(input, parseManifest(manifestInput()), population),
    ).toThrow(/Extra/);
  });
});

describe("measured document validity", () => {
  it("preserves the ordinary static map when no interactive token is configured", () => {
    const current = { ...route("/visit-contact"), map: "static" as const };
    expect(
      checkContent(
        { ...snapshot(current), mapLoaded: false, mapFallbackPresent: true },
        current,
      ).mapFallbackPresent,
    ).toBe(true);
  });
  it("rejects failed image payloads even when the document loads", () => {
    const current = route("/menus?menu=dinner");
    const input = report(current);
    input.audits["network-requests"].details.items.push({
      url: "https://test.invalid/broken.webp",
      statusCode: 500,
      resourceType: "Image",
    });
    expect(() => validateReport(input, current, population)).toThrow(
      /Failed image/,
    );
  });
  it("rejects a legacy final URL that would merge native assertion groups", () => {
    const current = route("/menus?menu=dinner");
    expect(() =>
      validateReport(
        { ...report(current), finalUrl: "https://test.invalid/menus" },
        current,
        population,
      ),
    ).toThrow(/final URL/);
  });
  const current = route("/menus?menu=dinner");
  it.each([
    [
      "runtime error",
      (value: ReturnType<typeof report>) => ({
        ...value,
        runtimeError: { code: "NO_FCP" },
      }),
    ],
    [
      "null score",
      (value: ReturnType<typeof report>) => ({
        ...value,
        categories: { performance: { score: null } },
      }),
    ],
    [
      "redirect/query loss",
      (value: ReturnType<typeof report>) => ({
        ...value,
        finalDisplayedUrl: "https://test.invalid/menus",
      }),
    ],
    [
      "wrong profile",
      (value: ReturnType<typeof report>) => ({
        ...value,
        configSettings: { ...value.configSettings, formFactor: "desktop" },
      }),
    ],
    [
      "tuned viewport",
      (value: ReturnType<typeof report>) => ({
        ...value,
        configSettings: {
          ...value.configSettings,
          screenEmulation: { ...screenEmulationMetrics.mobile, width: 390 },
        },
      }),
    ],
    [
      "blocked request",
      (value: ReturnType<typeof report>) => ({
        ...value,
        configSettings: {
          ...value.configSettings,
          blockedUrlPatterns: ["*analytics*"],
        },
      }),
    ],
    [
      "bad HTTP",
      (value: ReturnType<typeof report>) => ({
        ...value,
        audits: {
          ...value.audits,
          "network-requests": {
            details: {
              items: [
                {
                  url: value.requestedUrl,
                  statusCode: 500,
                  resourceType: "Document",
                },
              ],
            },
          },
        },
      }),
    ],
  ] as const)("rejects %s", (_failure, corrupt) => {
    expect(() =>
      validateReport(corrupt(report(current)), current, population),
    ).toThrow();
  });
  it.each([
    ["wrong menu", { menu: "lunch" }],
    ["blank body", { text: "Published" }],
    ["error page", { text: "Internal server error. ".repeat(20) }],
    ["old consent", { consentStored: true }],
    ["hidden consent", { consentVisible: false }],
  ])("rejects %s content", (_failure, change) => {
    expect(() =>
      checkContent({ ...snapshot(current), ...change }, current),
    ).toThrow();
  });
  it.each([
    ["/book-a-table", { bookingAvailable: false }],
    ["/visit-contact", { mapLoaded: false }],
    ["/journal/probe", { heroLoaded: false }],
  ])("rejects unavailable integration/hero on %s", (path, change) => {
    const target = route(path);
    expect(() =>
      checkContent({ ...snapshot(target), ...change }, target),
    ).toThrow();
  });
});
