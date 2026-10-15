"use client";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import styles from "@/components/app/compounds/table-booking-panel.module.css";
import { Button } from "@/components/ui/button";
import { TABLE_BOOKING_CONTENT } from "@/lib/constants/table-booking";
import type {
  ITableBookingDetailsProps,
  ITableBookingFieldProps,
  ITableBookingGuestDetails,
} from "@/lib/types";

function getDetailsErrors(details: ITableBookingGuestDetails) {
  const copy = TABLE_BOOKING_CONTENT.details;
  return {
    firstName: details.firstName.trim() ? "" : copy.nameError,
    surname: details.surname.trim() ? "" : copy.nameError,
    email: z.string().email().safeParse(details.email.trim()).success
      ? ""
      : copy.emailError,
    phone:
      /^[+\d\s()-]+$/.test(details.phone) &&
      details.phone.replace(/\D/g, "").length >= 7
        ? ""
        : copy.phoneError,
    terms: details.terms ? "" : copy.termsError,
  };
}
function BookingField({
  label,
  error,
  id,
  className,
  ...props
}: ITableBookingFieldProps) {
  const errorId = `${id}-error`;
  return (
    <label className={className}>
      <span>
        {label} <span className={styles.required}>*</span>
      </span>
      <input
        {...props}
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
      />
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
  onChange,
  onBack,
  onContinue,
}: ITableBookingDetailsProps) {
  const [attempted, setAttempted] = useState(false);
  const copy = TABLE_BOOKING_CONTENT.details;
  const fullName = details.surname
    ? `${details.firstName} ${details.surname}`
    : details.firstName;
  const invalid = getDetailsErrors(details);
  const errors: Partial<typeof invalid> = attempted ? invalid : {};
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
        <BookingField
          id="booking-phone"
          className={styles.phoneField}
          label={
            <>
              <span className={styles.desktopOnly}>Mobile number</span>
              <span className={styles.mobileOnly}>Telephone number</span>
            </>
          }
          type="tel"
          autoComplete="tel"
          value={details.phone}
          placeholder="e.g. 01 123 4567"
          error={errors.phone}
          onChange={(event) => update("phone", event.target.value)}
        />
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
            value={details.requests}
            placeholder="e.g. dietary requirements, occasion"
            onChange={(event) => update("requests", event.target.value)}
          />
        </label>
      </div>
      <label className={styles.terms}>
        <input
          type="checkbox"
          checked={details.terms}
          aria-invalid={!!errors.terms}
          aria-describedby={errors.terms ? "booking-terms-error" : undefined}
          onChange={(event) => update("terms", event.target.checked)}
        />
        <span>
          By confirming, you agree to{" "}
          <span className={styles.termsName}>
            Peploe’s Booking &amp; Cancellation Terms.
          </span>
        </span>
      </label>
      {errors.terms && (
        <p id="booking-terms-error" className={styles.error}>
          {errors.terms}
        </p>
      )}
      <div className={styles.flowActions}>
        <button type="button" className={styles.backAction} onClick={onBack}>
          <ArrowLeft aria-hidden="true" /> Back to times
        </button>
        <Button
          type="submit"
          variant="brand-primary"
          className={styles.continueAction}
        >
          {copy.action}
          <ArrowRight aria-hidden="true" />
        </Button>
      </div>
    </form>
  );
}
