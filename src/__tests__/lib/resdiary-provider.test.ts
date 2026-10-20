import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { logToSentry } from "@/lib/error-handler";
import { createResDiaryProvider } from "@/lib/resdiary-provider";
import type { IResDiaryConfig, IResDiaryReply } from "@/lib/types";

vi.mock("@/lib/error-handler", () => ({ logToSentry: vi.fn() }));

interface IRecordedRequest {
  method: string;
  path: string;
  search: URLSearchParams;
  body: unknown;
  authorization: string | null;
  signal: AbortSignal | undefined;
}

type THandler = (request: IRecordedRequest) => Promise<IResDiaryReply>;

const CONFIG: IResDiaryConfig = {
  apiUrl: "https://api.example.test",
  micrositeName: "PeploesTest",
  channelCode: "ONLINE",
  username: "api-user",
  password: "api-password",
};

const NOW = new Date("2026-10-15T08:00:00Z");
const RESTAURANT = "/api/ConsumerApi/v1/Restaurant/PeploesTest";

function reply(
  status: number,
  body?: unknown,
  headers: Record<string, string> = {},
): THandler {
  const text =
    body === undefined
      ? ""
      : typeof body === "string"
        ? body
        : JSON.stringify(body);
  return function scriptedReply() {
    return Promise.resolve({
      status,
      headers: new Headers(headers),
      text: () => Promise.resolve(text),
    });
  };
}

function signedIn(token = "token-1", expiry = "2026-10-16T04:23:04.1130000") {
  return reply(200, {
    Status: "Success",
    Token: token,
    TokenExpiryUtc: expiry,
  });
}

function hangs(): THandler {
  return function hangUntilAborted(request) {
    return new Promise((_resolve, reject) => {
      request.signal?.addEventListener("abort", function onAbort() {
        reject(new DOMException("The operation was aborted.", "AbortError"));
      });
    });
  };
}

function delayed(ms: number, handler: THandler): THandler {
  return function delayedReply(request) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, ms);
      request.signal?.addEventListener("abort", function onAbort() {
        clearTimeout(timer);
        reject(new DOMException("The operation was aborted.", "AbortError"));
      });
    }).then(() => handler(request));
  };
}

function failsWith(code: string): THandler {
  return function networkFailure() {
    return Promise.reject(
      Object.assign(new TypeError("fetch failed"), {
        cause: Object.assign(new Error(code), { code }),
      }),
    );
  };
}

function fakeResDiary(routes: Record<string, THandler | THandler[]>) {
  const requests: IRecordedRequest[] = [];
  const queues = new Map(
    Object.entries(routes).map(function toQueue([route, handlers]) {
      return [route, Array.isArray(handlers) ? [...handlers] : [handlers]];
    }),
  );

  function fetch(url: string, init: RequestInit) {
    const parsed = new URL(url);
    const request: IRecordedRequest = {
      method: init.method ?? "GET",
      path: parsed.pathname,
      search: parsed.searchParams,
      body: typeof init.body === "string" ? JSON.parse(init.body) : undefined,
      authorization: new Headers(init.headers).get("authorization"),
      signal: init.signal ?? undefined,
    };
    requests.push(request);
    const route = [...queues.keys()].find(function matches(key) {
      const [method, suffix] = key.split(" ");
      return method === request.method && request.path.endsWith(suffix);
    });
    const queue = route ? (queues.get(route) ?? []) : [];
    const handler = queue.length > 1 ? queue.shift() : queue[0];
    if (!handler) {
      return Promise.reject(
        new Error(`No fake route for ${request.method} ${request.path}`),
      );
    }
    return handler(request);
  }

  function count(route: string) {
    const [method, suffix] = route.split(" ");
    return requests.filter(function matches(request) {
      return request.method === method && request.path.endsWith(suffix);
    }).length;
  }

  return { fetch, requests, count };
}

async function settle<T>(promise: Promise<T>): Promise<T> {
  await vi.runAllTimersAsync();
  return promise;
}

const SETUP = {
  RestaurantId: 3899,
  Name: "Peploes Test",
  MaxOnlinePartySize: 10,
  MinOnlinePartySize: 1,
  OnlinePartySizeDefault: 2,
  Services: [
    {
      ServiceId: 8854,
      Name: "Breakfast",
      TimeFrom: "09:00:00",
      LastBookingTime: "11:45:00",
    },
    {
      ServiceId: 8856,
      Name: "Dinner",
      TimeFrom: "18:00:00",
      LastBookingTime: "22:00:00",
    },
  ],
  IsMembershipIdEnabled: true,
  IsMembershipIdRequired: false,
  MembershipIdTitle: "Do It All ID",
  CustomField: null,
  NoAvailabilityText: "",
  DisplayPhoneNumberWhenNoAvailability: false,
  ReservationPhoneNumber: "0",
  CurrencyCode: "EUR",
  TermsAndConditions: "<p>Please note we may require a valid credit card.</p>",
  PrivacyPolicy: "",
  AcceptBookingsDaysInAdvance: 365,
  StripeInfo: {
    StripePublishableKey: "pk_test_fixture",
    UseLiveToken: false,
    IsEnabled: true,
    StripeAccountId: "acct_fixture",
    ConnectedToMainResDiaryStripeAccount: true,
  },
  PaymentProvider: "Stripe",
};

beforeEach(function useFakeClock() {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
  vi.setSystemTime(NOW);
  vi.spyOn(console, "log").mockImplementation(function silence() {});
  vi.spyOn(console, "warn").mockImplementation(function silence() {});
  vi.spyOn(console, "error").mockImplementation(function silence() {});
});

afterEach(function useRealClock() {
  vi.useRealTimers();
});

describe("ResDiary settings", function settingsTests() {
  afterEach(function resetEnv() {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("refuses a ResDiary URL that is not https", async function refusesHttp() {
    vi.stubEnv("RESDIARY_API_URL", "http://api.rdbranch.com");
    vi.resetModules();

    await expect(import("@/lib/env")).rejects.toThrow(/RESDIARY_API_URL/);
  });

  it("turns booking off when a value is missing", async function offWhenMissing() {
    vi.stubEnv("RESDIARY_API_URL", "https://api.rdbranch.com");
    vi.stubEnv("RESDIARY_MICROSITE_NAME", "PeploesTest");
    vi.resetModules();

    const { createResDiaryProvider: create } = await import(
      "@/lib/resdiary-provider"
    );

    expect(create().isConfigured()).toBe(false);
  });
});

describe("getRules", function getRulesTests() {
  it("does nothing on the network when booking is not configured", async function notConfigured() {
    const fake = fakeResDiary({});
    const provider = createResDiaryProvider({
      config: null,
      fetch: fake.fetch,
    });

    const result = await provider.getRules("2026-10-23");

    expect(result._unsafeUnwrapErr()).toMatchObject({
      kind: "not_configured",
    });
    expect(fake.requests).toHaveLength(0);
  });

  it("signs in and turns Setup into booking rules", async function mapsSetup() {
    const fake = fakeResDiary({
      "POST /api/Jwt/v2/Authenticate": signedIn(),
      "GET /Setup": reply(200, SETUP),
    });
    const provider = createResDiaryProvider({
      config: CONFIG,
      fetch: fake.fetch,
    });

    const result = await settle(provider.getRules("2026-10-23"));

    expect(result._unsafeUnwrap()).toEqual({
      minPartySize: 1,
      maxPartySize: 10,
      defaultPartySize: 2,
      maxDaysAhead: 365,
      services: [
        { id: 8854, name: "Breakfast", start: "09:00" },
        { id: 8856, name: "Dinner", start: "18:00" },
      ],
      currency: "EUR",
      termsHtml: "<p>Please note we may require a valid credit card.</p>",
      privacyHtml: "",
      noAvailability: { message: null, phone: null },
      membership: { label: "Do It All ID", required: false },
      customField: null,
      stripe: {
        publishableKey: "pk_test_fixture",
        accountId: "acct_fixture",
        live: false,
      },
      paymentProvider: "stripe",
    });
    const [signIn, setup] = fake.requests;
    expect(signIn.body).toEqual({
      Username: "api-user",
      Password: "api-password",
    });
    expect(setup.path).toBe(`${RESTAURANT}/Setup`);
    expect(setup.search.get("date")).toBe("2026-10-23");
    expect(setup.search.get("channelCode")).toBe("ONLINE");
    expect(setup.authorization).toBe("Bearer token-1");
  });

  it("reads unlimited windows and missing minimums the ResDiary way", async function readsDefaults() {
    const fake = fakeResDiary({
      "POST /api/Jwt/v2/Authenticate": signedIn(),
      "GET /Setup": reply(200, {
        ...SETUP,
        AcceptBookingsDaysInAdvance: 0,
        MinOnlinePartySize: 0,
        OnlinePartySizeDefault: null,
        DisplayPhoneNumberWhenNoAvailability: true,
        ReservationPhoneNumber: "+353 1 676 3144",
        NoAvailabilityText: "Call us for later dates.",
        CustomField: { Name: "Website", IsRequired: true, Type: "Url" },
        StripeInfo: { IsEnabled: false },
        PaymentProvider: "GuestPay",
      }),
    });
    const provider = createResDiaryProvider({
      config: CONFIG,
      fetch: fake.fetch,
    });

    const rules = (
      await settle(provider.getRules("2026-10-23"))
    )._unsafeUnwrap();

    expect(rules).toMatchObject({
      minPartySize: 1,
      defaultPartySize: 1,
      maxDaysAhead: null,
      noAvailability: {
        message: "Call us for later dates.",
        phone: "+353 1 676 3144",
      },
      customField: { label: "Website", required: true, type: "url" },
      stripe: null,
      paymentProvider: "guestpay",
    });
  });

  it("refuses a malformed date before calling ResDiary", async function refusesBadDate() {
    const fake = fakeResDiary({});
    const provider = createResDiaryProvider({
      config: CONFIG,
      fetch: fake.fetch,
    });

    const result = await provider.getRules("23/10/2026");

    expect(result._unsafeUnwrapErr()).toMatchObject({
      kind: "rejected",
      fields: ["date"],
    });
    expect(fake.requests).toHaveLength(0);
  });

  it("shares one sign-in between requests that arrive together", async function sharesSignIn() {
    const fake = fakeResDiary({
      "POST /api/Jwt/v2/Authenticate": signedIn(),
      "GET /Setup": reply(200, SETUP),
    });
    const provider = createResDiaryProvider({
      config: CONFIG,
      fetch: fake.fetch,
    });

    await settle(
      Promise.all([
        provider.getRules("2026-10-23"),
        provider.getRules("2026-10-24"),
      ]),
    );

    expect(fake.count("POST /api/Jwt/v2/Authenticate")).toBe(1);
  });

  it("keeps the token until 5 minutes before its expiry, read as UTC", async function renewsBeforeExpiry() {
    const fake = fakeResDiary({
      "POST /api/Jwt/v2/Authenticate": [
        signedIn("token-1", "2026-10-15T09:00:00.6226871"),
        signedIn("token-2", "2026-10-16T09:00:00.0000000"),
      ],
      "GET /Setup": reply(200, SETUP),
    });
    const provider = createResDiaryProvider({
      config: CONFIG,
      fetch: fake.fetch,
    });

    await settle(provider.getRules("2026-10-23"));
    vi.setSystemTime(new Date("2026-10-15T08:54:00Z"));
    await settle(provider.getRules("2026-10-24"));
    expect(fake.count("POST /api/Jwt/v2/Authenticate")).toBe(1);

    vi.setSystemTime(new Date("2026-10-15T08:55:01Z"));
    await settle(provider.getRules("2026-10-25"));
    expect(fake.count("POST /api/Jwt/v2/Authenticate")).toBe(2);
    expect(fake.requests.at(-1)?.authorization).toBe("Bearer token-2");
  });

  it("keeps a token with an unusable expiry for one minute", async function shortLivedToken() {
    const fake = fakeResDiary({
      "POST /api/Jwt/v2/Authenticate": signedIn("token-1", ""),
      "GET /Setup": reply(200, SETUP),
    });
    const provider = createResDiaryProvider({
      config: CONFIG,
      fetch: fake.fetch,
    });

    await settle(provider.getRules("2026-10-23"));
    vi.setSystemTime(NOW.getTime() + 59_000);
    await settle(provider.getRules("2026-10-24"));
    expect(fake.count("POST /api/Jwt/v2/Authenticate")).toBe(1);

    vi.setSystemTime(NOW.getTime() + 61_000);
    await settle(provider.getRules("2026-10-25"));
    expect(fake.count("POST /api/Jwt/v2/Authenticate")).toBe(2);
  });

  it("pauses sign-in for a minute after ResDiary rejects the account", async function pausesAfterRejection() {
    const fake = fakeResDiary({
      "POST /api/Jwt/v2/Authenticate": [reply(401), signedIn()],
      "GET /Setup": reply(200, SETUP),
    });
    const provider = createResDiaryProvider({
      config: CONFIG,
      fetch: fake.fetch,
    });

    const first = await settle(provider.getRules("2026-10-23"));
    vi.setSystemTime(NOW.getTime() + 30_000);
    const second = await settle(provider.getRules("2026-10-23"));

    expect(first._unsafeUnwrapErr()).toMatchObject({ kind: "unavailable" });
    expect(second._unsafeUnwrapErr()).toMatchObject({ kind: "unavailable" });
    expect(fake.count("POST /api/Jwt/v2/Authenticate")).toBe(1);

    vi.setSystemTime(NOW.getTime() + 61_000);
    const third = await settle(provider.getRules("2026-10-23"));
    expect(third.isOk()).toBe(true);
  });

  it("treats a sign-in reply without Success as a rejected account", async function rejectsFailedStatus() {
    const fake = fakeResDiary({
      "POST /api/Jwt/v2/Authenticate": reply(200, { Status: "Failed" }),
      "GET /Setup": reply(200, SETUP),
    });
    const provider = createResDiaryProvider({
      config: CONFIG,
      fetch: fake.fetch,
    });

    await settle(provider.getRules("2026-10-23"));
    await settle(provider.getRules("2026-10-23"));

    expect(fake.count("POST /api/Jwt/v2/Authenticate")).toBe(1);
    expect(fake.count("GET /Setup")).toBe(0);
  });

  it("signs in again once and resends after a 401", async function resendsAfter401() {
    const fake = fakeResDiary({
      "POST /api/Jwt/v2/Authenticate": [
        signedIn("token-1"),
        signedIn("token-2"),
      ],
      "GET /Setup": [reply(401), reply(200, SETUP)],
    });
    const provider = createResDiaryProvider({
      config: CONFIG,
      fetch: fake.fetch,
    });

    const result = await settle(provider.getRules("2026-10-23"));

    expect(result.isOk()).toBe(true);
    expect(fake.count("POST /api/Jwt/v2/Authenticate")).toBe(2);
    expect(fake.requests.at(-1)?.authorization).toBe("Bearer token-2");
  });

  it("gives up after a second 401", async function givesUpAfterTwo401s() {
    const fake = fakeResDiary({
      "POST /api/Jwt/v2/Authenticate": signedIn(),
      "GET /Setup": reply(401),
    });
    const provider = createResDiaryProvider({
      config: CONFIG,
      fetch: fake.fetch,
    });

    const result = await settle(provider.getRules("2026-10-23"));

    expect(result._unsafeUnwrapErr()).toMatchObject({
      kind: "unavailable",
      httpStatus: 401,
    });
    expect(fake.count("GET /Setup")).toBe(2);
  });

  it("uses a token another request already renewed instead of signing in again", async function reusesRenewedToken() {
    const fake = fakeResDiary({
      "POST /api/Jwt/v2/Authenticate": [
        signedIn("token-1"),
        signedIn("token-2"),
      ],
      "GET /Setup": function byToken(request) {
        return request.authorization === "Bearer token-2"
          ? reply(200, SETUP)(request)
          : reply(401)(request);
      },
    });
    const provider = createResDiaryProvider({
      config: CONFIG,
      fetch: fake.fetch,
    });

    const results = await settle(
      Promise.all([
        provider.getRules("2026-10-23"),
        provider.getRules("2026-10-24"),
      ]),
    );

    expect(results.every((result) => result.isOk())).toBe(true);
    expect(fake.count("POST /api/Jwt/v2/Authenticate")).toBe(2);
  });
});

function loggedText(): string {
  return JSON.stringify([
    vi.mocked(console.log).mock.calls,
    vi.mocked(console.warn).mock.calls,
    vi.mocked(console.error).mock.calls,
  ]);
}

describe("getRules service start times", function serviceStartTests() {
  it.each([
    [{ TimeFrom: "18:00:00" }, "18:00"],
    [{ TimeFrom: null }, null],
    [{}, null],
    [{ TimeFrom: "six pm" }, null],
  ])(
    "reads TimeFrom %o as the service start %o, never failing Setup",
    async function readsStart(change, start) {
      const fake = fakeResDiary({
        "POST /api/Jwt/v2/Authenticate": signedIn(),
        "GET /Setup": reply(200, {
          ...SETUP,
          Services: [{ ServiceId: 8856, Name: "Dinner", ...change }],
        }),
      });
      const resdiary = createResDiaryProvider({
        config: CONFIG,
        fetch: fake.fetch,
      });

      const result = await settle(resdiary.getRules("2026-10-23"));

      expect(result._unsafeUnwrap().services).toEqual([
        { id: 8856, name: "Dinner", start },
      ]);
    },
  );
});

describe("reading from ResDiary", function readTransportTests() {
  function provider(setup: THandler | THandler[], config = CONFIG) {
    const fake = fakeResDiary({
      "POST /api/Jwt/v2/Authenticate": signedIn(),
      "GET /Setup": setup,
    });
    return {
      fake,
      provider: createResDiaryProvider({ config, fetch: fake.fetch }),
    };
  }

  it("retries a 5xx twice, then gives up", async function retries5xx() {
    const { fake, provider: resdiary } = provider(reply(503));

    const result = await settle(resdiary.getRules("2026-10-23"));

    expect(result._unsafeUnwrapErr()).toMatchObject({
      kind: "unavailable",
      httpStatus: 503,
    });
    expect(fake.count("GET /Setup")).toBe(3);
  });

  it("recovers when a retry succeeds", async function recoversOnRetry() {
    const { provider: resdiary } = provider([reply(503), reply(200, SETUP)]);

    const result = await settle(resdiary.getRules("2026-10-23"));

    expect(result.isOk()).toBe(true);
  });

  it("waits as long as Retry-After asks when that is longer than the back-off", async function honoursRetryAfter() {
    const { provider: resdiary } = provider([
      reply(429, undefined, { "retry-after": "2" }),
      reply(200, SETUP),
    ]);

    const result = await settle(resdiary.getRules("2026-10-23"));

    expect(result.isOk()).toBe(true);
    expect(Date.now() - NOW.getTime()).toBeGreaterThanOrEqual(2000);
  });

  it("reads Retry-After given as a date", async function readsRetryAfterDate() {
    const { provider: resdiary } = provider([
      reply(503, undefined, { "retry-after": "Thu, 15 Oct 2026 08:00:03 GMT" }),
      reply(200, SETUP),
    ]);

    await settle(resdiary.getRules("2026-10-23"));

    expect(Date.now() - NOW.getTime()).toBeGreaterThanOrEqual(3000);
  });

  it("fails at once when Retry-After is longer than the time left", async function failsOnLongRetryAfter() {
    const { fake, provider: resdiary } = provider(
      reply(429, undefined, { "retry-after": "30" }),
    );

    const result = await settle(resdiary.getRules("2026-10-23"));

    expect(result._unsafeUnwrapErr()).toMatchObject({ kind: "unavailable" });
    expect(fake.count("GET /Setup")).toBe(1);
  });

  it("retries network failures", async function retriesNetworkFailures() {
    const { fake, provider: resdiary } = provider([
      failsWith("ECONNRESET"),
      failsWith("ENOTFOUND"),
      reply(200, SETUP),
    ]);

    const result = await settle(resdiary.getRules("2026-10-23"));

    expect(result.isOk()).toBe(true);
    expect(fake.count("GET /Setup")).toBe(3);
  });

  it("gives up on a read after 4 seconds and does not retry a timeout", async function readTimeout() {
    const { fake, provider: resdiary } = provider(hangs());

    const result = await settle(resdiary.getRules("2026-10-23"));

    expect(result._unsafeUnwrapErr()).toMatchObject({
      kind: "unavailable",
      detail: "timeout",
    });
    expect(fake.count("GET /Setup")).toBe(1);
    expect(Date.now() - NOW.getTime()).toBe(4000);
  });

  it("stops at the caller's deadline", async function stopsAtDeadline() {
    const { provider: resdiary } = provider(hangs());

    const { result, at } = await settle(
      resdiary
        .getRules("2026-10-23", { deadlineAt: NOW.getTime() + 1500 })
        .then((value) => ({ result: value, at: Date.now() })),
    );

    expect(result._unsafeUnwrapErr()).toMatchObject({ kind: "unavailable" });
    expect(at - NOW.getTime()).toBe(1500);
  });

  it("treats an HTML error page as a failed read and never logs it", async function htmlErrorPage() {
    const { provider: resdiary } = provider(
      reply(502, "<html><body>Bad gateway</body></html>", {
        "content-type": "text/html",
      }),
    );

    const result = await settle(resdiary.getRules("2026-10-23"));

    expect(result._unsafeUnwrapErr()).toMatchObject({
      kind: "unavailable",
      httpStatus: 502,
    });
    expect(loggedText()).not.toContain("Bad gateway");
  });

  it("treats an empty 200 as unreadable", async function emptyReply() {
    const { fake, provider: resdiary } = provider(reply(200, ""));

    const result = await settle(resdiary.getRules("2026-10-23"));

    expect(result._unsafeUnwrapErr()).toMatchObject({ kind: "unavailable" });
    expect(fake.count("GET /Setup")).toBe(1);
  });

  it("names the unreadable field but never its value", async function schemaMismatch() {
    const { provider: resdiary } = provider(
      reply(200, { ...SETUP, MaxOnlinePartySize: "ten-guests" }),
    );

    const result = await settle(resdiary.getRules("2026-10-23"));

    expect(result._unsafeUnwrapErr()).toMatchObject({
      kind: "unavailable",
      detail: expect.stringContaining("MaxOnlinePartySize"),
    });
    expect(loggedText()).not.toContain("ten-guests");
  });

  it("returns the fields ResDiary rejected, without their messages", async function validationErrors() {
    const { provider: resdiary } = provider(
      reply(400, {
        Message: "The request is invalid.",
        ValidationErrors: [
          { PropertyName: "date", ErrorMessage: "secret detail one" },
          { PropertyName: "channelCode", ErrorMessage: "secret detail two" },
        ],
      }),
    );

    const result = await settle(resdiary.getRules("2026-10-23"));

    expect(result._unsafeUnwrapErr()).toMatchObject({
      kind: "rejected",
      fields: ["date", "channelCode"],
    });
    expect(loggedText()).not.toContain("secret detail");
  });

  it.each([
    [400, "error"],
    [404, "warn"],
  ] as const)(
    "logs a %i reply once, as %s",
    async function logsRefusal(status, level) {
      const { provider: resdiary } = provider(reply(status));

      await settle(resdiary.getRules("2026-10-23"));

      const other = level === "error" ? "warn" : "error";
      expect(console[level]).toHaveBeenCalledTimes(1);
      expect(console[other]).not.toHaveBeenCalled();
    },
  );

  it("maps 404 to not_found", async function notFound() {
    const { provider: resdiary } = provider(reply(404));

    const result = await settle(resdiary.getRules("2026-10-23"));

    expect(result._unsafeUnwrapErr()).toMatchObject({ kind: "not_found" });
  });

  it("removes the API account email from ResDiary's request id", async function redactsRequestId() {
    const { provider: resdiary } = provider(
      reply(500, {
        Message: "An unexpected error has occurred.",
        ApiRequestId: "2516102546915854596_90ca0217_api-account@example.test",
      }),
    );

    const result = await settle(resdiary.getRules("2026-10-23"));

    expect(result._unsafeUnwrapErr()).toMatchObject({
      requestId: "2516102546915854596_90ca0217",
    });
    expect(loggedText()).not.toContain("@example.test");
  });

  it("never logs credentials or the token", async function noSecretsInLogs() {
    const { provider: resdiary } = provider(reply(500));

    await settle(resdiary.getRules("2026-10-23"));

    const logged = loggedText();
    expect(logged).toContain("ResDiary request failed");
    expect(logged).not.toContain("api-password");
    expect(logged).not.toContain("api-user");
    expect(logged).not.toContain("token-1");
  });

  it("encodes the microsite name in the path", async function encodesMicrosite() {
    const { fake, provider: resdiary } = provider(reply(200, SETUP), {
      ...CONFIG,
      micrositeName: "Peploe's Test",
    });

    await settle(resdiary.getRules("2026-10-23"));

    expect(fake.requests.at(-1)?.path).toBe(
      "/api/ConsumerApi/v1/Restaurant/Peploe's%20Test/Setup",
    );
  });

  it("keeps a date's rules for 5 minutes", async function cachesRules() {
    const { fake, provider: resdiary } = provider(reply(200, SETUP));

    await settle(resdiary.getRules("2026-10-23"));
    await settle(resdiary.getRules("2026-10-23"));
    expect(fake.count("GET /Setup")).toBe(1);

    vi.setSystemTime(NOW.getTime() + 5 * 60_000 + 1);
    await settle(resdiary.getRules("2026-10-23"));
    expect(fake.count("GET /Setup")).toBe(2);
  });

  it("shares one Setup request between callers asking at once", async function sharesSetupRequest() {
    const { fake, provider: resdiary } = provider(reply(200, SETUP));

    await settle(
      Promise.all([
        resdiary.getRules("2026-10-23"),
        resdiary.getRules("2026-10-23"),
      ]),
    );

    expect(fake.count("GET /Setup")).toBe(1);
  });

  it("does not keep a failed read", async function doesNotCacheFailures() {
    const { fake, provider: resdiary } = provider([
      reply(503),
      reply(503),
      reply(503),
      reply(200, SETUP),
    ]);

    const first = await settle(resdiary.getRules("2026-10-23"));
    const second = await settle(resdiary.getRules("2026-10-23"));

    expect(first.isErr()).toBe(true);
    expect(second.isOk()).toBe(true);
    expect(fake.count("GET /Setup")).toBe(4);
  });
});

const DATE_RANGE = {
  AvailableDates: [
    {
      Date: "2026-10-22T00:00:00.0000000",
      AvailableTimes: [
        { TimeSlot: "09:00:00", ServiceId: 8854, AvailableAreaIds: [16148] },
        { TimeSlot: "1.00:15:00", ServiceId: 8856, AvailableAreaIds: [16148] },
      ],
      Areas: [{ Id: 16148, Name: "Main Restaurant", HasAvailability: true }],
    },
    { Date: "2026-10-23", AvailableTimes: [] },
  ],
  DateFrom: "2026-10-22",
  DateTo: "2026-10-24",
  NumberOfDaysReturned: 2,
  MissingDatesStart: null,
  MissingDatesEnd: null,
};

const TIME_SEARCH = {
  StandardAvailabilityMayRequireCreditCard: true,
  TimeSlots: [
    {
      TimeSlot: "2026-10-23T12:30:00",
      IsLeaveTimeRequired: false,
      LeaveTime: null,
      ServiceId: 8855,
      HasStandardAvailability: true,
      AvailablePromotions: [],
      StandardAvailabilityFeeAmount: 0,
    },
    {
      TimeSlot: "2026-10-23T18:30:00",
      IsLeaveTimeRequired: true,
      LeaveTime: "20:00:00",
      ServiceId: 8856,
      HasStandardAvailability: false,
      AvailablePromotions: [{ Id: 3041 }],
      StandardAvailabilityFeeAmount: 0,
    },
    {
      TimeSlot: "2026-10-23T22:00:00",
      IsLeaveTimeRequired: true,
      LeaveTime: "1.00:30:00",
      ServiceId: 8856,
      HasStandardAvailability: true,
      AvailablePromotions: [],
      StandardAvailabilityFeeAmount: 19.99,
    },
  ],
};

describe("getAvailableDates", function getAvailableDatesTests() {
  function provider(range: THandler) {
    const fake = fakeResDiary({
      "POST /api/Jwt/v2/Authenticate": signedIn(),
      "POST /AvailabilityForDateRangeV2": range,
    });
    return {
      fake,
      provider: createResDiaryProvider({ config: CONFIG, fetch: fake.fetch }),
    };
  }

  it("sends the range and returns each date's times", async function mapsRange() {
    const { fake, provider: resdiary } = provider(reply(200, DATE_RANGE));

    const result = await settle(
      resdiary.getAvailableDates({
        from: "2026-10-22",
        to: "2026-10-24",
        partySize: 2,
      }),
    );

    expect(result._unsafeUnwrap()).toEqual({
      dates: [
        {
          date: "2026-10-22",
          times: [
            { time: "09:00", nextDay: false },
            { time: "00:15", nextDay: true },
          ],
        },
        { date: "2026-10-23", times: [] },
      ],
      missing: null,
    });
    expect(fake.requests.at(-1)?.body).toEqual({
      DateFrom: "2026-10-22T00:00:00",
      DateTo: "2026-10-24T00:00:00",
      PartySize: 2,
      ChannelCode: "ONLINE",
      AvailabilityType: "Reservation",
    });
  });

  it("reports the part of the range ResDiary left out", async function reportsMissing() {
    const { provider: resdiary } = provider(
      reply(200, {
        ...DATE_RANGE,
        MissingDatesStart: "2026-11-01T00:00:00",
        MissingDatesEnd: "2026-11-30",
      }),
    );

    const result = await settle(
      resdiary.getAvailableDates({
        from: "2026-10-22",
        to: "2026-11-30",
        partySize: 2,
      }),
    );

    expect(result._unsafeUnwrap().missing).toEqual({
      from: "2026-11-01",
      to: "2026-11-30",
    });
  });

  it.each([
    [{ from: "2026-10-22", to: "2027-02-19", partySize: 2 }, ["to"]],
    [{ from: "2026-10-24", to: "2026-10-22", partySize: 2 }, ["to"]],
    [{ from: "22-10-2026", to: "2026-10-24", partySize: 2 }, ["from"]],
    [{ from: "2026-10-22", to: "2026-10-24", partySize: 0 }, ["partySize"]],
    [{ from: "2026-10-22", to: "2026-10-24", partySize: 2.5 }, ["partySize"]],
  ])(
    "refuses %o before calling ResDiary",
    async function refusesInput(input, fields) {
      const { fake, provider: resdiary } = provider(reply(200, DATE_RANGE));

      const result = await resdiary.getAvailableDates(input);

      expect(result._unsafeUnwrapErr()).toMatchObject({
        kind: "rejected",
        fields,
      });
      expect(fake.requests).toHaveLength(0);
    },
  );

  it("accepts a range of exactly 120 days", async function accepts120Days() {
    const { provider: resdiary } = provider(reply(200, DATE_RANGE));

    const result = await settle(
      resdiary.getAvailableDates({
        from: "2026-10-22",
        to: "2027-02-18",
        partySize: 2,
      }),
    );

    expect(result.isOk()).toBe(true);
  });

  it.each([
    [{ AvailableDates: [{ Date: "2026-11-31", AvailableTimes: [] }] }],
    [
      {
        MissingDatesStart: "2026-12-00T00:00:00",
        MissingDatesEnd: "2026-12-05",
      },
    ],
    [{ MissingDatesStart: "2026-12-01", MissingDatesEnd: "2026-02-30" }],
  ])(
    "treats an impossible date in %o as an unreadable reply",
    async function impossibleRangeDate(change) {
      const { provider: resdiary } = provider(
        reply(200, { ...DATE_RANGE, ...change }),
      );

      const result = await settle(
        resdiary.getAvailableDates({
          from: "2026-10-22",
          to: "2026-10-24",
          partySize: 2,
        }),
      );

      expect(result._unsafeUnwrapErr()).toMatchObject({ kind: "unavailable" });
    },
  );

  it("treats an unreadable time as an unreadable reply", async function unreadableTime() {
    const { provider: resdiary } = provider(
      reply(200, {
        ...DATE_RANGE,
        AvailableDates: [
          { Date: "2026-10-22", AvailableTimes: [{ TimeSlot: "noon" }] },
        ],
      }),
    );

    const result = await settle(
      resdiary.getAvailableDates({
        from: "2026-10-22",
        to: "2026-10-24",
        partySize: 2,
      }),
    );

    expect(result._unsafeUnwrapErr()).toMatchObject({ kind: "unavailable" });
  });
});

describe("searchTimes", function searchTimesTests() {
  function provider(search: THandler) {
    const fake = fakeResDiary({
      "POST /api/Jwt/v2/Authenticate": signedIn(),
      "POST /AvailabilitySearch": search,
    });
    return {
      fake,
      provider: createResDiaryProvider({ config: CONFIG, fetch: fake.fetch }),
    };
  }

  it("returns each slot in our own formats", async function mapsSlots() {
    const { fake, provider: resdiary } = provider(reply(200, TIME_SEARCH));

    const result = await settle(
      resdiary.searchTimes({ date: "2026-10-23", partySize: 9 }),
    );

    expect(result._unsafeUnwrap()).toEqual({
      mayRequireCard: true,
      slots: [
        {
          date: "2026-10-23",
          time: "12:30",
          serviceId: 8855,
          standard: true,
          feeCents: 0,
          leaveTimeRequired: false,
          leaveTime: null,
        },
        {
          date: "2026-10-23",
          time: "18:30",
          serviceId: 8856,
          standard: false,
          feeCents: 0,
          leaveTimeRequired: true,
          leaveTime: { time: "20:00", nextDay: false },
        },
        {
          date: "2026-10-23",
          time: "22:00",
          serviceId: 8856,
          standard: true,
          feeCents: 1999,
          leaveTimeRequired: true,
          leaveTime: { time: "00:30", nextDay: true },
        },
      ],
    });
    expect(fake.requests.at(-1)?.body).toEqual({
      VisitDate: "2026-10-23",
      PartySize: 9,
      ChannelCode: "ONLINE",
      AvailabilityType: "Reservation",
    });
  });

  it("reads a €20 deposit as 2000 cents", async function readsDeposit() {
    const slot = {
      ...TIME_SEARCH.TimeSlots[0],
      StandardAvailabilityFeeAmount: 20,
    };
    const { provider: resdiary } = provider(reply(200, { TimeSlots: [slot] }));

    const result = await settle(
      resdiary.searchTimes({ date: "2026-10-23", partySize: 2 }),
    );

    expect(result._unsafeUnwrap()).toMatchObject({
      mayRequireCard: false,
      slots: [{ feeCents: 2000 }],
    });
  });

  it("reads a missing fee as no deposit", async function readsNoFee() {
    const slot = {
      ...TIME_SEARCH.TimeSlots[0],
      StandardAvailabilityFeeAmount: null,
    };
    const { provider: resdiary } = provider(reply(200, { TimeSlots: [slot] }));

    const result = await settle(
      resdiary.searchTimes({ date: "2026-10-23", partySize: 2 }),
    );

    expect(result._unsafeUnwrap().slots).toMatchObject([{ feeCents: 0 }]);
  });

  it("refuses a malformed date before calling ResDiary", async function refusesBadDate() {
    const { fake, provider: resdiary } = provider(reply(200, TIME_SEARCH));

    const result = await resdiary.searchTimes({
      date: "2026-10-23T00:00",
      partySize: 2,
    });

    expect(result._unsafeUnwrapErr()).toMatchObject({
      kind: "rejected",
      fields: ["date"],
    });
    expect(fake.requests).toHaveLength(0);
  });
});

const HOLD = {
  BookingId: 425740,
  ExpiryTimestamp: "2026-10-15T08:05:00.4343581Z",
  BookingReference: "B79XNW76",
};
const RESDIARY_CLOCK = { date: "Thu, 15 Oct 2026 08:00:00 GMT" };
const HOLD_INPUT = { date: "2026-10-23", time: "19:30", partySize: 2 };

describe("createHold", function createHoldTests() {
  function provider(hold: THandler | THandler[], signIn = signedIn()) {
    const fake = fakeResDiary({
      "POST /api/Jwt/v2/Authenticate": signIn,
      "POST /CreateTableHold": hold,
    });
    return {
      fake,
      provider: createResDiaryProvider({ config: CONFIG, fetch: fake.fetch }),
    };
  }

  it("holds the table and times the hold on ResDiary's clock", async function holdsTable() {
    const { fake, provider: resdiary } = provider(
      reply(200, HOLD, RESDIARY_CLOCK),
    );

    const result = await settle(resdiary.createHold(HOLD_INPUT));

    expect(result._unsafeUnwrap()).toEqual({
      holdId: 425740,
      reference: "B79XNW76",
      expiresAt: Date.parse("2026-10-15T08:05:00.434Z"),
      expiresInMs: 300_434 - 1000,
    });
    expect(fake.requests.at(-1)?.body).toEqual({
      VisitDate: "2026-10-23",
      VisitTime: "19:30:00",
      PartySize: 2,
      ChannelCode: "ONLINE",
    });
  });

  it("is not fooled by our own clock running fast", async function ignoresOwnClockDrift() {
    vi.setSystemTime(NOW.getTime() + 40_000);
    const { provider: resdiary } = provider(reply(200, HOLD, RESDIARY_CLOCK));

    const result = await settle(resdiary.createHold(HOLD_INPUT));

    expect(result._unsafeUnwrap().expiresInMs).toBe(300_434 - 1000);
  });

  it("falls back to our clock when ResDiary sends no Date header", async function usesOwnClockWithoutHeader() {
    const { provider: resdiary } = provider(reply(200, HOLD));

    const result = await settle(resdiary.createHold(HOLD_INPUT));

    expect(result._unsafeUnwrap().expiresInMs).toBe(300_434);
  });

  it.each([
    ["with no expiry", { ...HOLD, ExpiryTimestamp: null }],
    ["with an unreadable expiry", { ...HOLD, ExpiryTimestamp: "soon" }],
    [
      "with an expiry already past",
      { ...HOLD, ExpiryTimestamp: "2026-10-15T07:59:00Z" },
    ],
    [
      "with an expiry two hours away",
      { ...HOLD, ExpiryTimestamp: "2026-10-15T10:00:00Z" },
    ],
    ["for a reference with spaces", { ...HOLD, BookingReference: "B9 GX;x" }],
  ])(
    "reports a hold reply %s as an unknown outcome",
    async function unusableExpiry(_label, body) {
      const { provider: resdiary } = provider(reply(200, body, RESDIARY_CLOCK));

      const result = await settle(resdiary.createHold(HOLD_INPUT));

      expect(result._unsafeUnwrapErr()).toMatchObject({
        kind: "outcome_unknown",
        operation: "createHold",
      });
    },
  );

  it("reports an expiry on an impossible date as an unknown outcome", async function impossibleExpiryDate() {
    vi.setSystemTime(Date.parse("2026-12-01T08:00:00Z"));
    const { provider: resdiary } = provider(
      reply(200, { ...HOLD, ExpiryTimestamp: "2026-11-31T08:05:00Z" }),
    );

    const result = await settle(resdiary.createHold(HOLD_INPUT));

    expect(result._unsafeUnwrapErr()).toMatchObject({
      kind: "outcome_unknown",
      operation: "createHold",
    });
  });

  it("never retries, and reports ResDiary's 500 as an unknown outcome", async function noRetryOn500() {
    const { fake, provider: resdiary } = provider(
      reply(500, {
        Message: "An unexpected error has occurred (id: 7d64c386).",
        ValidationErrors: null,
        ApiRequestId: "2516102546915854596_90ca0217_api-account@example.test",
      }),
    );

    const result = await settle(resdiary.createHold(HOLD_INPUT));

    expect(result._unsafeUnwrapErr()).toEqual({
      kind: "outcome_unknown",
      operation: "createHold",
      httpStatus: 500,
      requestId: "2516102546915854596_90ca0217",
    });
    expect(fake.count("POST /CreateTableHold")).toBe(1);
  });

  it("waits for a slow write until the deadline, then reports an unknown outcome", async function writeTimeout() {
    const { provider: resdiary } = provider(hangs());

    const result = await settle(resdiary.createHold(HOLD_INPUT));

    expect(result._unsafeUnwrapErr()).toMatchObject({
      kind: "outcome_unknown",
      detail: "timeout",
    });
    expect(Date.now() - NOW.getTime()).toBeGreaterThan(7000);
  });

  it("reports a request that never left as unavailable", async function notSent() {
    const { fake, provider: resdiary } = provider(failsWith("ENOTFOUND"));

    const result = await settle(resdiary.createHold(HOLD_INPUT));

    expect(result._unsafeUnwrapErr()).toMatchObject({
      kind: "unavailable",
      detail: "ENOTFOUND",
    });
    expect(fake.count("POST /CreateTableHold")).toBe(1);
  });

  it("reports a connection lost after sending as an unknown outcome", async function lostAfterSending() {
    const { provider: resdiary } = provider(failsWith("ECONNRESET"));

    const result = await settle(resdiary.createHold(HOLD_INPUT));

    expect(result._unsafeUnwrapErr()).toMatchObject({
      kind: "outcome_unknown",
    });
  });

  it("treats 429 on a write as refused, without retrying", async function refusedWrite() {
    const { fake, provider: resdiary } = provider(reply(429));

    const result = await settle(resdiary.createHold(HOLD_INPUT));

    expect(result._unsafeUnwrapErr()).toMatchObject({ kind: "unavailable" });
    expect(fake.count("POST /CreateTableHold")).toBe(1);
  });

  it("resends a write once after a 401", async function resendsWriteAfter401() {
    const { fake, provider: resdiary } = provider(
      [reply(401), reply(200, HOLD, RESDIARY_CLOCK)],
      signedIn(),
    );

    const result = await settle(resdiary.createHold(HOLD_INPUT));

    expect(result.isOk()).toBe(true);
    expect(fake.count("POST /CreateTableHold")).toBe(2);
  });

  it("refuses a time that is not HH:mm before calling ResDiary", async function refusesBadTime() {
    const { fake, provider: resdiary } = provider(reply(200, HOLD));

    const result = await resdiary.createHold({ ...HOLD_INPUT, time: "7:30pm" });

    expect(result._unsafeUnwrapErr()).toMatchObject({
      kind: "rejected",
      fields: ["time"],
    });
    expect(fake.requests).toHaveLength(0);
  });
});

const MOVE_INPUT = {
  holdId: 425740,
  date: "2026-10-23",
  time: "12:30",
  partySize: 2,
};

describe("changeHold", function changeHoldTests() {
  function provider(move: THandler | THandler[]) {
    const fake = fakeResDiary({
      "POST /api/Jwt/v2/Authenticate": signedIn(),
      "PUT /UpdateTableHoldBookingDetails": move,
    });
    return {
      fake,
      provider: createResDiaryProvider({ config: CONFIG, fetch: fake.fetch }),
    };
  }

  it("moves the hold to the new slot and reads back its expiry", async function movesHold() {
    const { fake, provider: resdiary } = provider(
      reply(200, { ExpiryTimestamp: "2026-10-15T08:05:00.4343581Z" }),
    );

    const result = await settle(resdiary.changeHold(MOVE_INPUT));

    expect(result._unsafeUnwrap()).toEqual({
      expiresAt: Date.parse("2026-10-15T08:05:00.434Z"),
    });
    expect(fake.requests.at(-1)).toMatchObject({
      method: "PUT",
      body: {
        BookingId: 425740,
        VisitDate: "2026-10-23",
        VisitTime: "12:30:00",
        PartySize: 2,
        ChannelCode: "ONLINE",
      },
    });
  });

  it("counts an empty 200 as moved, with no expiry", async function emptyReply() {
    const { provider: resdiary } = provider(reply(200));

    const result = await settle(resdiary.changeHold(MOVE_INPUT));

    expect(result._unsafeUnwrap()).toEqual({ expiresAt: null });
  });

  it("never retries, and reports ResDiary's 500 as an unknown outcome", async function noRetryOn500() {
    const { fake, provider: resdiary } = provider(
      reply(500, {
        Message: "An unexpected error has occurred (id: 891fce84).",
        ValidationErrors: null,
        ApiRequestId: "2516099135231110919_3ed4873b_api-account@example.test",
      }),
    );

    const result = await settle(resdiary.changeHold(MOVE_INPUT));

    expect(result._unsafeUnwrapErr()).toEqual({
      kind: "outcome_unknown",
      operation: "changeHold",
      httpStatus: 500,
      requestId: "2516099135231110919_3ed4873b",
    });
    expect(fake.count("PUT /UpdateTableHoldBookingDetails")).toBe(1);
  });

  it("reports a move that timed out as an unknown outcome", async function timeout() {
    const { provider: resdiary } = provider(hangs());

    const result = await settle(resdiary.changeHold(MOVE_INPUT));

    expect(result._unsafeUnwrapErr()).toMatchObject({
      kind: "outcome_unknown",
      detail: "timeout",
    });
  });

  it.each([
    [404, "not_found"],
    [400, "rejected"],
  ])("reports %i as %s", async function refused(status, kind) {
    const { provider: resdiary } = provider(
      reply(status, { ValidationErrors: [{ Field: "VisitTime" }] }),
    );

    const result = await settle(resdiary.changeHold(MOVE_INPUT));

    expect(result._unsafeUnwrapErr()).toMatchObject({ kind });
  });

  it("logs a 404 on a hold write as an error, since ResDiary answers a lost hold with 500", async function writeNotFound() {
    const { provider: resdiary } = provider(reply(404));

    await settle(resdiary.changeHold(MOVE_INPUT));

    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it.each([
    ["a hold id of 0", { ...MOVE_INPUT, holdId: 0 }, "holdId"],
    ["the time 25:00", { ...MOVE_INPUT, time: "25:00" }, "time"],
  ])(
    "refuses %s before calling ResDiary",
    async function refusesInput(_case, input, field) {
      const { fake, provider: resdiary } = provider(reply(200));

      const result = await resdiary.changeHold(input);

      expect(result._unsafeUnwrapErr()).toMatchObject({
        kind: "rejected",
        fields: [field],
      });
      expect(fake.requests).toHaveLength(0);
    },
  );
});

const GUEST_PATH = "/api/Restaurant/PeploesTest/UpdateTableHoldWithCustomer";
const GUEST_INPUT = {
  holdId: 425742,
  guest: { firstName: "Test", surname: "Guest", email: "guest@example.test" },
  specialRequests: "Window seat please",
  returnUrl: "https://peploes.example/booking/return",
  cancelUrl: "https://peploes.example/booking/cancel",
};
const GUEST_REPLY = {
  CustomerId: 604935,
  WasExistingCustomer: true,
  IsCustomerBlocked: false,
  Booking: {
    BookingId: 425742,
    Reference: "B9GXWPLY",
    VisitDate: "2026-10-23",
    VisitTime: "19:30",
    PartySize: 2,
    Customer: {
      FirstName: "Test",
      Surname: "Guest",
      Email: "guest@example.test",
    },
  },
  PaymentAmount: 0,
  FormattedPaymentAmount: "€0.00",
  StripePublishableKey: null,
  StripeAccountId: null,
  PaymentIntentSecret: null,
  SetupIntentClientSecret: null,
  PaymentProviderType: null,
  GuestPayHostedPageUrl: null,
  Errors: null,
};
const STRIPE_REPLY = {
  StripePublishableKey: "pk_test_fixture",
  StripeAccountId: "acct_fixture",
  PaymentProviderType: "Stripe",
};

describe("submitHoldGuest", function submitHoldGuestTests() {
  function provider(guest: THandler | THandler[]) {
    const fake = fakeResDiary({
      "POST /api/Jwt/v2/Authenticate": signedIn(),
      "PUT /UpdateTableHoldWithCustomer": guest,
    });
    return {
      fake,
      provider: createResDiaryProvider({ config: CONFIG, fetch: fake.fetch }),
    };
  }

  it.each([
    [
      "a guest's detail, as a warning",
      [{ PropertyName: "Customer.Email", ErrorMessage: "invalid" }],
      "warn",
    ],
    ["nothing it names, as an error", null, "error"],
  ] as const)(
    "logs ResDiary refusing %s",
    async function logsGuestRefusal(_case, validationErrors, level) {
      const { provider: resdiary } = provider(
        reply(400, { ValidationErrors: validationErrors }),
      );

      await settle(resdiary.submitHoldGuest(GUEST_INPUT));

      const other = level === "error" ? "warn" : "error";
      expect(console[level]).toHaveBeenCalledTimes(1);
      expect(console[other]).not.toHaveBeenCalled();
    },
  );

  it("sends the guest to the hold on ResDiary's unprefixed path", async function sendsGuest() {
    const { fake, provider: resdiary } = provider(
      reply(200, { ...GUEST_REPLY, Status: "Success" }),
    );

    const result = await settle(resdiary.submitHoldGuest(GUEST_INPUT));

    expect(result._unsafeUnwrap()).toEqual({
      kind: "confirmed",
      reference: "B9GXWPLY",
    });
    const request = fake.requests.at(-1);
    expect(request?.method).toBe("PUT");
    expect(request?.path).toBe(GUEST_PATH);
    expect(request?.body).toEqual({
      BookingId: 425742,
      Customer: {
        FirstName: "Test",
        Surname: "Guest",
        Email: "guest@example.test",
      },
      SpecialRequests: "Window seat please",
      RedirectUrl: "https://peploes.example/booking/return",
      CancelUrl: "https://peploes.example/booking/cancel",
    });
  });

  it("adds a mobile only when the guest gave one, and leaves out empty requests", async function optionalFields() {
    const { fake, provider: resdiary } = provider(
      reply(200, { ...GUEST_REPLY, Status: "Success" }),
    );

    await settle(
      resdiary.submitHoldGuest({
        ...GUEST_INPUT,
        guest: {
          ...GUEST_INPUT.guest,
          mobile: "871234567",
          mobileCountryCode: 353,
        },
        specialRequests: undefined,
      }),
    );

    expect(fake.requests.at(-1)?.body).toEqual({
      BookingId: 425742,
      Customer: {
        FirstName: "Test",
        Surname: "Guest",
        Email: "guest@example.test",
        Mobile: "871234567",
        MobileCountryCode: 353,
      },
      RedirectUrl: "https://peploes.example/booking/return",
      CancelUrl: "https://peploes.example/booking/cancel",
    });
  });

  it("returns the deposit and its Stripe payment step", async function paymentRequired() {
    const { provider: resdiary } = provider(
      reply(200, {
        ...GUEST_REPLY,
        ...STRIPE_REPLY,
        Status: "PaymentRequired",
        PaymentAmount: 20,
        FormattedPaymentAmount: "€20.00",
        PaymentIntentSecret: "pi_fixture_secret_one",
      }),
    );

    const result = await settle(resdiary.submitHoldGuest(GUEST_INPUT));

    expect(result._unsafeUnwrap()).toEqual({
      kind: "payment",
      amountCents: 2000,
      amountText: "€20.00",
      stripe: {
        publishableKey: "pk_test_fixture",
        accountId: "acct_fixture",
        clientSecret: "pi_fixture_secret_one",
      },
    });
  });

  it("returns the card-saving step for a card guarantee", async function cardRequired() {
    const { provider: resdiary } = provider(
      reply(200, {
        ...GUEST_REPLY,
        ...STRIPE_REPLY,
        Status: "CreditCardRequired",
        SetupIntentClientSecret: "seti_fixture_secret_one",
      }),
    );

    const result = await settle(resdiary.submitHoldGuest(GUEST_INPUT));

    expect(result._unsafeUnwrap()).toEqual({
      kind: "card",
      amountText: "€0.00",
      stripe: {
        publishableKey: "pk_test_fixture",
        accountId: "acct_fixture",
        clientSecret: "seti_fixture_secret_one",
      },
    });
  });

  it.each([
    ["TableConflict", { kind: "table_taken" }],
    ["CustomerBlocked", { kind: "guest_blocked" }],
  ])("maps %s", async function mapsRefusals(status, expected) {
    const { provider: resdiary } = provider(
      reply(200, { ...GUEST_REPLY, Status: status }),
    );

    const result = await settle(resdiary.submitHoldGuest(GUEST_INPUT));

    expect(result._unsafeUnwrap()).toEqual(expected);
  });

  it("refuses a payment it cannot take, without logging the secret", async function paymentUnsupported() {
    const { provider: resdiary } = provider(
      reply(200, {
        ...GUEST_REPLY,
        Status: "PaymentRequired",
        PaymentIntentSecret: "pi_fixture_secret_two",
        StripePublishableKey: null,
      }),
    );

    const result = await settle(resdiary.submitHoldGuest(GUEST_INPUT));

    expect(result._unsafeUnwrapErr()).toMatchObject({
      kind: "payment_unsupported",
    });
    expect(loggedText()).not.toContain("pi_fixture_secret_two");
  });

  it("refuses a hosted GuestPay page", async function guestPayUnsupported() {
    const { provider: resdiary } = provider(
      reply(200, {
        ...GUEST_REPLY,
        ...STRIPE_REPLY,
        Status: "CreditCardRequired",
        SetupIntentClientSecret: "seti_fixture_secret_two",
        GuestPayHostedPageUrl: "https://guestpay.example/page",
      }),
    );

    const result = await settle(resdiary.submitHoldGuest(GUEST_INPUT));

    expect(result._unsafeUnwrapErr()).toMatchObject({
      kind: "payment_unsupported",
    });
  });

  it.each([
    ["an unknown status", { ...GUEST_REPLY, Status: "PaymentFailed" }],
    [
      "Success without a reference",
      { ...GUEST_REPLY, Status: "Success", Booking: null },
    ],
  ])(
    "reports %s as an unknown outcome",
    async function unknownOutcome(_label, body) {
      const { provider: resdiary } = provider(reply(200, body));

      const result = await settle(resdiary.submitHoldGuest(GUEST_INPUT));

      expect(result._unsafeUnwrapErr()).toMatchObject({
        kind: "outcome_unknown",
        operation: "submitHoldGuest",
      });
    },
  );

  it("sends once and reports a reply that never came as an unknown outcome", async function noReply() {
    const { fake, provider: resdiary } = provider(hangs());

    const result = await settle(resdiary.submitHoldGuest(GUEST_INPUT));

    expect(result._unsafeUnwrapErr()).toMatchObject({
      kind: "outcome_unknown",
    });
    expect(fake.count("PUT /UpdateTableHoldWithCustomer")).toBe(1);
  });

  it("never logs the guest's details", async function noGuestDataInLogs() {
    const { provider: resdiary } = provider(reply(500));

    await settle(resdiary.submitHoldGuest(GUEST_INPUT));

    const logged = loggedText();
    expect(logged).toContain("ResDiary request failed");
    expect(logged).not.toContain("guest@example.test");
    expect(logged).not.toContain("Window seat");
  });

  it.each([
    [{ ...GUEST_INPUT, holdId: 0 }, ["holdId"]],
    [
      { ...GUEST_INPUT, guest: { ...GUEST_INPUT.guest, email: " " } },
      ["email"],
    ],
    [
      { ...GUEST_INPUT, guest: { ...GUEST_INPUT.guest, firstName: "" } },
      ["firstName"],
    ],
  ])(
    "refuses missing details before calling ResDiary",
    async function refusesInput(input, fields) {
      const { fake, provider: resdiary } = provider(reply(200, GUEST_REPLY));

      const result = await resdiary.submitHoldGuest(input);

      expect(result._unsafeUnwrapErr()).toMatchObject({
        kind: "rejected",
        fields,
      });
      expect(fake.requests).toHaveLength(0);
    },
  );
});

describe("getHoldStatus", function getHoldStatusTests() {
  function provider(status: THandler | THandler[]) {
    const fake = fakeResDiary({
      "POST /api/Jwt/v2/Authenticate": signedIn(),
      "GET /TableHoldBookingStatus/425742": status,
    });
    return {
      fake,
      provider: createResDiaryProvider({ config: CONFIG, fetch: fake.fetch }),
    };
  }

  it.each([
    ["Pending", "pending"],
    ["Confirmed", "confirmed"],
    ["Failed", "failed"],
    ["Cancelled", "cancelled"],
    ["Rescheduled", "unknown"],
  ])("maps %s to %s", async function mapsStatus(status, expected) {
    const { provider: resdiary } = provider(
      reply(200, {
        Status: status,
        Booking: { Reference: "B9GXWPLY", BookingId: 425742 },
      }),
    );

    const result = await settle(resdiary.getHoldStatus(425742));

    expect(result._unsafeUnwrap()).toEqual({
      status: expected,
      reference: "B9GXWPLY",
    });
  });

  it("warns once about a status it does not know, naming it", async function warnsUnknownStatus() {
    const { provider: resdiary } = provider(
      reply(200, { Status: "Rescheduled", Booking: { Reference: "B9GXWPLY" } }),
    );

    await settle(resdiary.getHoldStatus(425742));

    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(loggedText()).toContain("ResDiary sent an unknown hold status");
    expect(loggedText()).toContain("Rescheduled");
  });

  it("maps 404 to not_found", async function notFound() {
    const { provider: resdiary } = provider(reply(404));

    const result = await settle(resdiary.getHoldStatus(425742));

    expect(result._unsafeUnwrapErr()).toMatchObject({ kind: "not_found" });
  });

  it("leaves retrying to the next poll", async function noRetry() {
    const { fake, provider: resdiary } = provider(reply(503));

    const result = await settle(resdiary.getHoldStatus(425742));

    expect(result._unsafeUnwrapErr()).toMatchObject({ kind: "unavailable" });
    expect(fake.count("GET /TableHoldBookingStatus/425742")).toBe(1);
  });

  it("refuses a hold id that is not a positive whole number", async function refusesBadId() {
    const { fake, provider: resdiary } = provider(reply(200, {}));

    const result = await resdiary.getHoldStatus(-1);

    expect(result._unsafeUnwrapErr()).toMatchObject({
      kind: "rejected",
      fields: ["holdId"],
    });
    expect(fake.requests).toHaveLength(0);
  });
});

describe("review fixes", function reviewFixTests() {
  it("returns a failure instead of throwing when something unexpected breaks", async function catchesUnexpected() {
    const fake = fakeResDiary({ "POST /api/Jwt/v2/Authenticate": signedIn() });
    const resdiary = createResDiaryProvider({
      config: CONFIG,
      fetch: fake.fetch,
    });
    const broken = {
      ...GUEST_INPUT,
      guest: undefined,
    } as unknown as typeof GUEST_INPUT;

    const result = await settle(resdiary.submitHoldGuest(broken));

    expect(result._unsafeUnwrapErr()).toMatchObject({
      kind: "outcome_unknown",
      operation: "submitHoldGuest",
    });
    expect(loggedText()).toContain("ResDiary request failed");
  });

  it("logs and reports an unexpected exception once, with its stack but no guest details", async function keepsDiagnostics() {
    const fake = fakeResDiary({ "POST /api/Jwt/v2/Authenticate": signedIn() });
    const resdiary = createResDiaryProvider({
      config: CONFIG,
      fetch: fake.fetch,
    });
    const broken = {
      ...GUEST_INPUT,
      guest: { firstName: "Unloggable", surname: "Guest" },
    } as unknown as typeof GUEST_INPUT;

    const result = await settle(resdiary.submitHoldGuest(broken));

    expect(result._unsafeUnwrapErr()).toMatchObject({
      kind: "outcome_unknown",
      operation: "submitHoldGuest",
    });
    const logged = loggedText();
    expect(logged).toContain("reading 'trim'");
    expect(logged).toContain("resdiary-provider");
    expect(logged).not.toContain("Unloggable");
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(logToSentry).toHaveBeenCalledTimes(1);
    expect(logToSentry).toHaveBeenCalledWith(
      expect.any(TypeError),
      expect.objectContaining({
        context: {
          operation_data: {
            provider: "resdiary",
            operation: "submitHoldGuest",
          },
        },
      }),
    );
  });

  it("does not report a failed ResDiary reply to Sentry", async function noSentryForReplies() {
    const fake = fakeResDiary({
      "POST /api/Jwt/v2/Authenticate": signedIn(),
      "GET /Setup": reply(503),
    });
    const resdiary = createResDiaryProvider({
      config: CONFIG,
      fetch: fake.fetch,
    });

    await settle(resdiary.getRules("2026-10-23"));

    expect(logToSentry).not.toHaveBeenCalled();
  });

  it("ignores a trailing slash on the API URL", async function trailingSlash() {
    const fake = fakeResDiary({
      "POST /api/Jwt/v2/Authenticate": signedIn(),
      "GET /Setup": reply(200, SETUP),
    });
    const resdiary = createResDiaryProvider({
      config: { ...CONFIG, apiUrl: "https://api.example.test/" },
      fetch: fake.fetch,
    });

    await settle(resdiary.getRules("2026-10-23"));

    expect(fake.requests.map((request) => request.path)).toEqual([
      "/api/Jwt/v2/Authenticate",
      `${RESTAURANT}/Setup`,
    ]);
  });

  it("keeps only the id part of a request id, even when the email has underscores", async function redactsUnderscoredEmail() {
    const fake = fakeResDiary({
      "POST /api/Jwt/v2/Authenticate": signedIn(),
      "GET /Setup": reply(500, {
        ApiRequestId: "2516_90ca0217_peploes_api@example.test",
      }),
    });
    const resdiary = createResDiaryProvider({
      config: CONFIG,
      fetch: fake.fetch,
    });

    const result = await settle(resdiary.getRules("2026-10-23"));

    expect(result._unsafeUnwrapErr()).toMatchObject({
      requestId: "2516_90ca0217",
    });
    expect(loggedText()).not.toContain("peploes_api");
  });

  it("does not mistake built-in object keys for hold statuses", async function prototypeKeys() {
    const fake = fakeResDiary({
      "POST /api/Jwt/v2/Authenticate": signedIn(),
      "GET /TableHoldBookingStatus/425742": reply(200, {
        Status: "constructor",
      }),
    });
    const resdiary = createResDiaryProvider({
      config: CONFIG,
      fetch: fake.fetch,
    });

    const result = await settle(resdiary.getHoldStatus(425742));

    expect(result._unsafeUnwrap().status).toBe("unknown");
  });

  it("does not pause sign-in after a 403, which can come from a firewall", async function noPauseOn403() {
    const fake = fakeResDiary({
      "POST /api/Jwt/v2/Authenticate": [
        reply(403, "<html>Blocked</html>"),
        signedIn(),
      ],
      "GET /Setup": reply(200, SETUP),
    });
    const resdiary = createResDiaryProvider({
      config: CONFIG,
      fetch: fake.fetch,
    });

    const first = await settle(resdiary.getRules("2026-10-23"));
    const second = await settle(resdiary.getRules("2026-10-23"));

    expect(first.isErr()).toBe(true);
    expect(second.isOk()).toBe(true);
  });
});

describe("second review fixes", function secondReviewFixTests() {
  it("lets a caller with more time outlast a shared Setup request", async function sharedLoadDeadline() {
    const fake = fakeResDiary({
      "POST /api/Jwt/v2/Authenticate": signedIn(),
      "GET /Setup": delayed(3500, reply(200, SETUP)),
    });
    const resdiary = createResDiaryProvider({
      config: CONFIG,
      fetch: fake.fetch,
    });

    const [hurried, patient] = await settle(
      Promise.all([
        resdiary.getRules("2026-10-23", { deadlineAt: NOW.getTime() + 3000 }),
        resdiary.getRules("2026-10-23"),
      ]),
    );

    expect(hurried._unsafeUnwrapErr()).toMatchObject({ kind: "unavailable" });
    expect(patient.isOk()).toBe(true);
    expect(fake.count("GET /Setup")).toBe(1);
  });

  it("takes the time the hold reply spent travelling off the timer", async function subtractsTransit() {
    const fake = fakeResDiary({
      "POST /api/Jwt/v2/Authenticate": signedIn(),
      "POST /CreateTableHold": delayed(3000, reply(200, HOLD, RESDIARY_CLOCK)),
    });
    const resdiary = createResDiaryProvider({
      config: CONFIG,
      fetch: fake.fetch,
    });

    const result = await settle(resdiary.createHold(HOLD_INPUT));

    expect(result._unsafeUnwrap().expiresInMs).toBe(300_434 - 1000 - 3000);
  });
});

describe("getClosedDates", function getClosedDatesTests() {
  function provider(closed: THandler | THandler[]) {
    const fake = fakeResDiary({
      "POST /api/Jwt/v2/Authenticate": signedIn(),
      "GET /ClosedDates": closed,
    });
    return {
      fake,
      provider: createResDiaryProvider({ config: CONFIG, fetch: fake.fetch }),
    };
  }

  it("reads ResDiary's closed weekdays as numbers, 0 = Sunday", async function readsWeekdays() {
    const { fake, provider: resdiary } = provider(
      reply(200, { ClosedDays: ["Monday"], ClosedPeriods: [] }),
    );

    const result = await settle(resdiary.getClosedDates());

    expect(result._unsafeUnwrap()).toEqual({
      closedWeekdays: [1],
      closedPeriods: [],
    });
    expect(fake.requests.at(-1)?.path).toBe(`${RESTAURANT}/ClosedDates`);
  });

  it("reads closed periods and skips ones it cannot read", async function readsPeriods() {
    const { provider: resdiary } = provider(
      reply(200, {
        ClosedDays: ["sunday", "Funday", "Monday"],
        ClosedPeriods: [
          {
            StartDate: "2026-12-24T00:00:00",
            EndDate: "2026-12-26T00:00:00.0000000",
          },
          { Begins: "2027-01-01" },
          { StartDate: "2027-02-01", EndDate: "2027-01-31" },
        ],
      }),
    );

    const result = await settle(resdiary.getClosedDates());

    expect(result._unsafeUnwrap()).toEqual({
      closedWeekdays: [0, 1],
      closedPeriods: [{ from: "2026-12-24", to: "2026-12-26" }],
    });
    expect(loggedText()).toContain(
      "ResDiary sent closed dates the provider skipped",
    );
  });

  it("skips a closed period with an impossible date", async function skipsImpossiblePeriod() {
    const { provider: resdiary } = provider(
      reply(200, {
        ClosedDays: [],
        ClosedPeriods: [
          { StartDate: "2026-12-00", EndDate: "2026-12-26" },
          { StartDate: "2026-11-30", EndDate: "2026-11-31T00:00:00" },
          { StartDate: "2027-01-01", EndDate: "2027-01-02" },
        ],
      }),
    );

    const result = await settle(resdiary.getClosedDates());

    expect(result._unsafeUnwrap().closedPeriods).toEqual([
      { from: "2027-01-01", to: "2027-01-02" },
    ]);
  });

  it("reads empty or missing lists as nothing closed", async function readsEmpty() {
    const { provider: resdiary } = provider(reply(200, {}));

    const result = await settle(resdiary.getClosedDates());

    expect(result._unsafeUnwrap()).toEqual({
      closedWeekdays: [],
      closedPeriods: [],
    });
  });

  it("keeps closed dates for 5 minutes", async function cachesClosedDates() {
    const { fake, provider: resdiary } = provider(
      reply(200, { ClosedDays: ["Monday"], ClosedPeriods: [] }),
    );

    await settle(resdiary.getClosedDates());
    await settle(resdiary.getClosedDates());
    expect(fake.count("GET /ClosedDates")).toBe(1);

    vi.setSystemTime(NOW.getTime() + 5 * 60_000 + 1);
    await settle(resdiary.getClosedDates());
    expect(fake.count("GET /ClosedDates")).toBe(2);
  });

  it("reports a failed read as unavailable", async function failsCleanly() {
    const { provider: resdiary } = provider(reply(503));

    const result = await settle(resdiary.getClosedDates());

    expect(result._unsafeUnwrapErr()).toMatchObject({
      kind: "unavailable",
      operation: "getClosedDates",
    });
  });
});

describe("searchTimes with one unreadable slot", function badSlotTests() {
  it("drops that slot with a warning and keeps the rest", async function dropsBadSlot() {
    const fake = fakeResDiary({
      "POST /api/Jwt/v2/Authenticate": signedIn(),
      "POST /AvailabilitySearch": reply(200, {
        ...TIME_SEARCH,
        TimeSlots: [
          TIME_SEARCH.TimeSlots[0],
          { ...TIME_SEARCH.TimeSlots[2], TimeSlot: "sample string 3" },
          { ...TIME_SEARCH.TimeSlots[2], TimeSlot: "2026-02-30T22:00:00" },
          { ...TIME_SEARCH.TimeSlots[2], LeaveTime: "25:99" },
          TIME_SEARCH.TimeSlots[2],
        ],
      }),
    });
    const resdiary = createResDiaryProvider({
      config: CONFIG,
      fetch: fake.fetch,
    });

    const result = await settle(
      resdiary.searchTimes({ date: "2026-10-23", partySize: 2 }),
    );

    expect(result._unsafeUnwrap().slots.map((slot) => slot.time)).toEqual([
      "12:30",
      "22:00",
    ]);
    expect(loggedText()).toContain("ResDiary sent unreadable time slots");
  });
});
