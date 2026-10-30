"use client";

import { Pencil } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import styles from "@/components/app/compounds/table-booking-panel.module.css";
import { Button } from "@/components/ui/button";
import {
  getSessionStorage,
  removeSessionStorage,
  setSessionStorage,
} from "@/helpers/storage";
import { useBookingStatus } from "@/hooks/use-booking-status";
import { useReleaseHold } from "@/hooks/use-release-hold";
import { BOOKING_BUDGET_MS } from "@/lib/constants/booking";
import { TABLE_BOOKING_CONTENT } from "@/lib/constants/table-booking";
import type {
  IHoldSummary,
  ITableBookingChangeDialogProps,
  ITableBookingChangeProps,
  TReleasedHold,
} from "@/lib/types";

const copy = TABLE_BOOKING_CONTENT.changeBooking;
const RELEASE_KEY = "peploes:booking-release";
const RELEASE_MARGIN_MS = 3000;
const RELEASE_SETTLED_MS = BOOKING_BUDGET_MS.release + RELEASE_MARGIN_MS;

interface ISavedRelease {
  reference: string;
  revision: number;
  startedAt?: number;
}

interface IUncertainRelease {
  hold: IHoldSummary;
  pendingFrom: number;
}

function dialogText(
  check: ITableBookingChangeDialogProps["check"],
  stillHeld: boolean,
  summary: IHoldSummary,
): string {
  if (check?.kind === "unknown") return copy.unknown(summary.reference);
  if (check) return copy.checking;
  if (stillHeld) return copy.stillHeld;
  return copy.text(summary.timeLabel, summary.dateLabel);
}

function ChangeDialog({
  summary,
  releasing,
  check,
  stillHeld,
  onKeep,
  onRelease,
  onCheckAgain,
  onStartAgain,
}: ITableBookingChangeDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();
  const dismissLocked = releasing || check !== null;
  const waiting = releasing || (check !== null && check.kind !== "unknown");
  let actionLabel: string = copy.release;
  if (releasing) actionLabel = copy.releasing;
  else if (check?.kind === "unknown") actionLabel = copy.checkAgain;
  else if (check) actionLabel = copy.checkingAction;

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);

  return (
    <dialog
      ref={dialog}
      closedby={dismissLocked ? "none" : "closerequest"}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-text`}
      className={styles.changeDialog}
      onCancel={(event) => {
        event.preventDefault();
        if (!dismissLocked) onKeep();
      }}
      onClose={(event) => {
        const element = event.currentTarget;
        if (!element.isConnected || element.open) return;
        if (dismissLocked) {
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
        role={check || stillHeld ? "status" : undefined}
        className={styles.flowDescription}
      >
        {dialogText(check, stillHeld, summary)}
      </p>
      <div className={styles.changeActions}>
        <Button
          type="button"
          variant="brand-contact"
          autoFocus
          disabled={dismissLocked}
          onClick={onKeep}
        >
          {copy.keep}
        </Button>
        {check?.kind === "unknown" && (
          <Button type="button" variant="brand-contact" onClick={onStartAgain}>
            {TABLE_BOOKING_CONTENT.startAgain}
          </Button>
        )}
        <Button
          type="button"
          variant="brand-primary"
          disabled={waiting}
          onClick={check ? onCheckAgain : onRelease}
        >
          {actionLabel}
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
  const [uncertain, setUncertain] = useState<IUncertainRelease | null>(null);
  const [stillHeld, setStillHeld] = useState(false);
  const releaser = useReleaseHold();
  const check = useBookingStatus(
    uncertain?.hold ?? null,
    uncertain?.pendingFrom,
  );

  const settleRelease = useCallback(
    (reply: TReleasedHold) => {
      removeSessionStorage(RELEASE_KEY);
      setUncertain(null);
      setStillHeld(false);
      setAsking(false);
      if (reply.kind === "confirmed") {
        onConfirmed({ reference: reply.reference, summary: reply.summary });
      } else if (reply.kind === "released") {
        onReleased();
      }
    },
    [onConfirmed, onReleased],
  );

  useEffect(() => {
    const saved = getSessionStorage<ISavedRelease>(RELEASE_KEY);
    if (
      payment &&
      saved?.reference === payment.summary.reference &&
      saved.revision === payment.summary.revision
    ) {
      setUncertain({
        hold: payment.summary,
        pendingFrom: (saved.startedAt ?? Date.now()) + RELEASE_SETTLED_MS,
      });
      setAsking(true);
    }
  }, [payment]);

  useEffect(() => {
    if (!uncertain) return;
    if (check.kind === "confirmed") {
      settleRelease(check);
    } else if (check.kind === "failed") {
      settleRelease({ kind: "released" });
    } else if (check.kind === "pending") {
      removeSessionStorage(RELEASE_KEY);
      setUncertain(null);
      setStillHeld(true);
    }
  }, [check, uncertain, settleRelease]);

  function releaseAndChange() {
    if (!payment) return;
    const { summary } = payment;
    const startedAt = Date.now();
    setStillHeld(false);
    setSessionStorage(RELEASE_KEY, {
      reference: summary.reference,
      revision: summary.revision,
      startedAt,
    } satisfies ISavedRelease);
    releaser.release(payment.summary, (reply) => {
      if (reply) {
        settleRelease(reply);
      } else {
        setUncertain({
          hold: { ...summary },
          pendingFrom: startedAt + RELEASE_SETTLED_MS,
        });
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
          check={uncertain ? check : null}
          stillHeld={stillHeld}
          onKeep={() => {
            setStillHeld(false);
            setAsking(false);
          }}
          onRelease={releaseAndChange}
          onCheckAgain={() => {
            if (uncertain) {
              setUncertain({ ...uncertain, hold: { ...uncertain.hold } });
            }
          }}
          onStartAgain={() => {
            removeSessionStorage(RELEASE_KEY);
            setUncertain(null);
            setAsking(false);
            onReleased();
          }}
        />
      )}
    </>
  );
}
