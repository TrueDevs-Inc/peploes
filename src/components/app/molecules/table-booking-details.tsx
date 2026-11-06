"use client";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useId, useRef, useState } from "react";
import { z } from "zod";
import styles from "@/components/app/compounds/table-booking-panel.module.css";
import { Button } from "@/components/ui/button";
import {
  BOOKING_GUEST_LIMITS,
  BOOKING_MESSAGES,
  BOOKING_PATTERNS,
} from "@/lib/constants/booking";
import { TABLE_BOOKING_CONTENT } from "@/lib/constants/table-booking";
import type {
  ITableBookingDetailsProps,
  ITableBookingFieldProps,
  ITableBookingGuestDetails,
  TTableBookingDetailsErrors,
} from "@/lib/types";

function phoneError(phone: string): string {
  if (BOOKING_PATTERNS.internationalPrefix.test(phone.trim()))
    return BOOKING_MESSAGES.mobileWithoutCode;
  const digits = phone.replace(/\D/g, "").length;
  return /^[\d\s()-]+$/.test(phone) &&
    digits >= BOOKING_GUEST_LIMITS.mobileMinDigits &&
    digits <= BOOKING_GUEST_LIMITS.mobileMaxDigits
    ? ""
    : TABLE_BOOKING_CONTENT.details.phoneError;
}

function getDetailsErrors(details: ITableBookingGuestDetails) {
  const copy = TABLE_BOOKING_CONTENT.details;
  return {
    firstName: details.firstName.trim() ? "" : copy.nameError,
    surname: details.surname.trim() ? "" : copy.nameError,
    email: z.string().email().safeParse(details.email.trim()).success
      ? ""
      : copy.emailError,
    phone: phoneError(details.phone),
    terms: details.terms ? "" : copy.termsError,
  };
}
function BookingField({
  label,
  error,
  id,
  className,
  children,
  ...props
}: ITableBookingFieldProps) {
  const errorId = `${id}-error`;
  const input = (
    <input
      {...props}
      id={id}
      aria-invalid={!!error}
      aria-describedby={error ? errorId : undefined}
    />
  );
  return (
    <label htmlFor={id} className={className}>
      <span>
        {label} <span className={styles.required}>*</span>
      </span>
      {children ? (
        <span className={styles.phoneRow}>
          {children}
          {input}
        </span>
      ) : (
        input
      )}
      {error && (
        <span id={errorId} className={styles.error}>
          {error}
        </span>
      )}
    </label>
  );
}
export function TableBookingDetails({
  details,
  terms,
  sending,
  serverErrors,
  formError,
  onChange,
  onBack,
  onContinue,
}: ITableBookingDetailsProps) {
  const [attempted, setAttempted] = useState(false);
  const termsDialog = useRef<HTMLDialogElement>(null);
  const termsButton = useRef<HTMLButtonElement>(null);
  const termsHeading = useRef<HTMLHeadingElement>(null);
  const termsId = useId();
  const paragraphOccurrences = new Map<string, number>();
  const copy = TABLE_BOOKING_CONTENT.details;
  const fullName = details.surname
    ? `${details.firstName} ${details.surname}`
    : details.firstName;
  const invalid = getDetailsErrors(details);
  const errors: TTableBookingDetailsErrors = {
    ...(attempted ? invalid : {}),
    ...serverErrors,
  };
  function update(
    field: keyof ITableBookingGuestDetails,
    value: string | boolean,
  ) {
    onChange({ ...details, [field]: value });
  }
  function updateFullName(value: string) {
    if (value === fullName) return;
    let separator = value.lastIndexOf(" ");
    // Retain the known name boundary when editing one part in the mobile field.
    if (details.firstName && value.startsWith(`${details.firstName} `)) {
      separator = details.firstName.length;
    } else if (details.surname && value.endsWith(` ${details.surname}`)) {
      separator = value.length - details.surname.length - 1;
    }
    const hasSurname = separator >= 0 && separator < value.length - 1;
    onChange({
      ...details,
      firstName: hasSurname ? value.slice(0, separator) : value,
      surname: hasSurname ? value.slice(separator + 1) : "",
    });
  }
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        setAttempted(true);
        if (Object.values(invalid).some(Boolean)) {
          requestAnimationFrame(() => {
            Array.from(
              form.querySelectorAll<HTMLInputElement>('[aria-invalid="true"]'),
            )
              .find((field) => field.getClientRects().length)
              ?.focus();
          });
          return;
        }
        onContinue();
      }}
    >
      <div className={styles.detailsIntroduction}>
        <h2 className={styles.flowHeading}>{copy.heading}</h2>
        <p className={styles.flowDescription}>{copy.description}</p>
      </div>
      <div className={styles.detailsFields}>
        <BookingField
          id="booking-first"
          className={styles.desktopField}
          label="First name"
          autoComplete="given-name"
          value={details.firstName}
          placeholder="Your name"
          error={errors.firstName}
          onChange={(event) => update("firstName", event.target.value)}
        />
        <BookingField
          id="booking-surname"
          className={styles.desktopField}
          label="Surname"
          autoComplete="family-name"
          value={details.surname}
          placeholder="Your name"
          error={errors.surname}
          onChange={(event) => update("surname", event.target.value)}
        />
        <BookingField
          id="booking-name"
          className={styles.mobileField}
          label="Full name"
          autoComplete="name"
          value={fullName}
          placeholder="Your name"
          error={errors.firstName || errors.surname}
          onChange={(event) => updateFullName(event.target.value)}
        />
        <div className={styles.phoneField}>
          <BookingField
            id="booking-phone"
            className={styles.phoneNumber}
            label={
              <>
                <span className={styles.desktopOnly}>Mobile number</span>
                <span className={styles.mobileOnly}>Telephone number</span>
              </>
            }
            type="tel"
            autoComplete="tel-national"
            value={details.phone}
            placeholder="e.g. 087 123 4567"
            error={errors.phone || errors.countryCode}
            onChange={(event) => update("phone", event.target.value)}
          >
            <select
              aria-label={copy.countryCode}
              autoComplete="tel-country-code"
              className={styles.countryCode}
              value={details.countryCode}
              onChange={(event) => update("countryCode", event.target.value)}
            >
              {TABLE_BOOKING_CONTENT.countryCodes.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.label}
                </option>
              ))}
            </select>
          </BookingField>
        </div>
        <BookingField
          id="booking-email"
          className={styles.emailField}
          label="Email address"
          type="email"
          autoComplete="email"
          value={details.email}
          placeholder="you@example.com"
          error={errors.email}
          onChange={(event) => update("email", event.target.value)}
        />
        <label className={styles.requestsField}>
          <span>Special requests (optional)</span>
          <textarea
            rows={1}
            aria-invalid={!!errors.requests}
            aria-describedby={
              errors.requests ? "booking-requests-error" : undefined
            }
            value={details.requests}
            placeholder="e.g. dietary requirements, occasion"
            onChange={(event) => update("requests", event.target.value)}
          />
          {errors.requests && (
            <span id="booking-requests-error" className={styles.error}>
              {errors.requests}
            </span>
          )}
        </label>
      </div>
      <div className={styles.terms}>
        <input
          id={`${termsId}-agreement`}
          type="checkbox"
          aria-labelledby={`${termsId}-label ${termsId}-button`}
          checked={details.terms}
          aria-invalid={!!errors.terms}
          aria-describedby={errors.terms ? "booking-terms-error" : undefined}
          onChange={(event) => update("terms", event.target.checked)}
        />
        <span>
          <label htmlFor={`${termsId}-agreement`} id={`${termsId}-label`}>
            {copy.termsAgreement}
          </label>{" "}
          <button
            id={`${termsId}-button`}
            ref={termsButton}
            type="button"
            className={styles.termsName}
            onClick={() => {
              termsDialog.current?.showModal();
              termsHeading.current?.focus();
            }}
          >
            {copy.termsName}
          </button>
        </span>
      </div>
      <dialog
        ref={termsDialog}
        closedby="closerequest"
        aria-labelledby={`${termsId}-title`}
        className={`${styles.changeDialog} ${styles.termsDialog}`}
        onCancel={(event) => {
          event.preventDefault();
          event.currentTarget.close();
        }}
        onClose={(event) => {
          if (!event.currentTarget.open) termsButton.current?.focus();
        }}
      >
        <h2
          ref={termsHeading}
          id={`${termsId}-title`}
          className={styles.flowHeading}
          tabIndex={-1}
        >
          {copy.termsHeading}
        </h2>
        <section
          aria-labelledby={`${termsId}-title`}
          className={styles.termsText}
        >
          {terms.map((paragraph) => {
            const occurrence = (paragraphOccurrences.get(paragraph) ?? 0) + 1;
            paragraphOccurrences.set(paragraph, occurrence);
            return <p key={`${paragraph}-${occurrence}`}>{paragraph}</p>;
          })}
        </section>
        <div className={styles.changeActions}>
          <Button
            type="button"
            variant="brand-contact"
            onClick={() => termsDialog.current?.close()}
          >
            {copy.termsClose}
          </Button>
        </div>
      </dialog>
      {errors.terms && (
        <p id="booking-terms-error" className={styles.error}>
          {errors.terms}
        </p>
      )}
      <label className={styles.terms}>
        <input
          type="checkbox"
          checked={details.newsletterOptIn}
          onChange={(event) => update("newsletterOptIn", event.target.checked)}
        />
        <span>{copy.newsletterLabel}</span>
      </label>
      {formError && (
        <p role="alert" className={styles.formError}>
          {formError}
        </p>
      )}
      <div className={styles.flowActions}>
        <button
          type="button"
          className={styles.backAction}
          disabled={sending}
          onClick={onBack}
        >
          <ArrowLeft aria-hidden="true" /> Back to times
        </button>
        <Button
          type="submit"
          variant="brand-primary"
          className={styles.continueAction}
          disabled={sending}
        >
          {sending ? copy.sending : copy.action}
          <ArrowRight aria-hidden="true" />
        </Button>
      </div>
    </form>
  );
}
