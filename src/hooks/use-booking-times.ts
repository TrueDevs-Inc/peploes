"use client";

import { useEffect, useState } from "react";

import { fetcher } from "@/helpers/api";
import { bookingAttempt, trackBooking } from "@/lib/analytics/booking";
import { BOOKING_API, BOOKING_MESSAGES } from "@/lib/constants/booking";
import { GA4Event, HttpVerb } from "@/lib/enums";
import type { ITimesData, TBookingResponse, TBookingTimes } from "@/lib/types";

export function useBookingTimes(
  date: string,
  partySize: string,
  active: boolean,
): TBookingTimes {
  const [times, setTimes] = useState<TBookingTimes>({ status: "loading" });

  useEffect(() => {
    if (!active) return;
    let current = true;
    const attemptId = bookingAttempt();
    setTimes({ status: "loading" });
    fetcher<never, TBookingResponse<ITimesData>>({
      url: `${BOOKING_API.times}?${new URLSearchParams({ date, partySize })}`,
      method: HttpVerb.Get,
    }).then((reply) => {
      if (!current) return;
      const body = reply.data;
      if (body?.ok) {
        trackBooking(
          GA4Event.BookingAvailability,
          body.data.times.length ? "available" : "empty",
          { attemptId },
        );
        setTimes({ status: "ready", data: body.data });
      } else {
        trackBooking(GA4Event.BookingAvailability, "failed", {
          attemptId,
          errorCode: body?.error.code ?? "NETWORK",
        });
        setTimes({
          status: "failed",
          message: body?.error.message ?? BOOKING_MESSAGES.unavailable,
        });
      }
    });
    return () => {
      current = false;
    };
  }, [date, partySize, active]);

  return times;
}
