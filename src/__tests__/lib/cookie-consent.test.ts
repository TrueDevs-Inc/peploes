import { afterEach, describe, expect, it, vi } from "vitest";

import { COOKIE_PREFERENCES } from "@/lib/constants/cookie-consent";
import {
  getCookiePreferences,
  hasAnalyticsConsent,
  saveCookiePreferences,
  subscribeToConsent,
} from "@/lib/cookie-consent";
import {
  installFakeBroadcastChannel,
  installFakeBrowser,
} from "../helpers/browser";

afterEach(() => vi.unstubAllGlobals());

describe("analytics consent", function analyticsConsentTests() {
  it("reports failure until a previous denial cookie can be cleared", async () => {
    let stored: string | null = null;
    let denial = `${COOKIE_PREFERENCES.denialCookie}=1`;
    let blockDeletion = true;
    vi.stubGlobal("document", {
      get cookie() {
        return denial;
      },
      set cookie(value: string) {
        if (!blockDeletion && value.includes("Max-Age=0")) denial = "";
      },
    });
    vi.stubGlobal("window", {
      localStorage: {
        getItem: () => stored,
        setItem: (_key: string, value: string) => {
          stored = value;
        },
      },
    });
    vi.resetModules();
    const consent = await import("@/lib/cookie-consent");
    expect(consent.saveCookiePreferences(COOKIE_PREFERENCES.accepted)).toBe(
      false,
    );
    expect(consent.hasAnalyticsConsent()).toBe(false);
    blockDeletion = false;
    expect(consent.saveCookiePreferences(COOKIE_PREFERENCES.accepted)).toBe(
      true,
    );
    expect(consent.hasAnalyticsConsent()).toBe(true);
  });

  it("keeps no choices from a failed save after the denial cookie expires", async () => {
    let stored: string | null = null;
    let denial = `${COOKIE_PREFERENCES.denialCookie}=1`;
    vi.stubGlobal("document", {
      get cookie() {
        return denial;
      },
      set cookie(_value: string) {},
    });
    vi.stubGlobal("window", {
      localStorage: {
        getItem: () => stored,
        setItem: (_key: string, value: string) => {
          stored = value;
        },
        removeItem: () => {
          stored = null;
        },
      },
    });
    vi.resetModules();
    const consent = await import("@/lib/cookie-consent");
    expect(consent.saveCookiePreferences(COOKIE_PREFERENCES.accepted)).toBe(
      false,
    );
    denial = "";
    expect(consent.hasAnalyticsConsent()).toBe(false);
  });

  it("denies analytics without a browser consent decision", function defaultConsentTest() {
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it("remembers individual choices and immediately honours analytics withdrawal", () => {
    const storage = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
      },
    });
    expect(hasAnalyticsConsent()).toBe(false);
    expect(
      saveCookiePreferences({
        analytics: true,
        performance: false,
        marketing: false,
      }),
    ).toBe(true);
    expect(hasAnalyticsConsent()).toBe(true);
    expect(getCookiePreferences()).toEqual({
      analytics: true,
      performance: false,
      marketing: false,
    });
    saveCookiePreferences({
      analytics: false,
      performance: true,
      marketing: false,
    });
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it.each(["broken JSON", '{"analytics":"true"}', '{"analytics":true}'])(
    "denies analytics for invalid stored preferences: %s",
    (stored) => {
      vi.stubGlobal("window", { localStorage: { getItem: () => stored } });
      expect(hasAnalyticsConsent()).toBe(false);
    },
  );

  it("denies tracking and reports save failure when storage is unavailable", () => {
    vi.stubGlobal("window", {
      get localStorage() {
        throw new Error("Storage blocked");
      },
    });
    expect(hasAnalyticsConsent()).toBe(false);
    expect(
      saveCookiePreferences({
        analytics: true,
        performance: true,
        marketing: true,
      }),
    ).toBe(false);
  });

  it("withdraws existing analytics consent even when storage becomes read-only", () => {
    let stored: string | null = null;
    let readOnly = false;
    vi.stubGlobal("window", {
      localStorage: {
        getItem: () => stored,
        setItem: (_key: string, value: string) => {
          if (readOnly) throw new Error("Storage full");
          stored = value;
        },
      },
    });
    saveCookiePreferences({
      analytics: true,
      performance: true,
      marketing: true,
    });
    expect(hasAnalyticsConsent()).toBe(true);
    readOnly = true;
    expect(
      saveCookiePreferences({
        analytics: false,
        performance: false,
        marketing: false,
      }),
    ).toBe(false);
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it("keeps failed withdrawal denied after a reload or in another tab", async () => {
    const stored = JSON.stringify({
      analytics: true,
      performance: true,
      marketing: true,
    });
    vi.stubGlobal("document", { cookie: "" });
    vi.stubGlobal("window", {
      localStorage: {
        getItem: () => stored,
        setItem: () => {
          throw new Error("Storage full");
        },
      },
    });
    expect(
      saveCookiePreferences({
        analytics: false,
        performance: false,
        marketing: false,
      }),
    ).toBe(false);
    vi.resetModules();
    const freshPage = await import("@/lib/cookie-consent");
    expect(freshPage.hasAnalyticsConsent()).toBe(false);
  });
});

describe("consent change notifications", () => {
  const granted = { analytics: true, performance: true, marketing: true };
  const denied = { analytics: false, performance: false, marketing: false };

  it("notifies same-tab listeners after a saved choice", () => {
    installFakeBrowser();
    const listener = vi.fn();
    const stop = subscribeToConsent(listener);
    saveCookiePreferences(granted);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(hasAnalyticsConsent()).toBe(true);
    stop();
  });

  it("notifies after a failed save so withdrawal fails closed", () => {
    const browser = installFakeBrowser();
    saveCookiePreferences(granted);
    browser.grantAnalytics();
    const seen: boolean[] = [];
    const stop = subscribeToConsent(() => seen.push(hasAnalyticsConsent()));
    vi.stubGlobal("window", {
      ...window,
      localStorage: {
        getItem: () => JSON.stringify(granted),
        setItem: () => {
          throw new Error("Storage full");
        },
      },
    });
    expect(saveCookiePreferences(denied)).toBe(false);
    expect(seen).toEqual([false]);
    stop();
  });

  it("resyncs when another tab changes the stored choice", () => {
    const browser = installFakeBrowser();
    const listener = vi.fn();
    const stop = subscribeToConsent(listener);
    browser.grantAnalytics();
    browser.fireStorageEvent("peploes.cookie-preferences.v1");
    browser.fireStorageEvent(null);
    browser.fireStorageEvent("unrelated-key");
    expect(listener).toHaveBeenCalledTimes(2);
    stop();
  });

  it("stops notifying and detaches the storage listener after unsubscribe", () => {
    const browser = installFakeBrowser();
    const listener = vi.fn();
    const stop = subscribeToConsent(listener);
    expect(browser.listenerCount()).toBe(1);
    stop();
    expect(browser.listenerCount()).toBe(0);
    saveCookiePreferences(granted);
    expect(listener).not.toHaveBeenCalled();
  });

  it("keeps notifying other listeners when one throws", () => {
    installFakeBrowser();
    const survivor = vi.fn();
    const stopBad = subscribeToConsent(() => {
      throw new Error("listener failure");
    });
    const stopGood = subscribeToConsent(survivor);
    saveCookiePreferences(granted);
    expect(survivor).toHaveBeenCalledTimes(1);
    stopBad();
    stopGood();
  });

  describe("across tabs without storage events", () => {
    const CHANNEL = COOKIE_PREFERENCES.broadcastChannel;

    it("resyncs when another tab broadcasts a consent change", () => {
      installFakeBrowser();
      const bus = installFakeBroadcastChannel();
      const listener = vi.fn();
      const stop = subscribeToConsent(listener);
      bus.otherTab(CHANNEL).postMessage({ source: "other-tab" });
      expect(listener).toHaveBeenCalledTimes(1);
      stop();
    });

    it("broadcasts a saved choice, including one whose write failed", () => {
      installFakeBrowser({ blockLocalWrites: true });
      const bus = installFakeBroadcastChannel();
      const heard = vi.fn();
      bus.otherTab(CHANNEL).onmessage = heard;
      expect(saveCookiePreferences(denied)).toBe(false);
      expect(heard).toHaveBeenCalledTimes(1);
    });

    it("does not notify its own tab twice for one save", () => {
      installFakeBrowser();
      installFakeBroadcastChannel();
      const listener = vi.fn();
      const stop = subscribeToConsent(listener);
      saveCookiePreferences(granted);
      expect(listener).toHaveBeenCalledTimes(1);
      stop();
    });

    it("closes its channel on unsubscribe and leaves none open after a save", () => {
      installFakeBrowser();
      const bus = installFakeBroadcastChannel();
      const stop = subscribeToConsent(() => {});
      expect(bus.openCount()).toBe(1);
      stop();
      expect(bus.openCount()).toBe(0);
      saveCookiePreferences(granted);
      expect(bus.openCount()).toBe(0);
    });

    it("still works where BroadcastChannel is unavailable", () => {
      installFakeBrowser();
      vi.stubGlobal("BroadcastChannel", undefined);
      const listener = vi.fn();
      const stop = subscribeToConsent(listener);
      expect(() => saveCookiePreferences(granted)).not.toThrow();
      expect(listener).toHaveBeenCalledTimes(1);
      stop();
    });
  });
});
