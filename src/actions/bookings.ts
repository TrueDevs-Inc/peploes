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

const submitGuestDetailsAction = createPublicAction<
  unknown,
  TGuestDetailsResult,
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
    if (holdDone) {
      forgetHoldToken(cookieStore);
    }
    return result;
  },
});

export async function submitGuestDetails(
  details: unknown,
): Promise<TBookingResponse<TGuestDetailsResult>> {
  return toBookingResponse(await submitGuestDetailsAction(details));
}
