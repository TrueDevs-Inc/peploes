import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { COOKIE_PREFERENCES } from "@/lib/constants/cookie-consent";
import { installFakeBrowser } from "../helpers/browser";

const envState = vi.hoisted(() => ({
  production: true,
  gaId: "G-TEST" as string | undefined,
  phKey: "phc_synthetic" as string | undefined,
  phHost: "https://eu.i.posthog.com" as string | undefined,
}));
vi.mock("@/lib/public-env", () => ({
  isProduction: () => envState.production,
  publicEnv: {
    get NEXT_PUBLIC_GA_MEASUREMENT_ID() {
      return envState.gaId;
    },
    get NEXT_PUBLIC_POSTHOG_KEY() {
      return envState.phKey;
    },
    get NEXT_PUBLIC_POSTHOG_HOST() {
      return envState.phHost;
    },
  },
}));

const sentry = vi.hoisted(() => ({ captureException: vi.fn() }));
vi.mock("@sentry/nextjs", () => sentry);

const GA_SCRIPT = "https://www.googletagmanager.com/gtag/js?id=G-TEST";
const ACCEPTED = { analytics: true, performance: true, marketing: true };
// Interaction clicks can unload the page, so they skip PostHog's batch.
const INSTANT = { send_instantly: true };
const DENIED = { analytics: false, performance: false, marketing: false };

function createPostHog() {
  const instance = {
    init: vi.fn((..._args: unknown[]) => instance),
    capture: vi.fn((..._args: unknown[]) => ({})),
    opt_in_capturing: vi.fn(),
    opt_out_capturing: vi.fn(),
    reset: vi.fn(),
    identify: vi.fn(),
  };
  return instance;
}

interface ILoadOptions {
  browser?: Parameters<typeof installFakeBrowser>[0];
  importFails?: boolean;
  holdImport?: boolean;
  initThrows?: boolean;
}

async function load(options: ILoadOptions = {}) {
  vi.resetModules();
  const browser = installFakeBrowser(options.browser);
  browser.removeGtag();
  const posthog = createPostHog();
  if (options.initThrows) {
    posthog.init.mockImplementation(() => {
      throw new Error("init failed");
    });
  }
  let release: () => void = () => undefined;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  vi.doMock("posthog-js/dist/module.slim", async () => {
    if (options.importFails) throw new Error("chunk failed");
    if (options.holdImport) await gate;
    return { default: posthog };
  });
  const lifecycle = await import("@/lib/analytics/lifecycle");
  const client = await import("@/lib/analytics/client");
  const consent = await import("@/lib/cookie-consent");
  return { browser, posthog, release, lifecycle, client, consent };
}

async function settle() {
  await vi.dynamicImportSettled();
  await Promise.resolve();
  await Promise.resolve();
}

function gaEvents(
  browser: ReturnType<typeof installFakeBrowser>,
  name: string,
) {
  return browser
    .dataLayer()
    .filter((entry) => entry[0] === "event" && entry[1] === name)
    .map((entry) => entry[2]);
}

function phConfig(posthog: ReturnType<typeof createPostHog>) {
  return posthog.init.mock.calls[0]?.[1] as Record<string, unknown> & {
    before_send: (event: {
      event: string;
      properties: Record<string, unknown>;
      $set?: unknown;
      $set_once?: unknown;
    }) => { event: string; properties: Record<string, unknown> } | null;
  };
}

beforeEach(() => {
  // Node's real BroadcastChannel would link module graphs left by earlier tests
  // as if they were tabs; tests that need a channel install the fake one.
  vi.stubGlobal("BroadcastChannel", undefined);
  envState.production = true;
  envState.gaId = "G-TEST";
  envState.phKey = "phc_synthetic";
  envState.phHost = "https://eu.i.posthog.com";
  sentry.captureException.mockClear();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.doUnmock("posthog-js/dist/module.slim");
});

describe("before consent and without configuration", () => {
  it("loads both configured providers before a preference choice", async () => {
    const { browser, posthog, lifecycle } = await load();
    lifecycle.startAnalytics();
    lifecycle.recordNavigation("/");
    await settle();
    expect(browser.scripts).toHaveLength(1);
    expect(posthog.init).toHaveBeenCalledOnce();
    expect(posthog.capture).toHaveBeenCalledOnce();
  });

  it("stays inert when neither provider is configured", async () => {
    envState.gaId = undefined;
    envState.phKey = undefined;
    envState.phHost = undefined;
    const { browser, posthog, lifecycle } = await load();
    browser.grantAnalytics();
    lifecycle.startAnalytics();
    lifecycle.recordNavigation("/");
    await settle();
    expect(browser.scripts).toHaveLength(0);
    expect(posthog.init).not.toHaveBeenCalled();
  });

  it.each([
    ["key", { phKey: undefined }],
    ["host", { phHost: undefined }],
  ])("does not start PostHog without its %s", async (_label, change) => {
    Object.assign(envState, change);
    const { browser, posthog, lifecycle } = await load();
    browser.grantAnalytics();
    lifecycle.startAnalytics();
    await settle();
    expect(posthog.init).not.toHaveBeenCalled();
    expect(browser.scripts).toHaveLength(1);
  });

  it("does nothing during local development", async () => {
    envState.production = false;
    const { browser, posthog, lifecycle } = await load();
    browser.grantAnalytics();
    lifecycle.startAnalytics();
    lifecycle.recordNavigation("/");
    await settle();
    expect(browser.scripts).toHaveLength(0);
    expect(posthog.init).not.toHaveBeenCalled();
  });
});

describe("GA4 loading", () => {
  it("sets Consent Mode defaults to denied before loading gtag.js", async () => {
    const { browser, lifecycle } = await load();
    browser.grantAnalytics();
    lifecycle.startAnalytics();
    expect(browser.scripts.map((script) => script.src)).toEqual([GA_SCRIPT]);
    expect(browser.scripts[0]?.async).toBe(true);
    expect(browser.dataLayer()).toEqual([
      [
        "consent",
        "default",
        {
          analytics_storage: "denied",
          ad_storage: "denied",
          ad_user_data: "denied",
          ad_personalization: "denied",
        },
      ],
    ]);
    expect(window.gtag).toBeUndefined();
  });

  it("grants analytics only, then configures without an automatic page view", async () => {
    const { browser, lifecycle } = await load();
    browser.grantAnalytics();
    lifecycle.startAnalytics();
    browser.loadScript();
    const layer = browser.dataLayer();
    expect(layer.map((entry) => entry[0])).toEqual([
      "consent",
      "consent",
      "js",
      "config",
    ]);
    expect(layer[1]).toEqual([
      "consent",
      "update",
      { analytics_storage: "granted" },
    ]);
    expect(layer[3]).toEqual(["config", "G-TEST", { send_page_view: false }]);
    expect(typeof window.gtag).toBe("function");
  });

  it("sends the queued page view once after the script loads", async () => {
    const { browser, lifecycle } = await load({
      browser: { href: "https://peploes.test/menus/dinner" },
    });
    browser.grantAnalytics();
    lifecycle.startAnalytics();
    lifecycle.recordNavigation("/menus/dinner");
    expect(gaEvents(browser, "page_view")).toEqual([]);
    browser.loadScript();
    expect(gaEvents(browser, "page_view")).toEqual([
      {
        page_location: "https://peploes.test/menus/dinner",
        page_path: "/menus/dinner",
      },
    ]);
  });

  it("a saved preference does not duplicate the initial pageview", async () => {
    const { browser, lifecycle, consent } = await load();
    lifecycle.startAnalytics();
    lifecycle.recordNavigation("/");
    browser.loadScript();
    consent.saveCookiePreferences(ACCEPTED);
    consent.saveCookiePreferences(DENIED);
    expect(gaEvents(browser, "page_view")).toHaveLength(1);
  });

  it("keeps the site working when the script fails, and never retries", async () => {
    const { browser, lifecycle, consent, client } = await load();
    browser.grantAnalytics();
    lifecycle.startAnalytics();
    lifecycle.recordNavigation("/");
    expect(() => browser.failScript()).not.toThrow();
    expect(browser.scripts[0]?.removed).toBe(true);
    consent.saveCookiePreferences(ACCEPTED);
    client.trackCustomEvent("booking_click", { placement: "hero" });
    expect(browser.scripts).toHaveLength(1);
    expect(window.gtag).toBeUndefined();
    expect(sentry.captureException).not.toHaveBeenCalled();
  });

  it("gives up on a script that never answers", async () => {
    vi.useFakeTimers();
    const { browser, lifecycle } = await load();
    browser.grantAnalytics();
    lifecycle.startAnalytics();
    lifecycle.recordNavigation("/");
    vi.advanceTimersByTime(30_000);
    browser.loadScript();
    expect(window.gtag).toBeUndefined();
    expect(gaEvents(browser, "page_view")).toEqual([]);
  });
});

describe("page views", () => {
  it("counts each navigation once, including a revisit, and ignores a repeat of the same one", async () => {
    const { browser, lifecycle } = await load();
    browser.grantAnalytics();
    lifecycle.startAnalytics();
    browser.loadScript();
    lifecycle.recordNavigation("/");
    lifecycle.recordNavigation("/");
    lifecycle.recordNavigation("/menus");
    lifecycle.recordNavigation("/");
    expect(
      gaEvents(browser, "page_view").map(
        (p) => (p as { page_path: string }).page_path,
      ),
    ).toEqual(["/", "/menus", "/"]);
  });

  it("sends one page view per provider however often consent is granted", async () => {
    const { browser, posthog, lifecycle, consent } = await load();
    lifecycle.startAnalytics();
    lifecycle.recordNavigation("/menus");
    consent.saveCookiePreferences(ACCEPTED);
    consent.saveCookiePreferences(ACCEPTED);
    // Another tab granting writes the same choice and fires a storage event.
    browser.local.set(
      "peploes.cookie-preferences.v1",
      JSON.stringify(ACCEPTED),
    );
    browser.fireStorageEvent("peploes.cookie-preferences.v1");
    await settle();
    browser.loadScript();
    expect(gaEvents(browser, "page_view")).toHaveLength(1);
    expect(
      posthog.capture.mock.calls.filter(([name]) => name === "$pageview"),
    ).toHaveLength(1);
  });

  it("sends the same navigation to PostHog as a $pageview", async () => {
    const { browser, posthog, lifecycle } = await load();
    browser.grantAnalytics();
    lifecycle.startAnalytics();
    await settle();
    lifecycle.recordNavigation("/");
    lifecycle.recordNavigation("/");
    lifecycle.recordNavigation("/menus");
    lifecycle.recordNavigation("/");
    expect(posthog.capture.mock.calls.map(([name]) => name)).toEqual([
      "$pageview",
      "$pageview",
      "$pageview",
    ]);
    expect(posthog.capture.mock.calls[1]?.[1]).toEqual({
      page_location: "https://peploes.test/menus",
      page_path: "/menus",
      page_referrer: "https://peploes.test",
      $current_url: "https://peploes.test/menus",
      $pathname: "/menus",
      $referrer: "https://peploes.test",
    });
  });

  it("leaks no query, hash or email to either provider", async () => {
    const { browser, posthog, lifecycle } = await load({
      browser: {
        href: "https://peploes.test/menus?email=jane@example.com&token=abc#frag",
        referrer: "https://search.example/results?q=jane@example.com",
      },
    });
    browser.grantAnalytics();
    lifecycle.startAnalytics();
    await settle();
    browser.loadScript();
    lifecycle.recordNavigation("/menus");
    const sent = JSON.stringify([
      browser.dataLayer(),
      posthog.capture.mock.calls,
    ]);
    expect(sent).not.toMatch(/jane|token|frag|email=|q=/);
    expect(sent).toContain("https://search.example");
  });
});

describe("event routing", () => {
  it("sends catalog events to both providers and drops others", async () => {
    const { browser, posthog, lifecycle, client } = await load();
    browser.grantAnalytics();
    lifecycle.startAnalytics();
    await settle();
    browser.loadScript();
    client.trackCustomEvent("booking_click", { placement: "hero" });
    client.trackCustomEvent("contact_click", {
      placement: "footer",
      destination: "phone",
    });
    client.trackCustomEvent("purchase", { value: 10 });
    expect(gaEvents(browser, "booking_click")).toEqual([
      { placement: "hero", page_location: "https://peploes.test/" },
    ]);
    expect(posthog.capture.mock.calls).toEqual([
      ["booking_click", { placement: "hero" }, INSTANT],
      ["contact_click", { placement: "footer", destination: "phone" }, INSTANT],
    ]);
    expect(gaEvents(browser, "purchase")).toEqual([]);
  });

  it("routes optional events after rejection without replay on acceptance", async () => {
    const { browser, posthog, lifecycle, client, consent } = await load();
    lifecycle.startAnalytics();
    await settle();
    browser.loadScript();
    consent.saveCookiePreferences(DENIED);
    client.trackCustomEvent("booking_click", { placement: "hero" });
    consent.saveCookiePreferences(ACCEPTED);
    expect(gaEvents(browser, "booking_click")).toHaveLength(1);
    expect(posthog.capture).toHaveBeenCalledOnce();
  });
});

describe("PostHog initialisation", () => {
  it("initialises once, with every extra surface off", async () => {
    const { browser, posthog, lifecycle } = await load();
    browser.grantAnalytics();
    lifecycle.startAnalytics();
    lifecycle.startAnalytics();
    await settle();
    expect(posthog.init).toHaveBeenCalledTimes(1);
    expect(posthog.init.mock.calls[0]?.[0]).toBe("phc_synthetic");
    expect(phConfig(posthog)).toMatchObject({
      api_host: "https://eu.i.posthog.com",
      person_profiles: "identified_only",
      capture_pageview: false,
      capture_pageleave: false,
      autocapture: false,
      disable_session_recording: true,
      capture_exceptions: false,
      disable_surveys: true,
      advanced_disable_flags: true,
      enable_heatmaps: false,
    });
    expect(posthog.opt_in_capturing).toHaveBeenCalledWith({
      captureEventName: false,
    });
    expect(posthog.identify).not.toHaveBeenCalled();
  });

  it("survives an SDK that cannot be imported, without noise", async () => {
    const { browser, posthog, lifecycle, client } = await load({
      importFails: true,
    });
    browser.grantAnalytics();
    expect(() => lifecycle.startAnalytics()).not.toThrow();
    lifecycle.recordNavigation("/");
    await settle();
    browser.loadScript();
    client.trackCustomEvent("booking_click", { placement: "hero" });
    expect(posthog.init).not.toHaveBeenCalled();
    expect(gaEvents(browser, "page_view")).toHaveLength(1);
    expect(gaEvents(browser, "booking_click")).toHaveLength(1);
    expect(sentry.captureException).not.toHaveBeenCalled();
  });

  it("survives an SDK whose init throws", async () => {
    const { browser, posthog, lifecycle, client } = await load({
      initThrows: true,
    });
    browser.grantAnalytics();
    lifecycle.startAnalytics();
    await settle();
    client.trackCustomEvent("booking_click", { placement: "hero" });
    expect(posthog.capture).not.toHaveBeenCalled();
    expect(sentry.captureException).not.toHaveBeenCalled();
  });

  it("finishes provider initialization when preferences change during import", async () => {
    const { posthog, release, lifecycle, consent } = await load({
      holdImport: true,
    });
    lifecycle.startAnalytics();
    lifecycle.recordNavigation("/");
    consent.saveCookiePreferences(DENIED);
    release();
    await settle();
    expect(posthog.init).toHaveBeenCalledOnce();
    expect(posthog.capture).toHaveBeenCalledOnce();
  });

  it("holds the page view until the SDK is ready, then sends it once", async () => {
    const { browser, posthog, lifecycle, release } = await load({
      holdImport: true,
    });
    browser.grantAnalytics();
    lifecycle.startAnalytics();
    lifecycle.recordNavigation("/");
    expect(posthog.capture).not.toHaveBeenCalled();
    release();
    await settle();
    expect(posthog.capture).toHaveBeenCalledTimes(1);
  });
});

describe("placeholder preference changes", () => {
  it("do not stop providers, clear attribution, reset identities or reload scripts", async () => {
    const { browser, posthog, lifecycle, client, consent } = await load({
      browser: { href: "https://peploes.test/?utm_source=newsletter" },
    });
    lifecycle.startAnalytics();
    lifecycle.recordNavigation("/");
    await settle();
    browser.loadScript();
    consent.saveCookiePreferences(DENIED);
    lifecycle.recordNavigation("/our-story");
    client.trackCustomEvent("booking_click", { placement: "hero" });
    expect(gaEvents(browser, "page_view")).toHaveLength(2);
    expect(gaEvents(browser, "booking_click")).toHaveLength(1);
    expect(posthog.capture).toHaveBeenCalledTimes(3);
    expect(posthog.reset).not.toHaveBeenCalled();
    expect(posthog.opt_out_capturing).not.toHaveBeenCalled();
    expect(browser.scripts).toHaveLength(1);
    expect(browser.session.has("app_utm_params")).toBe(true);
  });
  it("another tab's rejection leaves measurement running", async () => {
    const { browser, lifecycle } = await load();
    lifecycle.startAnalytics();
    lifecycle.recordNavigation("/");
    browser.loadScript();
    browser.storeRawConsent(JSON.stringify(DENIED));
    browser.fireStorageEvent(COOKIE_PREFERENCES.storageKey);
    lifecycle.recordNavigation("/our-story");
    expect(gaEvents(browser, "page_view")).toHaveLength(2);
  });
});

describe("PostHog before_send", () => {
  async function scrubber() {
    const { browser, posthog, lifecycle } = await load();
    browser.grantAnalytics();
    lifecycle.startAnalytics();
    await settle();
    return phConfig(posthog).before_send;
  }

  it("strips query and hash from every URL-like property", async () => {
    const beforeSend = await scrubber();
    const result = beforeSend({
      event: "$pageview",
      properties: {
        $current_url: "https://peploes.test/menus?email=a@b.co#x",
        $referrer: "https://search.example/r?q=secret",
        $initial_referrer: "https://search.example/r?q=secret",
        $initial_current_url: "https://peploes.test/?utm_source=x#y",
        $pathname: "/menus?token=abc",
        $os: "Linux",
        page_path: "/menus",
      },
      $set: { $initial_referrer: "https://x.example/?a=1" },
      $set_once: { $initial_current_url: "https://x.example/?a=1" },
    });
    expect(result).toEqual({
      event: "$pageview",
      properties: {
        $current_url: "https://peploes.test/menus",
        $referrer: "https://search.example",
        $initial_referrer: "https://search.example",
        $initial_current_url: "https://peploes.test/",
        $pathname: "/menus",
        $os: "Linux",
        page_path: "/menus",
      },
    });
  });

  it.each([
    "$autocapture",
    "$pageleave",
    "$opt_in",
    "$exception",
    "$web_vitals",
    "purchase",
  ])("drops the %s event", async (event) => {
    const beforeSend = await scrubber();
    expect(beforeSend({ event, properties: {} })).toBeNull();
  });

  it("drops custom properties that are not allowlisted for the event", async () => {
    const beforeSend = await scrubber();
    const result = beforeSend({
      event: "booking_click",
      properties: {
        placement: "hero",
        email: "a@b.co",
        name: "Jane",
        $os: "Linux",
      },
    });
    expect(result?.properties).toEqual({ placement: "hero", $os: "Linux" });
  });

  it("drops a URL it cannot make safe", async () => {
    const beforeSend = await scrubber();
    const result = beforeSend({
      event: "$pageview",
      properties: { $current_url: "https://peploes.test/jane@example.com" },
    });
    expect(result?.properties).toEqual({});
  });
});

describe("GA4 failure is not a consent teardown", () => {
  it("keeps a slow PostHog import's first page view when gtag.js fails first", async () => {
    const { browser, posthog, lifecycle, release } = await load({
      holdImport: true,
    });
    browser.grantAnalytics();
    lifecycle.startAnalytics();
    lifecycle.recordNavigation("/");
    browser.failScript();
    release();
    await settle();
    expect(posthog.capture.mock.calls.map(([name]) => name)).toEqual([
      "$pageview",
    ]);
  });

  it("does not resend a delivered PostHog page view when gtag.js fails and consent is saved again", async () => {
    const { browser, posthog, lifecycle, consent } = await load();
    browser.grantAnalytics();
    lifecycle.startAnalytics();
    lifecycle.recordNavigation("/");
    await settle();
    expect(posthog.capture).toHaveBeenCalledTimes(1);
    browser.failScript();
    consent.saveCookiePreferences(ACCEPTED);
    await settle();
    expect(posthog.capture).toHaveBeenCalledTimes(1);
  });

  it("keeps stored campaign attribution when gtag.js times out", async () => {
    vi.useFakeTimers();
    const { browser, lifecycle, client } = await load({
      browser: { href: "https://peploes.test/?utm_source=newsletter" },
    });
    browser.grantAnalytics();
    lifecycle.startAnalytics();
    client.trackCustomEvent("booking_click", { placement: "hero" });
    expect(browser.session.size).toBe(1);
    vi.advanceTimersByTime(30_000);
    expect(browser.session.size).toBe(1);
  });
});

describe("PostHog-only withdrawal", () => {
  it("retains safe attribution after placeholder changes with PostHog alone", async () => {
    envState.gaId = undefined;
    const { browser, lifecycle, consent } = await load({
      browser: { href: "https://peploes.test/?utm_source=newsletter" },
    });
    lifecycle.startAnalytics();
    lifecycle.recordNavigation("/");
    await settle();
    consent.saveCookiePreferences(DENIED);
    expect(browser.session.has("app_utm_params")).toBe(true);
  });
});
