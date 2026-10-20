import "server-only";

import { err, ok } from "neverthrow";

import {
  BOOKING_GUEST_LIMITS,
  BOOKING_LOG,
  BOOKING_MESSAGES,
} from "@/lib/constants/booking";
import {
  addDays,
  dublinNow,
  isInPeriod,
  shortDateLabel,
  weekdayOf,
} from "@/lib/dates";
import { LogContext } from "@/lib/enums";
import { logger } from "@/lib/logger";
import type {
  IBookingError,
  IBookingVisit,
  IBookingWindow,
  IPartyLimits,
  IResDiaryClosedDates,
  IResDiaryRules,
  IResDiaryTimeSearchInput,
  TBookingProvider,
  TBookingResult,
} from "@/lib/types";
import { invalid, unavailable } from "@/services/bookings/errors";

const flaggedMaxima = new Set<number>();
const flaggedServices = new Set<number>();

export function partyLimits(rules: IResDiaryRules): IPartyLimits {
  return {
    min: rules.minPartySize,
    max: Math.min(rules.maxPartySize, BOOKING_GUEST_LIMITS.siteMaxPartySize),
  };
}

export function siteLimitError(partySize: number): IBookingError | null {
  const max = BOOKING_GUEST_LIMITS.siteMaxPartySize;
  return partySize > max
    ? invalid("partySize", BOOKING_MESSAGES.tooManyGuests(max))
    : null;
}

export function flagPartyCapConflict(rules: IResDiaryRules): void {
  const { maxPartySize } = rules;
  if (
    maxPartySize <= BOOKING_GUEST_LIMITS.siteMaxPartySize ||
    flaggedMaxima.has(maxPartySize)
  ) {
    return;
  }
  flaggedMaxima.add(maxPartySize);
  logger.warn(LogContext.Api, BOOKING_LOG.partyCapConflict, {
    maxPartySize,
    siteMaxPartySize: BOOKING_GUEST_LIMITS.siteMaxPartySize,
  });
}

export function impossibleLimits(rules: IResDiaryRules): IBookingError | null {
  const { min, max } = partyLimits(rules);
  if (max >= min) {
    return null;
  }
  logger.error(LogContext.Api, BOOKING_LOG.impossiblePartyLimits, {
    minPartySize: rules.minPartySize,
    maxPartySize: rules.maxPartySize,
    siteMaxPartySize: BOOKING_GUEST_LIMITS.siteMaxPartySize,
  });
  return unavailable();
}

export function guestLimitError(
  partySize: number,
  rules: IResDiaryRules,
): IBookingError | null {
  const { min, max } = partyLimits(rules);
  if (partySize < min) {
    return invalid("partySize", BOOKING_MESSAGES.tooFewGuests(min));
  }
  if (partySize > max) {
    return invalid("partySize", BOOKING_MESSAGES.tooManyGuests(max));
  }
  return null;
}

export function isClosed(date: string, closed: IResDiaryClosedDates): boolean {
  return (
    closed.closedWeekdays.includes(weekdayOf(date)) ||
    closed.closedPeriods.some((period) => isInPeriod(date, period))
  );
}

export async function loadWindow(
  provider: TBookingProvider,
  today: string,
  deadlineAt: number,
): TBookingResult<IBookingWindow> {
  const options = { deadlineAt };
  const [rules, closedReply] = await Promise.all([
    provider.getRules(today, options),
    provider.getClosedDates(options),
  ]);
  if (rules.isErr()) {
    return err(unavailable());
  }
  const { maxDaysAhead } = rules.value;
  return ok({
    rules: rules.value,
    lastDate: maxDaysAhead ? addDays(today, maxDaysAhead) : null,
    closed: closedReply.unwrapOr({ closedWeekdays: [], closedPeriods: [] }),
  });
}

export async function checkVisit(
  provider: TBookingProvider,
  input: IResDiaryTimeSearchInput,
  deadlineAt: number,
): TBookingResult<IBookingVisit> {
  const { date: today, time: now } = dublinNow();
  if (input.date < today) {
    return err(invalid("date", BOOKING_MESSAGES.pastDate));
  }
  const window = await loadWindow(provider, today, deadlineAt);
  if (window.isErr()) {
    return err(window.error);
  }
  const { lastDate, closed } = window.value;
  if (lastDate !== null && input.date > lastDate) {
    return err(
      invalid("date", BOOKING_MESSAGES.tooFarAhead(shortDateLabel(lastDate))),
    );
  }
  if (isClosed(input.date, closed)) {
    return ok({ today, now, closed: true, serviceStarts: new Map() });
  }
  const rules = await provider.getRules(input.date, { deadlineAt });
  if (rules.isErr()) {
    return err(unavailable());
  }
  flagPartyCapConflict(rules.value);
  const refused =
    impossibleLimits(rules.value) ??
    guestLimitError(input.partySize, rules.value);
  if (refused) {
    return err(refused);
  }
  const serviceStarts = new Map<number, string>();
  for (const { id, start } of rules.value.services) {
    if (start !== null) {
      serviceStarts.set(id, start);
    } else if (!flaggedServices.has(id)) {
      flaggedServices.add(id);
      logger.warn(LogContext.Api, BOOKING_LOG.serviceStartMissing, {
        serviceId: id,
      });
    }
  }
  return ok({ today, now, closed: false, serviceStarts });
}
