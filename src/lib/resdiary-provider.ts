import "server-only";

import { err, ok, type Result } from "neverthrow";
import type { z } from "zod/v4";

import {
  CALENDAR_NAMES,
  HTTP_CONTENT_TYPE,
  HTTP_STATUS,
  MILLISECONDS_PER_DAY,
  MILLISECONDS_PER_SECOND,
} from "@/lib/constants";
import {
  RESDIARY_CLOSED_DATES_CACHE_KEY,
  RESDIARY_DETAILS,
  RESDIARY_ENDPOINTS,
  RESDIARY_GUEST_STATUS,
  RESDIARY_HOLD_STATUSES,
  RESDIARY_LIMITS,
  RESDIARY_LOG,
  RESDIARY_NO_RETRY_DETAILS,
  RESDIARY_PATHS,
  RESDIARY_PATTERNS,
  RESDIARY_PAYMENT_PROVIDERS,
  RESDIARY_QUERY,
  RESDIARY_REQUEST_ID,
  RESDIARY_SIGN_IN_SUCCESS,
  RESDIARY_TIMING,
  RESDIARY_URL_FIELD_TYPE,
  RESDIARY_UTC_ZONE,
  RESDIARY_WRITE_OPERATIONS,
} from "@/lib/constants/resdiary";
import { isCalendarDate, isClockTime, utcMidnight } from "@/lib/dates";
import { AppModule, LogContext, SentryContext, Stage } from "@/lib/enums";
import { env } from "@/lib/env";
import { logToSentry } from "@/lib/error-handler";
import { getErrorMetadata, UNSENT_NETWORK_CODES } from "@/lib/errors";
import { logger } from "@/lib/logger";
import {
  changeHoldBody,
  changeHoldReplySchema,
  closedDatesReplySchema,
  closedPeriodReplySchema,
  dateRangeBody,
  dateRangeReplySchema,
  errorReplySchema,
  guestBody,
  guestReplySchema,
  holdBody,
  holdReplySchema,
  holdStatusReplySchema,
  setupReplySchema,
  signInBody,
  signInReplySchema,
  timeSearchBody,
  timeSearchReplySchema,
  timeSlotReplySchema,
} from "@/lib/resdiary-schema";
import type {
  IResDiaryCallOptions,
  IResDiaryChangeHoldInput,
  IResDiaryClock,
  IResDiaryClosedDates,
  IResDiaryConfig,
  IResDiaryDateRange,
  IResDiaryDateRangeInput,
  IResDiaryDeps,
  IResDiaryGuestInput,
  IResDiaryHold,
  IResDiaryHoldExpiry,
  IResDiaryHoldInput,
  IResDiaryHoldStatus,
  IResDiaryRules,
  IResDiarySlot,
  IResDiaryStripeStep,
  IResDiaryTimeSearchInput,
  IResDiaryTimes,
  IResDiaryWeekdays,
  TResDiaryClosedDatesReply,
  TResDiaryDateRangeReply,
  TResDiaryFailure,
  TResDiaryFetch,
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

type TResDiaryCache<T> = (
  key: string,
  caller: { operation: TResDiaryOperation; deadlineAt: number },
  load: (loadDeadlineAt: number) => TResDiaryResult<T>,
) => TResDiaryResult<T>;

interface IResDiaryConnection {
  config: IResDiaryConfig;
  fetch: TResDiaryFetch;
  token: { value: string; renewAt: number } | null;
  signingIn: Promise<Result<string, string>> | null;
  signInPausedUntil: number;
  rules: TResDiaryCache<IResDiaryRules>;
  closedDates: TResDiaryCache<IResDiaryClosedDates>;
}

interface IResDiaryRequest {
  operation: TResDiaryOperation;
  method: "GET" | "POST" | "PUT";
  path: string;
  body?: unknown;
  write?: boolean;
  noRetry?: boolean;
  emptyBody?: unknown;
  deadlineAt: number;
}

interface IResDiaryHttpReply {
  status: number;
  text: string;
  date: number | null;
  retryAfterMs: number | null;
  elapsedMs: number;
}

type TResDiaryAttempt =
  | { reply: IResDiaryHttpReply }
  | { lost: "not_sent" | "unknown"; detail: string };

interface IResDiaryFailureContext {
  holdId: number;
}

function parseInstant(value: string): number | null {
  const match = RESDIARY_PATTERNS.wireInstant.exec(value);
  if (!match || !isCalendarDate(datePart(value))) {
    return null;
  }
  const [, base, fraction = "", zone = RESDIARY_UTC_ZONE] = match;
  const { millisecondDigits } = RESDIARY_LIMITS;
  const millis = Date.parse(
    `${base}.${fraction.padEnd(millisecondDigits, "0").slice(0, millisecondDigits)}${zone}`,
  );
  return Number.isNaN(millis) ? null : millis;
}

function parseRetryAfter(value: string | null): number | null {
  if (!value) {
    return null;
  }
  if (RESDIARY_PATTERNS.retryAfterSeconds.test(value)) {
    return Number(value) * MILLISECONDS_PER_SECOND;
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

function toCents(amount: number | null | undefined): number {
  return Math.round((amount ?? 0) * RESDIARY_LIMITS.centsPerEuro);
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

function isExpectedFailure(failure: TResDiaryFailure): boolean {
  if (failure.kind === "not_found") {
    return !RESDIARY_WRITE_OPERATIONS.has(failure.operation);
  }
  if (failure.kind === "rejected") {
    return failure.operation === "submitHoldGuest" && failure.fields.length > 0;
  }
  return false;
}

function logFailure(
  failure: TResDiaryFailure,
  durationMs: number,
  context: Record<string, unknown>,
): void {
  const metadata = {
    provider: RESDIARY_LOG.provider,
    ...failure,
    durationMs,
    ...context,
  };
  if (isExpectedFailure(failure)) {
    logger.warn(LogContext.Api, RESDIARY_LOG.refused, metadata);
  } else {
    logger.error(LogContext.Api, RESDIARY_LOG.failed, metadata);
  }
}

function truncateForLog(value: string): string {
  return value.slice(0, RESDIARY_LIMITS.loggedValueMaxLength);
}

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
        date: parseHttpDate(response.headers.get("date")),
        retryAfterMs: parseRetryAfter(response.headers.get("retry-after")),
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
    accept: HTTP_CONTENT_TYPE.JSON,
    "content-type": HTTP_CONTENT_TYPE.JSON,
    ...(token
      ? {
          authorization: `Bearer ${token}`,
        }
      : {}),
  };
}

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
    maxDaysAhead: setup.AcceptBookingsDaysInAdvance || null,
    services: (setup.Services ?? []).map((service) => ({
      id: service.ServiceId,
      name: service.Name,
      start:
        service.TimeFrom && RESDIARY_PATTERNS.wireClock.test(service.TimeFrom)
          ? toClock(service.TimeFrom).time
          : null,
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
  if (!isCalendarDate(date)) {
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

function readWeekdays(names: string[]): IResDiaryWeekdays {
  const weekdays = new Set<number>();
  let skipped = 0;
  for (const name of names) {
    const weekday = CALENDAR_NAMES.weekdays.findIndex(
      (day) => day.toLowerCase() === name.trim().toLowerCase(),
    );
    if (weekday === -1) {
      skipped += 1;
    } else {
      weekdays.add(weekday);
    }
  }
  return { weekdays: [...weekdays].sort((a, b) => a - b), skipped };
}

function readPeriods(
  periods: unknown[],
): IResDiaryClosedDates["closedPeriods"] {
  const kept: IResDiaryClosedDates["closedPeriods"] = [];
  for (const period of periods) {
    const parsed = closedPeriodReplySchema.safeParse(period);
    if (parsed.success) {
      const from = datePart(parsed.data.StartDate);
      const to = datePart(parsed.data.EndDate);
      if (from <= to) {
        kept.push({ from, to });
      }
    }
  }
  return kept;
}

function toClosedDates(reply: TResDiaryClosedDatesReply): IResDiaryClosedDates {
  const periods = reply.ClosedPeriods ?? [];
  const days = readWeekdays(reply.ClosedDays ?? []);
  const closedPeriods = readPeriods(periods);
  const skippedPeriods = periods.length - closedPeriods.length;
  if (days.skipped > 0 || skippedPeriods > 0) {
    logger.warn(LogContext.Api, RESDIARY_LOG.skippedClosedDates, {
      provider: RESDIARY_LOG.provider,
      skippedDays: days.skipped,
      skippedPeriods,
    });
  }
  return { closedWeekdays: days.weekdays, closedPeriods };
}

function getClosedDates(
  connection: IResDiaryConnection,
  deadlineAt: number,
): TResDiaryResult<IResDiaryClosedDates> {
  const caller = { operation: "getClosedDates" as const, deadlineAt };
  return connection.closedDates(
    RESDIARY_CLOSED_DATES_CACHE_KEY,
    caller,
    async (loadDeadlineAt) => {
      const reply = await call(
        connection,
        {
          operation: "getClosedDates",
          method: "GET",
          path: restaurantPath(connection, RESDIARY_ENDPOINTS.closedDates),
          deadlineAt: loadDeadlineAt,
        },
        closedDatesReplySchema,
      );
      return reply.map(toClosedDates);
    },
  );
}

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
  const fromValid = isCalendarDate(input.from);
  const days =
    (utcMidnight(input.to) - utcMidnight(input.from)) / MILLISECONDS_PER_DAY +
    1;
  return invalidFields({
    from: fromValid,
    to:
      isCalendarDate(input.to) &&
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

function readSlots(slots: unknown[]): IResDiarySlot[] {
  const kept: IResDiarySlot[] = [];
  const fields = new Set<string>();
  for (const slot of slots) {
    const parsed = timeSlotReplySchema.safeParse(slot);
    if (parsed.success) {
      kept.push(toSlot(parsed.data));
    } else {
      for (const issue of parsed.error.issues) {
        fields.add(issue.path.join(".") || RESDIARY_DETAILS.root);
      }
    }
  }
  if (kept.length < slots.length) {
    logger.warn(LogContext.Api, RESDIARY_LOG.unreadableSlots, {
      provider: RESDIARY_LOG.provider,
      dropped: slots.length - kept.length,
      fields: [...fields],
    });
  }
  return kept;
}

async function searchTimes(
  connection: IResDiaryConnection,
  input: IResDiaryTimeSearchInput,
  deadlineAt: number,
): TResDiaryResult<IResDiaryTimes> {
  const fields = invalidFields({
    date: isCalendarDate(input.date),
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
    slots: readSlots(times.TimeSlots ?? []),
  }));
}

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
    date: isCalendarDate(input.date),
    time: isClockTime(input.time),
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

async function changeHold(
  connection: IResDiaryConnection,
  input: IResDiaryChangeHoldInput,
  deadlineAt: number,
): TResDiaryResult<IResDiaryHoldExpiry> {
  const fields = invalidFields({
    holdId: isPositiveId(input.holdId),
    date: isCalendarDate(input.date),
    time: isClockTime(input.time),
    partySize: isPartySize(input.partySize),
  });
  if (fields.length > 0) {
    return err(rejectedInput("changeHold", fields));
  }
  const reply = await call(
    connection,
    {
      operation: "changeHold",
      method: "PUT",
      path: restaurantPath(connection, RESDIARY_ENDPOINTS.changeHold),
      body: changeHoldBody(connection.config, input),
      write: true,
      emptyBody: {},
      deadlineAt,
    },
    changeHoldReplySchema,
  );
  return reply.map((moved) => ({
    expiresAt: moved.ExpiryTimestamp
      ? parseInstant(moved.ExpiryTimestamp)
      : null,
  }));
}

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
        closedDates: createCache(),
      }
    : null;

  async function run<T>(
    operation: TResDiaryOperation,
    work: (connected: IResDiaryConnection) => TResDiaryResult<T>,
    failureContext?: IResDiaryFailureContext,
  ): TResDiaryResult<T> {
    if (!connection) {
      return err({ kind: "not_configured", operation });
    }
    const started = Date.now();
    let result: Result<T, TResDiaryFailure>;
    let exception: Record<string, unknown> | undefined;
    try {
      result = await work(connection);
    } catch (error) {
      exception = getErrorMetadata(error);
      logToSentry(error, {
        module: AppModule.Api,
        stage: Stage.ServiceCall,
        context: {
          [SentryContext.OperationData]: {
            provider: RESDIARY_LOG.provider,
            operation,
          },
        },
      });
      result = err({
        kind: RESDIARY_WRITE_OPERATIONS.has(operation)
          ? "outcome_unknown"
          : "unavailable",
        operation,
        detail: error instanceof Error ? error.name : RESDIARY_DETAILS.unknown,
      });
    }
    if (result.isErr()) {
      logFailure(result.error, Date.now() - started, {
        ...failureContext,
        ...exception,
      });
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
    changeHold: (
      input: IResDiaryChangeHoldInput,
      options?: IResDiaryCallOptions,
    ) =>
      run(
        "changeHold",
        (connected) => changeHold(connected, input, deadline(options)),
        { holdId: input.holdId },
      ),
    submitHoldGuest: (
      input: IResDiaryGuestInput,
      options?: IResDiaryCallOptions,
    ) =>
      run(
        "submitHoldGuest",
        (connected) => submitHoldGuest(connected, input, deadline(options)),
        { holdId: input.holdId },
      ),
    getHoldStatus: (holdId: number, options?: IResDiaryCallOptions) =>
      run(
        "getHoldStatus",
        (connected) => getHoldStatus(connected, holdId, deadline(options)),
        { holdId },
      ),
    getClosedDates: (options?: IResDiaryCallOptions) =>
      run("getClosedDates", (connected) =>
        getClosedDates(connected, deadline(options)),
      ),
  };
}

export const resdiary = createResDiaryProvider();
