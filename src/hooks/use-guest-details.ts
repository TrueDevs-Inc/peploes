"use client";

import { useCallback, useState, useTransition } from "react";

import { submitGuestDetails } from "@/actions/bookings";
import { TABLE_BOOKING_CONTENT } from "@/lib/constants/table-booking";
import { ErrorCode } from "@/lib/enums";
import { tryCatch } from "@/lib/errors";
import type {
  IBookingResponseError,
  IGuestDetailsSending,
  IHoldSummary,
  ITableBookingGuestDetails,
  TBookingStatusCheck,
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
  const [unsure, setUnsure] = useState<IHoldSummary | null>(null);

  const send = useCallback(
    (
      details: ITableBookingGuestDetails,
      hold: IHoldSummary,
      onReply: (reply: TGuestDetailsView) => void,
    ) => {
      startTransition(async () => {
        setFormError(null);
        setFieldErrors({});
        const { data: reply } = await tryCatch(
          submitGuestDetails({
            holdReference: hold.reference,
            holdRevision: hold.revision,
            firstName: details.firstName,
            surname: details.surname,
            email: details.email,
            mobileCountryCode: details.countryCode,
            mobile: details.phone,
            specialRequests: details.requests,
            termsAccepted: details.terms,
          }),
        );
        if (reply?.ok) {
          onReply(reply.data);
          return;
        }
        if (!reply || reply.error.code === ErrorCode.OutcomeUnknown) {
          setUnsure(hold);
          return;
        }
        const errors = fieldErrorsOf(reply.error);
        setFieldErrors(errors);
        if (Object.keys(errors).length === 0) setFormError(reply.error.message);
      });
    },
    [],
  );

  const settle = useCallback((check: TBookingStatusCheck) => {
    setUnsure(null);
    if (check.kind === "pending") {
      setFormError(TABLE_BOOKING_CONTENT.details.resend);
    }
  }, []);

  return { sending, formError, fieldErrors, unsure, send, settle };
}
