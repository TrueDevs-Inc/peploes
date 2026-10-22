import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getCookiePreferences,
  hasAnalyticsConsent,
  saveCookiePreferences,
} from "@/lib/cookie-consent";

afterEach(() => vi.unstubAllGlobals());

describe("analytics consent", function analyticsConsentTests() {
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
