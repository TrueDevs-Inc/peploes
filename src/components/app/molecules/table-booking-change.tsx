"use client";

import { Pencil } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import styles from "@/components/app/compounds/table-booking-panel.module.css";
import { Button } from "@/components/ui/button";
import { fetcher } from "@/helpers/api";
import { BOOKING_API, BOOKING_BUDGET_MS } from "@/lib/constants/booking";
import { TABLE_BOOKING_CONTENT } from "@/lib/constants/table-booking";
import { HttpVerb } from "@/lib/enums";
import type {
  IHoldStatusResult,
  IHoldSummary,
  ITableBookingChangeProps,
  TBookingResponse,
} from "@/lib/types";

const copy = TABLE_BOOKING_CONTENT.changeBooking;

interface IChangeDialogProps {
  summary: IHoldSummary;
  checking: boolean;
  onKeep: () => void;
  onChoose: () => void;
}

async function checkHold(summary: IHoldSummary) {
  const query = new URLSearchParams({
    holdReference: summary.reference,
    holdRevision: String(summary.revision),
  });
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), BOOKING_BUDGET_MS.holdCheck);
  });
  const reply = await Promise.race([
    fetcher<never, TBookingResponse<IHoldStatusResult>>({
      url: `${BOOKING_API.holdStatus}?${query}`,
      method: HttpVerb.Get,
    }).then((response) => response.data),
    timeout,
  ]);
  clearTimeout(timer);
  return reply?.ok ? reply.data : null;
}

function ChangeDialog({
  summary,
  checking,
  onKeep,
  onChoose,
}: IChangeDialogProps) {
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
      closedby={checking ? "none" : "closerequest"}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-text`}
      className={styles.changeDialog}
      onCancel={(event) => {
        event.preventDefault();
        if (!checking) onKeep();
      }}
      onClose={(event) => {
        const element = event.currentTarget;
        if (!element.isConnected || element.open) return;
        if (checking) {
          element.showModal();
        } else {
          onKeep();
        }
      }}
    >
      <h2 id={`${id}-title`} className={styles.flowHeading}>
        {copy.heading}
      </h2>
      <p
        id={`${id}-text`}
        role={checking ? "status" : undefined}
        className={styles.flowDescription}
      >
        {copy.text(summary.timeLabel, summary.dateLabel)}
      </p>
      <div className={styles.changeActions}>
        <Button
          type="button"
          variant="brand-contact"
          autoFocus
          disabled={checking}
          onClick={onKeep}
        >
          {copy.keep}
        </Button>
        <Button
          type="button"
          variant="brand-primary"
          disabled={checking}
          onClick={onChoose}
        >
          {checking ? copy.checking : copy.choose}
        </Button>
      </div>
    </dialog>
  );
}

export function TableBookingChange({
  busy,
  payment,
  onEdit,
  onStartOver,
  onConfirmed,
}: ITableBookingChangeProps) {
  const [asking, setAsking] = useState(false);
  const [checking, setChecking] = useState(false);
  const checkingHold = useRef(false);

  async function chooseAnotherTime() {
    if (!payment || checkingHold.current) return;
    checkingHold.current = true;
    setChecking(true);
    const result = await checkHold(payment.summary);
    setAsking(false);
    setChecking(false);
    checkingHold.current = false;
    if (result?.status === "confirmed") {
      onConfirmed({ reference: result.reference, summary: result.summary });
    } else {
      onStartOver();
    }
  }

  return (
    <>
      <Button
        variant="plain"
        type="button"
        className={styles.editAction}
        aria-label="Edit date & guests"
        disabled={busy || checking}
        onClick={payment ? () => setAsking(true) : onEdit}
      >
        <Pencil aria-hidden="true" />
        <span className={styles.desktopOnly}>Edit date &amp; guests</span>
        <span className={styles.mobileOnly}>Edit</span>
      </Button>
      {asking && payment && (
        <ChangeDialog
          summary={payment.summary}
          checking={checking}
          onKeep={() => setAsking(false)}
          onChoose={chooseAnotherTime}
        />
      )}
    </>
  );
}
