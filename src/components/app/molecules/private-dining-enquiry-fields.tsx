"use client";

import { ArrowRight, Calendar, ChevronDown } from "lucide-react";
import Link from "next/link";

import styles from "@/components/app/compounds/private-dining.module.css";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { PRIVATE_DINING_FORM } from "@/lib/constants/private-dining";
import type { IPrivateDiningEnquiryProps } from "@/lib/types";

export function PrivateDiningEnquiryFields({
  content,
}: IPrivateDiningEnquiryProps) {
  return (
    <form
      className={styles.enquiryFields}
      aria-label={content.formEyebrow ?? content.eyebrow}
      onSubmit={(event) => event.preventDefault()}
    >
      {content.occasions && (
        <div className={styles.selectField}>
          <select
            name="occasion"
            className={styles.enquirySelect}
            aria-label={content.occasionLabel}
            defaultValue=""
            required
          >
            <option value="" disabled hidden>
              {content.occasionLabel}
            </option>
            {content.occasions.map((occasion) => (
              <option key={occasion} value={occasion}>
                {occasion}
              </option>
            ))}
          </select>
          <ChevronDown aria-hidden="true" className={styles.selectIcon} />
        </div>
      )}
      <div className={styles.fieldRow}>
        <label className={styles.dateField}>
          <input
            name="date"
            aria-label={PRIVATE_DINING_FORM.date}
            type="date"
            onClick={(event) => event.currentTarget.showPicker?.()}
            required
          />
          <span aria-hidden="true">{PRIVATE_DINING_FORM.date}</span>
          <Calendar aria-hidden="true" className={styles.dateIcon} />
        </label>
        <div className={styles.selectField}>
          <select
            name="guests"
            className={styles.enquirySelect}
            required
            aria-label={PRIVATE_DINING_FORM.guests}
            defaultValue=""
          >
            <option value="" disabled hidden>
              {PRIVATE_DINING_FORM.guests}
            </option>
            {PRIVATE_DINING_FORM.guestCounts.map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
          <ChevronDown aria-hidden="true" className={styles.selectIcon} />
        </div>
      </div>
      <div className={content.company ? styles.fieldRow : undefined}>
        <input
          name="name"
          autoComplete="name"
          required
          aria-label={PRIVATE_DINING_FORM.name}
          placeholder={PRIVATE_DINING_FORM.name}
        />
        {content.company && (
          <input
            name="company"
            autoComplete="organization"
            aria-label={PRIVATE_DINING_FORM.company}
            placeholder={PRIVATE_DINING_FORM.company}
          />
        )}
      </div>
      <input
        name="email"
        type="email"
        autoComplete="email"
        required
        aria-label={PRIVATE_DINING_FORM.email}
        placeholder={PRIVATE_DINING_FORM.email}
      />
      <textarea
        name="message"
        required
        aria-label={content.messageLabel}
        placeholder={content.messageLabel}
        rows={3}
      />
      {content.consent && (
        <label className={styles.consent}>
          <input type="checkbox" name="consent" required />
          <span>
            {PRIVATE_DINING_FORM.consent.beforePolicy}
            <Link
              href={ROUTES.PRIVACY_COOKIES}
              className={styles.consentPolicy}
            >
              {PRIVATE_DINING_FORM.consent.policy}
            </Link>
            {PRIVATE_DINING_FORM.consent.afterPolicy}
          </span>
        </label>
      )}
      <Button
        type="submit"
        variant="brand-primary"
        disabled
        aria-describedby="enquiry-unavailable"
        title={PRIVATE_DINING_FORM.unavailable}
        className={styles.sendButton}
      >
        {PRIVATE_DINING_FORM.submit}
        <ArrowRight aria-hidden="true" className="size-4" />
      </Button>
      <p id="enquiry-unavailable" className="sr-only">
        {PRIVATE_DINING_FORM.unavailable}
      </p>
    </form>
  );
}
