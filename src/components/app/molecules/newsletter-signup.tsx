"use client";

import { ArrowRight } from "lucide-react";
import { useState } from "react";
import styles from "@/components/app/molecules/newsletter-signup.module.css";
import { Button } from "@/components/ui/button";
import { FOOTER_CONTENT } from "@/lib/constants/footer";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [composing, setComposing] = useState(false);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [localPart, domain = "", extraPart] = email.split("@");
  const suggestions =
    focused &&
    !dismissed &&
    !composing &&
    localPart &&
    !/\s/.test(email) &&
    extraPart === undefined
      ? FOOTER_CONTENT.newsletter.domains
          .filter((value) => value.startsWith(domain.toLowerCase()))
          .map((value) => `${localPart}@${value}`)
          .filter((value) => value.toLowerCase() !== email.toLowerCase())
      : [];
  const completion = suggestions[0];

  return (
    <form
      autoComplete="off"
      onSubmit={(event) => {
        event.preventDefault();
        setDismissed(true);
        setSubmitted(true);
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
          {/* No name prevents the preview email being sent before hydration. */}
          <input
            id="footer-newsletter-email"
            type="email"
            required
            pattern=".+@.+\..+"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder={FOOTER_CONTENT.newsletter.emailLabel}
            aria-invalid={Boolean(error)}
            aria-autocomplete="inline"
            aria-describedby="footer-newsletter-hint footer-newsletter-error footer-newsletter-status"
            value={email}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onCompositionStart={() => setComposing(true)}
            onCompositionEnd={() => setComposing(false)}
            onScroll={(event) => setScrollLeft(event.currentTarget.scrollLeft)}
            onChange={(event) => {
              setEmail(event.target.value);
              setError("");
              setSubmitted(false);
              setDismissed(false);
            }}
            onKeyDown={(event) => {
              if (event.nativeEvent.isComposing) return;
              if (event.key === "Escape") {
                setDismissed(true);
              } else if (completion && event.key === "Tab" && !event.shiftKey) {
                event.preventDefault();
                setEmail(completion);
                setError("");
                setSubmitted(false);
                setDismissed(true);
              }
            }}
            onInvalid={(event) => {
              setDismissed(true);
              setError(
                event.currentTarget.validity.valueMissing
                  ? FOOTER_CONTENT.newsletter.requiredError
                  : FOOTER_CONTENT.newsletter.invalidError,
              );
            }}
            className={`${styles.input} h-[30px] min-w-0 rounded-none border-b border-border-interactive bg-transparent text-sm leading-[21px] text-ink placeholder:text-text-secondary focus:border-b-2 focus:border-peploe-burgundy focus:outline-none forced-colors:focus-visible:outline-2 forced-colors:focus-visible:outline-offset-2 forced-colors:focus-visible:outline-solid xl:h-11`}
          />
          {completion && (
            <div
              data-newsletter-completion
              aria-hidden="true"
              className={styles.completion}
            >
              <span style={{ transform: `translateX(-${scrollLeft}px)` }}>
                <span className="text-transparent">{email}</span>
                <span className="text-text-secondary">
                  {completion.slice(email.length)}
                </span>
              </span>
            </div>
          )}
        </div>
        <Button
          type="submit"
          variant="brand-primary"
          className="h-11 gap-2 rounded-[4px] bg-peploe-burgundy px-5 text-base leading-[22px] font-medium text-warm-cream shadow-none has-[>svg]:px-5 xl:leading-6"
        >
          {FOOTER_CONTENT.newsletter.submitLabel}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Button>
      </div>
      <p id="footer-newsletter-hint" className="sr-only">
        {FOOTER_CONTENT.newsletter.completionHint}
      </p>
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
