import { HTTP_STATUS, RESTAURANT_CONTACT } from "@/lib/constants";

export const BOOKING_BUDGET_MS = {
  findTable: 8000,
  calendar: 8000,
  times: 8000,
  holdStatus: 3000,
  holdCheck: 5000,
  holdCreate: 5000,
  holdChange: 5000,
  holdRecovery: 2500,
  guestSend: 9000,
  guestStatus: 3000,
  guestResendMin: 3000,
  guestTotal: 15_000,
} as const;

export const BOOKING_LOST_REPLY_STATUSES: ReadonlySet<number> = new Set([
  HTTP_STATUS.BAD_GATEWAY,
  HTTP_STATUS.SERVICE_UNAVAILABLE,
  HTTP_STATUS.GATEWAY_TIMEOUT,
]);

export const BOOKING_HOLD = {
  tokenVersion: 2,
  reuseMinRemainingMs: 30_000,
  moveMinRemainingMs: 60_000,
  maxMovesPerHold: 20,
  cookieGraceMs: 15 * 60_000,
  submitMinRemainingMs: 5000,
} as const;

export const BOOKING_GUEST_LIMITS = {
  nameMaxLength: 100,
  emailMaxLength: 254,
  mobileMinDigits: 6,
  mobileMaxDigits: 15,
  requestsMaxLength: 1000,
  countryCodeMax: 999,
  defaultCountryCode: 353,
} as const;

export const BOOKING_CALENDAR_MAX_DAYS = 42;

export const BOOKING_DEFAULT_DATE_SEARCH_DAYS = 31;

export const BOOKING_MESSAGES = {
  unavailable: `Online booking isn't available right now. Please call us on ${RESTAURANT_CONTACT.phoneLabel} or email ${RESTAURANT_CONTACT.email}.`,
  tooManyHolds: `You've held several tables in the last few minutes. Please wait a few minutes or call us on ${RESTAURANT_CONTACT.phoneLabel}.`,
  termsMissing: `For our booking terms, please call us on ${RESTAURANT_CONTACT.phoneLabel} or email ${RESTAURANT_CONTACT.email}.`,
  chooseDate: "Choose a date.",
  chooseGuests: "Choose the number of guests.",
  chooseTime: "Choose a time.",
  closedDay: "We're closed that day.",
  timeGone: "That time is no longer available. Please choose another.",
  holdUnclear: "We couldn't confirm your table hold. Please try again.",
  holdMissing: "We couldn't find your table hold. Please choose a time again.",
  holdExpired: "Your table hold ran out. Please choose a time again.",
  otherTab: "Your booking changed in another tab. Please start again here.",
  guestBlocked: "Please contact us to make this booking.",
  checkDetails: "Please check your details.",
  stillConfirming: `We're still confirming your booking. You'll get an email when it's confirmed. If nothing arrives within a few minutes, please call us on ${RESTAURANT_CONTACT.phoneLabel}.`,
  enterFirstName: "Please enter your name.",
  enterSurname: "Please enter your surname.",
  enterEmail: "Please enter a valid email address.",
  chooseCountryCode: "Choose a country code.",
  enterMobile: "Please enter a valid mobile number.",
  mobileWithoutCode: "Enter the number without the country code.",
  requestsTooLong: "Please keep requests under 1,000 characters.",
  acceptTerms: "Please accept the booking terms.",
  alreadyBooked: (reference: string) =>
    `You've already booked this table. Your booking reference is ${reference}.`,
  pastDate: "Choose today or a later date.",
  tooFarAhead: (lastDateLabel: string) =>
    `Online booking is open up to ${lastDateLabel}.`,
  tooFewGuests: (min: number) => `Online bookings start at ${min} guests.`,
  tooManyGuests: (max: number) =>
    `For more than ${max} guests, please call or email us.`,
} as const;

export const BOOKING_NEXT_DAY_LABEL = " (next day)";

export const BOOKING_LOG = {
  closedDatesFailed: "Booking calendar shown without closed days",
  impossiblePartyLimits: "ResDiary's party limits cannot work",
  everyWeekdayClosed: "ResDiary closes every weekday",
  unexpected: "Booking failed unexpectedly",
  searchRejected: "ResDiary refused a search the booking checks allowed",
  rangeUnchecked: "ResDiary left part of a date range unchecked",
  skippedTimes: "Booking skipped times ResDiary sent",
  holdRejected: "ResDiary refused a hold the booking checks allowed",
  holdMoveMissing: "ResDiary could not find the hold to move",
  badHoldToken: "Booking ignored an unreadable hold token",
  formUnsupported:
    "ResDiary's settings need something the booking form cannot give",
  guestRejected: "ResDiary refused guest details without naming a field",
  guestHoldMissing: "ResDiary could not find the hold for guest details",
  paymentUnsupported: "ResDiary asked for a payment the site cannot take",
  guestOutcomeUnknown: "Unclear whether the booking was made",
  holdLimitOff: "Booking holds are not rate-limited: Upstash is not configured",
  holdLimited: "Booking refused a hold over the visitor limit",
  holdLimitUnchecked:
    "Booking allowed a hold without checking the visitor limit",
} as const;

export const BOOKING_DATE_FIELDS: ReadonlySet<string> = new Set([
  "searchDate",
  "from",
  "to",
]);

export const BOOKING_PATTERNS = {
  internationalPrefix: /^(\+|00)/,
  mobileCharacters: /^[\d\s()-]+$/,
  notDigits: /\D/g,
  digitsOnly: /^\d+$/,
} as const;

export const BOOKING_TRUNK_PREFIX = "0";

export const BOOKING_TOKEN_FORMAT = {
  algorithm: "sha256",
  encoding: "base64url",
  payloadEncoding: "utf8",
  separator: ".",
} as const;

export const BOOKING_SKIP_REASONS = {
  date: "date",
  returnTime: "returnTime",
} as const;

export const BOOKING_UNSUPPORTED_SETTINGS = {
  membership: "membershipId",
  customField: "customField",
  stripeTestKey: "stripeTestKey",
} as const;

export const BOOKING_HOLD_LIMITS = {
  windows: [
    { name: "5m", holds: 5, window: "5 m" },
    { name: "10m", holds: 10, window: "10 m" },
  ],
  timeoutMs: 1000,
  redisRetries: 1,
  keyPrefix: "peploes:holds",
  visitorHeader: "x-forwarded-for",
  upstashTimedOut: "timeout",
  noVisitorIp: "no_visitor_ip",
} as const;

export const BOOKING_HOLD_COOKIE = {
  name: "peploes_booking_hold",
  sameSite: "lax",
  path: "/",
} as const;
