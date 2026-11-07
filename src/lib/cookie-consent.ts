import { COOKIE_PREFERENCES } from "@/lib/constants/cookie-consent";
import type { ICookiePreferences } from "@/lib/types";

function parseCookiePreferences(value: unknown): ICookiePreferences | null {
  if (typeof value !== "object" || value === null) return null;
  const { analytics, performance, marketing } = value as Record<
    string,
    unknown
  >;
  if (
    typeof analytics !== "boolean" ||
    typeof performance !== "boolean" ||
    typeof marketing !== "boolean"
  ) {
    return null;
  }
  return { analytics, performance, marketing };
}

let denyOptionalCookies = false;
const listeners = new Set<() => void>();

function notifyConsentChange(): void {
  for (const listener of [...listeners]) {
    try {
      listener();
    } catch {
      // One failing subscriber must not stop the others from withdrawing.
    }
  }
}

function handleStorageEvent(event: { key: string | null }): void {
  // A null key means another tab cleared all storage.
  if (event.key !== null && event.key !== COOKIE_PREFERENCES.storageKey) return;
  notifyConsentChange();
}

// A failed localStorage write fires no `storage` event, so tabs also announce
// every save on a channel. Each message carries its sender to skip our own.
const tabId = Math.random().toString(36).slice(2);
let channel: BroadcastChannel | null = null;

function openChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === "undefined") return null;
  try {
    return new BroadcastChannel(COOKIE_PREFERENCES.broadcastChannel);
  } catch {
    return null;
  }
}

function handleChannelMessage(event: { data: unknown }): void {
  const data = event.data as { source?: unknown } | null;
  if (data?.source === tabId) return;
  notifyConsentChange();
}

function announceConsentChange(): void {
  const sender = openChannel();
  if (!sender) return;
  try {
    sender.postMessage({ source: tabId });
  } catch {
    // Other tabs still see the stored choice on their next read.
  } finally {
    sender.close();
  }
}

/** Calls `listener` after any save in this tab, or a consent change in another tab. */
export function subscribeToConsent(listener: () => void): () => void {
  listeners.add(listener);
  if (listeners.size === 1 && typeof window !== "undefined") {
    window.addEventListener?.("storage", handleStorageEvent);
    channel = openChannel();
    if (channel) channel.onmessage = handleChannelMessage;
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && typeof window !== "undefined") {
      window.removeEventListener?.("storage", handleStorageEvent);
      channel?.close();
      channel = null;
    }
  };
}

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
    return (
      parseCookiePreferences(stored ? JSON.parse(stored) : null) ??
      COOKIE_PREFERENCES.defaults
    );
  } catch {
    return COOKIE_PREFERENCES.defaults;
  }
}

export function saveCookiePreferences(
  preferences: ICookiePreferences,
): boolean {
  if (typeof window === "undefined") return false;
  try {
    return persistPreferences(preferences);
  } finally {
    // Failed saves notify too: subscribers re-read consent, which now denies.
    notifyConsentChange();
    announceConsentChange();
  }
}

function persistPreferences(preferences: ICookiePreferences): boolean {
  try {
    window.localStorage.setItem(
      COOKIE_PREFERENCES.storageKey,
      JSON.stringify(preferences),
    );
    if (typeof document !== "undefined") {
      // biome-ignore lint/suspicious/noDocumentCookie: PR #41 keeps consent checks synchronous; use Cookie Store when that interface becomes async.
      document.cookie = `${COOKIE_PREFERENCES.denialCookie}=; Path=/; Max-Age=0; SameSite=Lax`;
      if (hasStoredDenial()) {
        // A save reported as failed must not take effect when the denial cookie expires.
        window.localStorage.removeItem(COOKIE_PREFERENCES.storageKey);
        return false;
      }
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
