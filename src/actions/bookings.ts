"use server";

import "server-only";

import { err, ok } from "neverthrow";
import { cookies, headers } from "next/headers";

import { createPublicAction } from "@/actions/base";
import {
  forgetHoldToken,
  readHoldToken,
  storeHoldToken,
} from "@/lib/booking-cookie";
import { toBookingResponse } from "@/lib/booking-response";
import { BOOKING_HOLD_LIMITS } from "@/lib/constants/booking";
import { allowHold } from "@/lib/rate-limit-provider";
import type {
  TBookingErrorCode,
  TBookingResponse,
  TGuestDetailsResult,
  TGuestDetailsView,
  THeldTable,
} from "@/lib/types";
import { bookings } from "@/services/bookings";

const holdTableAction = createPublicAction<
  unknown,
  THeldTable,
  TBookingErrorCode
>({
  parse: (rawInput) => ok(rawInput),
  handler: async ({ input }) => {
    const [cookieStore, requestHeaders] = await Promise.all([
      cookies(),
      headers(),
    ]);
    const forwardedFor = requestHeaders.get(BOOKING_HOLD_LIMITS.visitorHeader);
    const hold = await bookings.holdTable(
      input,
      () => allowHold(forwardedFor),
      readHoldToken(cookieStore),
    );
    if (hold.isErr()) {
      if (hold.error.clearHold) {
        forgetHoldToken(cookieStore);
      }
      return err(hold.error);
    }
    const { holdToken, cookieMaxAgeSeconds, expiresInMs, summary } = hold.value;
    storeHoldToken(cookieStore, holdToken, cookieMaxAgeSeconds);
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
  unknown,
  TGuestDetailsView,
  TBookingErrorCode
>({
  parse: (rawInput) => ok(rawInput),
  handler: async ({ input }) => {
    const cookieStore = await cookies();
    const result = await bookings.submitGuestDetails(
      input,
      readHoldToken(cookieStore),
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
      forgetHoldToken(cookieStore);
    } else if (holdCookie) {
      storeHoldToken(cookieStore, holdCookie.token, holdCookie.maxAgeSeconds);
    }
    return result.map(guestDetailsView);
  },
});

export async function submitGuestDetails(
  details: unknown,
): Promise<TBookingResponse<TGuestDetailsView>> {
  return toBookingResponse(await submitGuestDetailsAction(details));
}
