import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { installFakeBrowser } from "../helpers/browser";

const envState = vi.hoisted(() => ({
  production: true,
  gaId: "G-TEST" as string | undefined,
}));
vi.mock("@/lib/env", () => ({
  isProduction: () => envState.production,
  env: {
    get NEXT_PUBLIC_GA_MEASUREMENT_ID() {
      return envState.gaId;
    },
  },
}));

type TBrowser = ReturnType<typeof installFakeBrowser>;

async function load(options?: Parameters<typeof installFakeBrowser>[0]) {
  vi.resetModules();
  const browser = installFakeBrowser(options);
  const client = await import("@/lib/analytics/client");
  const ga4 = await import("@/lib/analytics/ga4");
  const lifecycle = await import("@/lib/analytics/lifecycle");
  const consent = await import("@/lib/cookie-consent");
  const utm = await import("@/lib/analytics/utm");
  return { browser, client, ga4, lifecycle, consent, utm };
}

const UTM_URL =
  "https://peploes.test/?utm_source=newsletter&utm_medium=email&utm_campaign=jane.doe@example.com";
const STORAGE_KEY = "app_utm_params";

function calls(browser: TBrowser) {
  return browser.gtag.mock.calls.map(([, name, params]) => [name, params]);
}

beforeEach(() => {
  envState.production = true;
  envState.gaId = "G-TEST";
});
afterEach(() => vi.unstubAllGlobals());

describe("analytics configuration", () => {
  it("sends page and optional click events before a preference choice", async () => {
    const { browser, client } = await load({ href: UTM_URL });
    client.trackPageView();
    client.trackCustomEvent("booking_click", { placement: "hero" });
    expect(calls(browser).map(([name]) => name)).toEqual([
      "page_view",
      "booking_click",
    ]);
    expect(browser.session.has(STORAGE_KEY)).toBe(true);
  });

  it.each([
    ["broken JSON", "{nope"],
    ["wrong shape", '{"analytics":"true"}'],
  ])(
    "malformed placeholder preferences do not stop collection: %s",
    async (_label, raw) => {
      const { browser, client } = await load({ href: UTM_URL });
      browser.storeRawConsent(raw);
      client.trackPageView();
      expect(browser.gtag).toHaveBeenCalledOnce();
    },
  );

  it("collects when placeholder storage is unreadable", async () => {
    const { browser, client } = await load({ href: UTM_URL });
    vi.stubGlobal("window", {
      ...window,
      get localStorage() {
        throw new Error("blocked");
      },
    });
    client.trackPageView();
    expect(browser.gtag).toHaveBeenCalledOnce();
  });

  it("collects nothing in development or without a measurement ID", async () => {
    const { browser, client } = await load({ href: UTM_URL });
    browser.grantAnalytics();
    envState.production = false;
    client.trackPageView();
    expect(browser.gtag).not.toHaveBeenCalled();
    expect(browser.session.size).toBe(0);
    vi.resetModules();
    envState.production = true;
    envState.gaId = undefined;
    const fresh = await import("@/lib/analytics/client");
    fresh.trackPageView();
    expect(browser.gtag).not.toHaveBeenCalled();
  });

  it("stores only sanitized campaign values, whatever the caller passes", async () => {
    const { browser, utm } = await load({ href: "https://peploes.test/" });
    browser.grantAnalytics();
    utm.storeUTMParams({
      utm_source: "newsletter",
      utm_campaign: "jane.doe@example.com",
      utm_term: "call 353 1 234 5678",
    });
    expect(JSON.parse(browser.session.get(STORAGE_KEY) ?? "{}").params).toEqual(
      {
        utm_source: "newsletter",
      },
    );
    browser.session.clear();
    utm.storeUTMParams({ utm_campaign: "jane.doe@example.com" });
    expect(browser.session.size).toBe(0);
  });

  it("does not throw when attribution storage is blocked", async () => {
    const { browser, client } = await load({
      href: UTM_URL,
      blockSessionStorage: true,
    });
    browser.grantAnalytics();
    expect(() => client.trackPageView()).not.toThrow();
    expect(calls(browser)[0]?.[0]).toBe("page_view");
  });

  it("ignores malformed stored attribution", async () => {
    const { browser, client } = await load();
    browser.grantAnalytics();
    browser.session.set(STORAGE_KEY, "{broken");
    client.trackCustomEvent("menu_view", { menu: "lunch" });
    expect(calls(browser)).toEqual([
      ["menu_view", { menu: "lunch", page_location: "https://peploes.test/" }],
    ]);
    expect(browser.session.has(STORAGE_KEY)).toBe(false);
  });
});

describe("payload privacy", () => {
  it("sends path-only locations, origin-only referrers and safe campaign values", async () => {
    const { browser, client } = await load({
      href: `${UTM_URL}&email=jane@example.com#reservation`,
      referrer: "https://search.test/results?q=jane@example.com",
    });
    browser.grantAnalytics();
    client.trackPageView();
    expect(calls(browser)).toEqual([
      [
        "page_view",
        {
          page_location: "https://peploes.test/",
          page_path: "/",
          page_referrer: "https://search.test",
          utm_source: "newsletter",
          utm_medium: "email",
        },
      ],
    ]);
    expect(JSON.stringify(browser.gtag.mock.calls)).not.toContain("jane");
    expect(JSON.stringify([...browser.session.values()])).not.toContain("jane");
  });

  it("gives interaction events a path-only location so gtag does not send the raw URL", async () => {
    const { browser, client } = await load({
      href: "https://peploes.test/visit-contact?email=jane@example.com#map",
    });
    browser.grantAnalytics();
    client.trackCustomEvent("booking_click", { placement: "hero" });
    expect(calls(browser)).toEqual([
      [
        "booking_click",
        {
          placement: "hero",
          page_location: "https://peploes.test/visit-contact",
        },
      ],
    ]);
    expect(JSON.stringify(browser.gtag.mock.calls)).not.toContain("jane");
  });

  it("drops events and properties outside the catalog", async () => {
    const { browser, client } = await load();
    browser.grantAnalytics();
    client.trackCustomEvent("purchase", { value: 1 });
    client.trackCustomEvent("booking_complete", {});
    client.trackCustomEvent("contact_click", {
      placement: "footer",
      destination: "phone",
      href: "tel:+353861234567",
    });
    expect(calls(browser)).toEqual([
      [
        "contact_click",
        {
          placement: "footer",
          destination: "phone",
          page_location: "https://peploes.test/",
        },
      ],
    ]);
  });

  it("enriches later events with stored campaign values", async () => {
    const { browser, client } = await load({ href: UTM_URL });
    browser.grantAnalytics();
    client.trackPageView();
    browser.setLocation("https://peploes.test/menus/dinner");
    client.trackCustomEvent("menu_view", { menu: "dinner" });
    expect(calls(browser)[1]).toEqual([
      "menu_view",
      {
        menu: "dinner",
        page_location: "https://peploes.test/menus/dinner",
        utm_source: "newsletter",
        utm_medium: "email",
      },
    ]);
  });
});

describe("dedupe", () => {
  it("does not suppress rapid revisits that carry new navigation keys", async () => {
    const { browser, client } = await load();
    browser.grantAnalytics();
    client.trackPageView({ dedupeKey: "nav-1" });
    client.trackPageView({ dedupeKey: "nav-2" });
    client.trackPageView({ dedupeKey: "nav-3" });
    expect(browser.gtag).toHaveBeenCalledTimes(3);
  });

  it("suppresses a repeat of the same navigation", async () => {
    const { browser, client } = await load();
    browser.grantAnalytics();
    client.trackPageView({ dedupeKey: "nav-1" });
    client.trackPageView({ dedupeKey: "nav-1" });
    expect(browser.gtag).toHaveBeenCalledTimes(1);
  });

  it("does not record a navigation that was never dispatched", async () => {
    const { browser, client } = await load();
    client.trackPageView({ dedupeKey: "nav-1" });
    browser.grantAnalytics();
    client.trackPageView({ dedupeKey: "nav-1" });
    expect(browser.gtag).toHaveBeenCalledTimes(1);
  });

  it("does not record when the transport throws", async () => {
    const { browser, client } = await load();
    browser.grantAnalytics();
    browser.gtag.mockImplementationOnce(() => {
      throw new Error("blocked by extension");
    });
    expect(() => client.trackPageView({ dedupeKey: "nav-1" })).not.toThrow();
    client.trackPageView({ dedupeKey: "nav-1" });
    expect(browser.gtag).toHaveBeenCalledTimes(2);
  });
});

describe("dispatch readiness and withdrawal", () => {
  it("holds consented events until the transport is ready, then sends them once", async () => {
    const { browser, client, ga4 } = await load();
    browser.grantAnalytics();
    browser.removeGtag();
    client.trackPageView({ dedupeKey: "nav-1" });
    client.trackCustomEvent("booking_click", { placement: "navbar" });
    expect(browser.gtag).not.toHaveBeenCalled();
    vi.stubGlobal("window", { ...window, gtag: browser.gtag });
    ga4.flushAnalyticsQueue();
    ga4.flushAnalyticsQueue();
    expect(calls(browser).map(([name]) => name)).toEqual([
      "page_view",
      "booking_click",
    ]);
  });

  it("queues optional events before a choice and flushes each once", async () => {
    const { browser, client, ga4 } = await load();
    browser.removeGtag();
    client.trackCustomEvent("booking_click", { placement: "hero" });
    browser.grantAnalytics();
    vi.stubGlobal("window", { ...window, gtag: browser.gtag });
    ga4.flushAnalyticsQueue();
    ga4.flushAnalyticsQueue();
    expect(calls(browser).map(([name]) => name)).toEqual(["booking_click"]);
  });

  it("keeps queued events and attribution after placeholder rejection", async () => {
    const { browser, client, ga4, consent } = await load({ href: UTM_URL });
    browser.removeGtag();
    client.trackPageView();
    consent.saveCookiePreferences({
      analytics: false,
      performance: false,
      marketing: false,
    });
    expect(browser.session.has(STORAGE_KEY)).toBe(true);
    vi.stubGlobal("window", { ...window, gtag: browser.gtag });
    ga4.flushAnalyticsQueue();
    expect(browser.gtag).toHaveBeenCalledOnce();
  });

  it("keeps queued events when another tab changes placeholder preferences", async () => {
    const { browser, client, ga4 } = await load();
    browser.removeGtag();
    client.trackCustomEvent("menu_view", { menu: "wine" });
    browser.storeRawConsent(null);
    browser.fireStorageEvent("peploes.cookie-preferences.v1");
    vi.stubGlobal("window", { ...window, gtag: browser.gtag });
    ga4.flushAnalyticsQueue();
    expect(calls(browser).map(([name]) => name)).toEqual(["menu_view"]);
  });

  it("a preference change during provider loading does not discard the navigation", async () => {
    const { browser, client, ga4 } = await load();
    browser.removeGtag();
    client.trackPageView({ dedupeKey: "nav-1" });
    browser.storeRawConsent(null);
    vi.stubGlobal("window", { ...window, gtag: browser.gtag });
    ga4.flushAnalyticsQueue();
    ga4.flushAnalyticsQueue();
    expect(browser.gtag).toHaveBeenCalledOnce();
  });

  it("bounds the pending queue", async () => {
    const { browser, client, ga4 } = await load();
    browser.grantAnalytics();
    browser.removeGtag();
    for (let index = 0; index < 50; index += 1) {
      client.trackCustomEvent("menu_view", { menu: "lunch" });
    }
    vi.stubGlobal("window", { ...window, gtag: browser.gtag });
    ga4.flushAnalyticsQueue();
    expect(browser.gtag.mock.calls.length).toBeLessThanOrEqual(20);
    expect(browser.gtag.mock.calls.length).toBeGreaterThan(0);
  });
});
