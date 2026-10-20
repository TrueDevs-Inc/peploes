import "server-only";

import { err, ok } from "neverthrow";

import { holdReferenceSchema } from "@/lib/booking-schema";
import { readHold } from "@/lib/booking-token";
import { BOOKING_BUDGET_MS } from "@/lib/constants/booking";
import type {
  IHoldStatusResult,
  IResDiaryHoldStatus,
  TBookingProvider,
  TBookingResult,
  THoldState,
  THoldToken,
} from "@/lib/types";
import { holdMissing, otherTab, unavailable } from "@/services/bookings/errors";
import { holdSummary } from "@/services/bookings/hold-table";

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
    return err(unavailable());
  }
  const status = toState(reply.value.status, hold, Date.now());
  return ok({
    status,
    reference: hold.reference,
    summary: holdSummary(hold),
    clearHold: status !== "pending",
  });
}
