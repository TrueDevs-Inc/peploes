import type {
  CaptureResult,
  PostHog,
  PostHogConfig,
} from "posthog-js/dist/module.slim";

import {
  ANALYTICS,
  ANALYTICS_EVENT_PARAMS,
  POSTHOG_CAMPAIGN_PROPERTY,
  POSTHOG_DOMAIN_PROPERTIES,
  POSTHOG_DOMAIN_VALUE,
  POSTHOG_EVENT_NAMES,
  POSTHOG_SDK_PROPERTIES,
  POSTHOG_URL_PROPERTIES,
  POSTHOG_VALUE_MAX_LENGTH,
} from "@/lib/constants";
import { GA4Event } from "@/lib/enums";
import { env } from "@/lib/env";
import type { IPendingAnalyticsEvent } from "@/lib/types";
import { clearCookies, clearStorageKeys } from "./browser-storage";
import { createEventHistory } from "./deduplication";
import { isAnalyticsPermitted } from "./permission";
import {
  sanitizeAnalyticsEvent,
  sanitizeCampaignValue,
  sanitizeUrlPart,
} from "./sanitize";

// PostHog's own persistence; its opt-out flag (`__ph_opt_in_out_*`) stays so a
// reload cannot silently resume capture.
const POSTHOG_STORAGE = /^ph_/;

const GA4_NAMES_BY_POSTHOG_NAME = new Map<string, string>(
  Object.keys(ANALYTICS_EVENT_PARAMS).map((name) => [
    toPostHogName(name),
    name,
  ]),
);

const history = createEventHistory(
  `peploes:posthog:${env.NEXT_PUBLIC_POSTHOG_KEY}:conversions`,
);
let sdk: PostHog | null = null;
let loading = false;
let withdrawal: AbortController | null = null;
let generation = 0;
let pending: IPendingAnalyticsEvent[] = [];

function toPostHogName(name: string): string {
  return (
    (POSTHOG_EVENT_NAMES as Record<string, string | undefined>)[name] ?? name
  );
}

function isConfigured(): boolean {
  return Boolean(env.NEXT_PUBLIC_POSTHOG_KEY && env.NEXT_PUBLIC_POSTHOG_HOST);
}

function isEnabled(): boolean {
  return isConfigured() && isAnalyticsPermitted();
}

function isPlainValue(value: unknown): boolean {
  if (typeof value === "string")
    return value.length <= POSTHOG_VALUE_MAX_LENGTH;
  return typeof value === "number" || typeof value === "boolean";
}

function cleanSdkProperty(key: string, value: unknown): unknown {
  const part = POSTHOG_URL_PROPERTIES[key];
  if (part) return sanitizeUrlPart(part, value);
  if (POSTHOG_CAMPAIGN_PROPERTY.test(key)) return sanitizeCampaignValue(value);
  if (POSTHOG_DOMAIN_PROPERTIES.has(key)) {
    return typeof value === "string" && POSTHOG_DOMAIN_VALUE.test(value)
      ? value
      : undefined;
  }
  return POSTHOG_SDK_PROPERTIES.has(key) && isPlainValue(value)
    ? value
    : undefined;
}

export function scrubPostHogEvent(
  capture: CaptureResult,
): CaptureResult | null {
  const name = GA4_NAMES_BY_POSTHOG_NAME.get(capture.event);
  if (!name) return null;

  const custom: Record<string, unknown> = {};
  const properties: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(capture.properties)) {
    if (key.startsWith("$") || POSTHOG_SDK_PROPERTIES.has(key)) {
      const clean = cleanSdkProperty(key, value);
      if (clean !== undefined) properties[key] = clean;
    } else {
      custom[key] = value;
    }
  }
  const safe = sanitizeAnalyticsEvent(name, custom);
  if (!safe) return null;

  // Person property updates are never allowed through.
  return {
    ...capture,
    $set: undefined,
    $set_once: undefined,
    $unset: undefined,
    properties: { ...properties, ...safe.params },
  };
}

/**
 * A page_view captured after a slow SDK load would read the location at flush
 * time, so each queued navigation carries its own native URL fields.
 */
function toCaptureProperties(
  name: string,
  params: Record<string, string>,
): Record<string, string> {
  if (name !== GA4Event.PageView) return params;
  const native = { ...params };
  if (params.page_location) native.$current_url = params.page_location;
  if (params.page_path) native.$pathname = params.page_path;
  if (params.page_referrer) native.$referrer = params.page_referrer;
  return native;
}

function dispatch({ name, params, dedupeKey }: IPendingAnalyticsEvent): void {
  history.dispatch(dedupeKey, () => {
    if (!sdk || !isEnabled()) return false;
    return Boolean(
      sdk.capture(toPostHogName(name), toCaptureProperties(name, params), {
        send_instantly: true,
      }),
    );
  });
}

function flush(): void {
  const batch = pending;
  pending = [];
  for (const event of batch) {
    if (!isEnabled()) return;
    dispatch(event);
  }
}

export function sendToPostHog(event: IPendingAnalyticsEvent): void {
  if (!isEnabled()) return;
  if (!sdk) {
    if (pending.length < ANALYTICS.MAX_QUEUE_SIZE) pending.push(event);
    return;
  }
  dispatch(event);
}

// posthog-js cannot discard its batch or retry queues. Its fetch calls spread
// `fetch_options` last, so a signal supplied here aborts every send of that
// instance (beacons are disabled so none bypass it); the next grant starts a
// fresh instance.
const SDK_REQUEST_TIMEOUT_MS = 60_000;

// Ours replaces the SDK's per-request signal, so it must also carry its timeout.
function requestSignal(withdrawn: AbortSignal): AbortSignal {
  if (typeof AbortSignal.any !== "function") return withdrawn;
  return AbortSignal.any([
    withdrawn,
    AbortSignal.timeout(SDK_REQUEST_TIMEOUT_MS),
  ]);
}

function buildConfig(withdrawal: AbortController): Partial<PostHogConfig> {
  return {
    api_host: env.NEXT_PUBLIC_POSTHOG_HOST,
    defaults: "2026-08-30",
    person_profiles: "identified_only",
    // One owner sends $pageview; the SDK must not add events of its own.
    capture_pageview: false,
    capture_pageleave: false,
    autocapture: false,
    capture_dead_clicks: false,
    capture_performance: false,
    // Sentry owns error reporting.
    capture_exceptions: false,
    disable_session_recording: true,
    enable_heatmaps: false,
    disable_surveys: true,
    disable_conversations: true,
    disable_web_experiments: true,
    advanced_disable_flags: true,
    save_campaign_params: false,
    disable_beacon: true,
    // A getter: the SDK reads `fetch_options` for every request.
    fetch_options: {
      get signal() {
        return requestSignal(withdrawal.signal);
      },
    } as PostHogConfig["fetch_options"],
    // Its scroll/resize listeners cannot be removed from an abandoned instance.
    disable_scroll_properties: true,
    // Capture time is the last point where consent can be checked per event.
    before_send: (capture) => (isEnabled() ? scrubPostHogEvent(capture) : null),
  };
}

function instanceName(): string {
  generation += 1;
  return `peploes_${generation}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function activatePostHog(): Promise<void> {
  const key = env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key || !isEnabled() || loading || sdk) return;
  // Without fetch the SDK falls back to XHR, which ignores the abort signal.
  if (typeof fetch !== "function") return;

  loading = true;
  try {
    const { default: posthog } = await import("posthog-js/dist/module.slim");
    // The import resolved after the decision that started it; ask again.
    if (!isEnabled()) return;
    const controller = new AbortController();
    const instance = posthog.init(key, buildConfig(controller), instanceName());
    withdrawal = controller;
    sdk = instance;
    // A stored opt-out from an earlier withdrawal would otherwise persist.
    instance.opt_in_capturing({ captureEventName: false });
    flush();
  } catch {
    // A blocked or failing SDK must leave the site working and unreported.
    pending = [];
  } finally {
    loading = false;
  }
}

export function clearPostHogPending(): void {
  pending = [];
  history.clear();
}

export function deactivatePostHog(): void {
  clearPostHogPending();
  if (!isConfigured()) return;
  withdrawal?.abort();
  withdrawal = null;
  const instance = sdk;
  sdk = null;
  try {
    instance?.reset();
    clearStorage();
    instance?.opt_out_capturing();
  } catch {
    // The page-level gate still stops every send.
  }
  clearStorage();
}

function clearStorage(): void {
  clearStorageKeys(() => window.localStorage, POSTHOG_STORAGE);
  clearStorageKeys(() => window.sessionStorage, POSTHOG_STORAGE);
  clearCookies(POSTHOG_STORAGE);
}
