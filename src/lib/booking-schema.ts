import { z } from "zod/v4";

import {
  BOOKING_GUEST_LIMITS,
  BOOKING_MESSAGES,
  BOOKING_PATTERNS,
} from "@/lib/constants/booking";
import { RESDIARY_PATTERNS } from "@/lib/constants/resdiary";
import { isCalendarDate, isClockTime } from "@/lib/dates";

const dateField = z
  .string({ error: BOOKING_MESSAGES.chooseDate })
  .refine(isCalendarDate, { error: BOOKING_MESSAGES.chooseDate });

function wholeNumberField(message?: string) {
  return z
    .union(
      [
        z.number(),
        z.string().regex(BOOKING_PATTERNS.digitsOnly).transform(Number),
      ],
      { error: message },
    )
    .pipe(z.number().int({ error: message }).positive({ error: message }));
}

const partySizeField = wholeNumberField(BOOKING_MESSAGES.chooseGuests);

export const timesQuerySchema = z.object({
  date: dateField,
  partySize: partySizeField,
});

export const calendarQuerySchema = z.object({
  from: dateField,
  to: dateField,
  partySize: partySizeField,
});

export const holdInputSchema = z.object({
  searchDate: dateField,
  time: z
    .string({ error: BOOKING_MESSAGES.chooseTime })
    .refine(isClockTime, { error: BOOKING_MESSAGES.chooseTime }),
  partySize: partySizeField,
  offer: z.object(
    { kind: z.literal("standard", { error: BOOKING_MESSAGES.chooseTime }) },
    { error: BOOKING_MESSAGES.chooseTime },
  ),
});

function nameField(message: string) {
  return z
    .string({ error: message })
    .trim()
    .min(1, { error: message })
    .max(BOOKING_GUEST_LIMITS.nameMaxLength, { error: message });
}

function countryCode(value: unknown): unknown {
  if (value === undefined) {
    return BOOKING_GUEST_LIMITS.defaultCountryCode;
  }
  if (typeof value !== "string") {
    return value;
  }
  const digits = value.trim().replace(BOOKING_PATTERNS.internationalPrefix, "");
  return BOOKING_PATTERNS.digitsOnly.test(digits) ? Number(digits) : Number.NaN;
}

function isMobileNumber(value: string): boolean {
  const digits = value.replace(BOOKING_PATTERNS.notDigits, "").length;
  return (
    BOOKING_PATTERNS.mobileCharacters.test(value) &&
    digits >= BOOKING_GUEST_LIMITS.mobileMinDigits &&
    digits <= BOOKING_GUEST_LIMITS.mobileMaxDigits
  );
}

export const pageHoldSchema = z.object({
  holdReference: z.string().regex(RESDIARY_PATTERNS.reference),
});

export const holdReferenceSchema = pageHoldSchema.extend({
  holdRevision: wholeNumberField(),
});

export const guestDetailsSchema = z.object({
  firstName: nameField(BOOKING_MESSAGES.enterFirstName),
  surname: nameField(BOOKING_MESSAGES.enterSurname),
  email: z
    .string({ error: BOOKING_MESSAGES.enterEmail })
    .trim()
    .max(BOOKING_GUEST_LIMITS.emailMaxLength, {
      error: BOOKING_MESSAGES.enterEmail,
      abort: true,
    })
    .pipe(z.email({ error: BOOKING_MESSAGES.enterEmail })),
  mobileCountryCode: z.preprocess(
    countryCode,
    z
      .number({ error: BOOKING_MESSAGES.chooseCountryCode })
      .int({ error: BOOKING_MESSAGES.chooseCountryCode })
      .min(1, { error: BOOKING_MESSAGES.chooseCountryCode })
      .max(BOOKING_GUEST_LIMITS.countryCodeMax, {
        error: BOOKING_MESSAGES.chooseCountryCode,
      }),
  ),
  mobile: z
    .string({ error: BOOKING_MESSAGES.enterMobile })
    .trim()
    .refine((value) => !BOOKING_PATTERNS.internationalPrefix.test(value), {
      error: BOOKING_MESSAGES.mobileWithoutCode,
      abort: true,
    })
    .refine(isMobileNumber, { error: BOOKING_MESSAGES.enterMobile })
    .transform((value) => value.replace(BOOKING_PATTERNS.notDigits, "")),
  specialRequests: z
    .string({ error: BOOKING_MESSAGES.requestsTooLong })
    .trim()
    .max(BOOKING_GUEST_LIMITS.requestsMaxLength, {
      error: BOOKING_MESSAGES.requestsTooLong,
    })
    .optional()
    .transform((value) => value || undefined),
  termsAccepted: z.literal(true, { error: BOOKING_MESSAGES.acceptTerms }),
});
