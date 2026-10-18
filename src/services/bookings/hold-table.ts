import "server-only";

import { err, ok } from "neverthrow";

import { holdInputSchema } from "@/lib/booking-schema";
import { readHold, signHold } from "@/lib/booking-token";
import { MILLISECONDS_PER_SECOND } from "@/lib/constants";
import {
  BOOKING_BUDGET_MS,
  BOOKING_HOLD,
  BOOKING_LOG,
  BOOKING_MESSAGES,
} from "@/lib/constants/booking";
import { guestsLabel, shortDateLabel, timeLabel } from "@/lib/dates";
import { LogContext } from "@/lib/enums";
import { logger } from "@/lib/logger";
import type {
  IBookingError,
  IBookingVisit,
  ICurrentOffer,
  IHoldResult,
  IHoldSummary,
  IResDiaryHoldStatus,
  TBookingProvider,
  TBookingResult,
  THoldGate,
  THoldInput,
  THoldToken,
  TResDiaryFailure,
  TStandardOffer,
} from "@/lib/types";
import {
  alreadyBooked,
  invalid,
  invalidInput,
  searchFailed,
  timeGone,
  unavailable,
} from "@/services/bookings/errors";
import { bookableTimes } from "@/services/bookings/times";
import { checkVisit } from "@/services/bookings/visit";

export function holdSummary(hold: THoldToken): IHoldSummary {
  return {
    reference: hold.reference,
    date: hold.date,
    dateLabel: shortDateLabel(hold.date),
    time: hold.time,
    timeLabel: timeLabel(hold.time),
    partySize: hold.partySize,
    guestsLabel: guestsLabel(hold.partySize),
    offer: hold.offer,
  };
}

function holdResult(
  holdToken: string,
  hold: THoldToken,
  now: number,
): IHoldResult {
  return {
    holdToken,
    cookieMaxAgeSeconds: Math.ceil(
      (hold.expiresAt + BOOKING_HOLD.cookieGraceMs - now) /
        MILLISECONDS_PER_SECOND,
    ),
    expiresInMs: hold.expiresAt - now,
    summary: holdSummary(hold),
  };
}

async function sameChoiceStatus(
  provider: TBookingProvider,
  hold: THoldToken,
  choice: THoldInput,
): Promise<IResDiaryHoldStatus["status"] | null> {
  const sameChoice =
    hold.searchDate === choice.searchDate &&
    hold.time === choice.time &&
    hold.partySize === choice.partySize &&
    hold.offer.kind === choice.offer.kind;
  if (!sameChoice) {
    return null;
  }
  const status = await provider.getHoldStatus(hold.holdId, {
    deadlineAt: Date.now() + BOOKING_BUDGET_MS.holdStatus,
  });
  return status.isOk() ? status.value.status : null;
}

async function currentOffer(
  provider: TBookingProvider,
  choice: THoldInput,
  visit: IBookingVisit,
  deadlineAt: number,
): TBookingResult<ICurrentOffer | null> {
  const search = await provider.searchTimes(
    { date: choice.searchDate, partySize: choice.partySize },
    { deadlineAt },
  );
  if (search.isErr()) {
    return err(searchFailed(search.error));
  }
  const time = bookableTimes(search.value, choice.searchDate, visit).find(
    (bookable) => bookable.time === choice.time,
  );
  const offer = time?.offers.find(
    (candidate): candidate is TStandardOffer =>
      candidate.kind === choice.offer.kind,
  );
  return ok(time && offer ? { time, offer } : null);
}

async function afterFailedHold(
  provider: TBookingProvider,
  choice: THoldInput,
  visit: IBookingVisit,
  failure: TResDiaryFailure,
): Promise<IBookingError> {
  if (failure.kind === "rejected") {
    logger.error(LogContext.Api, BOOKING_LOG.holdRejected, {
      fields: failure.fields,
    });
  }
  const unclear =
    failure.kind === "outcome_unknown" ||
    (failure.kind === "unavailable" && failure.httpStatus !== undefined);
  if (!unclear) {
    return unavailable();
  }
  const again = await currentOffer(
    provider,
    choice,
    visit,
    Date.now() + BOOKING_BUDGET_MS.holdRecovery,
  );
  return again.isOk() && again.value === null ? timeGone() : unavailable();
}

async function newHold(
  provider: TBookingProvider,
  secret: string,
  choice: THoldInput,
  mayHoldAnother: THoldGate,
): TBookingResult<IHoldResult> {
  const checkBy = Date.now() + BOOKING_BUDGET_MS.holdCheck;
  const visit = await checkVisit(
    provider,
    { date: choice.searchDate, partySize: choice.partySize },
    checkBy,
  );
  if (visit.isErr()) {
    return err(visit.error);
  }
  if (visit.value.closed) {
    return err(invalid("date", BOOKING_MESSAGES.closedDay));
  }
  const current = await currentOffer(provider, choice, visit.value, checkBy);
  if (current.isErr()) {
    return err(current.error);
  }
  if (current.value === null) {
    return err(timeGone());
  }
  const { time, offer } = current.value;

  if (!(await mayHoldAnother())) {
    return err(unavailable());
  }
  const hold = await provider.createHold(
    { date: choice.searchDate, time: choice.time, partySize: choice.partySize },
    { deadlineAt: Date.now() + BOOKING_BUDGET_MS.holdCreate },
  );
  if (hold.isErr()) {
    return err(
      await afterFailedHold(provider, choice, visit.value, hold.error),
    );
  }
  const now = Date.now();
  const token: THoldToken = {
    v: BOOKING_HOLD.tokenVersion,
    holdId: hold.value.holdId,
    reference: hold.value.reference,
    searchDate: choice.searchDate,
    date: time.date,
    time: time.time,
    partySize: choice.partySize,
    offer,
    issuedAt: now,
    expiresAt: now + hold.value.expiresInMs,
  };
  return ok(holdResult(signHold(token, secret), token, now));
}

export async function holdTable(
  provider: TBookingProvider,
  secret: string,
  input: unknown,
  mayHoldAnother: THoldGate,
  existingToken: string | undefined,
): TBookingResult<IHoldResult> {
  const parsed = holdInputSchema.safeParse(input);
  if (!parsed.success) {
    return err(invalidInput(parsed.error));
  }
  const existing = existingToken ? readHold(existingToken, secret) : null;
  if (existingToken && existing) {
    const status = await sameChoiceStatus(provider, existing, parsed.data);
    if (status === "confirmed") {
      return err(alreadyBooked(existing.reference));
    }
    const now = Date.now();
    if (
      status === "pending" &&
      existing.expiresAt - now > BOOKING_HOLD.reuseMinRemainingMs
    ) {
      return ok(holdResult(existingToken, existing, now));
    }
  }
  return newHold(provider, secret, parsed.data, mayHoldAnother);
}
