"use client";

import { useEffect, useRef, useState } from "react";

import styles from "@/components/app/compounds/table-booking-panel.module.css";
import { TableBookingStatusSkeleton } from "@/components/app/molecules/table-booking-skeleton";
import { Button } from "@/components/ui/button";
import { useBookingStatus } from "@/hooks/use-booking-status";
import { BOOKING_BANK_REFUSED_STATUSES } from "@/lib/constants/booking";
import { TABLE_BOOKING_CONTENT as content } from "@/lib/constants/table-booking";
import type {
  ITableBookingReturnProps,
  TBookingStatusCheck,
} from "@/lib/types";

export function TableBookingReturn({
  returned,
  onPaid,
  onConfirmed,
  onStartAgain,
}: ITableBookingReturnProps) {
  const [hold, setHold] = useState(returned);
  const check = useBookingStatus(hold, 0);
  const paid = hold.status === "succeeded" || hold.status === "processing";

  useEffect(() => {
    if (check.kind === "confirmed") {
      onConfirmed({ reference: check.reference, summary: check.summary });
    } else if (check.kind === "pending" && paid) {
      onPaid(check.summary);
    }
  }, [check, onConfirmed, onPaid, paid]);

  if (check.kind === "pending" && !paid) {
    const refused = BOOKING_BANK_REFUSED_STATUSES.has(hold.status);
    const message = refused
      ? content.payment.bankFailedWithoutStep(hold.reference)
      : content.payment.cantCheck(hold.reference);
    return <ReturnNotice message={message} onStartAgain={onStartAgain} />;
  }
  if (check.kind === "unknown" && check.notFound) {
    return (
      <ReturnNotice
        message={content.payment.cantCheck(hold.reference)}
        onStartAgain={onStartAgain}
      />
    );
  }
  return (
    <PaymentOutcome
      check={check}
      reference={hold.reference}
      onStartAgain={onStartAgain}
      onCheckAgain={() => setHold({ ...hold })}
    />
  );
}

function ReturnNotice({
  message,
  onStartAgain,
}: {
  message: string;
  onStartAgain: () => void;
}) {
  return (
    <div className={styles.flowNotice}>
      <p role="status" className={styles.flowDescription}>
        {message}
      </p>
      <Button type="button" variant="brand-primary" onClick={onStartAgain}>
        {content.startAgain}
      </Button>
    </div>
  );
}

export function PaymentOutcome({
  phase = "payment",
  check,
  reference,
  onStartAgain,
  onCheckAgain,
}: {
  phase?: "details" | "payment";
  check: TBookingStatusCheck;
  reference: string;
  onStartAgain: () => void;
  onCheckAgain: () => void;
}) {
  if (check.kind === "unknown") {
    return (
      <StillConfirming
        phase={phase}
        reference={reference}
        onStartAgain={onStartAgain}
        onCheckAgain={onCheckAgain}
      />
    );
  }
  if (check.kind !== "failed") {
    return (
      <>
        <p role="status" className={styles.flowDescription}>
          {content.payment.checking}
        </p>
        <TableBookingStatusSkeleton />
        <p className={styles.flowDescription}>
          {content.confirmation.referenceLabel}: <strong>{reference}</strong>
        </p>
      </>
    );
  }
  return (
    <div className={styles.flowNotice}>
      <p role="alert" className={styles.formError}>
        {content.payment.notConfirmed(reference)}
      </p>
      <Button type="button" variant="brand-primary" onClick={onStartAgain}>
        {content.startAgain}
      </Button>
    </div>
  );
}

function StillConfirming({
  phase,
  reference,
  onStartAgain,
  onCheckAgain,
}: {
  phase: "details" | "payment";
  reference: string;
  onStartAgain: () => void;
  onCheckAgain: () => void;
}) {
  const copy = content[phase];
  const [warning, setWarning] = useState(false);
  const message = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (warning) message.current?.focus();
  }, [warning]);

  return (
    <div className={styles.flowNotice}>
      <p
        ref={message}
        tabIndex={-1}
        role="status"
        className={styles.flowDescription}
      >
        {warning
          ? copy.startAgainWarning(reference)
          : copy.stillConfirming(reference)}
      </p>
      {warning ? (
        <>
          <Button
            type="button"
            variant="brand-contact"
            onClick={() => setWarning(false)}
          >
            {content.payment.keepWaiting}
          </Button>
          <Button type="button" variant="brand-primary" onClick={onStartAgain}>
            {content.startAgain}
          </Button>
        </>
      ) : (
        <>
          <Button type="button" variant="brand-contact" onClick={onCheckAgain}>
            {content.checkAgain}
          </Button>
          <Button
            type="button"
            variant="brand-primary"
            onClick={() => setWarning(true)}
          >
            {content.startAgain}
          </Button>
        </>
      )}
    </div>
  );
}
