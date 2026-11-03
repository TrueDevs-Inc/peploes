"use client";

import { ArrowRight } from "lucide-react";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { submitNewsletter } from "@/actions/newsletter";
import styles from "@/components/app/molecules/newsletter-signup.module.css";
import { Button } from "@/components/ui/button";
import { FOOTER_CONTENT } from "@/lib/constants/footer";
import { rememberNewsletterSubscription } from "@/lib/newsletter-subscription";

export function NewsletterSignup() {
  const id = useId();
  const inFlight = useRef(false);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <form
      autoComplete="off"
      onSubmit={(event) => {
        event.preventDefault();
        if (!ready || pending || submitted || inFlight.current) return;
        inFlight.current = true;
        setError("");
        startTransition(async () => {
          try {
            const result = await submitNewsletter({ email });
            setSubmitted(result.accepted);
            if (!result.accepted) {
              setError(result.message);
              return;
            }
          } catch {
            setError(FOOTER_CONTENT.newsletter.unknownError);
            return;
          } finally {
            inFlight.current = false;
          }
          rememberNewsletterSubscription();
        });
      }}
    >
      <div
        data-footer-newsletter-controls
        className="mt-4 flex flex-col gap-3 xl:mt-6 xl:flex-row xl:items-end"
      >
        <label htmlFor={`${id}-email`} className="sr-only">
          {FOOTER_CONTENT.newsletter.emailLabel}
        </label>
        <div className={styles.field}>
          <input
            id={`${id}-email`}
            type="email"
            required
            disabled={!ready || pending || submitted}
            pattern=".+@.+\..+"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder={FOOTER_CONTENT.newsletter.emailLabel}
            aria-invalid={Boolean(error)}
            aria-describedby={`${id}-error ${id}-status`}
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError("");
              setSubmitted(false);
            }}
            onInvalid={(event) => {
              setError(
                event.currentTarget.validity.valueMissing
                  ? FOOTER_CONTENT.newsletter.requiredError
                  : FOOTER_CONTENT.newsletter.invalidError,
              );
            }}
            className={`${styles.input} h-[30px] min-w-0 rounded-none border-b border-border-interactive bg-transparent text-sm leading-[21px] text-ink placeholder:text-text-secondary focus:border-peploe-burgundy focus:shadow-[0_1px_0_0_var(--color-peploe-burgundy)] focus:outline-none forced-colors:focus-visible:outline-2 forced-colors:focus-visible:outline-offset-2 forced-colors:focus-visible:outline-solid xl:h-11`}
          />
        </div>
        <Button
          type="submit"
          disabled={!ready || pending || submitted}
          variant="brand-primary"
          className="h-11 gap-2 rounded-[4px] bg-peploe-burgundy px-5 text-base leading-[22px] font-medium text-warm-cream shadow-none has-[>svg]:px-5 xl:leading-6"
        >
          {!ready
            ? FOOTER_CONTENT.newsletter.loadingLabel
            : pending
              ? FOOTER_CONTENT.newsletter.pendingLabel
              : submitted
                ? FOOTER_CONTENT.newsletter.status
                : FOOTER_CONTENT.newsletter.submitLabel}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Button>
      </div>
      <p
        id={`${id}-error`}
        role="alert"
        className="mt-2 text-sm text-peploe-burgundy empty:hidden"
      >
        {error}
      </p>
      <p
        id={`${id}-status`}
        role="status"
        className="mt-2 text-sm text-text-secondary empty:hidden"
      >
        {submitted ? FOOTER_CONTENT.newsletter.status : ""}
      </p>
    </form>
  );
}
