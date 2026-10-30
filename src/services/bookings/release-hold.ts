import "server-only";

import { err, ok } from "neverthrow";

import { holdReferenceSchema } from "@/lib/booking-schema";
import { readHold } from "@/lib/booking-token";
import { BOOKING_BUDGET_MS, BOOKING_LOG } from "@/lib/constants/booking";
import { LogContext } from "@/lib/enums";
import { logger } from "@/lib/logger";
import type {
  IResDiaryCancelReason,
  TBookingProvider,
  TBookingResult,
  TReleasedHold,
} from "@/lib/types";
import { holdMissing, otherTab, unavailable } from "@/services/bookings/errors";
import { holdSummary } from "@/services/bookings/hold-table";

const CHANGE_REASON = /change/i;

function releaseReason(
  reasons: IResDiaryCancelReason[],
): IResDiaryCancelReason | null {
  return (
    reasons.find((reason) => CHANGE_REASON.test(reason.label)) ??
    reasons[0] ??
    null
  );
}

export async function releaseHold(
  provider: TBookingProvider,
  secret: string,
  query: unknown,
  holdToken: string | undefined,
): TBookingResult<TReleasedHold> {
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

  const options = { deadlineAt: Date.now() + BOOKING_BUDGET_MS.release };
  const status = await provider.getHoldStatus(hold.holdId, options);
  const state = status.isOk() ? status.value.status : null;
  if (state === "confirmed") {
    return ok({
      kind: "confirmed",
      reference: hold.reference,
      summary: holdSummary(hold),
    });
  }
  if (state === "failed" || state === "cancelled") {
    return ok({ kind: "released" });
  }
  if (state !== "pending") {
    return err(unavailable());
  }

  const reasons = await provider.getCancellationReasons(options);
  const reason = reasons.isOk() ? releaseReason(reasons.value) : null;
  if (!reason) {
    if (reasons.isOk()) {
      logger.error(LogContext.Api, BOOKING_LOG.noCancelReason, {
        reference: hold.reference,
      });
    }
    return err(unavailable());
  }
  const cancelled = await provider.cancelHold(
    { holdId: hold.holdId, reference: hold.reference, reasonId: reason.id },
    options,
  );
  return cancelled.isOk() ? ok({ kind: "released" }) : err(unavailable());
}
