"use client";

import type { Appearance, StripePaymentElement } from "@stripe/stripe-js";
import { loadStripe } from "@stripe/stripe-js/pure";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import styles from "@/components/app/compounds/table-booking-panel.module.css";
import { Button } from "@/components/ui/button";
import { TABLE_BOOKING_CONTENT } from "@/lib/constants/table-booking";
import type {
  IPaymentFormProps,
  IStripeReady,
  ITableBookingPaymentProps,
  TPaymentStep,
} from "@/lib/types";

const copy = TABLE_BOOKING_CONTENT.payment;

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

async function prepare(step: TPaymentStep): Promise<IStripeReady | string> {
  const { publishableKey, accountId, clientSecret } = step.stripe;
  const stripe = await loadStripe(publishableKey, { stripeAccount: accountId });
  if (!stripe) return copy.loadFailed;
  let amount = step.amountText;
  if (step.kind === "payment") {
    const intent = await stripe.retrievePaymentIntent(clientSecret);
    if (!intent.paymentIntent) return intent.error?.message ?? copy.loadFailed;
    amount = formatAmount(
      intent.paymentIntent.amount,
      intent.paymentIntent.currency,
    );
  }
  const elements = stripe.elements({
    clientSecret,
    appearance: TABLE_BOOKING_CONTENT.stripeAppearance as Appearance,
  });
  return { stripe, elements, amount };
}

function actionLabel(step: TPaymentStep, amount: string, paying: boolean) {
  if (paying) return copy.paying;
  return step.kind === "payment" ? copy.pay(amount) : copy.saveCard;
}

function description(step: TPaymentStep, ready: IStripeReady | null) {
  if (!ready) return copy.loading;
  return step.kind === "payment"
    ? copy.deposit(ready.amount)
    : copy.card(ready.amount);
}

export function TableBookingPayment({
  step,
  initialError,
  onPaid,
}: ITableBookingPaymentProps) {
  const [attempt, setAttempt] = useState(0);
  return (
    <PaymentForm
      key={attempt}
      step={step}
      initialError={attempt === 0 ? initialError : null}
      onPaid={onPaid}
      onRetry={() => setAttempt((count) => count + 1)}
    />
  );
}

function PaymentForm({
  step,
  initialError,
  onPaid,
  onRetry,
}: IPaymentFormProps) {
  const mountPoint = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState<IStripeReady | null>(null);
  const [error, setError] = useState(initialError);
  const [paying, setPaying] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let element: StripePaymentElement | undefined;
    prepare(step)
      .catch(() => copy.loadFailed)
      .then((prepared) => {
        if (!active) return;
        if (typeof prepared === "string") {
          setError(prepared);
          setLoadFailed(true);
          return;
        }
        element = prepared.elements.create("payment");
        element.on("ready", () => {
          if (active) setReady(prepared);
        });
        if (mountPoint.current) element.mount(mountPoint.current);
      });
    return () => {
      active = false;
      element?.destroy();
    };
  }, [step]);

  async function pay() {
    if (!ready) return;
    setPaying(true);
    setError(null);
    const options = {
      elements: ready.elements,
      redirect: "if_required" as const,
      // biome-ignore lint/style/useNamingConvention: Stripe's API field name.
      confirmParams: { return_url: window.location.href },
    };
    const result =
      step.kind === "payment"
        ? await ready.stripe.confirmPayment(options)
        : await ready.stripe.confirmSetup(options);
    if (result.error) {
      setError(result.error.message ?? copy.failed);
      setPaying(false);
      return;
    }
    onPaid();
  }

  return (
    <div className={styles.payment}>
      <h2 className={styles.flowHeading}>
        {step.kind === "payment" ? copy.depositHeading : copy.cardHeading}
      </h2>
      <p role="status" className={styles.flowDescription}>
        {description(step, ready)}
      </p>
      <div ref={mountPoint} className={styles.paymentElement} />
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
