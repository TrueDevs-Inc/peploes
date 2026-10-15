import { DURATION, HTTP_STATUS } from "@/lib/constants";
import type {
  IResDiaryBooking,
  IResDiaryHoldStatus,
  IResDiaryRules,
  TResDiaryFailure,
  TResDiaryOperation,
} from "@/lib/types";

// Values the ResDiary provider (src/lib/resdiary-provider.ts) works with.
// Values marked "sandbox" were verified against ResDiary's sandbox on 15 October 2026.

// ─── Paths ────────────────────────────────────────────────────────────────

export const RESDIARY_PATHS = {
  signIn: "/api/Jwt/v2/Authenticate",
  restaurant: "/api/ConsumerApi/v1/Restaurant",
  /** The one endpoint without the ConsumerApi/v1 prefix (sandbox-verified). */
  guestDetailsRestaurant: "/api/Restaurant",
} as const;

export const RESDIARY_ENDPOINTS = {
  setup: "Setup",
  dateRange: "AvailabilityForDateRangeV2",
  timeSearch: "AvailabilitySearch",
  createHold: "CreateTableHold",
  guestDetails: "UpdateTableHoldWithCustomer",
  holdStatus: "TableHoldBookingStatus",
  booking: "Booking",
  guestSignIn: "AuthenticateV2",
  cancel: "Cancel",
  cancellationReasons: "CancellationReasons",
} as const;

export const RESDIARY_QUERY = {
  date: "date",
  channelCode: "channelCode",
  onlyEnabledReasons: "onlyEnabledReasons",
  authenticationToken: "authenticationToken",
  cancellationReasonId: "cancellationReasonId",
} as const;

export const RESDIARY_AVAILABILITY_TYPE = "Reservation";
export const RESDIARY_REASONS_CACHE_KEY = "all";

export const RESDIARY_HEADERS = {
  accept: "accept",
  contentType: "content-type",
  authorization: "authorization",
  date: "date",
  retryAfter: "retry-after",
  bearerPrefix: "Bearer ",
} as const;

// ─── Time ─────────────────────────────────────────────────────────────────

export const RESDIARY_TIMING = {
  /** Default wait per operation, sign-in included. */
  budgetMs: 8000,
  /** A cancel reads the booking back afterwards, so it gets longer. */
  cancelBudgetMs: 15_000,
  signInTimeoutMs: 10_000,
  readAttemptMs: 4000,
  /** An attempt that would start with less time left than this is not started. */
  minAttemptMs: 250,
  readRetryDelaysMs: [250, 500],
  tokenRenewMarginMs: DURATION.FIVE_MINUTES_MS,
  /** How long a token with an unusable expiry is kept. */
  tokenFallbackMs: DURATION.ONE_MINUTE_MS,
  /** How long sign-in stops after ResDiary refuses the account. */
  signInPauseMs: DURATION.ONE_MINUTE_MS,
  cacheTtlMs: DURATION.FIVE_MINUTES_MS,
  /** A hold lasts 5 minutes in the sandbox; more than 15 is not a real expiry. */
  maxHoldMs: DURATION.FIFTEEN_MINUTES_MS,
  /** ResDiary's Date header has 1-second resolution. */
  dateHeaderMarginMs: 1000,
  /** When to read a booking back after a cancel; a 204 once changed nothing (sandbox, BQZ9X967). */
  cancelCheckDelaysMs: [500, 1500],
  msPerSecond: 1000,
} as const;

// ─── Limits ───────────────────────────────────────────────────────────────

export const RESDIARY_LIMITS = {
  minPartySize: 1,
  maxRangeDays: 120,
  cacheMaxEntries: 100,
  cancelRounds: 2,
  centsPerEuro: 100,
  /** Length of YYYY-MM-DD, the date part of ResDiary's longer date strings. */
  isoDateLength: 10,
  loggedValueMaxLength: 40,
  loggedIssuesMax: 10,
  /** Digits of a fraction of a second that JavaScript dates keep. */
  millisecondDigits: 3,
  /** Last status of the 2xx success range. */
  lastSuccessStatus: 299,
} as const;

export const RESDIARY_REQUEST_ID = {
  /** Ids look like `<number>_<guid>_<API account email>`. */
  separator: "_",
  /** The email may contain underscores, so only the first two parts are kept. */
  keptParts: 2,
  /** Any kept part still holding this is an email and is dropped. */
  emailMarker: "@",
} as const;

// ─── Formats ──────────────────────────────────────────────────────────────

export const RESDIARY_PATTERNS = {
  date: /^\d{4}-\d{2}-\d{2}$/,
  time: /^([01]\d|2[0-3]):[0-5]\d$/,
  reference: /^[A-Za-z0-9-]{1,40}$/,
  /** ResDiary dates: 2026-10-23, 2026-10-23T00:00:00 or 2026-10-23T00:00:00.0000000. */
  wireDate: /^\d{4}-\d{2}-\d{2}(?:T00:00:00(?:\.0+)?)?$/,
  /** A .NET TimeSpan: 19:30, 19:30:00, or 1.00:30:00 for 00:30 the next day. */
  wireClock: /^(?:(\d+)\.)?(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/,
  wireDateTime: /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::\d{2}(?:\.\d+)?)?$/,
  /** Up to seven fractional digits, and sometimes no zone, which means UTC. */
  wireInstant:
    /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d+))?(Z|[+-]\d{2}:\d{2})?$/,
  retryAfterSeconds: /^\d+$/,
  trailingSlashes: /\/+$/,
} as const;

export const RESDIARY_UTC_ZONE = "Z";

export const RESDIARY_TIME_SUFFIX = {
  /** Turns YYYY-MM-DD into ResDiary's local midnight, 2026-10-23T00:00:00. */
  midnight: "T00:00:00",
  /** Turns HH:mm into ResDiary's HH:mm:ss. */
  seconds: ":00",
} as const;
export const RESDIARY_URL_FIELD_TYPE = "url";

// ─── ResDiary statuses ────────────────────────────────────────────────────

export const RESDIARY_SIGN_IN_SUCCESS = "Success";

export const RESDIARY_GUEST_STATUS = {
  success: "Success",
  paymentRequired: "PaymentRequired",
  cardRequired: "CreditCardRequired",
  tableConflict: "TableConflict",
  customerBlocked: "CustomerBlocked",
} as const;

export const RESDIARY_HOLD_STATUSES = new Map<
  string,
  IResDiaryHoldStatus["status"]
>([
  ["Pending", "pending"],
  ["Confirmed", "confirmed"],
  ["Failed", "failed"],
  ["Cancelled", "cancelled"],
]);

export const RESDIARY_BOOKING_STATUSES = new Map<
  string,
  IResDiaryBooking["status"]
>([
  ["Booked", "booked"],
  ["Cancelled", "cancelled"],
]);

export const RESDIARY_PAYMENT_PROVIDERS = new Map<
  string,
  NonNullable<IResDiaryRules["paymentProvider"]>
>([
  ["Stripe", "stripe"],
  ["GuestPay", "guestpay"],
]);

/** Cancel replies that mean ResDiary did not apply it; a 5xx may have applied. */
export const RESDIARY_REFUSED_CANCEL_STATUSES = new Set<number>([
  HTTP_STATUS.BAD_REQUEST,
  HTTP_STATUS.UNAUTHORIZED,
  HTTP_STATUS.NOT_FOUND,
  HTTP_STATUS.TOO_MANY_REQUESTS,
]);

/** Guest sign-in replies that mean "wrong email or unknown reference". */
export const RESDIARY_REFUSED_GUEST_STATUSES = new Set<number>([
  HTTP_STATUS.BAD_REQUEST,
  HTTP_STATUS.UNAUTHORIZED,
  HTTP_STATUS.FORBIDDEN,
  HTTP_STATUS.NOT_FOUND,
]);

// ─── Operations and failures ──────────────────────────────────────────────

/** A write may reach ResDiary before an unexpected error, so its outcome is unknown. */
export const RESDIARY_WRITE_OPERATIONS = new Set<TResDiaryOperation>([
  "createHold",
  "submitHoldGuest",
  "cancelBooking",
]);

/** Failures a caller expects (refused input, a wrong email); logged as warnings. */
export const RESDIARY_EXPECTED_FAILURES = new Set<TResDiaryFailure["kind"]>([
  "rejected",
  "not_found",
  "not_allowed",
]);

/** Short, safe words for the `detail` of a failure. */
export const RESDIARY_DETAILS = {
  timeout: "timeout",
  deadline: "deadline",
  unknown: "unknown",
  signInPaused: "sign-in paused",
  signInTimeout: "sign-in timeout",
  signInUnreadable: "sign-in unreadable",
  signInRefused: "sign-in refused",
  noReference: "no reference",
  unreadableExpiry: "unreadable expiry",
  unusableExpiry: "unusable expiry",
  /** Names the whole reply when a zod issue has no path. */
  root: "(root)",
} as const;

/** Lost requests that are not retried, because no time is left. */
export const RESDIARY_NO_RETRY_DETAILS = new Set<string>([
  RESDIARY_DETAILS.timeout,
  RESDIARY_DETAILS.deadline,
]);

export const RESDIARY_LOG = {
  provider: "resdiary",
  refused: "ResDiary request refused",
  failed: "ResDiary request failed",
  tokenExpiryUnusable: "ResDiary token expiry unusable",
  unknownHoldStatus: "ResDiary sent an unknown hold status",
} as const;
