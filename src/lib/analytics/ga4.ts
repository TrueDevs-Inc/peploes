import { ANALYTICS } from "@/lib/constants";
import { env } from "@/lib/env";
import type { IPendingAnalyticsEvent } from "@/lib/types";
import { clearCookies } from "./browser-storage";
import { createEventHistory } from "./deduplication";
import { isAnalyticsPermitted } from "./permission";

const GA_MEASUREMENT_ID = env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const GTAG_SCRIPT_URL = "https://www.googletagmanager.com/gtag/js";
const GOOGLE_COOKIES = /^(_ga|_ga_[A-Z0-9]+|_gid|_gat.*)$/;
const CONSENT_DENIED = {
  analytics_storage: "denied",
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
} as const;

type TScriptState = "idle" | "loading" | "loaded" | "failed";

let state: TScriptState = "idle";
let configured = false;
let script: HTMLScriptElement | null = null;
let timeout: ReturnType<typeof setTimeout> | undefined;
let pending: IPendingAnalyticsEvent[] = [];
const history = createEventHistory();

function isEnabled(): boolean {
  return !!GA_MEASUREMENT_ID && isAnalyticsPermitted();
}

function isTransportReady(): boolean {
  return typeof window.gtag === "function";
}

function clearPending(): void {
  pending = [];
  history.clear();
}

// The dedupe key is recorded only after gtag accepted the event.
function dispatch({ name, params, dedupeKey }: IPendingAnalyticsEvent): void {
  if (dedupeKey && history.isDuplicate(dedupeKey)) return;
  try {
    window.gtag?.("event", name, params);
  } catch {
    return;
  }
  if (dedupeKey) history.record(dedupeKey);
}

export function flushAnalyticsQueue(): void {
  if (!isEnabled()) {
    pending = [];
    return;
  }
  if (!isTransportReady()) return;
  const batch = pending;
  pending = [];
  for (const event of batch) {
    if (!isEnabled()) return;
    dispatch(event);
  }
}

export function sendToGA4(event: IPendingAnalyticsEvent): void {
  if (!isEnabled()) return;
  if (!isTransportReady()) {
    if (pending.length < ANALYTICS.MAX_QUEUE_SIZE) pending.push(event);
    return;
  }
  dispatch(event);
}

function pushCommand(..._command: unknown[]): void {
  window.dataLayer = window.dataLayer ?? [];
  // biome-ignore lint/complexity/noArguments: gtag.js ignores arrays in dataLayer and only runs Arguments objects.
  window.dataLayer.push(arguments);
}

function fail(): void {
  clearTimeout(timeout);
  state = "failed";
  script?.remove();
  script = null;
  Reflect.deleteProperty(window, "gtag");
  // A GA failure leaves consent and the other provider's work untouched.
  clearPending();
}

// Google's documented opt-out: it silences a gtag.js that is already running.
function setOptOut(disabled: boolean): void {
  (window as unknown as Record<string, unknown>)[
    `ga-disable-${GA_MEASUREMENT_ID}`
  ] = disabled;
}

function enable(): void {
  setOptOut(false);
  pushCommand("consent", "update", { analytics_storage: "granted" });
  if (!configured) {
    pushCommand("js", new Date());
    // The single pageview owner sends page_view, so gtag must not.
    pushCommand("config", GA_MEASUREMENT_ID, { send_page_view: false });
    configured = true;
  }
  window.gtag = pushCommand;
  flushAnalyticsQueue();
}

function handleLoad(): void {
  clearTimeout(timeout);
  if (state !== "loading") return;
  state = "loaded";
  // The script resolved after the decision that started it; ask again.
  if (isAnalyticsPermitted()) enable();
}

export function activateGA4(): void {
  if (!GA_MEASUREMENT_ID || !isAnalyticsPermitted()) return;
  if (state === "failed" || state === "loading") return;
  if (state === "loaded") {
    enable();
    return;
  }

  state = "loading";
  try {
    pushCommand("consent", "default", CONSENT_DENIED);
    script = document.createElement("script");
    script.async = true;
    script.src = `${GTAG_SCRIPT_URL}?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`;
    script.onload = handleLoad;
    script.onerror = fail;
    timeout = setTimeout(fail, ANALYTICS.SCRIPT_LOAD_TIMEOUT_MS);
    document.head.appendChild(script);
  } catch {
    fail();
  }
}

export function deactivateGA4(): void {
  if (GA_MEASUREMENT_ID) {
    setOptOut(true);
    if (state === "loaded" && configured) {
      try {
        pushCommand("consent", "update", CONSENT_DENIED);
      } catch {
        // The page-level gate below still stops every send.
      }
    }
  }
  Reflect.deleteProperty(window, "gtag");
  clearPending();
  clearCookies(GOOGLE_COOKIES);
}
