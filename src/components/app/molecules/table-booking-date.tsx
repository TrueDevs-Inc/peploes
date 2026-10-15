"use client";

import {
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
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useRef, useState } from "react";

import styles from "@/components/app/compounds/table-booking-panel.module.css";
import { TABLE_BOOKING_CONTENT } from "@/lib/constants/table-booking";
import type { ITableBookingDateProps } from "@/lib/types";

export function TableBookingDate({ value, onChange }: ITableBookingDateProps) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => startOfMonth(parseISO(value)));
  const trigger = useRef<HTMLButtonElement>(null);
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
  });

  return (
    <fieldset
      className={styles.dateField}
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
        onClick={() => setOpen(!open)}
      >
        <CalendarDays aria-hidden="true" className={styles.fieldIcon} />
        <span id="booking-date-value">
          {format(parseISO(value), "EEE, d MMM yyyy")}
        </span>
        <ChevronDown aria-hidden="true" className={styles.chevron} />
      </button>
      {open && (
        <fieldset
          id="booking-calendar"
          className={styles.calendar}
          aria-label="Choose date"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              trigger.current?.focus();
            }
          }}
        >
          <div className={styles.calendarHeader}>
            <strong aria-live="polite">{format(month, "MMMM yyyy")}</strong>
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => setMonth(addMonths(month, -1))}
            >
              <ChevronLeft aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => setMonth(addMonths(month, 1))}
            >
              <ChevronRight aria-hidden="true" />
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
                  data-outside={!isSameMonth(day, month)}
                  onClick={() => {
                    onChange(date);
                    setOpen(false);
                    trigger.current?.focus();
                  }}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}
    </fieldset>
  );
}
