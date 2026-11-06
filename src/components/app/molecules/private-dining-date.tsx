"use client";

import { Calendar } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { DateCalendar } from "@/components/app/atoms/date-calendar";
import enquiryStyles from "@/components/app/compounds/private-dining.module.css";
import styles from "@/components/app/molecules/private-dining-date.module.css";
import { Button } from "@/components/ui/button";
import { PRIVATE_DINING_FORM } from "@/lib/constants/private-dining";
import { dublinToday } from "@/lib/dates";
import type { IPrivateDiningDateProps } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PrivateDiningDate({ errorId }: IPrivateDiningDateProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [minimum, setMinimum] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const field = useRef<HTMLFieldSetElement>(null);
  const calendarId = useId();

  const refreshMinimum = useCallback(() => {
    const today = dublinToday();
    if (input.current) {
      input.current.min = today;
      setValue(input.current.value);
    }
    setMinimum(today);
    return today;
  }, []);

  useEffect(() => {
    const form = input.current?.form;
    refreshMinimum();
    form?.addEventListener("focusin", refreshMinimum);
    form?.addEventListener("input", refreshMinimum);
    form?.addEventListener("submit", refreshMinimum, true);
    return () => {
      form?.removeEventListener("focusin", refreshMinimum);
      form?.removeEventListener("input", refreshMinimum);
      form?.removeEventListener("submit", refreshMinimum, true);
    };
  }, [refreshMinimum]);

  useEffect(() => {
    if (!open) return;
    function closeOutside(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !field.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open]);

  function closeCalendar() {
    setOpen(false);
    input.current?.focus({ preventScroll: true });
  }

  function openCalendar() {
    refreshMinimum();
    setOpen(true);
  }

  function selectDate(date: string) {
    const element = input.current;
    if (!element || date < refreshMinimum()) return;
    // Use the native setter so React observes the change and cancels form previews.
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set?.call(element, date);
    element.dispatchEvent(new Event("input", { bubbles: true }));
    closeCalendar();
  }

  return (
    <fieldset
      ref={field}
      className={styles.field}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.preventDefault();
          closeCalendar();
        }
      }}
    >
      <label className={cn(enquiryStyles.dateField, styles.label)}>
        <input
          ref={input}
          type="date"
          name="date"
          max="9999-12-31"
          aria-label={PRIVATE_DINING_FORM.date}
          aria-invalid={Boolean(errorId)}
          aria-describedby={errorId}
          aria-controls={open ? calendarId : undefined}
          required
          onFocus={refreshMinimum}
          onChange={refreshMinimum}
          onPointerDown={openCalendar}
          onClick={(event) => {
            event.preventDefault();
            openCalendar();
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" || event.key === " ") {
              event.preventDefault();
              openCalendar();
              requestAnimationFrame(() => {
                field.current
                  ?.querySelector<HTMLButtonElement>(
                    "button[data-date][tabindex='0']",
                  )
                  ?.focus();
              });
            }
          }}
        />
        <span aria-hidden="true">{PRIVATE_DINING_FORM.date}</span>
      </label>
      <Button
        variant="plain"
        type="button"
        className={styles.trigger}
        aria-label="Choose preferred date"
        aria-expanded={open}
        aria-controls={open ? calendarId : undefined}
        onClick={() => {
          refreshMinimum();
          setOpen(!open);
        }}
      >
        <Calendar aria-hidden="true" />
      </Button>
      {open && minimum && (
        <DateCalendar
          key={`${value}:${minimum}`}
          id={calendarId}
          value={value}
          min={minimum}
          onChange={selectDate}
          className={styles.calendar}
        />
      )}
    </fieldset>
  );
}
