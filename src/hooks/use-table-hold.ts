"use client";

import { useCallback, useState, useTransition } from "react";

import { holdTable } from "@/actions/bookings";
import {
  getSessionStorage,
  removeSessionStorage,
  setSessionStorage,
} from "@/helpers/storage";
import {
  bindBookingAttempt,
  bookingAttempt,
  trackBooking,
} from "@/lib/analytics/booking";
import { TABLE_BOOKING_CONTENT } from "@/lib/constants/table-booking";
import { GA4Event } from "@/lib/enums";
import { tryCatch } from "@/lib/errors";
import type {
  IActiveHold,
  IHoldChoice,
  IHoldSummary,
  IStoredHold,
  ITableHold,
} from "@/lib/types";

const STORAGE_KEY = "peploes:booking-hold";

export function storedHold(): IStoredHold | null {
  return getSessionStorage<IStoredHold>(STORAGE_KEY);
}

export function useTableHold(): ITableHold {
  const [active, setActive] = useState<IActiveHold | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const holdReference = active?.summary.reference;

  const place = useCallback(
    (choice: IHoldChoice, onHeld: (summary: IHoldSummary) => void) => {
      const attemptId = bookingAttempt();
      startTransition(async () => {
        setError(null);
        const reference = holdReference ?? storedHold()?.holdReference;
        const { data: reply } = await tryCatch(
          holdTable({
            ...choice,
            offer: { kind: "standard" },
            ...(reference && { holdReference: reference }),
          }),
        );
        if (!reply) {
          trackBooking(GA4Event.BookingHold, "unknown", {
            attemptId,
            errorCode: "NETWORK",
          });
          setError(TABLE_BOOKING_CONTENT.connectionLost);
          return;
        }
        if (!reply.ok) {
          trackBooking(GA4Event.BookingHold, "failed", {
            attemptId,
            errorCode: reply.error.code,
          });
          setError(reply.error.message);
          return;
        }
        const { summary, expiresInMs } = reply.data;
        bindBookingAttempt(summary.reference, attemptId);
        trackBooking(GA4Event.BookingHold, "succeeded", { attemptId });
        setActive({ summary, endsAt: performance.now() + expiresInMs });
        setSessionStorage(STORAGE_KEY, {
          choice,
          holdReference: summary.reference,
          holdRevision: summary.revision,
        } satisfies IStoredHold);
        onHeld(summary);
      });
    },
    [holdReference],
  );

  const forgetHold = useCallback(() => {
    setActive(null);
    removeSessionStorage(STORAGE_KEY);
  }, []);

  return { active, pending, error, place, forgetHold, resume: setActive };
}
