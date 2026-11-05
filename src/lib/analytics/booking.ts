"use client";

import { ANALYTICS_ATTEMPT_ID_PATTERN } from "@/lib/constants";
import { GA4Event } from "@/lib/enums";
import type {
  IBookingAnalyticsContext,
  TBookingAnalyticsEvent,
  TBookingAnalyticsResult,
} from "@/lib/types";
import { trackCustomEvent } from "./client";
import { isAnalyticsPermitted } from "./permission";

const ATTEMPT_KEY = "peploes:booking-analytics-attempt";
const HOLDS_KEY = "peploes:booking-analytics-holds";
const MAX_HOLDS = 32;
const holds = new Map<string, { attemptId: string }>();
let current: string | undefined;

function validAttempt(value: unknown): value is string {
  return typeof value === "string" && ANALYTICS_ATTEMPT_ID_PATTERN.test(value);
}

function readHolds() {
  try {
    const saved: unknown = JSON.parse(
      window.localStorage.getItem(HOLDS_KEY) ?? "{}",
    );
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) return;
    for (const [reference, entry] of Object.entries(saved).slice(-MAX_HOLDS)) {
      if (entry && typeof entry === "object" && validAttempt(entry.attemptId)) {
        holds.set(reference, {
          attemptId: entry.attemptId,
        });
      }
    }
  } catch {
    return;
  }
}

function saveHolds() {
  while (holds.size > MAX_HOLDS) {
    const oldest = holds.keys().next().value;
    if (oldest !== undefined) holds.delete(oldest);
  }
  try {
    window.localStorage.setItem(
      HOLDS_KEY,
      JSON.stringify(Object.fromEntries(holds)),
    );
  } catch {
    return;
  }
}

export function beginBookingSearch(): string | undefined {
  if (!isAnalyticsPermitted()) return undefined;
  try {
    current = crypto.randomUUID();
  } catch {
    return undefined;
  }
  try {
    window.sessionStorage.setItem(ATTEMPT_KEY, current);
  } catch {
    return current;
  }
  return current;
}

export function bookingAttempt(): string | undefined {
  if (!isAnalyticsPermitted()) return undefined;
  if (current) return current;
  try {
    const saved = window.sessionStorage.getItem(ATTEMPT_KEY);
    if (validAttempt(saved)) current = saved;
  } catch {
    return beginBookingSearch();
  }
  return current ?? beginBookingSearch();
}

export function bindBookingAttempt(
  reference: string,
  attemptId = bookingAttempt(),
) {
  if (!attemptId || !isAnalyticsPermitted()) return;
  readHolds();
  holds.set(reference, {
    attemptId,
  });
  saveHolds();
}

function attemptFor(context: IBookingAnalyticsContext) {
  if (context.attemptId) return context.attemptId;
  if (context.reference) {
    readHolds();
    const saved = holds.get(context.reference);
    if (saved) return saved.attemptId;
    const attemptId = bookingAttempt();
    bindBookingAttempt(context.reference, attemptId);
    return attemptId;
  }
  return bookingAttempt();
}

export function resumeBookingAttempt(reference: string): void {
  if (!isAnalyticsPermitted()) return;
  current = attemptFor({ reference });
  if (!current) return;
  try {
    window.sessionStorage.setItem(ATTEMPT_KEY, current);
  } catch {
    return;
  }
}

export function trackBooking(
  event: TBookingAnalyticsEvent,
  result: TBookingAnalyticsResult,
  context: IBookingAnalyticsContext = {},
): void {
  if (!isAnalyticsPermitted()) return;
  const attemptId = attemptFor(context);
  trackCustomEvent(
    event,
    {
      attempt_id: attemptId,
      result,
      error_code: context.errorCode ?? "NONE",
      payment_kind: context.paymentKind ?? "none",
    },
    event === GA4Event.BookingConfirmed
      ? `booking-confirmed:${attemptId}`
      : undefined,
  );
}

export function trackBookingConfirmed(reference: string): void {
  trackBooking(GA4Event.BookingConfirmed, "confirmed", { reference });
}
