"use client";

import { addMonths, format, parseISO, startOfMonth } from "date-fns";
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
import {
  PaymentOutcome,
  TableBookingReturn,
} from "@/components/app/molecules/table-booking-payment-outcome";
import { TableBookingSupport } from "@/components/app/molecules/table-booking-support";
import { Button } from "@/components/ui/button";
import {
  getSessionStorage,
  removeSessionStorage,
  setSessionStorage,
} from "@/helpers/storage";
import { useBookingStatus } from "@/hooks/use-booking-status";
import { useBookingTimes } from "@/hooks/use-booking-times";
import {
  forgetGuestDetails,
  storedGuestDetails,
  useGuestDetails,
} from "@/hooks/use-guest-details";
import { useOpenDates } from "@/hooks/use-open-dates";
import { storedHold, useTableHold } from "@/hooks/use-table-hold";
import {
  beginBookingSearch,
  resumeBookingAttempt,
  trackBooking,
  trackBookingConfirmed,
} from "@/lib/analytics/booking";
import { holdReferenceSchema } from "@/lib/booking-schema";
import { ROUTES } from "@/lib/constants";
import {
  BOOKING_BANK_REFUSED_STATUSES,
  BOOKING_GUEST_LIMITS,
  BOOKING_MESSAGES,
  BOOKING_RETURN_PARAMS,
} from "@/lib/constants/booking";
import { TABLE_BOOKING_CONTENT as content } from "@/lib/constants/table-booking";
import { dublinToday, firstFreeBookingDate, guestsLabel } from "@/lib/dates";
import { GA4Event } from "@/lib/enums";
import type {
  IBookingBankReturn,
  IBookingTime,
  IGuestDetailsAttempt,
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
  TOpenDates,
  TPaymentStep,
  TTableBookingTimesListProps,
} from "@/lib/types";
import { cn } from "@/lib/utils";

function resumeBookingAnalytics(saved: ReturnType<typeof savedBooking>) {
  if (!saved) return;
  const reference =
    saved.kind === "held"
      ? storedHold()?.holdReference
      : saved.kind === "returning"
        ? saved.returned.reference
        : saved.summary.reference;
  if (reference) resumeBookingAttempt(reference);
}

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
  const [showRestoreError, setShowRestoreError] = useState(false);
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
  const { restore: restoreDetails } = guest;
  const [payment, setPayment] = useState<TPaymentStep | null>(null);
  const [returned, setReturned] = useState<IBookingBankReturn | null>(null);
  const [paid, setPaid] = useState<IHoldSummary | null>(null);
  const [paymentSaved, setPaymentSaved] = useState(true);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentBusy, setPaymentBusy] = useState(false);
  const panel = useRef<HTMLElement>(null);
  const previousStep = useRef(0);
  const shortDate = format(
    parseISO(step === 2 && time?.date ? time.date : date),
    "EEE, d MMM yyyy",
  );
  const longDate = format(parseISO(date), "EEEE, d MMMM yyyy");
  const guests = guestsLabel(Number(partySize));
  const returnBy = returnByOf(time);
  const times = useBookingTimes(date, partySize, step === 1 || step === 2);
  const hold = useTableHold();
  const { place, resume } = hold;
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
    resumeBookingAnalytics(saved);
    if (saved?.kind === "held") {
      setShowRestoreError(true);
      place(saved.choice, (summary) => showHeld(saved.choice, summary));
      return;
    }
    if (!saved) return;
    if (saved.kind === "returning") {
      setReturned(saved.returned);
      return;
    }
    showHeld(saved.choice, saved.summary);
    if (saved.kind === "details") {
      resume(saved.attempt.hold);
      restoreDetails(saved.attempt);
      return;
    }
    forgetGuestDetails();
    if (saved.kind !== "paid") {
      setPayment(saved.step);
      if (saved.kind === "refused") setPaymentError(content.payment.bankFailed);
      return;
    }
    savePaid(saved.summary);
    setPaid(saved.summary);
  }, [place, resume, restoreDetails, showHeld]);

  const { forgetHold } = hold;
  const confirmBooking = useCallback(
    (confirmed: ITableBookingConfirmationProps) => {
      void trackBookingConfirmed(confirmed.reference);
      forgetGuestDetails();
      forgetBankReturn();
      setReturned(null);
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
    const active = hold.active;
    if (!active) return;
    guest.send(details, active, (reply) => {
      if (reply.kind === "confirmed") {
        confirmBooking({ reference: reply.reference, summary: reply.summary });
      } else {
        setPaymentSaved(setSessionStorage(PAYMENT_KEY, reply));
        setPayment(reply);
      }
    });
  }

  const resumePaid = useCallback(
    (summary: IHoldSummary) => {
      forgetGuestDetails();
      if (savePaid(summary)) forgetBankReturn();
      showHeld(choiceFor(summary), summary);
      setReturned(null);
      setPaid(summary);
    },
    [showHeld],
  );

  const paymentAccepted = useCallback(() => {
    if (payment) resumePaid(payment.summary);
  }, [payment, resumePaid]);

  const paymentExpired = useCallback(() => {
    setPayment(null);
    setPaymentError(null);
    removeSessionStorage(PAYMENT_KEY);
    forgetHold();
  }, [forgetHold]);

  function editSearch() {
    setPayment(null);
    setPaymentError(null);
    removeSessionStorage(PAYMENT_KEY);
    setStep(0);
  }

  function startOver() {
    forgetBankReturn();
    setReturned(null);
    setPaid(null);
    removeSessionStorage(PAID_KEY);
    forgetHold();
    editSearch();
  }

  function holdChosenTime() {
    if (!time) return;
    setShowRestoreError(false);
    const choice = {
      searchDate: time.searchDate,
      time: time.time,
      partySize: Number(partySize),
    };
    place(choice, (summary) => showHeld(choice, summary));
  }
  const busy = isBusy(hold, guest, paymentBusy, paid);
  const month = startOfMonth(parseISO(date));
  const monthDates = availability.datesFor(month);
  const dateFull = isDateFull(monthDates, date);
  const firstFree = firstFreeBookingDate(date, findTable.calendar, [
    monthDates,
    availability.datesFor(addMonths(month, 1)),
  ]);
  const moveDate = dateFull && !datePicked && firstFree !== undefined;

  useEffect(() => {
    if (step === 0) load(startOfMonth(parseISO(date)));
  }, [load, date, step]);

  useEffect(() => {
    if (step === 0 && moveDate) setDate(firstFree);
  }, [step, moveDate, firstFree]);

  useEffect(() => {
    if (step !== 0) return;
    function refreshDate() {
      const today = dublinToday();
      setDate((current) => (current < today ? today : current));
    }
    window.addEventListener("focus", refreshDate);
    document.addEventListener("visibilitychange", refreshDate);
    return () => {
      window.removeEventListener("focus", refreshDate);
      document.removeEventListener("visibilitychange", refreshDate);
    };
  }, [step]);

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

  if (returned) {
    return (
      <section
        aria-label={content.label}
        className={cn(styles.panel, styles.flowPanel)}
      >
        <BookingProgress step={2} />
        <TableBookingReturn
          returned={returned}
          onPaid={resumePaid}
          onConfirmed={confirmBooking}
          onStartAgain={startOver}
        />
      </section>
    );
  }

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
              disabled={!date}
              onClick={() => {
                const today = dublinToday();
                if (date < today) {
                  setDate(today);
                  return;
                }
                const attemptId = beginBookingSearch();
                trackBooking(GA4Event.BookingSearch, "submitted", {
                  attemptId,
                });
                setShowRestoreError(false);
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
          <HoldError message={hold.error} visible={showRestoreError} />
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
              onStartOver={startOver}
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
              onTimeChange={(selected) => {
                setTime(selected);
                setReturnAccepted(false);
              }}
              onReturnChange={setReturnAccepted}
              onBack={() => setStep(0)}
              onContinue={holdChosenTime}
            />
          ) : (
            <HeldStep
              terms={findTable.terms}
              hold={hold}
              details={details}
              guest={guest}
              payment={payment}
              paymentError={paymentError}
              paymentSaved={paymentSaved}
              paid={paid}
              onPaid={paymentAccepted}
              onExpired={paymentExpired}
              onBusyChange={setPaymentBusy}
              onConfirmed={confirmBooking}
              onDetailsChange={setDetails}
              onBack={() => setStep(1)}
              onContinue={sendDetails}
              onStartAgain={startOver}
              onCheckAgain={() => setPaid(paid ? { ...paid } : null)}
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
          <Button
            variant="plain"
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
          </Button>
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
  pendingFrom: number;
  onSettled: (check: TBookingStatusCheck) => void;
}

function DetailsCheck({ hold, pendingFrom, onSettled }: IDetailsCheckProps) {
  const check = useBookingStatus(hold, pendingFrom);

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

const PAID_KEY = "peploes:booking-paid";
const PAYMENT_KEY = "peploes:booking-payment";

type TSavedBooking =
  | { kind: "returning"; returned: IBookingBankReturn }
  | { kind: "held"; choice: IHoldChoice }
  | { kind: "paid"; choice: IHoldChoice; summary: IHoldSummary }
  | {
      kind: "details";
      choice: IHoldChoice;
      summary: IHoldSummary;
      attempt: IGuestDetailsAttempt;
    }
  | {
      kind: "refused" | "paying";
      choice: IHoldChoice;
      summary: IHoldSummary;
      step: TPaymentStep;
    };

function choiceFor(summary: IHoldSummary): IHoldChoice {
  const saved = storedHold();
  if (
    saved?.holdReference === summary.reference &&
    saved.holdRevision === summary.revision
  ) {
    return saved.choice;
  }
  return {
    searchDate: summary.date,
    time: summary.time,
    partySize: summary.partySize,
  };
}

function savePaid(summary: IHoldSummary): boolean {
  if (!setSessionStorage(PAID_KEY, summary)) return false;
  removeSessionStorage(PAYMENT_KEY);
  return true;
}

function forgetBankReturn() {
  if (new URLSearchParams(window.location.search).has("redirect_status")) {
    window.history.replaceState(null, "", window.location.pathname);
  }
}

function bankReturn(): TSavedBooking | null {
  const params = new URLSearchParams(window.location.search);
  const status = params.get("redirect_status");
  if (!status) return null;
  const step = getSessionStorage<TPaymentStep>(PAYMENT_KEY);
  const secret = params.get(
    step?.kind === "card"
      ? "setup_intent_client_secret"
      : "payment_intent_client_secret",
  );
  if (!step || secret !== step.stripe.clientSecret) {
    const returned = returnedHold(params, status);
    if (!returned) forgetBankReturn();
    return returned;
  }
  forgetBankReturn();
  const { summary } = step;
  return BOOKING_BANK_REFUSED_STATUSES.has(status)
    ? { kind: "refused", choice: choiceFor(summary), summary, step }
    : { kind: "paid", choice: choiceFor(summary), summary };
}

function returnedHold(
  params: URLSearchParams,
  status: string,
): TSavedBooking | null {
  const hold = holdReferenceSchema.safeParse({
    holdReference: params.get(BOOKING_RETURN_PARAMS.reference),
    holdRevision: params.get(BOOKING_RETURN_PARAMS.revision),
  });
  if (!hold.success) return null;
  const query = new URLSearchParams([
    [BOOKING_RETURN_PARAMS.reference, hold.data.holdReference],
    [BOOKING_RETURN_PARAMS.revision, String(hold.data.holdRevision)],
    ["redirect_status", status],
  ]);
  window.history.replaceState(null, "", `${window.location.pathname}?${query}`);
  return {
    kind: "returning",
    returned: {
      reference: hold.data.holdReference,
      revision: hold.data.holdRevision,
      status,
    },
  };
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
  return savedDetailsOrHold();
}

function savedDetailsOrHold(): TSavedBooking | null {
  const attempt = storedGuestDetails();
  if (attempt) {
    const { summary } = attempt.hold;
    return { kind: "details", choice: choiceFor(summary), summary, attempt };
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

function isDateFull(dates: TOpenDates | undefined, date: string): boolean {
  return Array.isArray(dates) && !dates.includes(date);
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
    newsletterOptIn: false,
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

function HoldError({
  message,
  visible = true,
}: {
  message: string | null;
  visible?: boolean;
}) {
  if (!visible || !message) return null;
  return (
    <p role="alert" className={styles.timesMessage}>
      {message}
    </p>
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
      <HoldError message={holdError} />
      <div className={styles.flowActions}>
        <Button
          variant="plain"
          type="button"
          className={styles.backAction}
          disabled={holding}
          onClick={onBack}
        >
          <ArrowLeft aria-hidden="true" />
          Back to search
        </Button>
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
  terms,
  hold,
  details,
  guest,
  payment,
  paymentError,
  paymentSaved,
  paid,
  onPaid,
  onExpired,
  onBusyChange,
  onConfirmed,
  onDetailsChange,
  onBack,
  onContinue,
  onStartAgain,
  onCheckAgain,
}: ITableBookingHeldStepProps) {
  const check = useBookingStatus(paid);
  const { settle } = guest;
  const { forgetHold } = hold;
  const expireHold = useCallback(() => {
    if (hold.active)
      trackBooking(GA4Event.BookingHold, "expired", {
        reference: hold.active.summary.reference,
      });
    forgetHold();
  }, [hold.active, forgetHold]);

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
    return (
      <DetailsCheck
        hold={guest.unsure}
        pendingFrom={guest.pendingFrom}
        onSettled={settleDetails}
      />
    );
  }
  if (paid) {
    return (
      <PaymentOutcome
        check={check}
        reference={paid.reference}
        onStartAgain={onStartAgain}
        onCheckAgain={onCheckAgain}
      />
    );
  }
  if (payment) {
    return (
      <TableBookingPayment
        step={payment}
        initialError={paymentError}
        storageBlocked={!paymentSaved}
        onPaid={onPaid}
        onExpired={onExpired}
        onStartAgain={onStartAgain}
        onConfirmed={onConfirmed}
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
        onExpire={guest.sending ? KEEP_HOLD : expireHold}
      />
      <TableBookingDetails
        terms={terms}
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
            <Button
              variant="plain"
              type="button"
              key={`${slot.date} ${slot.time}`}
              aria-pressed={time?.date === slot.date && time.time === slot.time}
              className={styles.timeSlot}
              onClick={() => onTimeChange(slot)}
            >
              {slot.label}
            </Button>
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
