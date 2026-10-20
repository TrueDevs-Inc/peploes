import "server-only";

import { err, ok } from "neverthrow";

import { holdInputSchema } from "@/lib/booking-schema";
import { readHold, signHold } from "@/lib/booking-token";
import { HTTP_STATUS, MILLISECONDS_PER_SECOND } from "@/lib/constants";
import {
  BOOKING_BUDGET_MS,
  BOOKING_HOLD,
  BOOKING_LOST_REPLY_STATUSES,
  BOOKING_MESSAGES,
} from "@/lib/constants/booking";
import { guestsLabel, shortDateLabel, timeLabel } from "@/lib/dates";
import type {
  IBookingError,
  IBookingVisit,
  ICheckedOffer,
  ICurrentOffer,
  IHoldResult,
  IHoldSummary,
  IResDiaryChangeHoldInput,
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
  holdExpired,
  holdUnclear,
  invalid,
  invalidInput,
  timeGone,
  tooManyHolds,
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
    revision: hold.rev,
  };
}

export function cookieMaxAgeSeconds(hold: THoldToken, now: number): number {
  return Math.ceil(
    (hold.expiresAt + BOOKING_HOLD.cookieGraceMs - now) /
      MILLISECONDS_PER_SECOND,
  );
}

function holdResult(
  holdToken: string,
  hold: THoldToken,
  now: number,
): IHoldResult {
  return {
    holdToken,
    cookieMaxAgeSeconds: cookieMaxAgeSeconds(hold, now),
    expiresInMs: hold.expiresAt - now,
    summary: holdSummary(hold),
  };
}

function isSameChoice(hold: THoldToken, choice: THoldInput): boolean {
  return (
    hold.searchDate === choice.searchDate &&
    hold.time === choice.time &&
    hold.partySize === choice.partySize &&
    hold.offer.kind === choice.offer.kind
  );
}

function canMove(hold: THoldToken, now: number): boolean {
  return (
    !hold.detailsSent &&
    hold.rev < BOOKING_HOLD.maxMovesPerHold &&
    hold.expiresAt - now > BOOKING_HOLD.moveMinRemainingMs
  );
}

async function currentStatus(
  provider: TBookingProvider,
  hold: THoldToken,
): Promise<IResDiaryHoldStatus["status"] | null> {
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
    return err(unavailable());
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

async function offerAfterRefusal(
  provider: TBookingProvider,
  choice: THoldInput,
  visit: IBookingVisit,
): Promise<IBookingError> {
  const again = await currentOffer(
    provider,
    choice,
    visit,
    Date.now() + BOOKING_BUDGET_MS.holdRecovery,
  );
  return again.isOk() && again.value === null ? timeGone() : unavailable();
}

async function afterFailedHold(
  provider: TBookingProvider,
  choice: THoldInput,
  visit: IBookingVisit,
  failure: TResDiaryFailure,
): Promise<IBookingError> {
  const unclear =
    failure.kind === "outcome_unknown" ||
    (failure.kind === "unavailable" && failure.httpStatus !== undefined);
  return unclear
    ? await offerAfterRefusal(provider, choice, visit)
    : unavailable();
}

async function checkedOffer(
  provider: TBookingProvider,
  choice: THoldInput,
): TBookingResult<ICheckedOffer> {
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
  return ok({ visit: visit.value, ...current.value });
}

function isLostReply(failure: TResDiaryFailure): boolean {
  return (
    failure.kind === "outcome_unknown" &&
    (failure.httpStatus === undefined ||
      failure.httpStatus < HTTP_STATUS.BAD_REQUEST ||
      BOOKING_LOST_REPLY_STATUSES.has(failure.httpStatus))
  );
}

async function afterFailedMove(
  provider: TBookingProvider,
  choice: THoldInput,
  visit: IBookingVisit,
  move: IResDiaryChangeHoldInput,
  failure: TResDiaryFailure,
): TBookingResult<null> {
  if (failure.kind === "not_found") {
    return err(holdExpired());
  }
  if (failure.kind === "rejected") {
    return err(unavailable());
  }
  if (isLostReply(failure)) {
    const again = await provider.changeHold(move, {
      deadlineAt: Date.now() + BOOKING_BUDGET_MS.holdRecovery,
    });
    return again.isOk() ? ok(null) : err(holdUnclear());
  }
  if (failure.kind !== "outcome_unknown") {
    return err(unavailable());
  }
  return err(await offerAfterRefusal(provider, choice, visit));
}

async function movedHold(
  provider: TBookingProvider,
  secret: string,
  hold: THoldToken,
  choice: THoldInput,
): TBookingResult<IHoldResult> {
  const checked = await checkedOffer(provider, choice);
  if (checked.isErr()) {
    return err(checked.error);
  }
  const { visit, time, offer } = checked.value;
  const move = {
    holdId: hold.holdId,
    date: choice.searchDate,
    time: choice.time,
    partySize: choice.partySize,
  };
  const moved = await provider.changeHold(move, {
    deadlineAt: Date.now() + BOOKING_BUDGET_MS.holdChange,
  });
  if (moved.isErr()) {
    const recovered = await afterFailedMove(
      provider,
      choice,
      visit,
      move,
      moved.error,
    );
    if (recovered.isErr()) {
      return err(recovered.error);
    }
  }
  const now = Date.now();
  const token: THoldToken = {
    ...hold,
    searchDate: choice.searchDate,
    date: time.date,
    time: time.time,
    partySize: choice.partySize,
    offer,
    rev: hold.rev + 1,
    detailsSent: false,
  };
  return ok(holdResult(signHold(token, secret), token, now));
}

async function newHold(
  provider: TBookingProvider,
  secret: string,
  choice: THoldInput,
  mayHoldAnother: THoldGate,
): TBookingResult<IHoldResult> {
  const checked = await checkedOffer(provider, choice);
  if (checked.isErr()) {
    return err(checked.error);
  }
  const { visit, time, offer } = checked.value;

  if (!(await mayHoldAnother())) {
    return err(tooManyHolds());
  }
  const hold = await provider.createHold(
    { date: choice.searchDate, time: choice.time, partySize: choice.partySize },
    { deadlineAt: Date.now() + BOOKING_BUDGET_MS.holdCreate },
  );
  if (hold.isErr()) {
    return err(await afterFailedHold(provider, choice, visit, hold.error));
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
    rev: 1,
    detailsSent: false,
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
  const choice = parsed.data;
  const existing = existingToken ? readHold(existingToken, secret) : null;
  if (existingToken && existing && isSameChoice(existing, choice)) {
    const status = await currentStatus(provider, existing);
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
  } else if (existing && canMove(existing, Date.now())) {
    return movedHold(provider, secret, existing, choice);
  }
  return newHold(provider, secret, choice, mayHoldAnother);
}
