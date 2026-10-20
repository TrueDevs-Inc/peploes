import "server-only";

import { err, ok, type Result } from "neverthrow";

import { guestDetailsSchema, holdReferenceSchema } from "@/lib/booking-schema";
import { readHold, signHold } from "@/lib/booking-token";
import { ROUTES } from "@/lib/constants";
import {
  BOOKING_BUDGET_MS,
  BOOKING_HOLD,
  BOOKING_LOG,
  BOOKING_TRUNK_PREFIX,
  BOOKING_UNSUPPORTED_SETTINGS,
} from "@/lib/constants/booking";
import { LogContext } from "@/lib/enums";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import type {
  IBookingError,
  IBookingGuestContext,
  IHoldCookie,
  IResDiaryGuestInput,
  IResDiaryRules,
  TBookingProvider,
  TBookingResult,
  TGuestDetails,
  TGuestDetailsResult,
  TGuestDetailsView,
  THoldToken,
  TResDiaryFailure,
  TResDiaryGuestOutcome,
  TUnsupportedSetting,
} from "@/lib/types";
import {
  checkDetails,
  guestBlocked,
  holdExpired,
  holdMissing,
  invalidInput,
  otherTab,
  stillConfirming,
  timeGone,
  unavailable,
} from "@/services/bookings/errors";
import {
  cookieMaxAgeSeconds,
  holdSummary,
} from "@/services/bookings/hold-table";

function withoutTrunkZero(mobile: string): string {
  return mobile.startsWith(BOOKING_TRUNK_PREFIX)
    ? mobile.slice(BOOKING_TRUNK_PREFIX.length)
    : mobile;
}

function guestInput(
  hold: THoldToken,
  details: TGuestDetails,
): IResDiaryGuestInput {
  const pageUrl = new URL(ROUTES.BOOK_A_TABLE, env.NEXT_PUBLIC_SITE_URL).href;
  return {
    holdId: hold.holdId,
    guest: {
      firstName: details.firstName,
      surname: details.surname,
      email: details.email,
      mobile: withoutTrunkZero(details.mobile),
      mobileCountryCode: details.mobileCountryCode,
    },
    specialRequests: details.specialRequests,
    returnUrl: pageUrl,
    cancelUrl: pageUrl,
  };
}

function unsupportedSetting(
  rules: IResDiaryRules,
  liveSite: boolean,
): TUnsupportedSetting | null {
  if (rules.membership?.required) {
    return BOOKING_UNSUPPORTED_SETTINGS.membership;
  }
  if (rules.customField?.required) {
    return BOOKING_UNSUPPORTED_SETTINGS.customField;
  }
  if (liveSite && rules.stripe && !rules.stripe.live) {
    return BOOKING_UNSUPPORTED_SETTINGS.stripeTestKey;
  }
  return null;
}

function fromOutcome(
  outcome: TResDiaryGuestOutcome,
  hold: THoldToken,
): Result<TGuestDetailsView, IBookingError> {
  const summary = holdSummary(hold);
  switch (outcome.kind) {
    case "confirmed":
      return ok({ kind: "confirmed", reference: outcome.reference, summary });
    case "payment":
    case "card":
      return ok({ ...outcome, summary });
    case "table_taken":
      return err({ ...timeGone(), clearHold: true });
    case "guest_blocked":
      return err(guestBlocked());
  }
}

function fromFailure(failure: TResDiaryFailure): IBookingError {
  if (failure.kind === "rejected" && failure.fields.length > 0) {
    return checkDetails();
  }
  if (failure.kind === "not_found") {
    return holdExpired();
  }
  return unavailable();
}

async function afterUnclearReply(
  provider: TBookingProvider,
  hold: THoldToken,
  input: IResDiaryGuestInput,
  startedAt: number,
): TBookingResult<TGuestDetailsView> {
  const status = await provider.getHoldStatus(hold.holdId, {
    deadlineAt: Date.now() + BOOKING_BUDGET_MS.guestStatus,
  });
  const state = status.isOk() ? status.value.status : null;
  if (state === "confirmed") {
    return ok({
      kind: "confirmed",
      reference: hold.reference,
      summary: holdSummary(hold),
    });
  }
  if (state === "failed" || state === "cancelled") {
    return err(holdExpired());
  }
  const now = Date.now();
  const deadlineAt = startedAt + BOOKING_BUDGET_MS.guestTotal;
  if (
    state === "pending" &&
    hold.expiresAt - now >= BOOKING_HOLD.submitMinRemainingMs &&
    deadlineAt - now >= BOOKING_BUDGET_MS.guestResendMin
  ) {
    const again = await provider.submitHoldGuest(input, { deadlineAt });
    if (again.isOk()) {
      return fromOutcome(again.value, hold);
    }
    if (again.error.kind !== "outcome_unknown") {
      return err(fromFailure(again.error));
    }
  }
  logger.error(LogContext.Api, BOOKING_LOG.guestOutcomeUnknown, {
    reference: hold.reference,
  });
  return err(stillConfirming());
}

async function sendDetails(
  provider: TBookingProvider,
  hold: THoldToken,
  guest: IResDiaryGuestInput,
  startedAt: number,
  sendBy: number,
): TBookingResult<TGuestDetailsView> {
  const reply = await provider.submitHoldGuest(guest, { deadlineAt: sendBy });
  if (reply.isOk()) {
    return fromOutcome(reply.value, hold);
  }
  if (reply.error.kind === "outcome_unknown") {
    return afterUnclearReply(provider, hold, guest, startedAt);
  }
  return err(fromFailure(reply.error));
}

function markDetailsSent(
  sent: Result<TGuestDetailsView, IBookingError>,
  hold: THoldToken,
  secret: string,
): Result<TGuestDetailsResult, IBookingError> {
  const holdCookie = (): IHoldCookie => ({
    token: signHold({ ...hold, detailsSent: true }, secret),
    maxAgeSeconds: cookieMaxAgeSeconds(hold, Date.now()),
  });
  if (sent.isErr()) {
    return err(
      sent.error.clearHold
        ? sent.error
        : { ...sent.error, holdCookie: holdCookie() },
    );
  }
  const view = sent.value;
  return ok(
    view.kind === "confirmed" ? view : { ...view, holdCookie: holdCookie() },
  );
}

export async function submitGuestDetails(
  context: IBookingGuestContext,
  input: unknown,
  holdToken: string | undefined,
): TBookingResult<TGuestDetailsResult> {
  const { provider, secret, liveSite } = context;
  const startedAt = Date.now();
  const hold = holdToken ? readHold(holdToken, secret) : null;
  if (!hold) {
    return err(holdMissing());
  }
  const form = holdReferenceSchema.safeParse(input);
  if (
    !form.success ||
    form.data.holdReference !== hold.reference ||
    form.data.holdRevision !== hold.rev
  ) {
    return err(otherTab());
  }
  if (hold.expiresAt - startedAt <= BOOKING_HOLD.submitMinRemainingMs) {
    return err(holdExpired());
  }
  const details = guestDetailsSchema.safeParse(input);
  if (!details.success) {
    return err(invalidInput(details.error));
  }

  const sendBy = startedAt + BOOKING_BUDGET_MS.guestSend;
  const rules = await provider.getRules(hold.searchDate, {
    deadlineAt: sendBy,
  });
  if (rules.isErr()) {
    return err(unavailable());
  }
  const setting = unsupportedSetting(rules.value, liveSite);
  if (setting) {
    logger.error(LogContext.Api, BOOKING_LOG.formUnsupported, { setting });
    return err(unavailable());
  }

  const guest = guestInput(hold, details.data);
  const sent = await sendDetails(provider, hold, guest, startedAt, sendBy);
  return markDetailsSent(sent, hold, secret);
}
