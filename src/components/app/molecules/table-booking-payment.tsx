"use client";

import type {
  Appearance,
  Stripe,
  StripePaymentElement,
} from "@stripe/stripe-js";
import { loadStripe } from "@stripe/stripe-js/pure";
import { ArrowRight } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import styles from "@/components/app/compounds/table-booking-panel.module.css";
import { TableBookingProcessing } from "@/components/app/molecules/table-booking-processing";
import { TableBookingPaymentSkeleton } from "@/components/app/molecules/table-booking-skeleton";
import { Button } from "@/components/ui/button";
import { fetcher } from "@/helpers/api";
import { trackBooking } from "@/lib/analytics/booking";
import { logClientError } from "@/lib/client-errors";
import {
  BOOKING_API,
  BOOKING_BUDGET_MS,
  BOOKING_RETURN_PARAMS,
} from "@/lib/constants/booking";
import { TABLE_BOOKING_CONTENT } from "@/lib/constants/table-booking";
import { AppModule, ErrorCode, GA4Event, HttpVerb, Stage } from "@/lib/enums";
import type {
  IHoldStatusResult,
  IPaymentFormProps,
  IStripeReady,
  ITableBookingPaymentProps,
  TBookingAnalyticsResult,
  TBookingResponse,
  TPaymentStep,
} from "@/lib/types";

const copy = TABLE_BOOKING_CONTENT.payment;
const PAID_STATUSES = new Set(["succeeded", "processing", "requires_capture"]);
const CARD_PROBLEMS = new Set(["card_error", "validation_error"]);

function trackPayment(
  step: TPaymentStep,
  result: TBookingAnalyticsResult,
  errorCode?: "STRIPE" | "NETWORK" | "STORAGE",
) {
  trackBooking(GA4Event.BookingPayment, result, {
    reference: step.summary.reference,
    paymentKind: step.kind === "payment" ? "deposit" : "guarantee",
    errorCode,
  });
}

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

async function intentOf(stripe: Stripe, step: TPaymentStep) {
  const { clientSecret } = step.stripe;
  if (step.kind === "card") {
    const { setupIntent } = await stripe.retrieveSetupIntent(clientSecret);
    return setupIntent
      ? { status: setupIntent.status, amount: step.amountText }
      : null;
  }
  const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);
  return paymentIntent
    ? {
        status: paymentIntent.status,
        amount: formatAmount(paymentIntent.amount, paymentIntent.currency),
      }
    : null;
}

async function paymentMayHaveSucceeded(
  stripe: Stripe,
  step: TPaymentStep,
  errorType: string,
) {
  if (CARD_PROBLEMS.has(errorType)) return false;
  const intent = await checkedIntent(stripe, step);
  return !intent || PAID_STATUSES.has(intent.status);
}

async function checkedIntent(stripe: Stripe, step: TPaymentStep) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), BOOKING_BUDGET_MS.stripeCheck);
  });
  const result = await Promise.race([
    intentOf(stripe, step).catch(() => null),
    deadline,
  ]);
  clearTimeout(timer);
  return result;
}

async function prepare(
  step: TPaymentStep,
): Promise<IStripeReady | "paid" | null> {
  const { publishableKey, accountId, clientSecret } = step.stripe;
  const stripe = await loadStripe(publishableKey, { stripeAccount: accountId });
  if (!stripe) return null;
  const intent = await intentOf(stripe, step);
  if (!intent) return null;
  if (PAID_STATUSES.has(intent.status)) return "paid";
  const elements = stripe.elements({
    clientSecret,
    appearance: TABLE_BOOKING_CONTENT.stripeAppearance as Appearance,
  });
  return { stripe, elements, amount: intent.amount };
}

async function paymentHoldStatus(step: TPaymentStep) {
  const query = new URLSearchParams({
    holdReference: step.summary.reference,
    holdRevision: String(step.summary.revision),
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
  if (reply?.ok === false && reply.error.code === ErrorCode.NotFound) {
    return { status: "uncheckable" } as const;
  }
  return reply?.ok ? reply.data : null;
}

function actionLabel(step: TPaymentStep, amount: string, paying: boolean) {
  if (paying) return copy.paying;
  return step.kind === "payment" ? copy.pay(amount) : copy.saveCard;
}

function description(step: TPaymentStep, amount: string | undefined) {
  if (amount === undefined) return copy.loading;
  return step.kind === "payment" ? copy.deposit(amount) : copy.card(amount);
}

export function TableBookingPayment({
  step,
  storageBlocked = false,
  initialError,
  onPaid,
  onBusyChange,
  onExpired,
  onStartAgain,
  onConfirmed,
}: ITableBookingPaymentProps) {
  useEffect(() => {
    if (storageBlocked) trackPayment(step, "load_failed", "STORAGE");
  }, [step, storageBlocked]);
  if (storageBlocked) {
    return (
      <div className={styles.payment}>
        <h2 className={styles.flowHeading}>
          {step.kind === "payment" ? copy.depositHeading : copy.cardHeading}
        </h2>
        <p className={styles.flowDescription}>
          {description(step, step.amountText)}
        </p>
        <p role="alert" className={styles.formError}>
          {copy.storageBlocked}
        </p>
      </div>
    );
  }
  return (
    <PaymentForm
      step={step}
      initialError={initialError}
      onPaid={onPaid}
      onExpired={onExpired}
      onStartAgain={onStartAgain}
      onConfirmed={onConfirmed}
      onBusyChange={onBusyChange}
      onRetry={() => window.location.reload()}
    />
  );
}

function PaymentForm({
  step,
  initialError,
  onPaid,
  onBusyChange,
  onRetry,
  onExpired,
  onStartAgain,
  onConfirmed,
}: IPaymentFormProps) {
  const mountPoint = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState<IStripeReady | null>(null);
  const [error, setError] = useState(initialError);
  const [paying, setPaying] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [cantCheck, setCantCheck] = useState(false);

  const endForHold = useCallback(
    (result: Awaited<ReturnType<typeof paymentHoldStatus>>) => {
      if (result?.status === "confirmed") {
        onConfirmed({ reference: result.reference, summary: result.summary });
        return true;
      }
      if (result?.status === "failed" || result?.status === "expired") {
        trackBooking(GA4Event.BookingHold, result.status, {
          reference: step.summary.reference,
        });
        onExpired();
        return true;
      }
      if (result?.status === "uncheckable") {
        setCantCheck(true);
        setPaying(false);
        return true;
      }
      return false;
    },
    [onConfirmed, onExpired, step.summary.reference],
  );

  const busy = paying || !(ready || loadFailed || cantCheck);

  useLayoutEffect(() => {
    onBusyChange(busy);
    return () => onBusyChange(false);
  }, [busy, onBusyChange]);

  useEffect(() => {
    let active = true;
    let element: StripePaymentElement | undefined;
    const timer = setTimeout(failedToLoad, BOOKING_BUDGET_MS.stripeLoad);
    function failedToLoad() {
      if (!active) return;
      active = false;
      clearTimeout(timer);
      element?.destroy();
      element = undefined;
      trackPayment(step, "load_failed", "STRIPE");
      setError(copy.loadFailed);
      setLoadFailed(true);
    }
    function mount(prepared: IStripeReady) {
      element = prepared.elements.create("payment");
      element.on("ready", () => {
        if (!active) return;
        clearTimeout(timer);
        setReady(prepared);
      });
      element.on("loaderror", failedToLoad);
      if (mountPoint.current) element.mount(mountPoint.current);
    }

    async function load() {
      const prepared = await prepare(step).catch(() => null);
      if (!active) return;
      if (prepared === "paid") {
        trackPayment(step, "accepted");
        clearTimeout(timer);
        onPaid();
        return;
      }
      const hold = await paymentHoldStatus(step);
      if (!active) return;
      if (endForHold(hold)) {
        clearTimeout(timer);
        return;
      }
      if (!prepared) {
        failedToLoad();
        return;
      }
      mount(prepared);
    }
    void load().catch(failedToLoad);
    return () => {
      active = false;
      clearTimeout(timer);
      element?.destroy();
    };
  }, [step, onPaid, endForHold]);

  async function endBeforePay(stripe: Stripe) {
    const hold = await paymentHoldStatus(step);
    if (hold?.status === "uncheckable") {
      const intent = await checkedIntent(stripe, step);
      if (intent && PAID_STATUSES.has(intent.status)) {
        onPaid();
        return true;
      }
    }
    return endForHold(hold);
  }

  async function confirmWithStripe(prepared: IStripeReady) {
    const returnUrl = new URL(
      window.location.origin + window.location.pathname,
    );
    returnUrl.searchParams.set(
      BOOKING_RETURN_PARAMS.reference,
      step.summary.reference,
    );
    returnUrl.searchParams.set(
      BOOKING_RETURN_PARAMS.revision,
      String(step.summary.revision),
    );
    const options = {
      elements: prepared.elements,
      redirect: "if_required" as const,
      // biome-ignore lint/style/useNamingConvention: Stripe's API field name.
      confirmParams: { return_url: returnUrl.href },
    };
    try {
      return step.kind === "payment"
        ? await prepared.stripe.confirmPayment(options)
        : await prepared.stripe.confirmSetup(options);
    } catch {
      // Raw Stripe errors can contain payment data; report a fixed message and application stack.
      logClientError(new Error("Stripe confirmation rejected"), {
        module: AppModule.Api,
        stage: Stage.Response,
        context: {
          stripe: {
            operation:
              step.kind === "payment" ? "confirmPayment" : "confirmSetup",
          },
        },
      });
      return {
        error: {
          type: "api_error" as const,
          message: copy.confirmFailed(step.summary.reference),
        },
      };
    }
  }

  async function pay() {
    if (!ready || paying) return;
    setPaying(true);
    setError(null);
    try {
      if (await endBeforePay(ready.stripe)) return;
      trackPayment(step, "started");
      const result = await confirmWithStripe(ready);
      if (!result.error) {
        trackPayment(step, "accepted");
        onPaid();
        return;
      }
      if (
        await paymentMayHaveSucceeded(ready.stripe, step, result.error.type)
      ) {
        trackPayment(step, "unknown", "STRIPE");
        onPaid();
        return;
      }
      trackPayment(step, "declined", "STRIPE");
      setError(result.error.message ?? copy.failed);
    } catch {
      setError(copy.confirmFailed(step.summary.reference));
    }
    setPaying(false);
  }

  if (cantCheck) {
    return (
      <div className={styles.flowNotice}>
        <p role="status" className={styles.flowDescription}>
          {copy.cantCheck(step.summary.reference)}
        </p>
        <Button type="button" variant="brand-primary" onClick={onStartAgain}>
          {TABLE_BOOKING_CONTENT.startAgain}
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.payment}>
      <h2 className={styles.flowHeading}>
        {step.kind === "payment" ? copy.depositHeading : copy.cardHeading}
      </h2>
      {!loadFailed && (
        <p role="status" className={styles.flowDescription}>
          {description(step, ready?.amount)}
        </p>
      )}
      <div
        className={styles.paymentElementContainer}
        aria-busy={!ready && !loadFailed}
        hidden={loadFailed}
      >
        <div
          ref={mountPoint}
          className={styles.paymentElement}
          inert={!ready}
        />
        {!ready && !loadFailed && (
          <div className={styles.paymentLoading}>
            <TableBookingPaymentSkeleton />
          </div>
        )}
      </div>
      {paying && <TableBookingProcessing>{copy.paying}</TableBookingProcessing>}
      {error && (
        <p role="alert" className={styles.formError}>
          {error}
        </p>
      )}
      <div className={styles.flowActions}>
        {loadFailed ? (
          <Button
            type="button"
            variant="brand-primary"
            className={styles.continueAction}
            onClick={onRetry}
          >
            {copy.tryAgain}
          </Button>
        ) : (
          <Button
            type="button"
            variant="brand-primary"
            className={styles.continueAction}
            disabled={!ready || paying}
            onClick={pay}
          >
            {actionLabel(step, ready?.amount ?? "", paying)}
            <ArrowRight aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
  );
}
