import "server-only";

import { err, ok } from "neverthrow";

import { calendarQuerySchema } from "@/lib/booking-schema";
import { MILLISECONDS_PER_DAY } from "@/lib/constants";
import {
  BOOKING_BUDGET_MS,
  BOOKING_CALENDAR_MAX_DAYS,
  BOOKING_LOG,
  BOOKING_MESSAGES,
} from "@/lib/constants/booking";
import { dublinToday, utcMidnight } from "@/lib/dates";
import { LogContext } from "@/lib/enums";
import { logger } from "@/lib/logger";
import type {
  ICalendarDays,
  TBookingProvider,
  TBookingResult,
} from "@/lib/types";
import { invalid, invalidInput, unavailable } from "@/services/bookings/errors";
import {
  isClosed,
  loadWindow,
  siteLimitError,
} from "@/services/bookings/visit";

export async function findCalendarDays(
  provider: TBookingProvider,
  input: unknown,
): TBookingResult<ICalendarDays> {
  const parsed = calendarQuerySchema.safeParse(input);
  if (!parsed.success) {
    return err(invalidInput(parsed.error));
  }
  const { from, to, partySize } = parsed.data;
  const overCap = siteLimitError(partySize);
  if (overCap) {
    return err(overCap);
  }
  const days = (utcMidnight(to) - utcMidnight(from)) / MILLISECONDS_PER_DAY + 1;
  if (days < 1 || days > BOOKING_CALENDAR_MAX_DAYS) {
    return err(invalid("date", BOOKING_MESSAGES.chooseDate));
  }
  const deadlineAt = Date.now() + BOOKING_BUDGET_MS.calendar;
  const today = dublinToday();
  const window = await loadWindow(provider, today, deadlineAt);
  if (window.isErr()) {
    return err(window.error);
  }
  const { lastDate, closed } = window.value;

  const start = from < today ? today : from;
  const end = lastDate !== null && to > lastDate ? lastDate : to;
  if (start > end) {
    return ok({ from, to, partySize, openDates: [] });
  }
  const range = await provider.getAvailableDates(
    { from: start, to: end, partySize },
    { deadlineAt },
  );
  if (range.isErr()) {
    return err(unavailable());
  }
  if (range.value.missing) {
    logger.warn(LogContext.Api, BOOKING_LOG.rangeUnchecked, {
      ...range.value.missing,
    });
  }
  const openDates = range.value.dates
    .filter(
      (day) =>
        day.times.length > 0 &&
        day.date >= start &&
        day.date <= end &&
        !isClosed(day.date, closed),
    )
    .map((day) => day.date);
  return ok({
    from,
    to,
    partySize,
    openDates: [...new Set(openDates)].sort(),
  });
}
