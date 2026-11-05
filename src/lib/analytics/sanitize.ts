import {
  ANALYTICS,
  ANALYTICS_ATTEMPT_ID_PATTERN,
  ANALYTICS_EVENT_PARAMS,
} from "@/lib/constants";
import type { ISanitizedAnalyticsEvent, TUrlPart } from "@/lib/types";

const EMAIL_LIKE = /[^/\s]+@[^/\s]+/;
const DIGIT = /\d/g;

export function sanitizeCampaignValue(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  if (value.length === 0 || value.length > ANALYTICS.UTM_VALUE_MAX_LENGTH) {
    return undefined;
  }
  // The pattern already excludes "@", so an email address cannot pass.
  if (!ANALYTICS.UTM_VALUE_PATTERN.test(value)) return undefined;
  if ((value.match(DIGIT)?.length ?? 0) >= ANALYTICS.PHONE_LIKE_MIN_DIGITS) {
    return undefined;
  }
  return value;
}

function parseUrl(value: unknown, base?: string): URL | undefined {
  if (typeof value !== "string") return undefined;
  try {
    return new URL(value, base);
  } catch {
    return undefined;
  }
}

const MAX_DECODE_PASSES = 5;

// An address can hide behind several layers of percent-encoding ("%2540"), so
// decode until the text stops changing. A malformed escape, or a chain deeper
// than the limit, is treated as unsafe.
function hidesEmail(pathname: string): boolean {
  let text = pathname;
  for (let pass = 0; pass < MAX_DECODE_PASSES; pass++) {
    if (EMAIL_LIKE.test(text)) return true;
    let decoded: string;
    try {
      decoded = decodeURIComponent(text);
    } catch {
      return true;
    }
    if (decoded === text) return false;
    text = decoded;
  }
  return true;
}

function safePath(url: URL): string | undefined {
  if (url.pathname.length > ANALYTICS.PATH_MAX_LENGTH) return undefined;
  return hidesEmail(url.pathname) ? undefined : url.pathname;
}

/** Path only: query, hash and credentials never reach a provider. */
function sanitizePath(value: unknown): string | undefined {
  const url = parseUrl(value, "https://placeholder.invalid");
  return url ? safePath(url) : undefined;
}

function sanitizeUrl(value: unknown): string | undefined {
  const url = parseUrl(value);
  if (!url || !/^https?:$/.test(url.protocol)) return undefined;
  const path = safePath(url);
  return path === undefined ? undefined : `${url.origin}${path}`;
}

function sanitizeReferrer(value: unknown): string | undefined {
  const url = parseUrl(value);
  if (!url || !/^https?:$/.test(url.protocol)) return undefined;
  return url.origin;
}

const URL_SANITIZERS = {
  url: sanitizeUrl,
  path: sanitizePath,
  referrer: sanitizeReferrer,
} as const;

export function sanitizeUrlPart(
  part: TUrlPart,
  value: unknown,
): string | undefined {
  return URL_SANITIZERS[part](value);
}

function sanitizeScalar(
  rule: TUrlPart | "attempt",
  value: unknown,
): string | undefined | null {
  if (rule === "attempt")
    return typeof value === "string" && ANALYTICS_ATTEMPT_ID_PATTERN.test(value)
      ? value
      : null;
  return sanitizeUrlPart(rule, value);
}

function sanitizeProperty(rule: string | readonly string[], value: unknown) {
  if (typeof rule === "string")
    return sanitizeScalar(rule as TUrlPart | "attempt", value);
  return typeof value === "string" && rule.includes(value) ? value : null;
}

export function sanitizeAnalyticsEvent(
  name: string,
  params: unknown,
): ISanitizedAnalyticsEvent | null {
  if (!Object.hasOwn(ANALYTICS_EVENT_PARAMS, name)) return null;
  const spec: Record<string, string | readonly string[]> =
    ANALYTICS_EVENT_PARAMS[name as keyof typeof ANALYTICS_EVENT_PARAMS];
  const raw: Record<string, unknown> =
    params !== null && typeof params === "object" ? { ...params } : {};
  const safe: Record<string, string> = {};

  for (const [key, rule] of Object.entries(spec)) {
    const value = raw[key];
    const clean = sanitizeProperty(rule, value);
    if (clean === null) return null;
    if (clean !== undefined) safe[key] = clean;
  }

  for (const key of ANALYTICS.UTM_KEYS) {
    const clean = sanitizeCampaignValue(raw[key]);
    if (clean !== undefined) safe[key] = clean;
  }

  return { name, params: safe };
}
