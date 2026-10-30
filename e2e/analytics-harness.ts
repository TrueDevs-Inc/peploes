import { gunzipSync } from "node:zlib";

import type { BrowserContext, Page, Request } from "@playwright/test";
import { test as base, expect } from "@playwright/test";

export { expect } from "@playwright/test";

export const GA_ID = "G-TEST000000";
export const POSTHOG_HOST = "https://eu.i.posthog.com";

type TProvider = "ga" | "gtag-js" | "posthog" | "posthog-asset";

export interface IGaHit {
  event: string;
  location: string;
  params: Record<string, string>;
}

export interface IPostHogEvent {
  event: string;
  properties: Record<string, unknown>;
}

interface ITraffic {
  provider: TProvider;
  method: string;
  path: string;
  /** Decoded events, for PostHog capture requests only. */
  events?: IPostHogEvent[];
  gaHit?: IGaHit;
}

const GA_HOSTS = /(^|\.)(google-analytics\.com|analytics\.google\.com)$/;
const POSTHOG_CAPTURE = /^\/(e|i\/v0\/e|batch)\/?$/;
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
};

/**
 * Minimal stand-in for gtag.js. Like the real script it consumes dataLayer
 * Arguments objects (existing and future), honours Consent Mode, and reports
 * each event to google-analytics.com/g/collect with the page_location it was
 * given, falling back to the raw browser URL (what the real script does).
 */
const GTAG_STUB = `
(function () {
  var layer = (window.dataLayer = window.dataLayer || []);
  var consent = {};
  var configured = false;
  var tid = "";
  window.__gtagStubLoads = (window.__gtagStubLoads || 0) + 1;
  function collect(name, params) {
    var query = new URLSearchParams({ v: "2", tid: tid, en: name });
    query.set("dl", params.page_location || window.location.href);
    Object.keys(params).forEach(function (key) {
      query.set("ep." + key, String(params[key]));
    });
    fetch("https://www.google-analytics.com/g/collect?" + query.toString(), {
      method: "POST",
      mode: "no-cors",
      keepalive: true,
    }).catch(function () {});
  }
  function handle(entry) {
    var command = Array.prototype.slice.call(entry);
    if (command[0] === "consent") {
      Object.assign(consent, command[2]);
    } else if (command[0] === "config") {
      tid = command[1];
      configured = true;
      if (consent.analytics_storage === "granted") {
        document.cookie = "_ga=GA1.1.111.222; path=/";
        document.cookie = "_ga_TEST000000=GS2.1.s1; path=/";
      }
    } else if (command[0] === "event") {
      if (configured && consent.analytics_storage === "granted") {
        collect(command[1], command[2] || {});
      }
    }
  }
  layer.slice().forEach(handle);
  var push = layer.push;
  layer.push = function () {
    Array.prototype.slice.call(arguments).forEach(handle);
    return push.apply(layer, arguments);
  };
})();
`;

function decodePostHogBody(buffer: Buffer | null): IPostHogEvent[] {
  if (!buffer || buffer.length === 0) return [];
  let text: string;
  if (buffer[0] === 0x1f && buffer[1] === 0x8b) {
    text = gunzipSync(buffer).toString("utf8");
  } else {
    text = buffer.toString("utf8");
    if (text.startsWith("data=")) {
      text = Buffer.from(decodeURIComponent(text.slice(5)), "base64").toString(
        "utf8",
      );
    }
  }
  try {
    const parsed: unknown = JSON.parse(text);
    const list = Array.isArray(parsed)
      ? parsed
      : Array.isArray((parsed as { batch?: unknown }).batch)
        ? (parsed as { batch: unknown[] }).batch
        : [parsed];
    return list as IPostHogEvent[];
  } catch {
    return [];
  }
}

export class AnalyticsRecorder {
  readonly traffic: ITraffic[] = [];
  readonly errors: string[] = [];
  /** While set, gtag.js and lazy Next chunks wait for `release()`. */
  private gate: { promise: Promise<void>; open: () => void } | null = null;
  private blocked = new Set<TProvider>();

  get ga(): IGaHit[] {
    return this.traffic.flatMap((t) => (t.gaHit ? [t.gaHit] : []));
  }

  get posthogEvents(): IPostHogEvent[] {
    return this.traffic.flatMap((t) => t.events ?? []);
  }

  get providerRequests(): ITraffic[] {
    return this.traffic;
  }

  gaPageViews(): IGaHit[] {
    return this.ga.filter((hit) => hit.event === "page_view");
  }

  posthogPageViews(): IPostHogEvent[] {
    return this.posthogEvents.filter((e) => e.event === "$pageview");
  }

  gaNamed(event: string): IGaHit[] {
    return this.ga.filter((hit) => hit.event === event);
  }

  posthogNamed(event: string): IPostHogEvent[] {
    return this.posthogEvents.filter((e) => e.event === event);
  }

  hold(): void {
    let open = () => {};
    const promise = new Promise<void>((resolve) => {
      open = resolve;
    });
    this.gate = { promise, open };
  }

  release(): void {
    this.gate?.open();
    this.gate = null;
  }

  block(...providers: TProvider[]): void {
    for (const provider of providers) this.blocked.add(provider);
  }

  async waitGate(): Promise<void> {
    await this.gate?.promise;
  }

  isBlocked(provider: TProvider): boolean {
    return this.blocked.has(provider);
  }

  /** Request log with identifiers removed. */
  redactedLog(): string {
    return JSON.stringify(
      this.traffic.map((t) => ({
        ...t,
        events: t.events?.map((e) => ({
          event: e.event,
          properties: Object.fromEntries(
            Object.entries(e.properties).filter(
              ([key]) =>
                ![
                  "distinct_id",
                  "$device_id",
                  "$session_id",
                  "$window_id",
                  "$pageview_id",
                  "$insert_id",
                  "token",
                ].includes(key),
            ),
          ),
        })),
      })),
      null,
      2,
    );
  }
}

function toGaHit(url: URL): IGaHit {
  const params: Record<string, string> = {};
  for (const [key, value] of url.searchParams) {
    if (key.startsWith("ep.")) params[key.slice(3)] = value;
  }
  return {
    event: url.searchParams.get("en") ?? "",
    location: url.searchParams.get("dl") ?? "",
    params,
  };
}

function toTraffic(request: Request): ITraffic | null {
  const url = new URL(request.url());
  const method = request.method();
  if (url.hostname === "www.googletagmanager.com") {
    return { provider: "gtag-js", method, path: url.pathname };
  }
  if (GA_HOSTS.test(url.hostname)) {
    return { provider: "ga", method, path: url.pathname, gaHit: toGaHit(url) };
  }
  if (!url.hostname.endsWith("posthog.com") || method === "OPTIONS") {
    return null;
  }
  const capture = POSTHOG_CAPTURE.test(url.pathname);
  return {
    provider: capture ? "posthog" : "posthog-asset",
    method,
    path: url.pathname,
    events: capture ? decodePostHogBody(request.postDataBuffer()) : undefined,
  };
}

async function installRoutes(
  context: BrowserContext,
  recorder: AnalyticsRecorder,
): Promise<void> {
  context.on("request", (request: Request) => {
    const entry = toTraffic(request);
    if (entry) recorder.traffic.push(entry);
  });

  await context.route("https://www.googletagmanager.com/**", async (route) => {
    if (recorder.isBlocked("gtag-js")) return route.abort();
    await recorder.waitGate();
    await route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: GTAG_STUB,
    });
  });
  await context.route(
    (url) => GA_HOSTS.test(url.hostname),
    (route) => route.fulfill({ status: 204, headers: CORS }),
  );
  await context.route(
    (url) => url.hostname.endsWith("posthog.com"),
    (route) => {
      const request = route.request();
      if (recorder.isBlocked("posthog")) return route.abort();
      if (request.method() === "OPTIONS") {
        return route.fulfill({ status: 204, headers: CORS });
      }
      const path = new URL(request.url()).pathname;
      if (path.startsWith("/static/") || path.startsWith("/array/")) {
        return route.fulfill({
          status: 200,
          contentType: "application/javascript",
          headers: CORS,
          body: "",
        });
      }
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: CORS,
        body: JSON.stringify({ status: 1 }),
      });
    },
  );
  // Lazy application chunks (the posthog-js import) wait while the gate is held.
  await context.route("**/_next/static/chunks/**", async (route) => {
    await recorder.waitGate();
    await route.continue();
  });
}

function watchPage(page: Page, recorder: AnalyticsRecorder): void {
  page.on("pageerror", (error) =>
    recorder.errors.push(`pageerror: ${error.message}`),
  );
  page.on("console", (message) => {
    if (/content security policy/i.test(message.text())) {
      recorder.errors.push(`csp: ${message.text()}`);
    }
  });
}

export const test = base.extend<{ analytics: AnalyticsRecorder }>({
  analytics: async ({ context }, use, testInfo) => {
    const recorder = new AnalyticsRecorder();
    // posthog-js treats webdriver and HeadlessChrome brand browsers as bots and
    // drops their events, which would hide real SDK delivery from this suite.
    await context.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", {
        configurable: true,
        get: () => false,
      });
      Object.defineProperty(navigator, "userAgentData", {
        configurable: true,
        get: () => undefined,
      });
    });
    await installRoutes(context, recorder);
    context.on("page", (page) => watchPage(page, recorder));
    await use(recorder);
    await testInfo.attach("provider-requests.json", {
      body: recorder.redactedLog(),
      contentType: "application/json",
    });
    expect(recorder.errors, "page errors and CSP violations").toEqual([]);
  },
  page: async ({ context, analytics: _analytics }, use) => {
    await use(await context.newPage());
  },
});

export async function openPreferences(page: Page) {
  await page
    .getByRole("button", { name: "Cookie Settings", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Cookie Preferences",
    exact: true,
  });
  await expect(dialog).toBeVisible();
  return dialog;
}

export async function acceptAll(page: Page): Promise<void> {
  const dialog = await openPreferences(page);
  await dialog.getByRole("button", { name: "Accept All", exact: true }).click();
  await expect(dialog).not.toBeVisible();
}

export async function rejectAll(page: Page): Promise<void> {
  const dialog = await openPreferences(page);
  await dialog
    .getByRole("button", { name: "Reject non-essential", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
}

/** Wait past PostHog's 3 second batch timer before asserting absence. */
export const FLUSH_WAIT_MS = 4000;

export async function settle(page: Page): Promise<void> {
  await page.waitForTimeout(FLUSH_WAIT_MS);
}

/** Waits for the expected counts, then past a flush to prove nothing extra follows. */
export async function expectPageViews(
  page: Page,
  recorder: AnalyticsRecorder,
  expected: number,
): Promise<void> {
  await expect
    .poll(() => recorder.gaPageViews().length, { timeout: 15_000 })
    .toBe(expected);
  await expect
    .poll(() => recorder.posthogPageViews().length, { timeout: 15_000 })
    .toBe(expected);
  await settle(page);
  expect(recorder.gaPageViews()).toHaveLength(expected);
  expect(recorder.posthogPageViews()).toHaveLength(expected);
}

/** Cookies and web storage keys that belong to either provider. */
export async function providerStorage(page: Page): Promise<string[]> {
  const stored = await page.evaluate(() => {
    const keys: string[] = [];
    for (const area of [window.localStorage, window.sessionStorage]) {
      for (let i = 0; i < area.length; i += 1) {
        const key = area.key(i);
        if (key) keys.push(key);
      }
    }
    for (const cookie of document.cookie.split(";")) {
      const name = cookie.split("=")[0]?.trim();
      if (name) keys.push(name);
    }
    return keys;
  });
  return stored.filter((key) => /^(ph_|_ga|_gid|_gat|__ph|app_utm)/i.test(key));
}

/** Keeps tel: and mailto: from invoking an external handler; React onClick still runs. */
export async function suppressNavigationOfLinks(page: Page): Promise<void> {
  await page.evaluate(() => {
    document.addEventListener(
      "click",
      (event) => {
        const link = (event.target as Element | null)?.closest("a");
        if (/^(tel|mailto):/.test(link?.getAttribute("href") ?? "")) {
          event.preventDefault();
        }
      },
      true,
    );
  });
}
