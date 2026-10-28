import { z } from "zod";

import { COOKIE_PREFERENCES } from "@/lib/constants/cookie-consent";
import type { ICookiePreferences } from "@/lib/types";

export const cookiePreferencesSchema = z.object({
  analytics: z.boolean(),
  performance: z.boolean(),
  marketing: z.boolean(),
});

let denyOptionalCookies = false;

function hasStoredDenial(): boolean {
  return (
    typeof document !== "undefined" &&
    document.cookie
      .split(";")
      .some(
        (cookie) => cookie.trim() === `${COOKIE_PREFERENCES.denialCookie}=1`,
      )
  );
}

export function getCookiePreferences(): ICookiePreferences {
  if (typeof window === "undefined" || denyOptionalCookies) {
    return COOKIE_PREFERENCES.defaults;
  }
  try {
    if (hasStoredDenial()) return COOKIE_PREFERENCES.defaults;
    const stored = window.localStorage.getItem(COOKIE_PREFERENCES.storageKey);
    const result = cookiePreferencesSchema.safeParse(
      stored ? JSON.parse(stored) : null,
    );
    return result.success ? result.data : COOKIE_PREFERENCES.defaults;
  } catch {
    return COOKIE_PREFERENCES.defaults;
  }
}

export function saveCookiePreferences(
  preferences: ICookiePreferences,
): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(
      COOKIE_PREFERENCES.storageKey,
      JSON.stringify(preferences),
    );
    if (typeof document !== "undefined") {
      // biome-ignore lint/suspicious/noDocumentCookie: PR #41 keeps consent checks synchronous; use Cookie Store when that interface becomes async.
      document.cookie = `${COOKIE_PREFERENCES.denialCookie}=; Path=/; Max-Age=0; SameSite=Lax`;
      if (hasStoredDenial()) return false;
    }
    denyOptionalCookies = false;
    return true;
  } catch {
    // A failed withdrawal must override older consent that is still readable.
    denyOptionalCookies = true;
    try {
      if (typeof document !== "undefined") {
        // biome-ignore lint/suspicious/noDocumentCookie: PR #41 needs synchronous cross-page denial when localStorage writes fail.
        document.cookie = `${COOKIE_PREFERENCES.denialCookie}=1; Path=/; Max-Age=${COOKIE_PREFERENCES.denialMaxAgeSeconds}; SameSite=Lax`;
        denyOptionalCookies = !hasStoredDenial();
      }
    } catch {
      // If all browser storage is blocked, the current page still denies tracking.
    }
    return false;
  }
}

export function hasAnalyticsConsent(): boolean {
  return getCookiePreferences().analytics;
}
