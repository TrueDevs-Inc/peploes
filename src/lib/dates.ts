import { formatDistanceToNow } from "date-fns";

import {
  CALENDAR_FORMAT,
  CALENDAR_NAMES,
  GUEST_WORDS,
  MILLISECONDS_PER_DAY,
  RESTAURANT_TIME_ZONE,
} from "@/lib/constants";
import type { IDatePeriod, IRestaurantNow } from "@/lib/types";

export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-IE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function timeAgo(isoDate: string): string {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return formatDistanceToNow(date, { addSuffix: true });
}

export function formatLongDateTime(date?: Date): string {
  const d = date ?? new Date();
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });
}

const dublinFormat = new Intl.DateTimeFormat(CALENDAR_FORMAT.partsLocale, {
  timeZone: RESTAURANT_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function dublinNow(): IRestaurantNow {
  const parts = Object.fromEntries(
    dublinFormat
      .formatToParts(new Date())
      .map((part) => [part.type, part.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  };
}

export function dublinToday(): string {
  return dublinNow().date;
}

export function utcMidnight(date: string): number {
  return Date.parse(`${date}${CALENDAR_FORMAT.utcMidnightSuffix}`);
}

export function isCalendarDate(value: string): boolean {
  if (!CALENDAR_FORMAT.datePattern.test(value)) {
    return false;
  }
  const at = utcMidnight(value);
  return !Number.isNaN(at) && new Date(at).toISOString().startsWith(value);
}

export function isClockTime(value: string): boolean {
  return CALENDAR_FORMAT.clockPattern.test(value);
}

export function addDays(date: string, days: number): string {
  const at = utcMidnight(date) + days * MILLISECONDS_PER_DAY;
  return new Date(at).toISOString().slice(0, 10);
}

export function weekdayOf(date: string): number {
  return new Date(utcMidnight(date)).getUTCDay();
}

export function isInPeriod(date: string, period: IDatePeriod): boolean {
  return period.from <= date && date <= period.to;
}

export function timeLabel(time: string): string {
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  const { hoursPerHalfDay, morning, afternoon } = CALENDAR_FORMAT;
  const suffix = hours < hoursPerHalfDay ? morning : afternoon;
  return `${hours % hoursPerHalfDay || hoursPerHalfDay}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function dateParts(date: string) {
  const at = new Date(utcMidnight(date));
  return {
    weekday: at.getUTCDay(),
    day: at.getUTCDate(),
    month: at.getUTCMonth(),
    year: at.getUTCFullYear(),
  };
}

export function longDateLabel(date: string): string {
  const { weekday, day, month, year } = dateParts(date);
  return `${CALENDAR_NAMES.weekdays[weekday]}, ${day} ${CALENDAR_NAMES.months[month]} ${year}`;
}

export function shortDateLabel(date: string): string {
  const { weekday, day, month, year } = dateParts(date);
  return `${CALENDAR_NAMES.weekdaysShort[weekday]}, ${day} ${CALENDAR_NAMES.monthsShort[month]} ${year}`;
}

export function guestsLabel(partySize: number): string {
  return `${partySize} ${partySize === 1 ? GUEST_WORDS.one : GUEST_WORDS.many}`;
}
