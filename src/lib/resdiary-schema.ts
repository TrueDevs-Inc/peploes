// biome-ignore-all lint/style/useNamingConvention: ResDiary's API uses PascalCase field names.
import { z } from "zod/v4";

import {
  RESDIARY_AVAILABILITY_TYPE,
  RESDIARY_LIMITS,
  RESDIARY_PATTERNS,
  RESDIARY_TIME_SUFFIX,
} from "@/lib/constants/resdiary";
import { isCalendarDate } from "@/lib/dates";
import type {
  IResDiaryChangeHoldInput,
  IResDiaryConfig,
  IResDiaryDateRangeInput,
  IResDiaryGuestInput,
  IResDiaryHoldInput,
  IResDiaryTimeSearchInput,
} from "@/lib/types";

function wireDateField(pattern: RegExp) {
  return z
    .string()
    .regex(pattern)
    .refine((value) =>
      isCalendarDate(value.slice(0, RESDIARY_LIMITS.isoDateLength)),
    );
}

export const signInReplySchema = z.object({
  Status: z.string().nullish(),
  Token: z.string().nullish(),
  TokenExpiryUtc: z.string().nullish(),
});

export const errorReplySchema = z.object({
  ValidationErrors: z
    .array(z.object({ PropertyName: z.string().nullish() }))
    .nullish(),
  ApiRequestId: z.string().nullish(),
});

export const setupReplySchema = z.object({
  MinOnlinePartySize: z.number().int().nullish(),
  MaxOnlinePartySize: z.number().int(),
  OnlinePartySizeDefault: z.number().int().nullish(),
  AcceptBookingsDaysInAdvance: z.number().int().nullish(),
  Services: z
    .array(
      z.object({
        ServiceId: z.number().int(),
        Name: z.string(),
        TimeFrom: z.string().nullish(),
      }),
    )
    .nullish(),
  CurrencyCode: z.string(),
  TermsAndConditions: z.string().nullish(),
  PrivacyPolicy: z.string().nullish(),
  NoAvailabilityText: z.string().nullish(),
  DisplayPhoneNumberWhenNoAvailability: z.boolean().nullish(),
  ReservationPhoneNumber: z.string().nullish(),
  IsMembershipIdEnabled: z.boolean().nullish(),
  IsMembershipIdRequired: z.boolean().nullish(),
  MembershipIdTitle: z.string().nullish(),
  CustomField: z
    .object({
      Name: z.string().nullish(),
      IsRequired: z.boolean().nullish(),
      Type: z.string().nullish(),
    })
    .nullish(),
  StripeInfo: z
    .object({
      StripePublishableKey: z.string().nullish(),
      StripeAccountId: z.string().nullish(),
      UseLiveToken: z.boolean().nullish(),
      IsEnabled: z.boolean().nullish(),
    })
    .nullish(),
  PaymentProvider: z.string().nullish(),
});

export const dateRangeReplySchema = z.object({
  AvailableDates: z
    .array(
      z.object({
        Date: wireDateField(RESDIARY_PATTERNS.wireDate),
        AvailableTimes: z
          .array(
            z.object({
              TimeSlot: z.string().regex(RESDIARY_PATTERNS.wireClock),
            }),
          )
          .nullish(),
      }),
    )
    .nullish(),
  MissingDatesStart: wireDateField(RESDIARY_PATTERNS.wireDate).nullish(),
  MissingDatesEnd: wireDateField(RESDIARY_PATTERNS.wireDate).nullish(),
});

export const timeSlotReplySchema = z.object({
  TimeSlot: wireDateField(RESDIARY_PATTERNS.wireDateTime),
  ServiceId: z.number().int(),
  HasStandardAvailability: z.boolean(),
  StandardAvailabilityFeeAmount: z.number().nullish(),
  IsLeaveTimeRequired: z.boolean().nullish(),
  LeaveTime: z.string().regex(RESDIARY_PATTERNS.wireClock).nullish(),
});

export const timeSearchReplySchema = z.object({
  StandardAvailabilityMayRequireCreditCard: z.boolean().nullish(),
  TimeSlots: z.array(z.unknown()).nullish(),
});

export const closedDatesReplySchema = z.object({
  ClosedDays: z.array(z.string()).nullish(),
  ClosedPeriods: z.array(z.unknown()).nullish(),
});

export const closedPeriodReplySchema = z.object({
  StartDate: wireDateField(RESDIARY_PATTERNS.wireDate),
  EndDate: wireDateField(RESDIARY_PATTERNS.wireDate),
});

export const holdReplySchema = z.object({
  BookingId: z.number().int(),
  BookingReference: z.string().regex(RESDIARY_PATTERNS.reference),
  ExpiryTimestamp: z.string().nullish(),
});

export const changeHoldReplySchema = holdReplySchema.pick({
  ExpiryTimestamp: true,
});

export const guestReplySchema = z.object({
  Status: z.string(),
  Booking: z.object({ Reference: z.string().nullish() }).nullish(),
  PaymentAmount: z.number().nullish(),
  FormattedPaymentAmount: z.string().nullish(),
  StripePublishableKey: z.string().nullish(),
  StripeAccountId: z.string().nullish(),
  PaymentIntentSecret: z.string().nullish(),
  SetupIntentClientSecret: z.string().nullish(),
  GuestPayHostedPageUrl: z.string().nullish(),
});

export const holdStatusReplySchema = z.object({
  Status: z.string(),
  Booking: z.object({ Reference: z.string().nullish() }).nullish(),
});

export function signInBody(config: IResDiaryConfig) {
  return { Username: config.username, Password: config.password };
}

export function dateRangeBody(
  config: IResDiaryConfig,
  input: IResDiaryDateRangeInput,
) {
  return {
    DateFrom: `${input.from}${RESDIARY_TIME_SUFFIX.midnight}`,
    DateTo: `${input.to}${RESDIARY_TIME_SUFFIX.midnight}`,
    PartySize: input.partySize,
    ChannelCode: config.channelCode,
    AvailabilityType: RESDIARY_AVAILABILITY_TYPE,
  };
}

export function timeSearchBody(
  config: IResDiaryConfig,
  input: IResDiaryTimeSearchInput,
) {
  return {
    VisitDate: input.date,
    PartySize: input.partySize,
    ChannelCode: config.channelCode,
    AvailabilityType: RESDIARY_AVAILABILITY_TYPE,
  };
}

export function holdBody(config: IResDiaryConfig, input: IResDiaryHoldInput) {
  return {
    VisitDate: input.date,
    VisitTime: `${input.time}${RESDIARY_TIME_SUFFIX.seconds}`,
    PartySize: input.partySize,
    ChannelCode: config.channelCode,
  };
}

export function changeHoldBody(
  config: IResDiaryConfig,
  input: IResDiaryChangeHoldInput,
) {
  return { BookingId: input.holdId, ...holdBody(config, input) };
}

export function guestBody(input: IResDiaryGuestInput) {
  const { guest } = input;
  return {
    BookingId: input.holdId,
    Customer: {
      FirstName: guest.firstName,
      Surname: guest.surname,
      Email: guest.email,
      ...(guest.mobile ? { Mobile: guest.mobile } : {}),
      ...(guest.mobile && guest.mobileCountryCode
        ? { MobileCountryCode: guest.mobileCountryCode }
        : {}),
    },
    ...(input.specialRequests
      ? { SpecialRequests: input.specialRequests }
      : {}),
    RedirectUrl: input.returnUrl,
    CancelUrl: input.cancelUrl,
  };
}
