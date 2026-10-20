import "server-only";

import { z } from "zod/v4";

import {
  BOOKING_DATE_FIELDS,
  BOOKING_LOG,
  BOOKING_MESSAGES,
} from "@/lib/constants/booking";
import {
  AppModule,
  ErrorCode,
  LogContext,
  SentryContext,
  Stage,
} from "@/lib/enums";
import { logToSentry } from "@/lib/error-handler";
import { createError, getErrorMetadata } from "@/lib/errors";
import { logger } from "@/lib/logger";
import type {
  IBookingError,
  TBookingField,
  TBookingOperation,
} from "@/lib/types";

export function unavailable(): IBookingError {
  return createError(
    ErrorCode.ServiceUnavailable,
    BOOKING_MESSAGES.unavailable,
  );
}

export function invalid(field: TBookingField, message: string): IBookingError {
  return {
    ...createError(ErrorCode.ValidationError, message),
    fieldErrors: { [field]: message },
  };
}

export function invalidInput(
  error: z.ZodError<Partial<Record<TBookingField, unknown>>>,
): IBookingError {
  const fieldErrors: Record<string, string | undefined> = {};
  for (const [field, messages] of Object.entries(
    z.flattenError(error).fieldErrors,
  )) {
    fieldErrors[BOOKING_DATE_FIELDS.has(field) ? "date" : field] ??=
      messages?.[0];
  }
  return {
    ...createError(
      ErrorCode.ValidationError,
      error.issues[0]?.message ?? BOOKING_MESSAGES.chooseDate,
    ),
    fieldErrors,
  };
}

export function timeGone(): IBookingError {
  return createError(ErrorCode.Conflict, BOOKING_MESSAGES.timeGone);
}

export function tooManyHolds(): IBookingError {
  return createError(ErrorCode.TooManyRequests, BOOKING_MESSAGES.tooManyHolds);
}

export function holdUnclear(): IBookingError {
  return {
    ...createError(ErrorCode.OutcomeUnknown, BOOKING_MESSAGES.holdUnclear),
    clearHold: true,
  };
}

export function holdMissing(): IBookingError {
  return {
    ...createError(ErrorCode.NotFound, BOOKING_MESSAGES.holdMissing),
    clearHold: true,
  };
}

export function otherTab(): IBookingError {
  return createError(ErrorCode.NotFound, BOOKING_MESSAGES.otherTab);
}

export function holdExpired(): IBookingError {
  return {
    ...createError(ErrorCode.HoldExpired, BOOKING_MESSAGES.holdExpired),
    clearHold: true,
  };
}

export function guestBlocked(): IBookingError {
  return {
    ...createError(ErrorCode.Forbidden, BOOKING_MESSAGES.guestBlocked),
    clearHold: true,
  };
}

export function checkDetails(): IBookingError {
  return createError(ErrorCode.ValidationError, BOOKING_MESSAGES.checkDetails);
}

export function stillConfirming(): IBookingError {
  return createError(
    ErrorCode.OutcomeUnknown,
    BOOKING_MESSAGES.stillConfirming,
  );
}

export function alreadyBooked(reference: string): IBookingError {
  return createError(
    ErrorCode.Conflict,
    BOOKING_MESSAGES.alreadyBooked(reference),
  );
}

export function logUnexpected(
  operation: TBookingOperation,
  error: unknown,
): void {
  logger.error(LogContext.Api, BOOKING_LOG.unexpected, {
    operation,
    ...getErrorMetadata(error),
  });
  logToSentry(error, {
    module: AppModule.Api,
    stage: Stage.ServiceCall,
    context: { [SentryContext.OperationData]: { operation } },
  });
}
