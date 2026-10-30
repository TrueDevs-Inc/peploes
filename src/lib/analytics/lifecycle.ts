import { subscribeToConsent } from "@/lib/cookie-consent";
import { trackPageView } from "./client";
import { activateGA4, deactivateGA4 } from "./ga4";
import { isAnalyticsPermitted } from "./permission";
import { activatePostHog, deactivatePostHog } from "./posthog";
import { clearStoredUTMParams } from "./utm";

interface INavigation {
  id: number;
  pathname: string;
  referrer?: string;
}

let navigation: INavigation | null = null;
let sequence = 0;
let stopWatching: (() => void) | null = null;

/** The single page_view owner: one event per navigation, for every provider. */
function sendCurrentPageView(): void {
  if (!navigation) return;
  const { id, pathname, referrer } = navigation;
  trackPageView({
    page_location: `${window.location.origin}${pathname}`,
    page_referrer: referrer,
    dedupeKey: `${id}:${pathname}`,
  });
}

function syncProviders(): void {
  if (!isAnalyticsPermitted()) {
    clearStoredUTMParams();
    deactivateGA4();
    deactivatePostHog();
    return;
  }
  activateGA4();
  void activatePostHog();
  // A grant mid-visit measures the page the visitor is on from that moment.
  sendCurrentPageView();
}

export function startAnalytics(): () => void {
  stopWatching ??= subscribeToConsent(syncProviders);
  syncProviders();
  return () => {
    stopWatching?.();
    stopWatching = null;
  };
}

export function recordNavigation(pathname: string): void {
  if (typeof window === "undefined") return;
  if (navigation?.pathname !== pathname) {
    sequence += 1;
    navigation = {
      id: sequence,
      pathname,
      referrer: navigation
        ? `${window.location.origin}${navigation.pathname}`
        : undefined,
    };
  }
  sendCurrentPageView();
}
