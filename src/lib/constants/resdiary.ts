import { DURATION } from "@/lib/constants";
import type {
  IResDiaryHoldStatus,
  IResDiaryRules,
  TResDiaryOperation,
} from "@/lib/types";

export const RESDIARY_PATHS = {
  signIn: "/api/Jwt/v2/Authenticate",
  restaurant: "/api/ConsumerApi/v1/Restaurant",
  guestDetailsRestaurant: "/api/Restaurant",
} as const;

export const RESDIARY_ENDPOINTS = {
  setup: "Setup",
  dateRange: "AvailabilityForDateRangeV2",
  timeSearch: "AvailabilitySearch",
  createHold: "CreateTableHold",
  changeHold: "UpdateTableHoldBookingDetails",
  guestDetails: "UpdateTableHoldWithCustomer",
  holdStatus: "TableHoldBookingStatus",
  closedDates: "ClosedDates",
} as const;

export const RESDIARY_QUERY = {
  date: "date",
  channelCode: "channelCode",
} as const;

export const RESDIARY_AVAILABILITY_TYPE = "Reservation";
export const RESDIARY_CLOSED_DATES_CACHE_KEY = "all";

export const RESDIARY_TIMING = {
  budgetMs: 8000,
  signInTimeoutMs: 10_000,
  readAttemptMs: 4000,
  minAttemptMs: 250,
  readRetryDelaysMs: [250, 500],
  tokenRenewMarginMs: DURATION.FIVE_MINUTES_MS,
  tokenFallbackMs: DURATION.ONE_MINUTE_MS,
  signInPauseMs: DURATION.ONE_MINUTE_MS,
  cacheTtlMs: DURATION.FIVE_MINUTES_MS,
  maxHoldMs: DURATION.FIFTEEN_MINUTES_MS,
  dateHeaderMarginMs: 1000,
} as const;

export const RESDIARY_LIMITS = {
  minPartySize: 1,
  maxRangeDays: 120,
  cacheMaxEntries: 100,
  centsPerEuro: 100,
  isoDateLength: 10,
  loggedValueMaxLength: 40,
  loggedIssuesMax: 10,
  millisecondDigits: 3,
  lastSuccessStatus: 299,
} as const;

export const RESDIARY_REQUEST_ID = {
  separator: "_",
  keptParts: 2,
  emailMarker: "@",
} as const;

export const RESDIARY_PATTERNS = {
  reference: /^[A-Za-z0-9-]{1,40}$/,
  wireDate: /^\d{4}-\d{2}-\d{2}(?:T00:00:00(?:\.0+)?)?$/,
  wireClock: /^(?:(\d+)\.)?([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d(?:\.\d+)?)?$/,
  wireDateTime:
    /^(\d{4}-\d{2}-\d{2})T((?:[01]\d|2[0-3]):[0-5]\d)(?::[0-5]\d(?:\.\d+)?)?$/,
  wireInstant:
    /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d+))?(Z|[+-]\d{2}:\d{2})?$/,
  retryAfterSeconds: /^\d+$/,
  trailingSlashes: /\/+$/,
} as const;

export const RESDIARY_UTC_ZONE = "Z";

export const RESDIARY_TIME_SUFFIX = {
  midnight: "T00:00:00",
  seconds: ":00",
} as const;
export const RESDIARY_URL_FIELD_TYPE = "url";

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

export const RESDIARY_PAYMENT_PROVIDERS = new Map<
  string,
  NonNullable<IResDiaryRules["paymentProvider"]>
>([
  ["Stripe", "stripe"],
  ["GuestPay", "guestpay"],
]);

export const RESDIARY_WRITE_OPERATIONS = new Set<TResDiaryOperation>([
  "createHold",
  "changeHold",
  "submitHoldGuest",
]);

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
  root: "(root)",
} as const;

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
  unreadableSlots: "ResDiary sent unreadable time slots",
  skippedClosedDates: "ResDiary sent closed dates the provider skipped",
} as const;
