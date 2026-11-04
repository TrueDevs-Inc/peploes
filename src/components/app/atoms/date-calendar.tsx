"use client";

import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { type KeyboardEvent, useRef, useState } from "react";

import styles from "@/components/app/atoms/date-calendar.module.css";
import { CALENDAR_NAMES } from "@/lib/constants";
import { dublinToday, isCalendarDate } from "@/lib/dates";
import type { IDateCalendarProps } from "@/lib/types";
import { cn } from "@/lib/utils";

export function DateCalendar({
  id,
  value,
  min,
  onChange,
  className,
}: IDateCalendarProps) {
  const initialDate =
    isCalendarDate(value) && (!min || value >= min)
      ? value
      : (min ?? dublinToday());
  const [month, setMonth] = useState(() => startOfMonth(parseISO(initialDate)));
  const [activeDate, setActiveDate] = useState(initialDate);
  const calendar = useRef<HTMLFieldSetElement>(null);
  const days = eachDayOfInterval({
    start: startOfWeek(month, { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
  });

  function changeMonth(offset: number) {
    const next = addMonths(month, offset);
    const first = format(next, "yyyy-MM-dd");
    if (!isCalendarDate(first)) return;
    setMonth(next);
    setActiveDate(min && first < min ? min : first);
  }

  function moveDay(event: KeyboardEvent<HTMLButtonElement>, day: Date) {
    const next = new Map([
      ["ArrowLeft", addDays(day, -1)],
      ["ArrowRight", addDays(day, 1)],
      ["ArrowUp", addDays(day, -7)],
      ["ArrowDown", addDays(day, 7)],
      ["Home", startOfWeek(day, { weekStartsOn: 1 })],
      ["End", endOfWeek(day, { weekStartsOn: 1 })],
      ["PageUp", addMonths(day, -1)],
      ["PageDown", addMonths(day, 1)],
    ]).get(event.key);
    if (!next) return;
    event.preventDefault();
    const date = format(next, "yyyy-MM-dd");
    if (!isCalendarDate(date)) return;
    const target = min && date < min ? min : date;
    setMonth(startOfMonth(parseISO(target)));
    setActiveDate(target);
    requestAnimationFrame(() => {
      calendar.current
        ?.querySelector<HTMLButtonElement>(`[data-date="${target}"]`)
        ?.focus();
    });
  }

  return (
    <fieldset
      ref={calendar}
      id={id}
      className={cn(styles.calendar, className)}
      aria-label="Choose date"
    >
      <div className={styles.header}>
        <strong aria-live="polite">{format(month, "MMMM yyyy")}</strong>
        <button
          type="button"
          aria-label="Previous month"
          disabled={Boolean(min && format(month, "yyyy-MM") <= min.slice(0, 7))}
          onClick={() => changeMonth(-1)}
        >
          <ArrowLeft aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="Next month"
          disabled={!isCalendarDate(format(addMonths(month, 1), "yyyy-MM-dd"))}
          onClick={() => changeMonth(1)}
        >
          <ArrowRight aria-hidden="true" />
        </button>
      </div>
      <div className={styles.grid}>
        {days.slice(0, 7).map((day) => (
          <span key={day.getDay()}>
            {CALENDAR_NAMES.weekdaysShort[day.getDay()]}
          </span>
        ))}
        {days.map((day) => {
          const date = format(day, "yyyy-MM-dd");
          return (
            <button
              type="button"
              key={date}
              aria-label={format(day, "EEEE, d MMMM yyyy")}
              aria-pressed={date === value}
              data-outside={!isSameMonth(day, month)}
              data-date={date}
              data-past-week={Boolean(
                min &&
                  format(endOfWeek(day, { weekStartsOn: 1 }), "yyyy-MM-dd") <
                    min,
              )}
              tabIndex={date === activeDate ? 0 : -1}
              disabled={!isCalendarDate(date) || Boolean(min && date < min)}
              onFocus={() => setActiveDate(date)}
              onKeyDown={(event) => moveDay(event, day)}
              onClick={() => onChange(date)}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
