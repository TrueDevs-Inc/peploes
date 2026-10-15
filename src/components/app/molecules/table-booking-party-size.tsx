"use client";

import { ChevronDown, UserRound, UsersRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import styles from "@/components/app/compounds/table-booking-panel.module.css";
import { TABLE_BOOKING_CONTENT } from "@/lib/constants/table-booking";
import type { ITableBookingPartySizeProps } from "@/lib/types";

export function TableBookingPartySize({
  value,
  onChange,
}: ITableBookingPartySizeProps) {
  const { label, options } = TABLE_BOOKING_CONTENT.partySize;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(value);
  const field = useRef<HTMLFieldSetElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const activeOption = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const dismissOutside = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !field.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", dismissOutside);
    return () => document.removeEventListener("pointerdown", dismissOutside);
  }, [open]);

  useEffect(() => {
    if (open && active)
      activeOption.current?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  function choose(count: string) {
    onChange(count);
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
  }

  function moveActive(direction: number) {
    const index = options.findIndex((count) => String(count) === active);
    const next = Math.max(0, Math.min(index + direction, options.length - 1));
    setActive(open ? String(options[next]) : value);
    setOpen(true);
  }

  return (
    <fieldset
      ref={field}
      className={styles.field}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <span id="booking-party-size-label" className={styles.fieldLabel}>
        {label}
      </span>
      <div className={styles.selectWrapper}>
        <button
          ref={trigger}
          type="button"
          role="combobox"
          aria-labelledby="booking-party-size-label"
          aria-expanded={open}
          aria-controls={open ? "booking-party-options" : undefined}
          aria-haspopup="listbox"
          aria-activedescendant={
            open ? `booking-party-option-${active}` : undefined
          }
          className={styles.selection}
          onClick={() => {
            setActive(value);
            setOpen(!open);
          }}
          onKeyDown={(event) => {
            switch (event.key) {
              case "Escape":
                if (open) event.preventDefault();
                setOpen(false);
                break;
              case "Tab":
                setOpen(false);
                break;
              case "Enter":
              case " ":
                event.preventDefault();
                if (open) choose(active);
                else {
                  setActive(value);
                  setOpen(true);
                }
                break;
              case "ArrowDown":
                event.preventDefault();
                moveActive(1);
                break;
              case "ArrowUp":
                event.preventDefault();
                moveActive(-1);
                break;
              case "Home":
              case "End":
                event.preventDefault();
                setActive(
                  String(
                    event.key === "Home"
                      ? options[0]
                      : options[options.length - 1],
                  ),
                );
                setOpen(true);
                break;
              default:
                if (options.some((count) => String(count) === event.key)) {
                  event.preventDefault();
                  setActive(event.key);
                  setOpen(true);
                }
            }
          }}
        >
          <UserRound aria-hidden="true" className={styles.fieldIcon} />
          <span>
            {value} {value === "1" ? "guest" : "guests"}
          </span>
          <ChevronDown aria-hidden="true" className={styles.chevron} />
        </button>
        {open && (
          <div
            id="booking-party-options"
            role="listbox"
            aria-labelledby="booking-party-size-label"
            className={styles.partyOptions}
          >
            {options.map((count) => {
              const option = String(count);
              const Icon = count > 2 ? UsersRound : UserRound;
              return (
                <button
                  key={count}
                  ref={option === active ? activeOption : undefined}
                  id={`booking-party-option-${count}`}
                  type="button"
                  role="option"
                  aria-selected={option === value}
                  data-active={option === active}
                  tabIndex={-1}
                  className={styles.partyOption}
                  onPointerDown={(event) => event.preventDefault()}
                  onClick={() => choose(option)}
                >
                  <Icon aria-hidden="true" className={styles.fieldIcon} />
                  <span>
                    {count} {count === 1 ? "guest" : "guests"}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </fieldset>
  );
}
