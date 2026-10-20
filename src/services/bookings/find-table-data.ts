import "server-only";

import { err, ok } from "neverthrow";

import { CALENDAR_NAMES } from "@/lib/constants";
import {
  BOOKING_BUDGET_MS,
  BOOKING_DEFAULT_DATE_SEARCH_DAYS,
  BOOKING_LOG,
  BOOKING_MESSAGES,
} from "@/lib/constants/booking";
import { addDays, dublinToday } from "@/lib/dates";
import { LogContext } from "@/lib/enums";
import { logger } from "@/lib/logger";
import type {
  IFindTableData,
  IResDiaryClosedDates,
  TBookingProvider,
  TBookingResult,
} from "@/lib/types";
import { htmlToParagraphs } from "@/lib/utils";
import { unavailable } from "@/services/bookings/errors";
import {
  flagPartyCapConflict,
  impossibleLimits,
  isClosed,
  loadWindow,
  partyLimits,
} from "@/services/bookings/visit";

function firstOpenDate(
  today: string,
  lastDate: string | null,
  closed: IResDiaryClosedDates,
): string {
  for (
    let offset = 0;
    offset <= BOOKING_DEFAULT_DATE_SEARCH_DAYS;
    offset += 1
  ) {
    const date = addDays(today, offset);
    if (lastDate !== null && date > lastDate) {
      break;
    }
    if (!isClosed(date, closed)) {
      return date;
    }
  }
  return today;
}

export async function findTableData(
  provider: TBookingProvider,
): TBookingResult<IFindTableData> {
  const today = dublinToday();
  const window = await loadWindow(
    provider,
    today,
    Date.now() + BOOKING_BUDGET_MS.findTable,
  );
  if (window.isErr()) {
    return err(window.error);
  }
  const { rules, lastDate, closed } = window.value;

  const impossible = impossibleLimits(rules);
  if (impossible) {
    return err(impossible);
  }
  flagPartyCapConflict(rules);
  const { min, max } = partyLimits(rules);
  if (closed.closedWeekdays.length === CALENDAR_NAMES.weekdays.length) {
    logger.error(LogContext.Api, BOOKING_LOG.everyWeekdayClosed);
    return err(unavailable());
  }

  const calendarClosed = {
    closedWeekdays: closed.closedWeekdays,
    closedPeriods: closed.closedPeriods.filter(
      (period) =>
        period.to >= today && (lastDate === null || period.from <= lastDate),
    ),
  };
  const terms = htmlToParagraphs(rules.termsHtml);
  return ok({
    partySize: {
      min,
      max,
      default: Math.min(Math.max(rules.defaultPartySize, min), max),
    },
    calendar: {
      today,
      lastDate,
      defaultDate: firstOpenDate(today, lastDate, calendarClosed),
      ...calendarClosed,
    },
    terms: terms.length > 0 ? terms : [BOOKING_MESSAGES.termsMissing],
  });
}
