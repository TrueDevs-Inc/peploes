"use client";

import { format, parseISO, startOfMonth } from "date-fns";
import { ArrowLeft, ArrowRight, CalendarDays, Check } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import styles from "@/components/app/compounds/table-booking-panel.module.css";
import { TableBookingChange } from "@/components/app/molecules/table-booking-change";
import { TableBookingDate } from "@/components/app/molecules/table-booking-date";
import { TableBookingDetails } from "@/components/app/molecules/table-booking-details";
import { TableBookingHoldTimer } from "@/components/app/molecules/table-booking-hold-timer";
import { TableBookingPartySize } from "@/components/app/molecules/table-booking-party-size";
import { TableBookingPayment } from "@/components/app/molecules/table-booking-payment";
import { TableBookingSupport } from "@/components/app/molecules/table-booking-support";
import { Button } from "@/components/ui/button";
import {
  getSessionStorage,
  removeSessionStorage,
  setSessionStorage,
} from "@/helpers/storage";
import { useBookingStatus } from "@/hooks/use-booking-status";
import { useBookingTimes } from "@/hooks/use-booking-times";
import { useGuestDetails } from "@/hooks/use-guest-details";
import { useOpenDates } from "@/hooks/use-open-dates";
import { storedHold, useTableHold } from "@/hooks/use-table-hold";
import { ROUTES } from "@/lib/constants";
import {
  BOOKING_GUEST_LIMITS,
  BOOKING_MESSAGES,
} from "@/lib/constants/booking";
import { TABLE_BOOKING_CONTENT as content } from "@/lib/constants/table-booking";
import type {
  IBookingTime,
  IGuestDetailsSending,
  IHoldChoice,
  IHoldSummary,
  IReturnBy,
  ITableBookingConfirmationProps,
  ITableBookingGuestDetails,
  ITableBookingHeldStepProps,
  ITableBookingNoticeProps,
  ITableBookingPanelProps,
  ITableBookingProgressProps,
  ITableBookingTimesProps,
  ITableHold,
  TBookingStatusCheck,
  TBookingTimes,
  TPaymentStep,
  TTableBookingTimesListProps,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export function TableBookingNotice({
  message,
  loading = false,
}: ITableBookingNoticeProps) {
  return (
    <section
      aria-label={content.label}
      aria-busy={loading}
      className={styles.panel}
    >
      <p role={loading ? "status" : undefined} className={styles.panelMessage}>
        {message}
      </p>
      <TableBookingSupport />
    </section>
  );
}

export function TableBookingPanel({ findTable }: ITableBookingPanelProps) {
  const [step, setStep] = useState(0);
  const [date, setDate] = useState(findTable.calendar.defaultDate);
  const [partySize, setPartySize] = useState(
    String(findTable.partySize.default),
  );
  const [time, setTime] = useState<IBookingTime | null>(null);
  const [datePicked, setDatePicked] = useState(false);
  const availability = useOpenDates(partySize, findTable.calendar.lastDate);
  const { load } = availability;

  const [returnAccepted, setReturnAccepted] = useState(false);
  const [details, setDetails] = useState(emptyDetails);
  const [booked, setBooked] = useState<ITableBookingConfirmationProps | null>(
    null,
  );
  const guest = useGuestDetails();
  const [payment, setPayment] = useState<TPaymentStep | null>(null);
  const [paid, setPaid] = useState<IHoldSummary | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentBusy, setPaymentBusy] = useState(false);
  const panel = useRef<HTMLElement>(null);
  const previousStep = useRef(0);
  const shortDate = format(parseISO(date), "EEE, d MMM yyyy");
  const longDate = format(parseISO(date), "EEEE, d MMMM yyyy");
  const guests = partySize === "1" ? "1 guest" : `${partySize} guests`;
  const returnBy = returnByOf(time);
  const times = useBookingTimes(date, partySize, step === 1 || step === 2);
  const hold = useTableHold();
  const { place } = hold;
  const restoring = useRef(true);

  const showHeld = useCallback((choice: IHoldChoice, summary: IHoldSummary) => {
    setDate(choice.searchDate);
    setPartySize(String(choice.partySize));
    setDatePicked(true);
    setTime({
      searchDate: choice.searchDate,
      date: summary.date,
      time: summary.time,
      label: summary.timeLabel,
      offers: [summary.offer],
    });
    setReturnAccepted(true);
    setStep(2);
  }, []);

  useEffect(() => {
    if (!restoring.current) return;
    restoring.current = false;
    const saved = savedBooking();
    if (saved?.kind === "held") {
      place(saved.choice, (summary) => showHeld(saved.choice, summary));
      return;
    }
    if (!saved) return;
    showHeld(saved.choice, saved.summary);
    if (saved.kind !== "paid") {
      setPayment(saved.step);
      if (saved.kind === "refused") setPaymentError(content.payment.bankFailed);
      return;
    }
    setSessionStorage(PAID_KEY, saved.summary);
    removeSessionStorage(PAYMENT_KEY);
    setPaid(saved.summary);
  }, [place, showHeld]);

  const { forgetHold } = hold;
  const confirmBooking = useCallback(
    (confirmed: ITableBookingConfirmationProps) => {
      setBooked(confirmed);
      setPayment(null);
      setPaid(null);
      removeSessionStorage(PAID_KEY);
      removeSessionStorage(PAYMENT_KEY);
      forgetHold();
      setStep(3);
    },
    [forgetHold],
  );

  function sendDetails() {
    const held = hold.active?.summary;
    if (!held) return;
    guest.send(details, held, (reply) => {
      if (reply.kind === "confirmed") {
        confirmBooking({ reference: reply.reference, summary: reply.summary });
      } else {
        setSessionStorage(PAYMENT_KEY, reply);
        setPayment(reply);
      }
    });
  }

  const paymentAccepted = useCallback(() => {
    if (!payment) return;
    setSessionStorage(PAID_KEY, payment.summary);
    removeSessionStorage(PAYMENT_KEY);
    setPaid(payment.summary);
  }, [payment]);

  function editSearch() {
    setPayment(null);
    setPaymentError(null);
    removeSessionStorage(PAYMENT_KEY);
    setStep(0);
  }

  function startOver() {
    setPaid(null);
    removeSessionStorage(PAID_KEY);
    forgetHold();
    editSearch();
  }

  function holdChosenTime() {
    if (!time) return;
    const choice = {
      searchDate: time.searchDate,
      time: time.time,
      partySize: Number(partySize),
    };
    place(choice, (summary) => showHeld(choice, summary));
  }
  const busy = isBusy(hold, guest, paymentBusy, paid);
  const monthDates = availability.datesFor(startOfMonth(parseISO(date)));
  const dateFull = Array.isArray(monthDates) && !monthDates.includes(date);
  const firstFree = Array.isArray(monthDates) ? monthDates[0] : undefined;
  const moveDate = dateFull && !datePicked && firstFree !== undefined;

  useEffect(() => {
    load(startOfMonth(parseISO(date)));
  }, [load, date]);

  useEffect(() => {
    if (moveDate) setDate(firstFree);
  }, [moveDate, firstFree]);

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
      <BookingProgress step={step} />

      {step === 0 && (
        <>
          <div className={styles.availability}>
            <div className={styles.fields}>
              <TableBookingDate
                value={date}
                calendar={findTable.calendar}
                availability={availability}
                onChange={(value) => {
                  setDate(value);
                  setDatePicked(true);
                }}
              />
              <TableBookingPartySize
                value={partySize}
                min={findTable.partySize.min}
                max={findTable.partySize.max}
                onChange={setPartySize}
              />
            </div>
            <Button
              type="button"
              variant="brand-primary"
              className={styles.findTable}
              onClick={() => {
                setTime(null);
                setReturnAccepted(false);
                setStep(1);
              }}
            >
              {content.action}
              <ArrowRight aria-hidden="true" className={styles.actionArrow} />
            </Button>
          </div>
          <p role="status" className={styles.dateNote}>
            {dateFull && !moveDate && content.fullDate(guests, shortDate)}
          </p>
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
              {step === 2 && time && (
                <>
                  {time.label}
                  <span aria-hidden="true"> | </span>
                </>
              )}
              {guests}
              {step === 2 && returnBy && (
                <small>{content.tableUntil(returnBy.label)}</small>
              )}
            </p>
            <TableBookingChange
              busy={busy}
              payment={payment}
              onEdit={editSearch}
              onReleased={startOver}
              onConfirmed={confirmBooking}
            />
          </div>
          {step === 1 ? (
            <BookingTimes
              longDate={longDate}
              guests={guests}
              times={times}
              time={time}
              holding={hold.pending}
              holdError={hold.error}
              returnAccepted={returnAccepted}
              onTimeChange={setTime}
              onReturnChange={setReturnAccepted}
              onBack={() => setStep(0)}
              onContinue={holdChosenTime}
            />
          ) : (
            <HeldStep
              hold={hold}
              details={details}
              guest={guest}
              payment={payment}
              paymentError={paymentError}
              paid={paid}
              onPaid={paymentAccepted}
              onBusyChange={setPaymentBusy}
              onConfirmed={confirmBooking}
              onDetailsChange={setDetails}
              onBack={() => setStep(1)}
              onContinue={sendDetails}
              onStartAgain={startOver}
            />
          )}
        </>
      )}

      {step === 3 && booked && (
        <>
          <BookingConfirmation
            reference={booked.reference}
            summary={booked.summary}
          />
          <TableBookingSupport confirmation />
          <button
            type="button"
            className={cn(styles.backAction, styles.restart)}
            onClick={() => {
              setStep(0);
              setTime(null);
              setReturnAccepted(false);
              setDetails(emptyDetails());
              setBooked(null);
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

function BookingConfirmation({
  reference,
  summary,
}: ITableBookingConfirmationProps) {
  const { returnBy } = summary.offer;
  return (
    <div className={styles.confirmation}>
      <span className={styles.confirmationCheck}>
        <Check aria-hidden="true" />
      </span>
      <h2 className={styles.flowHeading}>{content.confirmation.heading}</h2>
      <p className={styles.bookingReference}>
        {content.confirmation.referenceLabel}
        <br />
        <strong>{reference}</strong>
      </p>
      <p className={styles.confirmationSummary}>
        {summary.dateLabel}
        <br className={styles.desktopOnly} /> · {summary.timeLabel} ·{" "}
        {summary.guestsLabel}
        {returnBy && (
          <>
            <br />
            {content.tableUntil(returnBy.label)}
          </>
        )}
      </p>
      <p className={styles.confirmationDisclaimer}>
        {content.confirmation.keepReference}
      </p>
      <div className={styles.confirmationActions}>
        <Button
          type="button"
          variant="brand-contact"
          disabled
          title="Calendar export isn't available yet."
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
  );
}

interface IDetailsCheckProps {
  hold: IHoldSummary;
  onSettled: (check: TBookingStatusCheck) => void;
}

function DetailsCheck({ hold, onSettled }: IDetailsCheckProps) {
  const check = useBookingStatus(hold, 0);

  useEffect(() => {
    if (check.kind !== "checking" && check.kind !== "unknown") {
      onSettled(check);
    }
  }, [check, onSettled]);

  return (
    <p role="status" className={styles.flowDescription}>
      {check.kind === "unknown"
        ? content.details.stillConfirming(hold.reference)
        : content.details.checking}
    </p>
  );
}

function PaymentOutcome({
  check,
  reference,
  onStartAgain,
}: {
  check: TBookingStatusCheck;
  reference: string;
  onStartAgain: () => void;
}) {
  const failed = check.kind === "failed";
  if (!failed && check.kind !== "unknown") {
    return (
      <p role="status" className={styles.flowDescription}>
        {content.payment.checking}
      </p>
    );
  }
  return (
    <div className={styles.flowNotice}>
      {failed ? (
        <p role="alert" className={styles.formError}>
          {content.payment.notConfirmed(reference)}
        </p>
      ) : (
        <p role="status" className={styles.flowDescription}>
          {content.payment.stillConfirming(reference)}
        </p>
      )}
      <Button type="button" variant="brand-primary" onClick={onStartAgain}>
        {content.startAgain}
      </Button>
    </div>
  );
}

const PAID_KEY = "peploes:booking-paid";
const PAYMENT_KEY = "peploes:booking-payment";
const REFUSED_BY_BANK = new Set(["failed", "requires_payment_method"]);

type TSavedBooking =
  | { kind: "held"; choice: IHoldChoice }
  | { kind: "paid"; choice: IHoldChoice; summary: IHoldSummary }
  | {
      kind: "refused" | "paying";
      choice: IHoldChoice;
      summary: IHoldSummary;
      step: TPaymentStep;
    };

function choiceFor(summary: IHoldSummary): IHoldChoice {
  return (
    storedHold()?.choice ?? {
      searchDate: summary.date,
      time: summary.time,
      partySize: summary.partySize,
    }
  );
}

function bankReturn(): TSavedBooking | null {
  const params = new URLSearchParams(window.location.search);
  const status = params.get("redirect_status");
  if (!status) return null;
  window.history.replaceState(null, "", window.location.pathname);
  const step = getSessionStorage<TPaymentStep>(PAYMENT_KEY);
  const secret = params.get(
    step?.kind === "card"
      ? "setup_intent_client_secret"
      : "payment_intent_client_secret",
  );
  if (!step || secret !== step.stripe.clientSecret) return null;
  const { summary } = step;
  return REFUSED_BY_BANK.has(status)
    ? { kind: "refused", choice: choiceFor(summary), summary, step }
    : { kind: "paid", choice: choiceFor(summary), summary };
}

function savedBooking(): TSavedBooking | null {
  const returned = bankReturn();
  if (returned) return returned;
  const paid = getSessionStorage<IHoldSummary>(PAID_KEY);
  if (paid) return { kind: "paid", choice: choiceFor(paid), summary: paid };
  const step = getSessionStorage<TPaymentStep>(PAYMENT_KEY);
  if (step) {
    const { summary } = step;
    return { kind: "paying", choice: choiceFor(summary), summary, step };
  }
  const held = storedHold();
  return held ? { kind: "held", choice: held.choice } : null;
}

const KEEP_HOLD = () => undefined;

function isBusy(
  hold: ITableHold,
  guest: IGuestDetailsSending,
  paymentBusy: boolean,
  paid: IHoldSummary | null,
): boolean {
  return (
    hold.pending ||
    guest.sending ||
    guest.unsure !== null ||
    paymentBusy ||
    paid !== null
  );
}

function emptyDetails(): ITableBookingGuestDetails {
  return {
    firstName: "",
    surname: "",
    email: "",
    countryCode: String(BOOKING_GUEST_LIMITS.defaultCountryCode),
    phone: "",
    requests: "",
    terms: false,
  };
}

function returnByOf(time: IBookingTime | null): IReturnBy | null {
  return time?.offers[0]?.returnBy ?? null;
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
  times,
  time,
  holding,
  holdError,
  returnAccepted,
  onTimeChange,
  onReturnChange,
  onBack,
  onContinue,
}: ITableBookingTimesProps) {
  const returnBy = returnByOf(time);
  const mustAccept = returnBy?.required === true;
  return (
    <div>
      <h2 className={styles.flowHeading}>{content.timesLabel}</h2>
      <p className={styles.flowDescription}>
        Showing times for {longDate} · {guests}
      </p>
      <TimesList times={times} time={time} onTimeChange={onTimeChange} />
      {returnBy && !mustAccept && (
        <p className={styles.returnInfo}>
          {content.tableUntil(returnBy.label)}
        </p>
      )}
      {returnBy && mustAccept && (
        <div className={styles.returnNotice}>
          <strong>{content.returnTime.heading}</strong>
          <label>
            <input
              type="checkbox"
              checked={returnAccepted}
              onChange={(event) => onReturnChange(event.target.checked)}
            />
            {content.returnTime.accept(returnBy.label)}
          </label>
        </div>
      )}
      {holdError && (
        <p role="alert" className={styles.timesMessage}>
          {holdError}
        </p>
      )}
      <div className={styles.flowActions}>
        <button
          type="button"
          className={styles.backAction}
          disabled={holding}
          onClick={onBack}
        >
          <ArrowLeft aria-hidden="true" />
          Back to search
        </button>
        <Button
          type="button"
          variant="brand-primary"
          className={styles.continueAction}
          disabled={!time || holding || (mustAccept && !returnAccepted)}
          onClick={onContinue}
        >
          {holding ? content.holding : "Continue"}
          <ArrowRight aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

function HeldStep({
  hold,
  details,
  guest,
  payment,
  paymentError,
  paid,
  onPaid,
  onBusyChange,
  onConfirmed,
  onDetailsChange,
  onBack,
  onContinue,
  onStartAgain,
}: ITableBookingHeldStepProps) {
  const check = useBookingStatus(paid);
  const { settle } = guest;
  const { forgetHold } = hold;

  useEffect(() => {
    if (check.kind === "confirmed") {
      onConfirmed({ reference: check.reference, summary: check.summary });
    } else if (check.kind === "failed") {
      removeSessionStorage(PAID_KEY);
      forgetHold();
    }
  }, [check, onConfirmed, forgetHold]);

  const settleDetails = useCallback(
    (detailsCheck: TBookingStatusCheck) => {
      settle(detailsCheck);
      if (detailsCheck.kind === "confirmed") {
        onConfirmed({
          reference: detailsCheck.reference,
          summary: detailsCheck.summary,
        });
      } else if (detailsCheck.kind === "failed") {
        forgetHold();
      }
    },
    [settle, forgetHold, onConfirmed],
  );

  if (guest.unsure) {
    return <DetailsCheck hold={guest.unsure} onSettled={settleDetails} />;
  }
  if (paid) {
    return (
      <PaymentOutcome
        check={check}
        reference={paid.reference}
        onStartAgain={onStartAgain}
      />
    );
  }
  if (payment) {
    return (
      <TableBookingPayment
        step={payment}
        initialError={paymentError}
        onPaid={onPaid}
        onBusyChange={onBusyChange}
      />
    );
  }
  if (!hold.active) {
    return (
      <div className={styles.flowNotice}>
        <p role="alert">{BOOKING_MESSAGES.holdExpired}</p>
        <Button type="button" variant="brand-primary" onClick={onBack}>
          {content.chooseAgain}
        </Button>
      </div>
    );
  }
  return (
    <>
      <TableBookingHoldTimer
        endsAt={hold.active.endsAt}
        onExpire={guest.sending ? KEEP_HOLD : hold.forgetHold}
      />
      <TableBookingDetails
        details={details}
        sending={guest.sending}
        serverErrors={guest.fieldErrors}
        formError={guest.formError}
        onChange={onDetailsChange}
        onBack={onBack}
        onContinue={onContinue}
      />
    </>
  );
}

function TimesList({ times, time, onTimeChange }: TTableBookingTimesListProps) {
  return (
    <>
      <p role="status" className={styles.timesMessage}>
        {timesMessage(times)}
      </p>
      {times.status === "ready" && times.data.times.length > 0 && (
        <fieldset className={styles.timeGrid} aria-label={content.timesLabel}>
          {times.data.times.map((slot) => (
            <button
              type="button"
              key={`${slot.date} ${slot.time}`}
              aria-pressed={time?.date === slot.date && time.time === slot.time}
              className={styles.timeSlot}
              onClick={() => onTimeChange(slot)}
            >
              {slot.label}
            </button>
          ))}
        </fieldset>
      )}
    </>
  );
}

function timesMessage(times: TBookingTimes): string {
  if (times.status === "loading") return content.findingTimes;
  if (times.status === "failed") return times.message;
  const { emptyReason, dateLabel, guestsLabel } = times.data;
  switch (emptyReason) {
    case "closed":
      return content.noTimes.closed(dateLabel);
    case "none_online":
      return content.noTimes.noneOnline(guestsLabel, dateLabel);
    case "all_passed":
      return content.noTimes.allPassed(dateLabel);
    default:
      return "";
  }
}
