import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { installFakeBrowser } from "../helpers/browser";

const settings = vi.hoisted(() => ({
  gaId: "G-STAGING" as string | undefined,
}));
vi.mock("@/lib/env", () => ({
  isProduction: () => process.env.NODE_ENV === "production",
  env: {
    get NEXT_PUBLIC_GA_MEASUREMENT_ID() {
      return settings.gaId;
    },
    GA_API_SECRET: "synthetic-test-secret",
  },
}));

beforeEach(() => {
  vi.resetModules();
  settings.gaId = "G-STAGING";
  vi.stubEnv("NODE_ENV", "production");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("analytics reporting policy", () => {
  it.each([
    ["production", 1],
    ["development", 0],
    ["test", 0],
  ] as const)(
    "server collection in NODE_ENV=%s sends %i requests",
    async (nodeEnv, count) => {
      vi.stubEnv("NODE_ENV", nodeEnv);
      const fetch = vi
        .fn()
        .mockResolvedValue(new Response(null, { status: 204 }));
      vi.stubGlobal("fetch", fetch);
      const { trackServerEvent } = await import("@/lib/analytics/server");
      expect(
        await trackServerEvent("booking_search", {}, "synthetic-client"),
      ).toBe(count === 1);
      expect(fetch).toHaveBeenCalledTimes(count);
    },
  );

  it.each(["development", "test"])(
    "does not collect in NODE_ENV=%s with configured accounts",
    async (nodeEnv) => {
      vi.stubEnv("NODE_ENV", nodeEnv);
      const browser = installFakeBrowser();
      const client = await import("@/lib/analytics/client");
      client.trackPageView();
      client.trackCustomEvent("booking_click", { placement: "hero" });
      expect(browser.gtag).not.toHaveBeenCalled();
    },
  );

  it("sends staging page and optional interaction events without a consent choice", async () => {
    const browser = installFakeBrowser();
    const client = await import("@/lib/analytics/client");
    client.trackPageView();
    client.trackCustomEvent("booking_click", { placement: "hero" });
    expect(browser.gtag.mock.calls.map((call) => call[1])).toEqual([
      "page_view",
      "booking_click",
    ]);
  });

  it("keeps collecting after the placeholder rejects optional categories", async () => {
    const browser = installFakeBrowser();
    browser.storeRawConsent(
      JSON.stringify({
        analytics: false,
        performance: false,
        marketing: false,
      }),
    );
    const client = await import("@/lib/analytics/client");
    client.trackPageView();
    expect(browser.gtag).toHaveBeenCalledOnce();
  });

  it("sends when preference storage is blocked", async () => {
    const browser = installFakeBrowser({ blockSessionStorage: true });
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("blocked");
      },
    });
    const client = await import("@/lib/analytics/client");
    expect(() => client.trackPageView()).not.toThrow();
    expect(browser.gtag).toHaveBeenCalledOnce();
  });

  it("an unconfigured provider does not report", async () => {
    settings.gaId = undefined;
    const browser = installFakeBrowser();
    browser.grantAnalytics();
    const client = await import("@/lib/analytics/client");
    client.trackPageView();
    expect(browser.gtag).not.toHaveBeenCalled();
  });
});
