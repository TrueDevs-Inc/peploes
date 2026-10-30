"use client";

import { Pencil } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import styles from "@/components/app/compounds/table-booking-panel.module.css";
import { Button } from "@/components/ui/button";
import { useReleaseHold } from "@/hooks/use-release-hold";
import { TABLE_BOOKING_CONTENT } from "@/lib/constants/table-booking";
import type {
  ITableBookingChangeDialogProps,
  ITableBookingChangeProps,
} from "@/lib/types";

const copy = TABLE_BOOKING_CONTENT.changeBooking;

function ChangeDialog({
  summary,
  releasing,
  onKeep,
  onRelease,
}: ITableBookingChangeDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);

  return (
    <dialog
      ref={dialog}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-text`}
      className={styles.changeDialog}
      onCancel={(event) => {
        event.preventDefault();
        if (!releasing) onKeep();
      }}
    >
      <h2 id={`${id}-title`} className={styles.flowHeading}>
        {copy.heading}
      </h2>
      <p id={`${id}-text`} className={styles.flowDescription}>
        {copy.text(summary.timeLabel, summary.dateLabel)}
      </p>
      <div className={styles.changeActions}>
        <Button
          type="button"
          variant="brand-contact"
          autoFocus
          disabled={releasing}
          onClick={onKeep}
        >
          {copy.keep}
        </Button>
        <Button
          type="button"
          variant="brand-primary"
          disabled={releasing}
          onClick={onRelease}
        >
          {releasing ? copy.releasing : copy.release}
        </Button>
      </div>
    </dialog>
  );
}

export function TableBookingChange({
  busy,
  payment,
  onEdit,
  onReleased,
  onConfirmed,
}: ITableBookingChangeProps) {
  const [asking, setAsking] = useState(false);
  const releaser = useReleaseHold();

  function release() {
    if (!payment) return;
    releaser.release(payment.summary, (reply) => {
      setAsking(false);
      if (reply?.kind === "confirmed") {
        onConfirmed({ reference: reply.reference, summary: reply.summary });
      } else {
        onReleased();
      }
    });
  }

  return (
    <>
      <button
        type="button"
        className={styles.editAction}
        aria-label="Edit date & guests"
        disabled={busy}
        onClick={payment ? () => setAsking(true) : onEdit}
      >
        <Pencil aria-hidden="true" />
        <span className={styles.desktopOnly}>Edit date &amp; guests</span>
        <span className={styles.mobileOnly}>Edit</span>
      </button>
      {asking && payment && (
        <ChangeDialog
          summary={payment.summary}
          releasing={releaser.releasing}
          onKeep={() => setAsking(false)}
          onRelease={release}
        />
      )}
    </>
  );
}
