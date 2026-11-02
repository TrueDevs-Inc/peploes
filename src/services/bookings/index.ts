import "server-only";

import { err } from "neverthrow";

import { env } from "@/lib/env";
import { resdiary } from "@/lib/resdiary-provider";
import type {
  IBookingError,
  IBookingServiceDeps,
  TBookingOperation,
  TBookingResult,
  THoldGate,
} from "@/lib/types";
import { findCalendarDays } from "@/services/bookings/calendar-days";
import {
  holdUnclear,
  logUnexpected,
  stillConfirming,
  unavailable,
} from "@/services/bookings/errors";
import { findTableData } from "@/services/bookings/find-table-data";
import { submitGuestDetails } from "@/services/bookings/guest-details";
import { holdStatus } from "@/services/bookings/hold-status";
import { holdTable } from "@/services/bookings/hold-table";
import { releaseHold } from "@/services/bookings/release-hold";
import { findTimes } from "@/services/bookings/times";

export function createBookingService(deps: IBookingServiceDeps = {}) {
  const provider = deps.provider ?? resdiary;
  const holdSecret =
    deps.holdSecret === undefined
      ? (env.BOOKING_HOLD_SECRET ?? null)
      : deps.holdSecret;
  const allowHoldCancellation =
    deps.allowHoldCancellation ?? env.BOOKING_ALLOW_HOLD_CANCELLATION;

  async function guarded<T>(
    operation: TBookingOperation,
    work: (secret: string) => TBookingResult<T>,
    onThrow: () => IBookingError = unavailable,
  ): TBookingResult<T> {
    if (!holdSecret) {
      return err(unavailable());
    }
    try {
      return await work(holdSecret);
    } catch (error) {
      logUnexpected(operation, error);
      return err(onThrow());
    }
  }

  return {
    getFindTableData: () =>
      guarded("getFindTableData", () =>
        findTableData(provider, allowHoldCancellation),
      ),
    getCalendarDays: (input: unknown) =>
      guarded("getCalendarDays", () => findCalendarDays(provider, input)),
    getTimes: (input: unknown) =>
      guarded("getTimes", () => findTimes(provider, input)),
    holdTable: (
      input: unknown,
      mayHoldAnother: THoldGate,
      existingToken?: string,
    ) =>
      guarded(
        "holdTable",
        (secret) =>
          holdTable(provider, secret, input, mayHoldAnother, existingToken),
        holdUnclear,
      ),
    getHoldStatus: (query: unknown, holdToken?: string) =>
      guarded("getHoldStatus", (secret) =>
        holdStatus(provider, secret, query, holdToken),
      ),
    releaseHold: (query: unknown, holdToken?: string) =>
      guarded("releaseHold", (secret) =>
        releaseHold(provider, secret, query, holdToken, allowHoldCancellation),
      ),
    submitGuestDetails: (input: unknown, holdToken?: string) =>
      guarded(
        "submitGuestDetails",
        (secret) => submitGuestDetails({ provider, secret }, input, holdToken),
        stillConfirming,
      ),
  };
}

export const bookings = createBookingService();
