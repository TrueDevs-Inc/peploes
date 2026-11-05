"use client";

import { ArrowRight } from "lucide-react";
import { useState, useTransition } from "react";
import { submitNewsletter } from "@/actions/newsletter";
import styles from "@/components/app/molecules/newsletter-signup.module.css";
import { Button } from "@/components/ui/button";
import { FOOTER_CONTENT } from "@/lib/constants/footer";

export function NewsletterSignup() {
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (pending || submitted) return;
        if (!event.currentTarget.checkValidity()) return;
        setError("");
        startTransition(async () => {
          try {
            const result = await submitNewsletter({ email });
            setSubmitted(result.accepted);
            if (!result.accepted) setError(result.message);
          } catch {
            setError(FOOTER_CONTENT.newsletter.unknownError);
          }
        });
      }}
    >
      <div
        data-footer-newsletter-controls
        className="mt-4 flex flex-col gap-3 xl:mt-6 xl:flex-row xl:items-end"
      >
        <label htmlFor="footer-newsletter-email" className="sr-only">
          {FOOTER_CONTENT.newsletter.emailLabel}
        </label>
        <div className={styles.field}>
          <input
            id="footer-newsletter-email"
            name="email"
            type="email"
            required
            disabled={pending || submitted}
            pattern=".+@.+\..+"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder={FOOTER_CONTENT.newsletter.emailLabel}
            aria-invalid={Boolean(error)}
            aria-describedby="footer-newsletter-error footer-newsletter-status"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError("");
              setSubmitted(false);
            }}
            onInvalid={(event) => {
              event.preventDefault();
              event.currentTarget.focus();
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
          disabled={pending || submitted}
          variant="brand-primary"
          className="h-11 gap-2 rounded-[4px] bg-peploe-burgundy px-5 text-base leading-[22px] font-medium text-warm-cream shadow-none has-[>svg]:px-5 xl:leading-6"
        >
          {pending
            ? FOOTER_CONTENT.newsletter.pendingLabel
            : FOOTER_CONTENT.newsletter.submitLabel}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Button>
      </div>
      <p
        id="footer-newsletter-error"
        role="alert"
        className="mt-2 text-sm text-peploe-burgundy empty:hidden"
      >
        {error}
      </p>
      <p
        id="footer-newsletter-status"
        role="status"
        className="mt-2 text-sm text-text-secondary empty:hidden"
      >
        {submitted ? FOOTER_CONTENT.newsletter.status : ""}
      </p>
    </form>
  );
}
