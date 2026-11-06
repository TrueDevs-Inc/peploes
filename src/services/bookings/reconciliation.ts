import "server-only";

import { createHmac, randomUUID } from "node:crypto";

import { BOOKING_BUDGET_MS, BOOKING_LOG } from "@/lib/constants/booking";
import { AppModule, LogContext, SentryContext, Stage } from "@/lib/enums";
import { logToSentry } from "@/lib/error-handler";
import { logger } from "@/lib/logger";
import type {
  IResDiaryHoldInput,
  TBookingObservation,
  TBookingProvider,
  THoldToken,
} from "@/lib/types";

export async function requestBookingHold(
  provider: TBookingProvider,
  input: IResDiaryHoldInput,
) {
  const attemptId = randomUUID();
  logger.info(LogContext.Api, BOOKING_LOG.observation, {
    event: "hold_requested",
    attemptId,
  });
  const result = await provider.createHold(input, {
    deadlineAt: Date.now() + BOOKING_BUDGET_MS.holdCreate,
  });
  if (result.isOk()) {
    logger.info(LogContext.Api, BOOKING_LOG.observation, {
      event: "hold_accepted",
      attemptId,
      holdId: result.value.holdId,
    });
  } else if (result.error.kind === "outcome_unknown") {
    logger.error(LogContext.Api, BOOKING_LOG.observation, {
      event: "hold_outcome_unknown",
      attemptId,
      failure: result.error.kind,
    });
  } else {
    logger.info(LogContext.Api, BOOKING_LOG.observation, {
      event: "hold_refused",
      attemptId,
      failure: result.error.kind,
    });
  }
  return result;
}

export function recordBookingObservation(
  hold: THoldToken,
  secret: string,
  event: TBookingObservation,
): void {
  const correlationId = createHmac("sha256", secret)
    .update(`peploes:booking-reconciliation:${hold.holdId}`)
    .digest("hex");
  const evidence = { event, correlationId, revision: hold.rev };
  const metadata = { ...evidence, holdId: hold.holdId };
  const needsReview =
    event === "outcome_unknown" ||
    event === "status_unknown" ||
    event === "status_unavailable";

  if (needsReview) {
    logger.error(LogContext.Api, BOOKING_LOG.reconciliationRequired, metadata);
    logToSentry(BOOKING_LOG.reconciliationRequired, {
      module: AppModule.Api,
      stage: Stage.ServiceCall,
      tags: { bookingReconciliation: "required" },
      context: { [SentryContext.OperationData]: evidence },
    });
    return;
  }

  logger.info(LogContext.Api, BOOKING_LOG.observation, metadata);
}
