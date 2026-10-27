"use client";

import { GA4Event } from "@/lib/enums";
import { logGA4Event } from "./debug";
import { sendToGA4 } from "./ga4";
import { isAnalyticsPermitted } from "./permission";
import { sendToPostHog } from "./posthog";
import { sanitizeAnalyticsEvent, sanitizeUrlPart } from "./sanitize";
import { getCurrentUTMParams } from "./utm";

function sendEvent(
  eventName: string,
  params: unknown,
  dedupeKey?: string,
): void {
  const event = sanitizeAnalyticsEvent(eventName, params);
  if (!event) return;
  logGA4Event(event.name, event.params);

  // Denied events are dropped here, never queued, so consent cannot replay them.
  if (!isAnalyticsPermitted()) return;

  // gtag otherwise fills GA's location from the raw URL, query and hash included.
  const pageLocation =
    event.params.page_location ?? sanitizeUrlPart("url", window.location.href);
  const location: Record<string, string> = pageLocation
    ? { page_location: pageLocation }
    : {};
  const shared = { ...event.params, ...getCurrentUTMParams() };
  sendToGA4({
    name: event.name,
    params: { ...shared, ...location },
    dedupeKey,
  });
  // PostHog derives its own sanitised URL properties.
  sendToPostHog({ name: event.name, params: shared, dedupeKey });
}

export function trackPageView(params?: {
  page_location?: string;
  page_referrer?: string;
  dedupeKey?: string;
}): void {
  if (typeof window === "undefined") return;
  const location = params?.page_location ?? window.location.href;
  sendEvent(
    GA4Event.PageView,
    {
      page_location: location,
      page_path: location,
      page_referrer: params?.page_referrer ?? document.referrer,
    },
    params?.dedupeKey,
  );
}

export function trackCustomEvent(
  eventName: string,
  params: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;
  sendEvent(eventName, params);
}
