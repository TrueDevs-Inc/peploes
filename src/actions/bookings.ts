"use server";

import "server-only";

import { err, ok } from "neverthrow";
import { cookies, headers } from "next/headers";
import { after } from "next/server";

import { createPublicAction } from "@/actions/base";
import {
  forgetHoldToken,
  pageHoldReference,
  readHoldToken,
  storeHoldToken,
} from "@/lib/booking-cookie";
import { toBookingResponse } from "@/lib/booking-response";
import { guestDetailsSchema } from "@/lib/booking-schema";
import { BOOKING_HOLD_LIMITS } from "@/lib/constants/booking";
import { LogContext } from "@/lib/enums";
import { logger } from "@/lib/logger";
import { allowHold } from "@/lib/rate-limit-provider";
import type {
  TBookingErrorCode,
  TBookingResponse,
  TGuestDetailsResult,
  TGuestDetailsView,
  THeldTable,
} from "@/lib/types";
import { bookings } from "@/services/bookings";
import { subscribeNewsletter } from "@/services/newsletter";

const holdTableAction = createPublicAction<THeldTable, TBookingErrorCode>({
  handler: async ({ input }) => {
    const [cookieStore, requestHeaders] = await Promise.all([
      cookies(),
      headers(),
    ]);
    const forwardedFor = requestHeaders.get(BOOKING_HOLD_LIMITS.visitorHeader);
    const holdReference = pageHoldReference(input);
    const hold = await bookings.holdTable(
      input,
      () => allowHold(forwardedFor),
      readHoldToken(cookieStore, holdReference),
    );
    if (hold.isErr()) {
      if (hold.error.clearHold) {
        forgetHoldToken(cookieStore, holdReference);
      }
      return err(hold.error);
    }
    const { holdToken, cookieMaxAgeSeconds, expiresInMs, summary } = hold.value;
    if (holdReference !== summary.reference) {
      forgetHoldToken(cookieStore, holdReference);
    }
    storeHoldToken(
      cookieStore,
      summary.reference,
      holdToken,
      cookieMaxAgeSeconds,
    );
    return ok({ expiresInMs, summary });
  },
});

export async function holdTable(
  choice: unknown,
): Promise<TBookingResponse<THeldTable>> {
  return toBookingResponse(await holdTableAction(choice));
}

function guestDetailsView(result: TGuestDetailsResult): TGuestDetailsView {
  if (result.kind === "confirmed") {
    return result;
  }
  const { holdCookie, ...view } = result;
  return view;
}

const submitGuestDetailsAction = createPublicAction<
  TGuestDetailsView,
  TBookingErrorCode
>({
  handler: async ({ input }) => {
    const cookieStore = await cookies();
    const holdReference = pageHoldReference(input);
    const result = await bookings.submitGuestDetails(
      input,
      readHoldToken(cookieStore, holdReference),
    );
    const holdDone = result.isOk()
      ? result.value.kind === "confirmed"
      : result.error.clearHold === true;
    const holdCookie = result.isOk()
      ? "holdCookie" in result.value
        ? result.value.holdCookie
        : undefined
      : result.error.holdCookie;
    if (holdDone) {
      forgetHoldToken(cookieStore, holdReference);
    } else if (holdCookie && holdReference) {
      storeHoldToken(
        cookieStore,
        holdReference,
        holdCookie.token,
        holdCookie.maxAgeSeconds,
      );
    }
    if (result.isOk()) {
      const details = guestDetailsSchema.safeParse(input);
      if (details.success && details.data.newsletterOptIn) {
        const { email } = details.data;
        try {
          const forwardedFor = (await headers()).get(
            BOOKING_HOLD_LIMITS.visitorHeader,
          );
          after(async () => {
            try {
              await subscribeNewsletter({ email }, forwardedFor);
            } catch {
              logger.error(
                LogContext.Api,
                "Booking newsletter subscription failed unexpectedly",
              );
            }
          });
        } catch {
          logger.error(
            LogContext.Api,
            "Booking newsletter subscription could not be scheduled",
          );
        }
      }
    }
    return result.map(guestDetailsView);
  },
});

export async function submitGuestDetails(
  details: unknown,
): Promise<TBookingResponse<TGuestDetailsView>> {
  return toBookingResponse(await submitGuestDetailsAction(details));
}
