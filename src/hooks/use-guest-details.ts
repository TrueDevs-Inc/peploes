"use client";

import { useCallback, useState, useTransition } from "react";

import { submitGuestDetails } from "@/actions/bookings";
import type {
  IBookingResponseError,
  IGuestDetailsSending,
  IHoldSummary,
  ITableBookingGuestDetails,
  TGuestDetailsView,
  TTableBookingDetailsErrors,
} from "@/lib/types";

const FIELD_FOR: Record<string, keyof ITableBookingGuestDetails> = {
  firstName: "firstName",
  surname: "surname",
  email: "email",
  mobileCountryCode: "countryCode",
  mobile: "phone",
  specialRequests: "requests",
  termsAccepted: "terms",
};

function fieldErrorsOf(
  error: IBookingResponseError,
): TTableBookingDetailsErrors {
  const errors: TTableBookingDetailsErrors = {};
  for (const [field, message] of Object.entries(error.fieldErrors ?? {})) {
    const target = FIELD_FOR[field];
    if (target && message) errors[target] = message;
  }
  return errors;
}

export function useGuestDetails(): IGuestDetailsSending {
  const [sending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<TTableBookingDetailsErrors>(
    {},
  );

  const send = useCallback(
    (
      details: ITableBookingGuestDetails,
      hold: IHoldSummary,
      onReply: (reply: TGuestDetailsView) => void,
    ) => {
      startTransition(async () => {
        setFormError(null);
        setFieldErrors({});
        const reply = await submitGuestDetails({
          holdReference: hold.reference,
          holdRevision: hold.revision,
          firstName: details.firstName,
          surname: details.surname,
          email: details.email,
          mobileCountryCode: details.countryCode,
          mobile: details.phone,
          specialRequests: details.requests,
          termsAccepted: details.terms,
        });
        if (reply.ok) {
          onReply(reply.data);
          return;
        }
        const errors = fieldErrorsOf(reply.error);
        setFieldErrors(errors);
        if (Object.keys(errors).length === 0) setFormError(reply.error.message);
      });
    },
    [],
  );

  return { sending, formError, fieldErrors, send };
}
