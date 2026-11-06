import "server-only";

import { err, ok } from "neverthrow";

import { holdReferenceSchema } from "@/lib/booking-schema";
import { readHold } from "@/lib/booking-token";
import { BOOKING_BUDGET_MS } from "@/lib/constants/booking";
import type {
  IHoldStatusResult,
  IResDiaryHoldStatus,
  TBookingObservation,
  TBookingProvider,
  TBookingResult,
  THoldState,
  THoldToken,
} from "@/lib/types";
import { holdMissing, otherTab, unavailable } from "@/services/bookings/errors";
import { holdSummary } from "@/services/bookings/hold-table";
import { recordBookingObservation } from "@/services/bookings/reconciliation";

function toState(
  status: IResDiaryHoldStatus["status"],
  hold: THoldToken,
  now: number,
): THoldState {
  if (status === "confirmed") {
    return "confirmed";
  }
  if (status === "failed" || status === "cancelled") {
    return now < hold.expiresAt ? "failed" : "expired";
  }
  return "pending";
}

export async function holdStatus(
  provider: TBookingProvider,
  secret: string,
  query: unknown,
  holdToken: string | undefined,
): TBookingResult<IHoldStatusResult> {
  const hold = holdToken ? readHold(holdToken, secret) : null;
  if (!hold) {
    return err(holdMissing());
  }
  const page = holdReferenceSchema.safeParse(query);
  if (
    !page.success ||
    page.data.holdReference !== hold.reference ||
    page.data.holdRevision !== hold.rev
  ) {
    return err(otherTab());
  }
  const reply = await provider.getHoldStatus(hold.holdId, {
    deadlineAt: Date.now() + BOOKING_BUDGET_MS.holdStatus,
  });
  if (reply.isErr()) {
    if (hold.detailsSent) {
      recordBookingObservation(hold, secret, "status_unavailable");
    }
    return err(unavailable());
  }
  const observations = {
    confirmed: "status_confirmed",
    pending: "status_pending",
    failed: "status_failed",
    cancelled: "status_cancelled",
    unknown: "status_unknown",
  } as const satisfies Record<
    IResDiaryHoldStatus["status"],
    TBookingObservation
  >;
  if (hold.detailsSent || reply.value.status !== "pending") {
    recordBookingObservation(hold, secret, observations[reply.value.status]);
  }
  const status = toState(reply.value.status, hold, Date.now());
  return ok({
    status,
    reference: hold.reference,
    summary: holdSummary(hold),
    clearHold: status !== "pending",
  });
}
