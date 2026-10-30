"use client";

import { useCallback, useState, useTransition } from "react";

import { submitGuestDetails } from "@/actions/bookings";
import {
  getSessionStorage,
  removeSessionStorage,
  setSessionStorage,
} from "@/helpers/storage";
import { BOOKING_BUDGET_MS } from "@/lib/constants/booking";
import { TABLE_BOOKING_CONTENT } from "@/lib/constants/table-booking";
import { ErrorCode } from "@/lib/enums";
import { tryCatch } from "@/lib/errors";
import type {
  IActiveHold,
  IBookingResponseError,
  IGuestDetailsAttempt,
  IGuestDetailsSending,
  IHoldSummary,
  ITableBookingGuestDetails,
  TBookingStatusCheck,
  TGuestDetailsView,
  TTableBookingDetailsErrors,
} from "@/lib/types";

const DETAILS_KEY = "peploes:booking-details";
const DETAILS_MARGIN_MS = 3000;
const DETAILS_SETTLED_MS = BOOKING_BUDGET_MS.guestTotal + DETAILS_MARGIN_MS;

interface ISavedDetails extends IGuestDetailsAttempt {
  timeOrigin: number;
}

export function forgetGuestDetails(): void {
  removeSessionStorage(DETAILS_KEY);
}

export function storedGuestDetails(): IGuestDetailsAttempt | null {
  const saved = getSessionStorage<ISavedDetails>(DETAILS_KEY);
  if (!saved) return null;
  return {
    startedAt: saved.startedAt,
    hold: {
      summary: saved.hold.summary,
      endsAt: saved.hold.endsAt + saved.timeOrigin - performance.timeOrigin,
    },
  };
}

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
  const [pendingFrom, setPendingFrom] = useState(0);

  const restore = useCallback((attempt: IGuestDetailsAttempt) => {
    setUnsure(attempt.hold.summary);
    setPendingFrom(attempt.startedAt + DETAILS_SETTLED_MS);
  }, []);

  const send = useCallback(
    (
      details: ITableBookingGuestDetails,
      active: IActiveHold,
      onReply: (reply: TGuestDetailsView) => void,
    ) => {
      const hold = active.summary;
      setSessionStorage(DETAILS_KEY, {
        hold: active,
        startedAt: Date.now(),
        timeOrigin: performance.timeOrigin,
      } satisfies ISavedDetails);
      setPendingFrom(0);
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
          forgetGuestDetails();
          return;
        }
        if (!reply || reply.error.code === ErrorCode.OutcomeUnknown) {
          setUnsure(hold);
          return;
        }
        forgetGuestDetails();
        const errors = fieldErrorsOf(reply.error);
        setFieldErrors(errors);
        if (Object.keys(errors).length === 0) setFormError(reply.error.message);
      });
    },
    [],
  );

  const settle = useCallback((check: TBookingStatusCheck) => {
    forgetGuestDetails();
    setUnsure(null);
    if (check.kind === "pending") {
      setFormError(TABLE_BOOKING_CONTENT.details.resend);
    }
  }, []);

  return {
    sending,
    formError,
    fieldErrors,
    unsure,
    pendingFrom,
    restore,
    send,
    settle,
  };
}
