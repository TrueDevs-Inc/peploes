"use client";

import { format, parseISO } from "date-fns";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import styles from "@/components/app/compounds/table-booking-panel.module.css";
import { TableBookingDate } from "@/components/app/molecules/table-booking-date";
import { TableBookingDetails } from "@/components/app/molecules/table-booking-details";
import { TableBookingPartySize } from "@/components/app/molecules/table-booking-party-size";
import { TableBookingSupport } from "@/components/app/molecules/table-booking-support";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { TABLE_BOOKING_CONTENT as content } from "@/lib/constants/table-booking";
import type {
  ITableBookingGuestDetails,
  ITableBookingProgressProps,
  ITableBookingTimesProps,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export function TableBookingPanel() {
  const [step, setStep] = useState(0);
  const [date, setDate] = useState<string>(content.date.initialValue);
  const [partySize, setPartySize] = useState<string>(
    content.partySize.initialValue,
  );
  const [time, setTime] = useState("");

  const [returnAccepted, setReturnAccepted] = useState(false);
  const [details, setDetails] = useState<ITableBookingGuestDetails>({
    firstName: "",
    surname: "",
    email: "",
    phone: "",
    requests: "",
    terms: false,
  });
  const panel = useRef<HTMLElement>(null);
  const previousStep = useRef(0);
  const shortDate = format(parseISO(date), "EEE, d MMM yyyy");
  const longDate = format(parseISO(date), "EEEE, d MMMM yyyy");
  const guests = partySize === "1" ? "1 guest" : `${partySize} guests`;
  const requiresReturn = time === content.returnTime.start;

  useEffect(() => {
    if (previousStep.current !== step) {
      previousStep.current = step;
      panel.current?.focus({ preventScroll: true });
      if (
        panel.current &&
        panel.current.getBoundingClientRect().top <
          Number.parseFloat(getComputedStyle(panel.current).scrollMarginTop)
      ) {
        panel.current.scrollIntoView({ block: "start", behavior: "instant" });
      }
    }
  }, [step]);

  return (
    <section
      ref={panel}
      tabIndex={-1}
      aria-label={content.label}
      className={cn(
        styles.panel,

        step > 0 && styles.flowPanel,
        step === 3 && styles.confirmedPanel,
      )}
    >
      <p className={styles.previewNotice}>{content.previewMessage}</p>
      <BookingProgress step={step} />

      {step === 0 && (
        <>
          <div className={styles.availability}>
            <div className={styles.fields}>
              <TableBookingDate value={date} onChange={setDate} />
              <TableBookingPartySize
                value={partySize}
                onChange={setPartySize}
              />
            </div>
            <Button
              type="button"
              variant="brand-primary"
              className={styles.findTable}
              onClick={() => {
                setTime("");
                setReturnAccepted(false);

                setStep(1);
              }}
            >
              {content.action}
              <ArrowRight aria-hidden="true" className={styles.actionArrow} />
            </Button>
          </div>
          <TableBookingSupport />
        </>
      )}

      {(step === 1 || step === 2) && (
        <>
          <div className={styles.summary}>
            <CalendarDays aria-hidden="true" />
            <p>
              {shortDate}
              <span aria-hidden="true"> | </span>
              {step === 2 && (
                <>
                  {time}
                  <span aria-hidden="true"> | </span>
                </>
              )}
              {guests}
              {step === 2 && requiresReturn && (
                <small>Table until {content.returnTime.end}</small>
              )}
            </p>
            <button
              type="button"
              className={styles.editAction}
              aria-label="Edit date & guests"
              onClick={() => setStep(0)}
            >
              <Pencil aria-hidden="true" />
              <span className={styles.desktopOnly}>Edit date &amp; guests</span>
              <span className={styles.mobileOnly}>Edit</span>
            </button>
          </div>
          {step === 1 ? (
            <BookingTimes
              longDate={longDate}
              guests={guests}
              time={time}
              returnAccepted={returnAccepted}
              onTimeChange={setTime}
              onReturnChange={setReturnAccepted}
              onBack={() => setStep(0)}
              onContinue={() => setStep(2)}
            />
          ) : (
            <TableBookingDetails
              details={details}
              onChange={setDetails}
              onBack={() => setStep(1)}
              onContinue={() => setStep(3)}
            />
          )}
        </>
      )}

      {step === 3 && (
        <>
          <div className={styles.confirmation}>
            <span className={styles.confirmationCheck}>
              <Check aria-hidden="true" />
            </span>
            <p className={styles.confirmationLabel}>Confirmation preview</p>
            <h2 className={styles.flowHeading}>Your table is booked.</h2>
            <p className={styles.bookingReference}>
              Sample booking reference
              <br />
              <strong>#PPL-45827</strong>
            </p>
            <p className={styles.confirmationSummary}>
              {longDate}
              <br className={styles.desktopOnly} /> · {time} · {guests}
              {requiresReturn && (
                <>
                  <br />
                  Table required back by {content.returnTime.end}
                </>
              )}
            </p>
            <p className={styles.confirmationDisclaimer}>
              {content.previewConfirmation}
            </p>
            <div className={styles.confirmationActions}>
              <Button
                type="button"
                variant="brand-contact"
                disabled
                title="Calendar export is unavailable for a sample reservation."
              >
                Add to Calendar
              </Button>
              <Button asChild variant="brand-primary">
                <Link href={ROUTES.MENUS}>
                  View Menus
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="brand-contact">
                <Link href={ROUTES.VISIT_CONTACT}>
                  Plan Your Visit
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
          <TableBookingSupport confirmation />
          <button
            type="button"
            className={cn(styles.backAction, styles.restart)}
            onClick={() => {
              setStep(0);
              setTime("");
              setReturnAccepted(false);
              setDetails({
                firstName: "",
                surname: "",
                email: "",
                phone: "",
                requests: "",
                terms: false,
              });
            }}
          >
            <ArrowLeft aria-hidden="true" />
            Start again
          </button>
        </>
      )}
    </section>
  );
}

function BookingProgress({ step }: ITableBookingProgressProps) {
  return (
    <ol aria-label={content.progressLabel} className={styles.progress}>
      {content.steps.map((item, index) => (
        <li
          key={item.number}
          aria-current={index === step ? "step" : undefined}
          data-complete={index < step}
          className={styles.step}
        >
          <span className={styles.stepNumber} aria-hidden="true">
            {index < step ? (
              <Check className={styles.completedIcon} />
            ) : (
              <>
                <span className={styles.desktopNumber}>{item.number}</span>
                <span className={styles.mobileNumber}>{item.mobileNumber}</span>
              </>
            )}
          </span>
          <span className={styles.stepName}>{item.label}</span>
        </li>
      ))}
    </ol>
  );
}

function BookingTimes({
  longDate,
  guests,
  time,
  returnAccepted,
  onTimeChange,
  onReturnChange,
  onBack,
  onContinue,
}: ITableBookingTimesProps) {
  const [showMore, setShowMore] = useState(() =>
    content.moreTimes.some((slot) => slot === time),
  );
  const requiresReturn = time === content.returnTime.start;
  return (
    <div>
      <h2 className={styles.flowHeading}>Available times</h2>
      <p className={styles.flowDescription}>
        Showing times for {longDate} · {guests}
      </p>
      <fieldset className={styles.timeGrid} aria-label="Sample available times">
        {[...content.times, ...(showMore ? content.moreTimes : [])].map(
          (slot) => (
            <button
              type="button"
              key={slot}
              aria-pressed={time === slot}
              className={styles.timeSlot}
              onClick={() => {
                onTimeChange(slot);
                onReturnChange(false);
              }}
            >
              {slot}
            </button>
          ),
        )}
      </fieldset>
      <button
        type="button"
        className={styles.moreTimes}
        aria-expanded={showMore}
        onClick={() => setShowMore(!showMore)}
      >
        <ChevronDown aria-hidden="true" />
        {showMore ? "Show fewer times" : "Show more times (6 more)"}
      </button>
      {requiresReturn && (
        <div className={styles.returnNotice}>
          <strong>This table has a return time</strong>
          <p>
            Your table is available from 7:00pm until 9:00pm.
            <br />
            Please confirm you’re happy to return the table by 9:00pm.
          </p>
          <label>
            <input
              type="checkbox"
              checked={returnAccepted}
              onChange={(event) => onReturnChange(event.target.checked)}
            />
            {content.returnTime.label}
          </label>
        </div>
      )}
      <div className={styles.flowActions}>
        <button type="button" className={styles.backAction} onClick={onBack}>
          <ArrowLeft aria-hidden="true" />
          Back to search
        </button>
        <Button
          type="button"
          variant="brand-primary"
          className={styles.continueAction}
          disabled={!time || (requiresReturn && !returnAccepted)}
          onClick={onContinue}
        >
          Continue
          <ArrowRight aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
