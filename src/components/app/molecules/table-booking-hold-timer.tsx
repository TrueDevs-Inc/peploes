"use client";

import { useEffect, useState } from "react";

import styles from "@/components/app/compounds/table-booking-panel.module.css";
import { BOOKING_HOLD } from "@/lib/constants/booking";
import { TABLE_BOOKING_CONTENT } from "@/lib/constants/table-booking";
import type { ITableBookingHoldTimerProps } from "@/lib/types";

export function TableBookingHoldTimer({
  endsAt,
  onExpire,
}: ITableBookingHoldTimerProps) {
  const [now, setNow] = useState(() => performance.now());
  const left = Math.max(0, endsAt - now - BOOKING_HOLD.submitMinRemainingMs);
  const seconds = Math.ceil(left / 1000);

  useEffect(() => {
    const tick = setInterval(() => setNow(performance.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    if (left === 0) onExpire();
  }, [left, onExpire]);

  return (
    <p role="timer" className={styles.holdTimer}>
      {TABLE_BOOKING_CONTENT.heldFor(
        `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`,
      )}
    </p>
  );
}
