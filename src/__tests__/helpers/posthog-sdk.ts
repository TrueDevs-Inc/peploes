import { gunzipSync } from "node:zlib";
import { vi } from "vitest";

interface IFetchInit {
  body?: unknown;
  signal?: AbortSignal;
}

export interface ISdkRequest {
  url: string;
  events: Record<string, unknown>[];
}

/**
 * Runs the real posthog-js in Node: browser globals it reads at load time are
 * stubbed once, and the network is recorded instead of sent. Install this
 * before the first import of posthog-js and keep it for the whole file.
 */
export function installSdkGlobals() {
  const requests: ISdkRequest[] = [];
  const network = {
    status: 200,
    /** A hanging request settles only when its signal aborts. */
    hang: false,
    requests,
    /** URLs passed to navigator.sendBeacon, which bypasses fetch. */
    beacons: [] as string[],
    signals: [] as AbortSignal[],
    /** Event types the page registered on window, in order. */
    windowListeners: [] as string[],
  };

  const win = window as unknown as Record<string, unknown>;
  const navigatorStub = {
    userAgent:
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36",
    language: "en",
    onLine: true,
    sendBeacon: (url: string) => {
      network.beacons.push(url);
      return true;
    },
  };
  const addWindowListener = win.addEventListener as (
    type: string,
    listener: unknown,
    options?: unknown,
  ) => void;
  win.addEventListener = (
    type: string,
    listener: unknown,
    options?: unknown,
  ) => {
    network.windowListeners.push(type);
    addWindowListener(type, listener, options);
  };
  Object.assign(win, {
    navigator: navigatorStub,
    screen: { width: 1000, height: 800 },
    innerWidth: 1000,
    innerHeight: 800,
    history: { pushState: () => undefined },
    matchMedia: () => ({ matches: false }),
    console,
  });
  const doc = document as unknown as Record<string, unknown>;
  Object.assign(doc, {
    addEventListener: () => undefined,
    documentElement: { clientWidth: 1000, clientHeight: 800 },
    body: {},
    readyState: "complete",
    location: win.location,
  });
  vi.stubGlobal("navigator", navigatorStub);
  vi.stubGlobal("location", win.location);
  // Without it the SDK gzips through streams that need real event-loop turns.
  vi.stubGlobal("CompressionStream", undefined);
  vi.stubGlobal("fetch", (url: string, init: IFetchInit) => {
    // Like a real fetch, an aborted signal rejects before anything is sent.
    if (init.signal?.aborted) {
      return Promise.reject(new DOMException("Aborted", "AbortError"));
    }
    requests.push({ url, events: decode(init.body) });
    if (init.signal) network.signals.push(init.signal);
    if (network.hang) {
      return new Promise((_resolve, reject) => {
        init.signal?.addEventListener("abort", () =>
          reject(new DOMException("Aborted", "AbortError")),
        );
      });
    }
    return Promise.resolve({
      status: network.status,
      ok: network.status === 200,
      text: () => Promise.resolve("{}"),
      json: () => Promise.resolve({}),
      headers: new Headers(),
    });
  });
  return network;
}

function decode(body: unknown): Record<string, unknown>[] {
  const raw =
    body instanceof ArrayBuffer
      ? gunzipSync(Buffer.from(body)).toString("utf8")
      : String(body);
  const parsed: unknown = JSON.parse(raw);
  const list = Array.isArray(parsed)
    ? parsed
    : ((parsed as { batch?: unknown[] }).batch ?? [parsed]);
  return list as Record<string, unknown>[];
}
