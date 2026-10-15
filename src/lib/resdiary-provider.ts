import "server-only";

import { err, ok, type Result } from "neverthrow";
import type { z } from "zod/v4";

import {
  HTTP_CONTENT_TYPE,
  HTTP_STATUS,
  MILLISECONDS_PER_DAY,
} from "@/lib/constants";
import {
  RESDIARY_BOOKING_STATUSES,
  RESDIARY_DETAILS,
  RESDIARY_ENDPOINTS,
  RESDIARY_EXPECTED_FAILURES,
  RESDIARY_GUEST_STATUS,
  RESDIARY_HEADERS,
  RESDIARY_HOLD_STATUSES,
  RESDIARY_LIMITS,
  RESDIARY_LOG,
  RESDIARY_NO_RETRY_DETAILS,
  RESDIARY_PATHS,
  RESDIARY_PATTERNS,
  RESDIARY_PAYMENT_PROVIDERS,
  RESDIARY_QUERY,
  RESDIARY_REASONS_CACHE_KEY,
  RESDIARY_REFUSED_CANCEL_STATUSES,
  RESDIARY_REFUSED_GUEST_STATUSES,
  RESDIARY_REQUEST_ID,
  RESDIARY_SIGN_IN_SUCCESS,
  RESDIARY_TIME_SUFFIX,
  RESDIARY_TIMING,
  RESDIARY_URL_FIELD_TYPE,
  RESDIARY_UTC_ZONE,
  RESDIARY_WRITE_OPERATIONS,
} from "@/lib/constants/resdiary";
import { LogContext } from "@/lib/enums";
import { env } from "@/lib/env";
import { UNSENT_NETWORK_CODES } from "@/lib/errors";
import { logger } from "@/lib/logger";
import {
  bookingReplySchema,
  cancelReasonsReplySchema,
  dateRangeBody,
  dateRangeReplySchema,
  errorReplySchema,
  guestBody,
  guestReplySchema,
  guestTokenBody,
  guestTokenReplySchema,
  holdBody,
  holdReplySchema,
  holdStatusReplySchema,
  setupReplySchema,
  signInBody,
  signInReplySchema,
  timeSearchBody,
  timeSearchReplySchema,
} from "@/lib/resdiary-schema";
import type {
  IResDiaryBooking,
  IResDiaryBookingLookup,
  IResDiaryCallOptions,
  IResDiaryCancelInput,
  IResDiaryCancelled,
  IResDiaryCancelReason,
  IResDiaryClock,
  IResDiaryConfig,
  IResDiaryConnection,
  IResDiaryDateRange,
  IResDiaryDateRangeInput,
  IResDiaryDeps,
  IResDiaryGuestInput,
  IResDiaryHold,
  IResDiaryHoldInput,
  IResDiaryHoldStatus,
  IResDiaryHttpReply,
  IResDiaryRequest,
  IResDiaryRules,
  IResDiarySlot,
  IResDiaryStripeStep,
  IResDiaryTimeSearchInput,
  IResDiaryTimes,
  TResDiaryAttempt,
  TResDiaryBookingReply,
  TResDiaryCache,
  TResDiaryDateRangeReply,
  TResDiaryFailure,
  TResDiaryGuestOutcome,
  TResDiaryGuestReply,
  TResDiaryHoldReply,
  TResDiaryHoldStatusReply,
  TResDiaryOperation,
  TResDiaryResult,
  TResDiarySetupReply,
  TResDiarySignInReply,
  TResDiaryTimeSlotReply,
} from "@/lib/types";

// The one module that talks to ResDiary.
// Constants: src/lib/constants/resdiary.ts. Wire format: src/lib/resdiary-schema.ts.

// ─── Formats ──────────────────────────────────────────────────────────────

/** ResDiary instants carry up to seven fractional digits and sometimes no zone; no zone means UTC. */
function parseInstant(value: string): number | null {
  const match = RESDIARY_PATTERNS.wireInstant.exec(value);
  if (!match) {
    return null;
  }
  const [, base, fraction = "", zone = RESDIARY_UTC_ZONE] = match;
  const { millisecondDigits } = RESDIARY_LIMITS;
  const millis = Date.parse(
    `${base}.${fraction.padEnd(millisecondDigits, "0").slice(0, millisecondDigits)}${zone}`,
  );
  return Number.isNaN(millis) ? null : millis;
}

/** `Retry-After` in seconds or as an HTTP date. */
function parseRetryAfter(value: string | null): number | null {
  if (!value) {
    return null;
  }
  if (RESDIARY_PATTERNS.retryAfterSeconds.test(value)) {
    return Number(value) * RESDIARY_TIMING.msPerSecond;
  }
  const at = Date.parse(value);
  return Number.isNaN(at) ? null : Math.max(0, at - Date.now());
}

function parseHttpDate(value: string | null): number | null {
  const at = value ? Date.parse(value) : Number.NaN;
  return Number.isNaN(at) ? null : at;
}

function blankToNull(value: string | null | undefined): string | null {
  return value?.trim() ? value : null;
}

function datePart(value: string): string {
  return value.slice(0, RESDIARY_LIMITS.isoDateLength);
}

function toClock(value: string): IResDiaryClock {
  const [, days = "0", hours = "00", minutes = "00"] =
    RESDIARY_PATTERNS.wireClock.exec(value) ?? [];
  return { time: `${hours}:${minutes}`, nextDay: Number(days) > 0 };
}

/** Euro amounts arrive as numbers such as 20 or 19.99. */
function toCents(amount: number | null | undefined): number {
  return Math.round((amount ?? 0) * RESDIARY_LIMITS.centsPerEuro);
}

/** Midnight UTC of a YYYY-MM-DD date, for calendar arithmetic only. */
function utcMidnight(value: string): number {
  return Date.parse(
    `${value}${RESDIARY_TIME_SUFFIX.midnight}${RESDIARY_UTC_ZONE}`,
  );
}

/** A real calendar date in YYYY-MM-DD form. */
function isDate(value: string): boolean {
  if (!RESDIARY_PATTERNS.date.test(value)) {
    return false;
  }
  const at = utcMidnight(value);
  return !Number.isNaN(at) && new Date(at).toISOString().startsWith(value);
}

function isPartySize(value: number): boolean {
  return Number.isInteger(value) && value >= RESDIARY_LIMITS.minPartySize;
}

function isPositiveId(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

function invalidFields(checks: Record<string, boolean>): string[] {
  return Object.entries(checks)
    .filter(([, valid]) => !valid)
    .map(([field]) => field);
}

// ─── Failures and logging ─────────────────────────────────────────────────

/** Keeps only the id part of a ResDiary request id, never the API account email. */
function redactRequestId(value: string | null | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  const { separator, keptParts, emailMarker } = RESDIARY_REQUEST_ID;
  return value
    .split(separator)
    .slice(0, keptParts)
    .filter((segment) => !segment.includes(emailMarker))
    .join(separator);
}

function readErrorBody(text: string) {
  try {
    const parsed = errorReplySchema.safeParse(JSON.parse(text));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function replyFailure(
  request: IResDiaryRequest,
  reply: IResDiaryHttpReply,
): TResDiaryFailure {
  const body = readErrorBody(reply.text);
  const base = {
    operation: request.operation,
    httpStatus: reply.status,
    requestId: redactRequestId(body?.ApiRequestId),
  };
  switch (reply.status) {
    case HTTP_STATUS.BAD_REQUEST:
      return {
        ...base,
        kind: "rejected",
        fields: (body?.ValidationErrors ?? [])
          .map((error) => error.PropertyName ?? "")
          .filter(Boolean),
      };
    case HTTP_STATUS.NOT_FOUND:
      return { ...base, kind: "not_found" };
    case HTTP_STATUS.UNAUTHORIZED:
    case HTTP_STATUS.FORBIDDEN:
    case HTTP_STATUS.TOO_MANY_REQUESTS:
      return { ...base, kind: "unavailable" };
    default:
      return {
        ...base,
        kind: request.write ? "outcome_unknown" : "unavailable",
      };
  }
}

function logFailure(failure: TResDiaryFailure, durationMs: number): void {
  const metadata = { provider: RESDIARY_LOG.provider, ...failure, durationMs };
  if (RESDIARY_EXPECTED_FAILURES.has(failure.kind)) {
    logger.warn(LogContext.Api, RESDIARY_LOG.refused, metadata);
  } else {
    logger.error(LogContext.Api, RESDIARY_LOG.failed, metadata);
  }
}

function truncateForLog(value: string): string {
  return value.slice(0, RESDIARY_LIMITS.loggedValueMaxLength);
}

// ─── Transport ────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function classifyLostRequest(
  error: unknown,
  timedOut: boolean,
): TResDiaryAttempt {
  if (timedOut) {
    return { lost: "unknown", detail: RESDIARY_DETAILS.timeout };
  }
  const cause = error instanceof Error ? error.cause : undefined;
  let code = error instanceof Error ? error.name : RESDIARY_DETAILS.unknown;
  if (cause && typeof cause === "object" && "code" in cause) {
    code = String(cause.code);
  }
  return {
    lost: UNSENT_NETWORK_CODES.has(code) ? "not_sent" : "unknown",
    detail: code,
  };
}

async function attempt(
  connection: IResDiaryConnection,
  path: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<TResDiaryAttempt> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();
  try {
    const response = await connection.fetch(
      `${connection.config.apiUrl}${path}`,
      { ...init, cache: "no-store", signal: controller.signal },
    );
    const text = await response.text();
    return {
      reply: {
        status: response.status,
        text,
        date: parseHttpDate(response.headers.get(RESDIARY_HEADERS.date)),
        retryAfterMs: parseRetryAfter(
          response.headers.get(RESDIARY_HEADERS.retryAfter),
        ),
        elapsedMs: Date.now() - startedAt,
      },
    };
  } catch (error) {
    return classifyLostRequest(error, controller.signal.aborted);
  } finally {
    clearTimeout(timer);
  }
}

function jsonHeaders(token?: string): HeadersInit {
  return {
    [RESDIARY_HEADERS.accept]: HTTP_CONTENT_TYPE.JSON,
    [RESDIARY_HEADERS.contentType]: HTTP_CONTENT_TYPE.JSON,
    ...(token
      ? {
          [RESDIARY_HEADERS.authorization]: `${RESDIARY_HEADERS.bearerPrefix}${token}`,
        }
      : {}),
  };
}

/** Waits for a promise until the deadline, then gives up without cancelling it. */
async function waitUntil<T>(
  promise: Promise<T>,
  deadlineAt: number,
  onTimeout: () => T,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<T>((resolve) => {
    timer = setTimeout(
      () => resolve(onTimeout()),
      Math.max(0, deadlineAt - Date.now()),
    );
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

function createCache<T>(): TResDiaryCache<T> {
  const entries = new Map<string, { value: T; expiresAt: number }>();
  const loading = new Map<string, TResDiaryResult<T>>();

  function remember(key: string, value: T): void {
    entries.delete(key);
    entries.set(key, {
      value,
      expiresAt: Date.now() + RESDIARY_TIMING.cacheTtlMs,
    });
    const oldest = entries.keys().next().value;
    if (
      entries.size > RESDIARY_LIMITS.cacheMaxEntries &&
      oldest !== undefined
    ) {
      entries.delete(oldest);
    }
  }

  return function cached(key, caller, load) {
    const hit = entries.get(key);
    if (hit && hit.expiresAt > Date.now()) {
      return Promise.resolve(ok(hit.value));
    }
    // A shared load gets at least the full budget, so a hurried first caller
    // cannot cut it short for a later caller with more time.
    const pending =
      loading.get(key) ??
      load(Math.max(caller.deadlineAt, Date.now() + RESDIARY_TIMING.budgetMs))
        .then((result) => {
          if (result.isOk()) {
            remember(key, result.value);
          }
          return result;
        })
        .finally(() => loading.delete(key));
    loading.set(key, pending);
    return waitUntil(pending, caller.deadlineAt, () =>
      err({
        kind: "unavailable",
        operation: caller.operation,
        detail: RESDIARY_DETAILS.timeout,
      }),
    );
  };
}

// ─── Sign-in and token ────────────────────────────────────────────────────

function pauseSignIn(connection: IResDiaryConnection, detail: string): string {
  connection.signInPausedUntil = Date.now() + RESDIARY_TIMING.signInPauseMs;
  return detail;
}

function keepToken(
  connection: IResDiaryConnection,
  token: string,
  expiry: string,
): void {
  const expiresAt = parseInstant(expiry);
  const renewAt =
    expiresAt === null ? 0 : expiresAt - RESDIARY_TIMING.tokenRenewMarginMs;
  if (renewAt <= Date.now()) {
    logger.warn(LogContext.Api, RESDIARY_LOG.tokenExpiryUnusable, {
      provider: RESDIARY_LOG.provider,
    });
  }
  connection.token = {
    value: token,
    renewAt:
      renewAt > Date.now()
        ? renewAt
        : Date.now() + RESDIARY_TIMING.tokenFallbackMs,
  };
}

function acceptToken(
  connection: IResDiaryConnection,
  reply: IResDiaryHttpReply,
): Result<string, string> {
  // Only a 401 says the account was refused; a 403 can be a firewall page.
  if (reply.status === HTTP_STATUS.UNAUTHORIZED) {
    return err(pauseSignIn(connection, `sign-in ${reply.status}`));
  }
  if (reply.status !== HTTP_STATUS.OK) {
    return err(`sign-in ${reply.status}`);
  }
  let body: TResDiarySignInReply;
  try {
    body = signInReplySchema.parse(JSON.parse(reply.text));
  } catch {
    return err(RESDIARY_DETAILS.signInUnreadable);
  }
  if (
    !body.Token ||
    (body.Status && body.Status !== RESDIARY_SIGN_IN_SUCCESS)
  ) {
    return err(pauseSignIn(connection, RESDIARY_DETAILS.signInRefused));
  }
  keepToken(connection, body.Token, body.TokenExpiryUtc ?? "");
  return ok(body.Token);
}

/** One sign-in attempt, plus one more after a network failure, 5xx or 429. */
async function signIn(
  connection: IResDiaryConnection,
): Promise<Result<string, string>> {
  const giveUpAt = Date.now() + RESDIARY_TIMING.signInTimeoutMs;
  const init: RequestInit = {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(signInBody(connection.config)),
  };
  let result = await attempt(
    connection,
    RESDIARY_PATHS.signIn,
    init,
    RESDIARY_TIMING.signInTimeoutMs,
  );
  const wait = retryWait(
    result,
    [...RESDIARY_TIMING.readRetryDelaysMs],
    giveUpAt,
  );
  if (wait !== null) {
    await sleep(wait);
    result = await attempt(
      connection,
      RESDIARY_PATHS.signIn,
      init,
      giveUpAt - Date.now(),
    );
  }
  if ("lost" in result) {
    return err(`sign-in ${result.detail}`);
  }
  return acceptToken(connection, result.reply);
}

async function getToken(
  connection: IResDiaryConnection,
  request: IResDiaryRequest,
): TResDiaryResult<string> {
  const { token } = connection;
  if (token && Date.now() < token.renewAt) {
    return ok(token.value);
  }
  const unavailable = (detail: string): TResDiaryFailure => ({
    kind: "unavailable",
    operation: request.operation,
    detail,
  });
  if (Date.now() < connection.signInPausedUntil) {
    return err(unavailable(RESDIARY_DETAILS.signInPaused));
  }
  connection.signingIn ??= signIn(connection).finally(() => {
    connection.signingIn = null;
  });
  const signedIn = await waitUntil(
    connection.signingIn,
    request.deadlineAt,
    (): Result<string, string> => err(RESDIARY_DETAILS.signInTimeout),
  );
  return signedIn.mapErr(unavailable);
}

function forgetToken(connection: IResDiaryConnection, rejected: string): void {
  if (connection.token?.value === rejected) {
    connection.token = null;
  }
}

// ─── Requests ─────────────────────────────────────────────────────────────

/**
 * How long to wait before retrying, or null when the attempt must not be retried.
 * Takes the next delay from `delays`.
 */
function retryWait(
  result: TResDiaryAttempt,
  delays: number[],
  deadlineAt: number,
): number | null {
  const retryable =
    "lost" in result
      ? !RESDIARY_NO_RETRY_DETAILS.has(result.detail)
      : result.reply.status >= HTTP_STATUS.INTERNAL_ERROR ||
        result.reply.status === HTTP_STATUS.TOO_MANY_REQUESTS;
  const [delay] = delays;
  if (!retryable || delay === undefined) {
    return null;
  }
  const retryAfter = "reply" in result ? (result.reply.retryAfterMs ?? 0) : 0;
  const wait = Math.max(delay, retryAfter);
  if (Date.now() + wait + RESDIARY_TIMING.minAttemptMs > deadlineAt) {
    return null;
  }
  delays.shift();
  return wait;
}

function lostFailure(
  request: IResDiaryRequest,
  lost: "not_sent" | "unknown",
  detail: string,
): TResDiaryFailure {
  const kind =
    request.write && lost === "unknown" ? "outcome_unknown" : "unavailable";
  return { kind, operation: request.operation, detail };
}

function attemptRequest(
  connection: IResDiaryConnection,
  request: IResDiaryRequest,
  token: string,
): Promise<TResDiaryAttempt> {
  const remaining = request.deadlineAt - Date.now();
  if (remaining < RESDIARY_TIMING.minAttemptMs) {
    return Promise.resolve({
      lost: "not_sent",
      detail: RESDIARY_DETAILS.deadline,
    });
  }
  return attempt(
    connection,
    request.path,
    {
      method: request.method,
      headers: jsonHeaders(token),
      body:
        request.body === undefined ? undefined : JSON.stringify(request.body),
    },
    request.write
      ? remaining
      : Math.min(RESDIARY_TIMING.readAttemptMs, remaining),
  );
}

/**
 * Sends one request with the shared token. Reads retry network failures, 5xx
 * and 429; a 401 gets one new sign-in and one resend.
 */
async function send(
  connection: IResDiaryConnection,
  request: IResDiaryRequest,
): TResDiaryResult<IResDiaryHttpReply> {
  const delays: number[] =
    request.write || request.noRetry
      ? []
      : [...RESDIARY_TIMING.readRetryDelaysMs];
  let token = await getToken(connection, request);
  let resent = false;
  for (;;) {
    if (token.isErr()) {
      return err(token.error);
    }
    const result = await attemptRequest(connection, request, token.value);
    const wait = retryWait(result, delays, request.deadlineAt);
    if (wait !== null) {
      await sleep(wait);
      continue;
    }
    if ("lost" in result) {
      return err(lostFailure(request, result.lost, result.detail));
    }
    if (result.reply.status !== HTTP_STATUS.UNAUTHORIZED || resent) {
      return ok(result.reply);
    }
    resent = true;
    forgetToken(connection, token.value);
    token = await getToken(connection, request);
  }
}

function isSuccessStatus(status: number): boolean {
  return (
    status >= HTTP_STATUS.OK && status <= RESDIARY_LIMITS.lastSuccessStatus
  );
}

/** Turns a reply into parsed data, or the failure its status and body mean. */
function readReply<T>(
  request: IResDiaryRequest,
  reply: IResDiaryHttpReply,
  schema: z.ZodType<T>,
): Result<T, TResDiaryFailure> {
  if (!isSuccessStatus(reply.status)) {
    return err(replyFailure(request, reply));
  }
  let json: unknown = request.emptyBody;
  if (reply.text.trim() !== "" || request.emptyBody === undefined) {
    try {
      json = JSON.parse(reply.text);
    } catch {
      json = undefined;
    }
  }
  const parsed = schema.safeParse(json);
  if (parsed.success) {
    return ok(parsed.data);
  }
  const paths = parsed.error.issues
    .slice(0, RESDIARY_LIMITS.loggedIssuesMax)
    .map((issue) => issue.path.join(".") || RESDIARY_DETAILS.root);
  return err({
    kind: request.write ? "outcome_unknown" : "unavailable",
    operation: request.operation,
    httpStatus: reply.status,
    detail: `unreadable: ${paths.join(", ")}`,
  });
}

async function call<T>(
  connection: IResDiaryConnection,
  request: IResDiaryRequest,
  schema: z.ZodType<T>,
): TResDiaryResult<T> {
  const reply = await send(connection, request);
  return reply.andThen((value) => readReply(request, value, schema));
}

function restaurantPath(
  connection: IResDiaryConnection,
  endpoint: string,
  prefix: string = RESDIARY_PATHS.restaurant,
): string {
  const site = encodeURIComponent(connection.config.micrositeName);
  return `${prefix}/${site}/${endpoint}`;
}

function rejectedInput(
  operation: TResDiaryOperation,
  fields: string[],
): TResDiaryFailure {
  return { kind: "rejected", operation, fields };
}

// ─── Booking rules ────────────────────────────────────────────────────────

function toStripe(setup: TResDiarySetupReply): IResDiaryRules["stripe"] {
  const stripe = setup.StripeInfo;
  if (
    !(
      stripe?.IsEnabled &&
      stripe.StripePublishableKey &&
      stripe.StripeAccountId
    )
  ) {
    return null;
  }
  return {
    publishableKey: stripe.StripePublishableKey,
    accountId: stripe.StripeAccountId,
    live: Boolean(stripe.UseLiveToken),
  };
}

function toCustomField(
  setup: TResDiarySetupReply,
): IResDiaryRules["customField"] {
  const field = setup.CustomField;
  if (!field) {
    return null;
  }
  return {
    label: blankToNull(field.Name),
    required: Boolean(field.IsRequired),
    type:
      field.Type?.toLowerCase() === RESDIARY_URL_FIELD_TYPE ? "url" : "text",
  };
}

function toRules(setup: TResDiarySetupReply): IResDiaryRules {
  const minPartySize = Math.max(
    RESDIARY_LIMITS.minPartySize,
    setup.MinOnlinePartySize ?? RESDIARY_LIMITS.minPartySize,
  );
  return {
    minPartySize,
    maxPartySize: setup.MaxOnlinePartySize,
    defaultPartySize: setup.OnlinePartySizeDefault ?? minPartySize,
    // ResDiary uses both null and 0 for "no limit".
    maxDaysAhead: setup.AcceptBookingsDaysInAdvance || null,
    services: (setup.Services ?? []).map((service) => ({
      id: service.ServiceId,
      name: service.Name,
    })),
    currency: setup.CurrencyCode,
    termsHtml: setup.TermsAndConditions ?? "",
    privacyHtml: setup.PrivacyPolicy ?? "",
    noAvailability: {
      message: blankToNull(setup.NoAvailabilityText),
      phone: setup.DisplayPhoneNumberWhenNoAvailability
        ? blankToNull(setup.ReservationPhoneNumber)
        : null,
    },
    membership: setup.IsMembershipIdEnabled
      ? {
          label: blankToNull(setup.MembershipIdTitle),
          required: Boolean(setup.IsMembershipIdRequired),
        }
      : null,
    customField: toCustomField(setup),
    stripe: toStripe(setup),
    paymentProvider:
      RESDIARY_PAYMENT_PROVIDERS.get(setup.PaymentProvider ?? "") ?? null,
  };
}

function getRules(
  connection: IResDiaryConnection,
  date: string,
  deadlineAt: number,
): TResDiaryResult<IResDiaryRules> {
  if (!isDate(date)) {
    return Promise.resolve(err(rejectedInput("getRules", ["date"])));
  }
  const caller = { operation: "getRules" as const, deadlineAt };
  return connection.rules(date, caller, async (loadDeadlineAt) => {
    const query = new URLSearchParams({
      [RESDIARY_QUERY.date]: date,
      [RESDIARY_QUERY.channelCode]: connection.config.channelCode,
    });
    const setup = await call(
      connection,
      {
        operation: "getRules",
        method: "GET",
        path: `${restaurantPath(connection, RESDIARY_ENDPOINTS.setup)}?${query}`,
        deadlineAt: loadDeadlineAt,
      },
      setupReplySchema,
    );
    return setup.map(toRules);
  });
}

// ─── Dates and times ──────────────────────────────────────────────────────

function toDateRange(range: TResDiaryDateRangeReply): IResDiaryDateRange {
  const start = range.MissingDatesStart;
  const end = range.MissingDatesEnd;
  return {
    dates: (range.AvailableDates ?? []).map((day) => ({
      date: datePart(day.Date),
      times: (day.AvailableTimes ?? []).map((time) => toClock(time.TimeSlot)),
    })),
    missing: start && end ? { from: datePart(start), to: datePart(end) } : null,
  };
}

function rangeFields(input: IResDiaryDateRangeInput): string[] {
  const fromValid = isDate(input.from);
  const days =
    (utcMidnight(input.to) - utcMidnight(input.from)) / MILLISECONDS_PER_DAY +
    1;
  return invalidFields({
    from: fromValid,
    to:
      isDate(input.to) &&
      (!fromValid || (days >= 1 && days <= RESDIARY_LIMITS.maxRangeDays)),
    partySize: isPartySize(input.partySize),
  });
}

async function getAvailableDates(
  connection: IResDiaryConnection,
  input: IResDiaryDateRangeInput,
  deadlineAt: number,
): TResDiaryResult<IResDiaryDateRange> {
  const fields = rangeFields(input);
  if (fields.length > 0) {
    return err(rejectedInput("getAvailableDates", fields));
  }
  const range = await call(
    connection,
    {
      operation: "getAvailableDates",
      method: "POST",
      path: restaurantPath(connection, RESDIARY_ENDPOINTS.dateRange),
      body: dateRangeBody(connection.config, input),
      deadlineAt,
    },
    dateRangeReplySchema,
  );
  return range.map(toDateRange);
}

function toSlot(slot: TResDiaryTimeSlotReply): IResDiarySlot {
  const [, date = "", time = ""] =
    RESDIARY_PATTERNS.wireDateTime.exec(slot.TimeSlot) ?? [];
  return {
    date,
    time,
    serviceId: slot.ServiceId,
    standard: slot.HasStandardAvailability,
    feeCents: toCents(slot.StandardAvailabilityFeeAmount),
    leaveTimeRequired: Boolean(slot.IsLeaveTimeRequired),
    leaveTime: slot.LeaveTime ? toClock(slot.LeaveTime) : null,
  };
}

async function searchTimes(
  connection: IResDiaryConnection,
  input: IResDiaryTimeSearchInput,
  deadlineAt: number,
): TResDiaryResult<IResDiaryTimes> {
  const fields = invalidFields({
    date: isDate(input.date),
    partySize: isPartySize(input.partySize),
  });
  if (fields.length > 0) {
    return err(rejectedInput("searchTimes", fields));
  }
  const search = await call(
    connection,
    {
      operation: "searchTimes",
      method: "POST",
      path: restaurantPath(connection, RESDIARY_ENDPOINTS.timeSearch),
      body: timeSearchBody(connection.config, input),
      deadlineAt,
    },
    timeSearchReplySchema,
  );
  return search.map((times) => ({
    mayRequireCard: Boolean(times.StandardAvailabilityMayRequireCreditCard),
    slots: (times.TimeSlots ?? []).map(toSlot),
  }));
}

// ─── Holding a table ──────────────────────────────────────────────────────

/**
 * Times the hold on ResDiary's own clock (its Date header) when it can, so our
 * server's clock drift cannot shorten or stretch the guest's countdown.
 */
function toHold(
  hold: TResDiaryHoldReply,
  reply: IResDiaryHttpReply,
): Result<IResDiaryHold, string> {
  const expiresAt = hold.ExpiryTimestamp
    ? parseInstant(hold.ExpiryTimestamp)
    : null;
  if (expiresAt === null) {
    return err(RESDIARY_DETAILS.unreadableExpiry);
  }
  // ResDiary stamped its Date somewhere inside our request, so taking off the
  // whole request time can only shorten the countdown, never stretch it.
  const expiresInMs =
    reply.date === null
      ? expiresAt - Date.now()
      : expiresAt -
        reply.date -
        RESDIARY_TIMING.dateHeaderMarginMs -
        reply.elapsedMs;
  if (expiresInMs <= 0 || expiresInMs > RESDIARY_TIMING.maxHoldMs) {
    return err(RESDIARY_DETAILS.unusableExpiry);
  }
  return ok({
    holdId: hold.BookingId,
    reference: hold.BookingReference,
    expiresAt,
    expiresInMs,
  });
}

async function createHold(
  connection: IResDiaryConnection,
  input: IResDiaryHoldInput,
  deadlineAt: number,
): TResDiaryResult<IResDiaryHold> {
  const fields = invalidFields({
    date: isDate(input.date),
    time: RESDIARY_PATTERNS.time.test(input.time),
    partySize: isPartySize(input.partySize),
  });
  if (fields.length > 0) {
    return err(rejectedInput("createHold", fields));
  }
  const request: IResDiaryRequest = {
    operation: "createHold",
    method: "POST",
    path: restaurantPath(connection, RESDIARY_ENDPOINTS.createHold),
    body: holdBody(connection.config, input),
    write: true,
    deadlineAt,
  };
  const reply = await send(connection, request);
  if (reply.isErr()) {
    return err(reply.error);
  }
  return readReply(request, reply.value, holdReplySchema).andThen((hold) =>
    toHold(hold, reply.value).mapErr(
      (detail): TResDiaryFailure => ({
        kind: "outcome_unknown",
        operation: "createHold",
        detail,
      }),
    ),
  );
}

// ─── Guest details and hold status ────────────────────────────────────────

/** The Stripe step the browser needs, or null when we cannot take this payment. */
function stripeStep(
  reply: TResDiaryGuestReply,
  clientSecret: string | null | undefined,
): IResDiaryStripeStep | null {
  const { StripePublishableKey: publishableKey, StripeAccountId: accountId } =
    reply;
  if (reply.GuestPayHostedPageUrl || !clientSecret) {
    return null;
  }
  return publishableKey && accountId
    ? { publishableKey, accountId, clientSecret }
    : null;
}

function toGuestOutcome(
  reply: TResDiaryGuestReply,
): Result<TResDiaryGuestOutcome, TResDiaryFailure> {
  const operation = "submitHoldGuest";
  const unsupported: TResDiaryFailure = {
    kind: "payment_unsupported",
    operation,
  };
  switch (reply.Status) {
    case RESDIARY_GUEST_STATUS.success: {
      const reference = reply.Booking?.Reference;
      return reference
        ? ok({ kind: "confirmed", reference })
        : err({
            kind: "outcome_unknown",
            operation,
            detail: RESDIARY_DETAILS.noReference,
          });
    }
    case RESDIARY_GUEST_STATUS.paymentRequired: {
      const stripe = stripeStep(reply, reply.PaymentIntentSecret);
      return stripe
        ? ok({
            kind: "payment",
            amountCents: toCents(reply.PaymentAmount),
            amountText: reply.FormattedPaymentAmount ?? "",
            stripe,
          })
        : err(unsupported);
    }
    case RESDIARY_GUEST_STATUS.cardRequired: {
      const stripe = stripeStep(reply, reply.SetupIntentClientSecret);
      return stripe
        ? ok({
            kind: "card",
            amountText: reply.FormattedPaymentAmount ?? "",
            stripe,
          })
        : err(unsupported);
    }
    case RESDIARY_GUEST_STATUS.tableConflict:
      return ok({ kind: "table_taken" });
    case RESDIARY_GUEST_STATUS.customerBlocked:
      return ok({ kind: "guest_blocked" });
    default:
      return err({
        kind: "outcome_unknown",
        operation,
        detail: `status ${truncateForLog(reply.Status)}`,
      });
  }
}

/** Sends once. Whether to resend after an unknown outcome is the service's call. */
async function submitHoldGuest(
  connection: IResDiaryConnection,
  input: IResDiaryGuestInput,
  deadlineAt: number,
): TResDiaryResult<TResDiaryGuestOutcome> {
  const fields = invalidFields({
    holdId: isPositiveId(input.holdId),
    firstName: Boolean(input.guest.firstName.trim()),
    surname: Boolean(input.guest.surname.trim()),
    email: Boolean(input.guest.email.trim()),
  });
  if (fields.length > 0) {
    return err(rejectedInput("submitHoldGuest", fields));
  }
  const reply = await call(
    connection,
    {
      operation: "submitHoldGuest",
      method: "PUT",
      path: restaurantPath(
        connection,
        RESDIARY_ENDPOINTS.guestDetails,
        RESDIARY_PATHS.guestDetailsRestaurant,
      ),
      body: guestBody(input),
      write: true,
      deadlineAt,
    },
    guestReplySchema,
  );
  return reply.andThen(toGuestOutcome);
}

function toHoldStatus(reply: TResDiaryHoldStatusReply): IResDiaryHoldStatus {
  const status = RESDIARY_HOLD_STATUSES.get(reply.Status);
  if (!status) {
    logger.warn(LogContext.Api, RESDIARY_LOG.unknownHoldStatus, {
      provider: RESDIARY_LOG.provider,
      status: truncateForLog(reply.Status),
    });
  }
  return {
    status: status ?? "unknown",
    reference: reply.Booking?.Reference ?? null,
  };
}

async function getHoldStatus(
  connection: IResDiaryConnection,
  holdId: number,
  deadlineAt: number,
): TResDiaryResult<IResDiaryHoldStatus> {
  if (!isPositiveId(holdId)) {
    return err(rejectedInput("getHoldStatus", ["holdId"]));
  }
  const reply = await call(
    connection,
    {
      operation: "getHoldStatus",
      method: "GET",
      path: restaurantPath(
        connection,
        `${RESDIARY_ENDPOINTS.holdStatus}/${holdId}`,
      ),
      noRetry: true,
      deadlineAt,
    },
    holdStatusReplySchema,
  );
  return reply.map(toHoldStatus);
}

// ─── Bookings and cancelling ──────────────────────────────────────────────

function toBooking(booking: TResDiaryBookingReply): IResDiaryBooking {
  const visitAtUtc = booking.VisitDateTimeUtc
    ? parseInstant(booking.VisitDateTimeUtc)
    : null;
  return {
    reference: booking.Reference,
    date: datePart(booking.VisitDate),
    time: toClock(booking.VisitTime).time,
    partySize: booking.PartySize,
    status: RESDIARY_BOOKING_STATUSES.get(booking.BookingStatus) ?? "other",
    canCancel: Boolean(booking.CanCancel),
    canEdit: Boolean(booking.CanEdit),
    depositPaidCents: toCents(booking.DepositPaidAmount),
    visitAtUtc,
  };
}

function bookingPath(
  connection: IResDiaryConnection,
  reference: string,
): string {
  return restaurantPath(
    connection,
    `${RESDIARY_ENDPOINTS.booking}/${encodeURIComponent(reference)}`,
  );
}

/**
 * Signs in as the guest with their email. The guest token never leaves this
 * module. A refused email and an unknown reference both answer not_found, so
 * callers cannot probe which references exist.
 */
async function signInGuest(
  connection: IResDiaryConnection,
  lookup: IResDiaryBookingLookup,
  deadlineAt: number,
): TResDiaryResult<string> {
  const operation = "getBooking";
  const guestToken = await call(
    connection,
    {
      operation,
      method: "POST",
      path: `${bookingPath(connection, lookup.reference)}/${RESDIARY_ENDPOINTS.guestSignIn}`,
      body: guestTokenBody(lookup),
      deadlineAt,
    },
    guestTokenReplySchema,
  );
  if (guestToken.isErr()) {
    const refused = RESDIARY_REFUSED_GUEST_STATUSES.has(
      guestToken.error.httpStatus ?? 0,
    );
    return err(refused ? { kind: "not_found", operation } : guestToken.error);
  }
  return ok(guestToken.value.Result);
}

async function fetchBooking(
  connection: IResDiaryConnection,
  reference: string,
  guestToken: string,
  deadlineAt: number,
): TResDiaryResult<IResDiaryBooking> {
  const query = new URLSearchParams({
    [RESDIARY_QUERY.authenticationToken]: guestToken,
  });
  const booking = await call(
    connection,
    {
      operation: "getBooking",
      method: "GET",
      path: `${bookingPath(connection, reference)}?${query}`,
      deadlineAt,
    },
    bookingReplySchema,
  );
  return booking.map(toBooking);
}

async function readBooking(
  connection: IResDiaryConnection,
  lookup: IResDiaryBookingLookup,
  deadlineAt: number,
): TResDiaryResult<IResDiaryBooking> {
  const guestToken = await signInGuest(connection, lookup, deadlineAt);
  if (guestToken.isErr()) {
    return err(guestToken.error);
  }
  return fetchBooking(
    connection,
    lookup.reference,
    guestToken.value,
    deadlineAt,
  );
}

function lookupFields(lookup: IResDiaryBookingLookup): string[] {
  return invalidFields({
    reference: RESDIARY_PATTERNS.reference.test(lookup.reference),
    email: Boolean(lookup.email.trim()),
  });
}

function getBooking(
  connection: IResDiaryConnection,
  lookup: IResDiaryBookingLookup,
  deadlineAt: number,
): TResDiaryResult<IResDiaryBooking> {
  const fields = lookupFields(lookup);
  if (fields.length > 0) {
    return Promise.resolve(err(rejectedInput("getBooking", fields)));
  }
  return readBooking(connection, lookup, deadlineAt);
}

function getCancellationReasons(
  connection: IResDiaryConnection,
  deadlineAt: number,
): TResDiaryResult<IResDiaryCancelReason[]> {
  const caller = { operation: "getCancellationReasons" as const, deadlineAt };
  return connection.cancelReasons(
    RESDIARY_REASONS_CACHE_KEY,
    caller,
    async (loadDeadlineAt) => {
      const query = new URLSearchParams({
        [RESDIARY_QUERY.onlyEnabledReasons]: "true",
      });
      const reasons = await call(
        connection,
        {
          operation: "getCancellationReasons",
          method: "GET",
          path: `${restaurantPath(connection, RESDIARY_ENDPOINTS.cancellationReasons)}?${query}`,
          // ResDiary may answer an empty list with no body.
          emptyBody: [],
          deadlineAt: loadDeadlineAt,
        },
        cancelReasonsReplySchema,
      );
      return reasons.map((list) =>
        list
          .filter(
            (reason) => reason.DisplayOnline && reason.ApplyToStandardBookings,
          )
          .map((reason) => ({ id: reason.Id, label: reason.Description })),
      );
    },
  );
}

/** Sends the cancel. A lost reply or a 5xx is left to the read-back to judge. */
async function sendCancel(
  connection: IResDiaryConnection,
  input: IResDiaryCancelInput,
  deadlineAt: number,
): TResDiaryResult<void> {
  const query = new URLSearchParams({
    [RESDIARY_QUERY.cancellationReasonId]: String(input.reasonId),
  });
  const request: IResDiaryRequest = {
    operation: "cancelBooking",
    method: "POST",
    path: `${bookingPath(connection, input.reference)}/${RESDIARY_ENDPOINTS.cancel}?${query}`,
    write: true,
    deadlineAt,
  };
  const reply = await send(connection, request);
  if (reply.isErr()) {
    return reply.error.kind === "outcome_unknown"
      ? ok(undefined)
      : err(reply.error);
  }
  const { status } = reply.value;
  if (status === HTTP_STATUS.FORBIDDEN) {
    return err({
      kind: "not_allowed",
      operation: "cancelBooking",
      httpStatus: status,
    });
  }
  if (RESDIARY_REFUSED_CANCEL_STATUSES.has(status)) {
    return err(replyFailure(request, reply.value));
  }
  return ok(undefined);
}

/** Reads the booking back a few times; true once ResDiary shows it cancelled. */
async function confirmCancelled(
  connection: IResDiaryConnection,
  reference: string,
  guestToken: string,
  deadlineAt: number,
): TResDiaryResult<boolean> {
  for (const delay of RESDIARY_TIMING.cancelCheckDelaysMs) {
    await sleep(delay);
    const booking = await fetchBooking(
      connection,
      reference,
      guestToken,
      deadlineAt,
    );
    if (booking.isErr()) {
      return err({
        kind: "outcome_unknown",
        operation: "cancelBooking",
        detail: `check ${booking.error.kind}`,
      });
    }
    if (booking.value.status === "cancelled") {
      return ok(true);
    }
  }
  return ok(false);
}

async function cancelBooking(
  connection: IResDiaryConnection,
  input: IResDiaryCancelInput,
  deadlineAt: number,
): TResDiaryResult<IResDiaryCancelled> {
  const operation = "cancelBooking";
  const fields = [
    ...lookupFields(input),
    ...invalidFields({ reasonId: isPositiveId(input.reasonId) }),
  ];
  if (fields.length > 0) {
    return err(rejectedInput(operation, fields));
  }
  const cancelled: IResDiaryCancelled = {
    reference: input.reference,
    status: "cancelled",
  };
  // One guest sign-in serves the first read and every read-back.
  const guestToken = await signInGuest(connection, input, deadlineAt);
  if (guestToken.isErr()) {
    return err({ ...guestToken.error, operation });
  }
  const before = await fetchBooking(
    connection,
    input.reference,
    guestToken.value,
    deadlineAt,
  );
  if (before.isErr()) {
    return err({ ...before.error, operation });
  }
  if (before.value.status === "cancelled") {
    return ok(cancelled);
  }
  if (!before.value.canCancel) {
    return err({ kind: "not_allowed", operation });
  }
  for (let round = 0; round < RESDIARY_LIMITS.cancelRounds; round += 1) {
    const sent = await sendCancel(connection, input, deadlineAt);
    if (sent.isErr()) {
      return err(sent.error);
    }
    const confirmed = await confirmCancelled(
      connection,
      input.reference,
      guestToken.value,
      deadlineAt,
    );
    if (confirmed.isErr()) {
      return err(confirmed.error);
    }
    if (confirmed.value) {
      return ok(cancelled);
    }
  }
  return err({
    kind: "cancel_not_applied",
    operation,
    reference: input.reference,
  });
}

// ─── Provider ─────────────────────────────────────────────────────────────

function readConfigFromEnv(): IResDiaryConfig | null {
  const apiUrl = env.RESDIARY_API_URL;
  const micrositeName = env.RESDIARY_MICROSITE_NAME;
  const channelCode = env.RESDIARY_CHANNEL_CODE;
  const username = env.RESDIARY_USERNAME;
  const password = env.RESDIARY_PASSWORD;
  if (!(apiUrl && micrositeName && channelCode && username && password)) {
    return null;
  }
  return { apiUrl, micrositeName, channelCode, username, password };
}

function deadline(
  options?: IResDiaryCallOptions,
  budgetMs: number = RESDIARY_TIMING.budgetMs,
): number {
  return options?.deadlineAt ?? Date.now() + budgetMs;
}

/** Tests pass their own config and fetch; the app uses `resdiary` below. */
export function createResDiaryProvider(deps: IResDiaryDeps = {}) {
  const config = deps.config === undefined ? readConfigFromEnv() : deps.config;
  const connection: IResDiaryConnection | null = config
    ? {
        config: {
          ...config,
          apiUrl: config.apiUrl.replace(RESDIARY_PATTERNS.trailingSlashes, ""),
        },
        fetch: deps.fetch ?? ((url, init) => fetch(url, init)),
        token: null,
        signingIn: null,
        signInPausedUntil: 0,
        rules: createCache(),
        cancelReasons: createCache(),
      }
    : null;

  async function run<T>(
    operation: TResDiaryOperation,
    work: (connected: IResDiaryConnection) => TResDiaryResult<T>,
  ): TResDiaryResult<T> {
    if (!connection) {
      return err({ kind: "not_configured", operation });
    }
    const started = Date.now();
    let result: Result<T, TResDiaryFailure>;
    try {
      result = await work(connection);
    } catch (error) {
      // Never throw to callers. A write may have reached ResDiary before the throw.
      result = err({
        kind: RESDIARY_WRITE_OPERATIONS.has(operation)
          ? "outcome_unknown"
          : "unavailable",
        operation,
        detail: error instanceof Error ? error.name : RESDIARY_DETAILS.unknown,
      });
    }
    if (result.isErr()) {
      logFailure(result.error, Date.now() - started);
    }
    return result;
  }

  return {
    isConfigured: () => connection !== null,
    getRules: (date: string, options?: IResDiaryCallOptions) =>
      run("getRules", (connected) =>
        getRules(connected, date, deadline(options)),
      ),
    getAvailableDates: (
      input: IResDiaryDateRangeInput,
      options?: IResDiaryCallOptions,
    ) =>
      run("getAvailableDates", (connected) =>
        getAvailableDates(connected, input, deadline(options)),
      ),
    searchTimes: (
      input: IResDiaryTimeSearchInput,
      options?: IResDiaryCallOptions,
    ) =>
      run("searchTimes", (connected) =>
        searchTimes(connected, input, deadline(options)),
      ),
    createHold: (input: IResDiaryHoldInput, options?: IResDiaryCallOptions) =>
      run("createHold", (connected) =>
        createHold(connected, input, deadline(options)),
      ),
    submitHoldGuest: (
      input: IResDiaryGuestInput,
      options?: IResDiaryCallOptions,
    ) =>
      run("submitHoldGuest", (connected) =>
        submitHoldGuest(connected, input, deadline(options)),
      ),
    getHoldStatus: (holdId: number, options?: IResDiaryCallOptions) =>
      run("getHoldStatus", (connected) =>
        getHoldStatus(connected, holdId, deadline(options)),
      ),
    getBooking: (
      lookup: IResDiaryBookingLookup,
      options?: IResDiaryCallOptions,
    ) =>
      run("getBooking", (connected) =>
        getBooking(connected, lookup, deadline(options)),
      ),
    getCancellationReasons: (options?: IResDiaryCallOptions) =>
      run("getCancellationReasons", (connected) =>
        getCancellationReasons(connected, deadline(options)),
      ),
    /** Default deadline 15 s: the read-back after the cancel needs the time. */
    cancelBooking: (
      input: IResDiaryCancelInput,
      options?: IResDiaryCallOptions,
    ) =>
      run("cancelBooking", (connected) =>
        cancelBooking(
          connected,
          input,
          deadline(options, RESDIARY_TIMING.cancelBudgetMs),
        ),
      ),
  };
}

export const resdiary = createResDiaryProvider();
