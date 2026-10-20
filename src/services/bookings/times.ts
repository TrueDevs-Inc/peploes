import "server-only";

import { err, ok } from "neverthrow";

import { timesQuerySchema } from "@/lib/booking-schema";
import {
  BOOKING_BUDGET_MS,
  BOOKING_LOG,
  BOOKING_NEXT_DAY_LABEL,
  BOOKING_SKIP_REASONS,
} from "@/lib/constants/booking";
import { addDays, guestsLabel, longDateLabel, timeLabel } from "@/lib/dates";
import { LogContext } from "@/lib/enums";
import { logger } from "@/lib/logger";
import type {
  IBookingTime,
  IBookingVisit,
  IResDiarySlot,
  IResDiaryTimes,
  IReturnBy,
  ISkippedSlot,
  ITimesData,
  TBookingProvider,
  TBookingResult,
  TBookingSkipReason,
  TTimesEmptyReason,
} from "@/lib/types";
import { invalidInput, unavailable } from "@/services/bookings/errors";
import { checkVisit } from "@/services/bookings/visit";

function withDay(label: string, nextDay: boolean): string {
  return nextDay ? `${label}${BOOKING_NEXT_DAY_LABEL}` : label;
}

function calendarDay(
  slot: IResDiarySlot,
  searchDate: string,
  visit: IBookingVisit,
): string {
  const serviceStart = visit.serviceStarts.get(slot.serviceId);
  const afterMidnight =
    slot.date === searchDate &&
    serviceStart !== undefined &&
    slot.time < serviceStart;
  return afterMidnight ? addDays(searchDate, 1) : slot.date;
}

function isPassed(
  day: string,
  slot: IResDiarySlot,
  visit: IBookingVisit,
): boolean {
  return day === visit.today && slot.time <= visit.now;
}

function returnBy(
  slot: IResDiarySlot,
  day: string,
  searchDate: string,
): IReturnBy | null {
  if (slot.leaveTime === null) {
    return null;
  }
  const { time } = slot.leaveTime;
  const nextDay =
    slot.leaveTime.nextDay || day !== searchDate || time < slot.time;
  return {
    time,
    label: withDay(timeLabel(time), nextDay),
    nextDay,
    required: slot.leaveTimeRequired,
  };
}

function toBookingTime(
  slot: IResDiarySlot,
  day: string,
  searchDate: string,
  mayRequireCard: boolean,
): IBookingTime {
  return {
    searchDate,
    date: day,
    time: slot.time,
    label: withDay(timeLabel(slot.time), day !== searchDate),
    offers: [
      {
        kind: "standard",
        feeCents: slot.feeCents,
        mayRequireCard,
        returnBy: returnBy(slot, day, searchDate),
      },
    ],
  };
}

function badSlotReason(
  slot: IResDiarySlot,
  searchDate: string,
): TBookingSkipReason | null {
  if (slot.date !== searchDate && slot.date !== addDays(searchDate, 1)) {
    return BOOKING_SKIP_REASONS.date;
  }
  if (slot.leaveTimeRequired && slot.leaveTime === null) {
    return BOOKING_SKIP_REASONS.returnTime;
  }
  return null;
}

export function bookableTimes(
  search: IResDiaryTimes,
  searchDate: string,
  visit: IBookingVisit,
): IBookingTime[] {
  const kept = new Map<string, IBookingTime>();
  const skipped: ISkippedSlot[] = [];
  for (const slot of search.slots) {
    const reason = badSlotReason(slot, searchDate);
    if (reason !== null) {
      skipped.push({ date: slot.date, time: slot.time, reason });
    } else {
      const day = calendarDay(slot, searchDate, visit);
      if (slot.standard && !isPassed(day, slot, visit)) {
        kept.set(
          `${day} ${slot.time}`,
          toBookingTime(slot, day, searchDate, search.mayRequireCard),
        );
      }
    }
  }
  if (skipped.length > 0) {
    logger.warn(LogContext.Api, BOOKING_LOG.skippedTimes, { slots: skipped });
  }
  return [...kept.values()].sort(
    (a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time),
  );
}

function emptyReason(
  times: IBookingTime[],
  search: IResDiaryTimes,
  searchDate: string,
  visit: IBookingVisit,
): TTimesEmptyReason | null {
  if (times.length > 0) {
    return null;
  }
  const allPassed =
    search.slots.length > 0 &&
    search.slots.every((slot) =>
      isPassed(calendarDay(slot, searchDate, visit), slot, visit),
    );
  return allPassed ? "all_passed" : "none_online";
}

export async function findTimes(
  provider: TBookingProvider,
  input: unknown,
): TBookingResult<ITimesData> {
  const parsed = timesQuerySchema.safeParse(input);
  if (!parsed.success) {
    return err(invalidInput(parsed.error));
  }
  const { date, partySize } = parsed.data;
  const deadlineAt = Date.now() + BOOKING_BUDGET_MS.times;
  const visit = await checkVisit(provider, parsed.data, deadlineAt);
  if (visit.isErr()) {
    return err(visit.error);
  }
  const answer = {
    date,
    dateLabel: longDateLabel(date),
    partySize,
    guestsLabel: guestsLabel(partySize),
  };
  if (visit.value.closed) {
    return ok({ ...answer, times: [], emptyReason: "closed" });
  }

  const search = await provider.searchTimes(
    { date, partySize },
    { deadlineAt },
  );
  if (search.isErr()) {
    return err(unavailable());
  }
  const times = bookableTimes(search.value, date, visit.value);
  return ok({
    ...answer,
    times,
    emptyReason: emptyReason(times, search.value, date, visit.value),
  });
}
