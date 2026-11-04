"use client";

import {
  addDays,
  addMonths,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ArrowLeft, ArrowRight, CalendarDays, ChevronDown } from "lucide-react";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";

import styles from "@/components/app/compounds/table-booking-panel.module.css";
import { TABLE_BOOKING_CONTENT } from "@/lib/constants/table-booking";
import { dublinToday, isBookableDay, monthGrid } from "@/lib/dates";
import type { ITableBookingDateProps } from "@/lib/types";

export function TableBookingDate({
  value,
  calendar,
  availability,
  onChange,
}: ITableBookingDateProps) {
  const [open, setOpen] = useState(false);
  const [activeDate, setActiveDate] = useState(value);
  const grid = useRef<HTMLFieldSetElement>(null);
  const [month, setMonth] = useState(() => startOfMonth(parseISO(value)));
  const selectedMonth = value.slice(0, 7);
  const [previousSelectedMonth, setPreviousSelectedMonth] =
    useState(selectedMonth);

  if (selectedMonth !== previousSelectedMonth) {
    setPreviousSelectedMonth(selectedMonth);
    setMonth(startOfMonth(parseISO(value)));
  }
  const trigger = useRef<HTMLButtonElement>(null);
  const today = dublinToday();
  const minimum = today > calendar.today ? today : calendar.today;
  const firstMonth = startOfMonth(parseISO(minimum));
  const lastMonth = calendar.lastDate
    ? startOfMonth(parseISO(calendar.lastDate))
    : null;
  const atFirstMonth = !isAfter(month, firstMonth);
  const atLastMonth = lastMonth !== null && !isBefore(month, lastMonth);
  const days = monthGrid(month).filter(
    (day) =>
      !isBefore(day, startOfWeek(parseISO(minimum), { weekStartsOn: 1 })),
  );
  const openDates = availability.datesFor(month);
  const { load } = availability;

  function isUnavailable(date: string, available = openDates) {
    return (
      date < minimum ||
      !isBookableDay(date, calendar) ||
      (Array.isArray(available) && !available.includes(date))
    );
  }
  const tabDay =
    days.find(
      (day) =>
        format(day, "yyyy-MM-dd") === activeDate && !isUnavailable(activeDate),
    ) ?? days.find((day) => !isUnavailable(format(day, "yyyy-MM-dd")));

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
    const targetMonth = startOfMonth(next);
    if (
      isBefore(targetMonth, firstMonth) ||
      (lastMonth && isAfter(targetMonth, lastMonth))
    )
      return;
    const forward =
      event.key === "Home" || (event.key !== "End" && !isBefore(next, day));
    const candidates = monthGrid(targetMonth);
    if (!forward) candidates.reverse();
    const available = availability.datesFor(targetMonth) ?? "loading";
    const target = candidates.find(
      (candidate) =>
        (forward ? !isBefore(candidate, next) : !isAfter(candidate, next)) &&
        !isUnavailable(format(candidate, "yyyy-MM-dd"), available),
    );
    if (!target) return;
    const date = format(target, "yyyy-MM-dd");
    setMonth(targetMonth);
    setActiveDate(date);
    requestAnimationFrame(() => {
      grid.current
        ?.querySelector<HTMLButtonElement>(`[data-date="${date}"]`)
        ?.focus();
    });
  }

  useEffect(() => {
    if (open) load(month);
  }, [open, month, load]);

  return (
    <fieldset
      className={styles.dateField}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.preventDefault();
          setOpen(false);
          trigger.current?.focus();
        }
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <span id="booking-date-label" className={styles.fieldLabel}>
        {TABLE_BOOKING_CONTENT.date.label}
      </span>
      <button
        ref={trigger}
        type="button"
        aria-labelledby="booking-date-label booking-date-value"
        aria-expanded={open}
        aria-controls="booking-calendar"
        className={styles.selection}
        onClick={() => {
          const today = dublinToday();
          if (value < today) onChange(today);
          setOpen(!open);
        }}
      >
        <CalendarDays aria-hidden="true" className={styles.fieldIcon} />
        <span id="booking-date-value">
          {value
            ? format(parseISO(value), "EEE, d MMM yyyy")
            : TABLE_BOOKING_CONTENT.date.placeholder}
        </span>
        <ChevronDown aria-hidden="true" className={styles.chevron} />
      </button>
      {open && (
        <fieldset
          ref={grid}
          id="booking-calendar"
          className={styles.calendar}
          aria-label="Choose date"
        >
          <div className={styles.calendarHeader}>
            <strong aria-live="polite">{format(month, "MMMM yyyy")}</strong>
            <button
              type="button"
              aria-label="Previous month"
              aria-disabled={atFirstMonth}
              onClick={() => {
                if (!atFirstMonth) {
                  const next = addMonths(month, -1);
                  setMonth(next);
                  setActiveDate(format(next, "yyyy-MM-dd"));
                }
              }}
            >
              <ArrowLeft aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Next month"
              aria-disabled={atLastMonth}
              onClick={() => {
                if (!atLastMonth) {
                  const next = addMonths(month, 1);
                  setMonth(next);
                  setActiveDate(format(next, "yyyy-MM-dd"));
                }
              }}
            >
              <ArrowRight aria-hidden="true" />
            </button>
          </div>
          <div className={styles.calendarGrid}>
            {TABLE_BOOKING_CONTENT.weekdays.map((day) => (
              <span key={day} className={styles.weekday}>
                {day}
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
                  disabled={isUnavailable(date)}
                  data-date={date}
                  tabIndex={day === tabDay ? 0 : -1}
                  onFocus={() => setActiveDate(date)}
                  onKeyDown={(event) => moveDay(event, day)}
                  data-outside={!isSameMonth(day, month)}
                  onClick={() => {
                    const today = dublinToday();
                    onChange(date < today ? today : date);
                    setOpen(false);
                    trigger.current?.focus();
                  }}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>
          <p role="status" className={styles.calendarStatus}>
            {openDates === "loading" && TABLE_BOOKING_CONTENT.checkingDates}
          </p>
        </fieldset>
      )}
    </fieldset>
  );
}
