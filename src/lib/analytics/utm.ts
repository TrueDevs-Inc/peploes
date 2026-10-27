import { ANALYTICS } from "@/lib/constants";
import type { IUTMParameters } from "@/lib/types";

import { isAnalyticsPermitted } from "./permission";
import { sanitizeCampaignValue } from "./sanitize";

function hasUTMParams(params: IUTMParameters): boolean {
  return Object.keys(params).length > 0;
}

function pickSafeUTM(source: {
  get: (key: string) => unknown;
}): IUTMParameters {
  const safe: IUTMParameters = {};
  for (const key of ANALYTICS.UTM_KEYS) {
    const value = sanitizeCampaignValue(source.get(key));
    if (value !== undefined) safe[key] = value;
  }
  return safe;
}

export function extractUTMFromURL(url?: string): IUTMParameters {
  if (typeof window === "undefined") return {};
  try {
    return pickSafeUTM(new URL(url ?? window.location.href).searchParams);
  } catch {
    return {};
  }
}

export function clearStoredUTMParams(): void {
  try {
    window.sessionStorage.removeItem(ANALYTICS.UTM_STORAGE_KEY);
  } catch {
    // Blocked storage holds nothing to clear.
  }
}

export function storeUTMParams(params: IUTMParameters): void {
  if (!isAnalyticsPermitted()) return;
  // Callers may pass raw input, so only sanitized values reach storage.
  const safe = pickSafeUTM({
    get: (key) => params[key as keyof IUTMParameters],
  });
  if (!hasUTMParams(safe)) return;
  try {
    window.sessionStorage.setItem(
      ANALYTICS.UTM_STORAGE_KEY,
      JSON.stringify({ params: safe, timestamp: Date.now() }),
    );
  } catch {
    // Attribution is best effort; blocked storage must not break tracking.
  }
}

export function getStoredUTMParams(): IUTMParameters {
  if (!isAnalyticsPermitted()) return {};

  let stored: string | null;
  try {
    stored = window.sessionStorage.getItem(ANALYTICS.UTM_STORAGE_KEY);
  } catch {
    return {};
  }
  if (!stored) return {};

  try {
    const data: unknown = JSON.parse(stored);
    const { params, timestamp } = data as {
      params?: Record<string, unknown>;
      timestamp?: unknown;
    };
    const expiryMs = ANALYTICS.UTM_EXPIRY_HOURS * 60 * 60 * 1000;
    if (
      typeof timestamp === "number" &&
      Date.now() - timestamp <= expiryMs &&
      params !== null &&
      typeof params === "object"
    ) {
      // Storage is writable by anyone on the page, so re-validate every value.
      return pickSafeUTM({ get: (key) => params[key] });
    }
  } catch {
    // Fall through to clearing the unreadable entry.
  }
  clearStoredUTMParams();
  return {};
}

export function getCurrentUTMParams(): IUTMParameters {
  if (!isAnalyticsPermitted()) return {};

  const urlParams = extractUTMFromURL();
  if (hasUTMParams(urlParams)) {
    storeUTMParams(urlParams);
    return urlParams;
  }
  return getStoredUTMParams();
}
