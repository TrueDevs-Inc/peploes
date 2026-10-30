import { vi } from "vitest";

import { COOKIE_PREFERENCES } from "@/lib/constants/cookie-consent";

interface IFakeBrowserOptions {
  href?: string;
  referrer?: string;
  blockLocalWrites?: boolean;
  blockSessionStorage?: boolean;
}

export interface IFakeScript {
  src: string;
  async: boolean;
  removed: boolean;
  onload?: () => void;
  onerror?: () => void;
  remove: () => void;
}

type TStorageListener = (event: { key: string | null }) => void;

/** Minimal window/document pair for the consent and analytics seams. */
export function installFakeBrowser(options: IFakeBrowserOptions = {}) {
  const local = new Map<string, string>();
  const session = new Map<string, string>();
  const listeners = new Set<TStorageListener>();
  const gtag = vi.fn();
  const scripts: IFakeScript[] = [];
  const jar = new Map<
    string,
    { name: string; value: string; domain: string }
  >();
  const location = new URL(options.href ?? "https://peploes.test/");

  const storage = (store: Map<string, string>, blockWrites: boolean) => ({
    get length() {
      return store.size;
    },
    key: (index: number) => [...store.keys()][index] ?? null,
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      if (blockWrites) throw new Error("Storage blocked");
      store.set(key, value);
    },
    removeItem: (key: string) => store.delete(key),
  });

  const cookieKey = (name: string, domain: string) => `${name}|${domain}`;
  const hostName = () => location.hostname;
  const visible = (domain: string) =>
    domain === "" || domain === hostName() || hostName().endsWith(`.${domain}`);

  const browser = {
    local,
    scripts,
    cookieNames: () =>
      [...jar.values()].filter((c) => visible(c.domain)).map((c) => c.name),
    setCookie(name: string, value = "1", domain = "") {
      const host = domain.replace(/^\./, "");
      jar.set(cookieKey(name, host), { name, value, domain: host });
    },
    /** Empties every store and listener so one fake window can serve many tests. */
    reset() {
      local.clear();
      session.clear();
      jar.clear();
      scripts.length = 0;
      listeners.clear();
      win.dataLayer = undefined;
      win.gtag = gtag;
      location.href = options.href ?? "https://peploes.test/";
      doc.referrer = options.referrer ?? "";
    },
    loadScript(index = scripts.length - 1) {
      scripts[index]?.onload?.();
    },
    failScript(index = scripts.length - 1) {
      scripts[index]?.onerror?.();
    },
    dataLayer: () =>
      ((win.dataLayer as ArrayLike<unknown>[] | undefined) ?? []).map((entry) =>
        Array.from(entry),
      ),
    session,
    gtag,
    listenerCount: () => listeners.size,
    setLocation(href: string) {
      const next = new URL(href);
      location.href = next.href;
    },
    grantAnalytics() {
      local.set(
        COOKIE_PREFERENCES.storageKey,
        JSON.stringify(COOKIE_PREFERENCES.accepted),
      );
    },
    storeRawConsent(value: string | null) {
      if (value === null) local.delete(COOKIE_PREFERENCES.storageKey);
      else local.set(COOKIE_PREFERENCES.storageKey, value);
    },
    fireStorageEvent(key: string | null) {
      for (const listener of [...listeners]) listener({ key });
    },
    removeGtag() {
      Reflect.deleteProperty(win, "gtag");
    },
  };

  const win: Record<string, unknown> = {
    localStorage: storage(local, options.blockLocalWrites ?? false),
    location,
    gtag,
    addEventListener: (type: string, listener: TStorageListener) => {
      if (type === "storage") listeners.add(listener);
    },
    removeEventListener: (type: string, listener: TStorageListener) => {
      if (type === "storage") listeners.delete(listener);
    },
  };
  Object.defineProperty(win, "sessionStorage", {
    get() {
      if (options.blockSessionStorage) throw new Error("Storage blocked");
      return storage(session, false);
    },
  });

  vi.stubGlobal("window", win);
  const doc = {
    referrer: options.referrer ?? "",
    title: "Peploe's",
    head: { appendChild: (element: IFakeScript) => scripts.push(element) },
    createElement: (): IFakeScript => {
      const script: IFakeScript = {
        src: "",
        async: false,
        removed: false,
        remove: () => {
          script.removed = true;
        },
      };
      return script;
    },
  };
  Object.defineProperty(doc, "cookie", {
    get: () =>
      [...jar.values()]
        .filter((c) => visible(c.domain))
        .map((c) => `${c.name}=${c.value}`)
        .join("; "),
    set(raw: string) {
      const [pair = "", ...attributes] = raw.split(";");
      const [name = "", value = ""] = pair.trim().split("=");
      const attrs = attributes.map((a) => a.trim().toLowerCase());
      const domain = (
        attrs.find((a) => a.startsWith("domain="))?.slice(7) ?? ""
      ).replace(/^\./, "");
      const expired = attrs.some(
        (a) => a === "max-age=0" || a.startsWith("expires=thu, 01 jan 1970"),
      );
      if (expired) jar.delete(cookieKey(name, domain));
      else jar.set(cookieKey(name, domain), { name, value, domain });
    },
  });
  vi.stubGlobal("document", doc);
  return browser;
}

/** In-process BroadcastChannel: a message reaches every other open channel of the same name. */
export function installFakeBroadcastChannel() {
  const open = new Set<FakeChannel>();

  class FakeChannel {
    onmessage: ((event: { data: unknown }) => void) | null = null;
    closed = false;
    constructor(readonly name: string) {
      open.add(this);
    }
    postMessage(data: unknown) {
      if (this.closed) throw new Error("Channel closed");
      for (const channel of open) {
        if (channel !== this && channel.name === this.name) {
          channel.onmessage?.({ data });
        }
      }
    }
    close() {
      this.closed = true;
      open.delete(this);
    }
  }

  vi.stubGlobal("BroadcastChannel", FakeChannel);
  return {
    /** A channel as another tab would hold it. */
    otherTab: (name: string) => new FakeChannel(name),
    openCount: () => open.size,
  };
}
