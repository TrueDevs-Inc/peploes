import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { installFakeBrowser } from "../helpers/browser";
import { installSdkGlobals } from "../helpers/posthog-sdk";

const envState = vi.hoisted(() => ({
  gaId: undefined as string | undefined,
  phKey: "phc_synthetic" as string | undefined,
  phHost: "https://eu.i.posthog.com" as string | undefined,
}));
vi.mock("@/lib/env", () => ({
  env: {
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
  isLiveSiteClient: () => true,
}));

const ACCEPTED = { analytics: true, performance: true, marketing: true };
const DENIED = { analytics: false, performance: false, marketing: false };
const START_URL =
  "https://peploes.test/menus?utm_source=jane@example.com&utm_medium=email&ph_keyword=secret&gclid=abc123&email=a@b.co#frag";

let browser: ReturnType<typeof installFakeBrowser>;
let network: ReturnType<typeof installSdkGlobals>;

beforeAll(() => {
  browser = installFakeBrowser({
    href: START_URL,
    referrer: "https://search.example/results?q=jane@example.com",
  });
  browser.removeGtag();
  network = installSdkGlobals();
});
afterAll(() => vi.unstubAllGlobals());

beforeEach(() => {
  vi.useFakeTimers({
    toFake: [
      "setTimeout",
      "clearTimeout",
      "setInterval",
      "clearInterval",
      "Date",
    ],
  });
  browser.reset();
  browser.removeGtag();
  browser.setLocation(START_URL);
  network.requests.length = 0;
  network.status = 200;
  network.hang = false;
  network.signals.length = 0;
  network.windowListeners.length = 0;
  return () => vi.useRealTimers();
});

async function start() {
  vi.resetModules();
  const lifecycle = await import("@/lib/analytics/lifecycle");
  const consent = await import("@/lib/cookie-consent");
  const client = await import("@/lib/analytics/client");
  return { lifecycle, consent, client };
}

async function settle() {
  await vi.dynamicImportSettled();
  await vi.advanceTimersByTimeAsync(0);
}

const sentEvents = () => network.requests.flatMap((request) => request.events);

describe("pending SDK delivery on withdrawal", () => {
  it("sends a captured event after the SDK's batch interval", async () => {
    const { lifecycle } = await start();
    browser.grantAnalytics();
    lifecycle.startAnalytics();
    lifecycle.recordNavigation("/menus");
    await settle();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(sentEvents().map((e) => e.event)).toEqual(["$pageview"]);
  });

  it("sends each event at once and nothing after consent is withdrawn", async () => {
    const { lifecycle, consent } = await start();
    browser.grantAnalytics();
    lifecycle.startAnalytics();
    lifecycle.recordNavigation("/menus");
    await settle();
    expect(network.requests).toHaveLength(1);
    consent.saveCookiePreferences(DENIED);
    lifecycle.recordNavigation("/visit");
    await vi.advanceTimersByTimeAsync(60_000);
    expect(network.requests).toHaveLength(1);
  });

  it("does not retry a failed request after withdrawal, nor resend it after re-consent", async () => {
    const { lifecycle, consent } = await start();
    browser.grantAnalytics();
    lifecycle.startAnalytics();
    lifecycle.recordNavigation("/menus");
    await settle();
    network.status = 500;
    await vi.advanceTimersByTimeAsync(3_500);
    expect(network.requests).toHaveLength(1);

    consent.saveCookiePreferences(DENIED);
    await vi.advanceTimersByTimeAsync(120_000);
    expect(network.requests).toHaveLength(1);

    network.status = 200;
    consent.saveCookiePreferences(ACCEPTED);
    await settle();
    await vi.advanceTimersByTimeAsync(120_000);
    const urls = sentEvents().map((e) => e.event);
    expect(urls).toEqual(["$pageview", "$pageview"]);
    expect(network.requests.slice(1).flatMap((r) => r.events)).toHaveLength(1);
  });
});

describe("SDK properties", () => {
  it("lets no campaign, keyword, query or hash value through", async () => {
    const { lifecycle } = await start();
    browser.grantAnalytics();
    lifecycle.startAnalytics();
    lifecycle.recordNavigation("/menus");
    await settle();
    await vi.advanceTimersByTimeAsync(10_000);
    const payload = JSON.stringify(sentEvents());
    expect(payload).not.toMatch(
      /jane|secret|gclid|abc123|a@b\.co|frag|q=|ph_keyword|email=/,
    );
    const [event] = sentEvents();
    const properties = event?.properties as Record<string, unknown>;
    expect(properties.$session_entry_utm_medium).toBe("email");
    expect(properties.$session_entry_utm_source).toBeUndefined();
    expect(properties.$current_url).toBe("https://peploes.test/menus");
    expect(properties.$referrer).toBe("https://search.example");
    expect(properties.$lib).toBe("web");
  });

  it("sends only allowlisted keys", async () => {
    const { lifecycle } = await start();
    browser.grantAnalytics();
    lifecycle.startAnalytics();
    lifecycle.recordNavigation("/menus");
    await settle();
    await vi.advanceTimersByTimeAsync(10_000);
    const allowed = new Set([
      "distinct_id",
      "token",
      "$os",
      "$browser",
      "$browser_version",
      "$browser_language",
      "$browser_language_prefix",
      "$device_type",
      "$device_id",
      "$timezone",
      "$timezone_offset",
      "$screen_height",
      "$screen_width",
      "$viewport_height",
      "$viewport_width",
      "$lib",
      "$lib_version",
      "$insert_id",
      "$time",
      "$session_id",
      "$window_id",
      "$pageview_id",
      "$is_identified",
      "$process_person_profile",
      "$host",
      "$referring_domain",
      "$session_entry_host",
      "$session_entry_referring_domain",
      "$current_url",
      "$pathname",
      "$referrer",
      "$session_entry_url",
      "$session_entry_pathname",
      "$session_entry_referrer",
      "$session_entry_utm_medium",
      "page_location",
      "page_path",
      "page_referrer",
      "utm_medium",
    ]);
    const keys = Object.keys(
      (sentEvents()[0]?.properties as Record<string, unknown>) ?? {},
    );
    expect(keys.filter((key) => !allowed.has(key))).toEqual([]);
  });
});

describe("request timeout and instance cost", () => {
  it("still times out a hanging request, so the SDK retries it", async () => {
    // AbortSignal.timeout runs on the runtime's clock, which fake timers skip.
    vi.spyOn(AbortSignal, "timeout").mockImplementation((ms) => {
      const timer = new AbortController();
      setTimeout(() => timer.abort(), ms);
      return timer.signal;
    });
    const { lifecycle } = await start();
    browser.grantAnalytics();
    lifecycle.startAnalytics();
    network.hang = true;
    lifecycle.recordNavigation("/menus");
    await settle();
    await vi.advanceTimersByTimeAsync(3_500);
    expect(network.requests).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(70_000);
    expect(network.requests.length).toBeGreaterThan(1);
  });

  it("still aborts a hanging request on withdrawal", async () => {
    const { lifecycle, consent } = await start();
    browser.grantAnalytics();
    lifecycle.startAnalytics();
    network.hang = true;
    lifecycle.recordNavigation("/menus");
    await settle();
    await vi.advanceTimersByTimeAsync(3_500);
    expect(network.signals.every((signal) => !signal.aborted)).toBe(true);
    consent.saveCookiePreferences(DENIED);
    expect(network.signals.every((signal) => signal.aborted)).toBe(true);
    await vi.advanceTimersByTimeAsync(120_000);
    expect(network.requests).toHaveLength(1);
  });

  it("registers no scroll or resize listeners across grant and withdraw cycles", async () => {
    const { lifecycle, consent } = await start();
    browser.grantAnalytics();
    lifecycle.startAnalytics();
    await settle();
    for (let cycle = 0; cycle < 3; cycle++) {
      consent.saveCookiePreferences(DENIED);
      consent.saveCookiePreferences(ACCEPTED);
      await settle();
    }
    const scrollLike = network.windowListeners.filter((type) =>
      ["scroll", "scrollend", "resize"].includes(type),
    );
    expect(scrollLike).toEqual([]);
  });

  it("does not start when fetch is unavailable, so no XHR fallback ignores withdrawal", async () => {
    const realFetch = fetch;
    vi.stubGlobal("fetch", undefined);
    const { lifecycle } = await start();
    browser.grantAnalytics();
    lifecycle.startAnalytics();
    lifecycle.recordNavigation("/menus");
    await settle();
    await vi.advanceTimersByTimeAsync(10_000);
    vi.stubGlobal("fetch", realFetch);
    expect(network.requests).toEqual([]);
    expect(
      network.windowListeners.filter((type) => type !== "storage"),
    ).toEqual([]);
  });
});

describe("page views queued behind a slow SDK load", () => {
  it("keeps each navigation's own URL, path and referrer", async () => {
    const { lifecycle } = await start();
    browser.grantAnalytics();
    browser.setLocation("https://peploes.test/");
    lifecycle.startAnalytics();
    lifecycle.recordNavigation("/");
    browser.setLocation("https://peploes.test/menus");
    lifecycle.recordNavigation("/menus");
    browser.setLocation("https://peploes.test/our-story");
    lifecycle.recordNavigation("/our-story");
    await settle();
    await vi.advanceTimersByTimeAsync(10_000);
    const views = sentEvents().map((event) => {
      const p = event.properties as Record<string, unknown>;
      return [p.$current_url, p.$pathname, p.$referrer];
    });
    expect(views).toEqual([
      ["https://peploes.test/", "/", "https://search.example"],
      ["https://peploes.test/menus", "/menus", "https://peploes.test"],
      ["https://peploes.test/our-story", "/our-story", "https://peploes.test"],
    ]);
  });
});
