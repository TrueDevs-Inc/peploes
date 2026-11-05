"use client";

import { format, parseISO } from "date-fns";
import { CalendarDays, ChevronDown } from "lucide-react";
import { useRef, useState } from "react";
import { DateCalendar } from "@/components/app/atoms/date-calendar";
import styles from "@/components/app/compounds/table-booking-panel.module.css";
import { Button } from "@/components/ui/button";
import { TABLE_BOOKING_CONTENT } from "@/lib/constants/table-booking";
import { dublinToday } from "@/lib/dates";
import type { ITableBookingDateProps } from "@/lib/types";

export function TableBookingDate({ value, onChange }: ITableBookingDateProps) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const minimum = dublinToday();

  return (
    <fieldset
      className={styles.dateField}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.preventDefault();
          setOpen(false);
          trigger.current?.focus();
        }
      }}
    >
      <span id="booking-date-label" className={styles.fieldLabel}>
        {TABLE_BOOKING_CONTENT.date.label}
      </span>
      <Button
        variant="plain"
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
      </Button>
      {open && (
        <DateCalendar
          key={minimum}
          id="booking-calendar"
          value={value}
          min={minimum}
          className={styles.bookingCalendar}
          onChange={(date) => {
            const today = dublinToday();
            onChange(date < today ? today : date);
            setOpen(false);
            trigger.current?.focus();
          }}
        />
      )}
    </fieldset>
  );
}
