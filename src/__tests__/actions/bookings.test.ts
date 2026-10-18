import { err, ok } from "neverthrow";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fakeCookieStore } from "@/__tests__/mocks/cookie-store";
import {
  ALLOW_HOLDS,
  DINNER,
  fakeProvider,
  GUEST_DETAILS,
  HOLD_SECRET,
  LUNCH,
  NOW,
  STRIPE_STEP,
  setUpBookingTests,
} from "@/__tests__/services/bookings/fixtures";
import { ErrorCode } from "@/lib/enums";
import type {
  IHoldCookieStore,
  TBookingProvider,
  TResDiaryFailure,
  TResDiaryGuestOutcome,
} from "@/lib/types";

const edges = vi.hoisted(() => ({
  provider: null as TBookingProvider | null,
  cookieStore: null as IHoldCookieStore | null,
  forwardedFor: "203.0.113.7" as string | null,
  allowHold: null as ((forwardedFor: string | null) => Promise<boolean>) | null,
}));

vi.mock("next/headers", () => ({
  cookies: () =>
    edges.cookieStore
      ? Promise.resolve(edges.cookieStore)
      : Promise.reject(new Error("cookies() was called outside a request")),
  headers: () =>
    Promise.resolve(
      new Headers(
        edges.forwardedFor ? { "x-forwarded-for": edges.forwardedFor } : {},
      ),
    ),
}));
vi.mock("@/lib/resdiary-provider", () => ({
  get resdiary() {
    return edges.provider;
  },
}));
vi.mock("@/lib/rate-limit-provider", () => ({
  allowHold: (forwardedFor: string | null) => edges.allowHold?.(forwardedFor),
}));
vi.mock("@/lib/error-handler", () => ({ logToSentry: vi.fn() }));

setUpBookingTests();

const COOKIE = "peploes_booking_hold";

async function holdTableAction() {
  vi.resetModules();
  const { holdTable } = await import("@/actions/bookings");
  return holdTable;
}

function setUp() {
  const provider = fakeProvider();
  const browser = fakeCookieStore();
  const allowHold = vi.fn(ALLOW_HOLDS);
  edges.provider = provider;
  edges.cookieStore = browser.store;
  edges.allowHold = allowHold;
  vi.stubEnv("BOOKING_HOLD_SECRET", HOLD_SECRET);
  return { provider, cookies: browser.cookies, allowHold };
}

beforeEach(function resetEdges() {
  edges.provider = null;
  edges.cookieStore = null;
  edges.allowHold = null;
  edges.forwardedFor = "203.0.113.7";
});

afterEach(function resetEnv() {
  vi.unstubAllEnvs();
});

describe("the holdTable action", function holdTableActionTests() {
  it("keeps the token in the httpOnly cookie and sends the page only what it shows", async function holds() {
    const { cookies } = setUp();
    const holdTable = await holdTableAction();

    const response = await holdTable(DINNER);

    expect(response).toStrictEqual({
      ok: true,
      data: {
        expiresInMs: 298_200,
        summary: expect.objectContaining({
          reference: "B9GXWPLY",
          timeLabel: "7:30 pm",
        }),
      },
    });
    expect(cookies.get(COOKIE)).toEqual({
      value: expect.stringMatching(/^[\w-]+\.[\w-]+$/),
      options: expect.objectContaining({ httpOnly: true, maxAge: 1199 }),
    });
    expect(JSON.stringify(response)).not.toContain(cookies.get(COOKIE)?.value);
  });

  it("asks the limit with this request's IP and writes no cookie when it refuses", async function overLimit() {
    const { provider, cookies, allowHold } = setUp();
    allowHold.mockResolvedValue(false);
    edges.forwardedFor = "198.51.100.20";
    const holdTable = await holdTableAction();

    const response = await holdTable(DINNER);

    expect(response).toStrictEqual({
      ok: false,
      error: {
        code: ErrorCode.ServiceUnavailable,
        message:
          "Online booking isn't available right now. Please call us on +353 1 676 3144 or email reception@peploes.ie.",
      },
    });
    expect(allowHold).toHaveBeenCalledWith("198.51.100.20");
    expect(provider.createHold).not.toHaveBeenCalled();
    expect(cookies.size).toBe(0);
  });

  it("hands back the cookie's hold on a later click, without asking the limit again", async function reuses() {
    const { provider, cookies, allowHold } = setUp();
    const holdTable = await holdTableAction();

    const first = await holdTable(DINNER);
    const token = cookies.get(COOKIE)?.value;
    vi.setSystemTime(NOW.getTime() + 60_000);
    const second = await holdTable(DINNER);

    expect(second).toMatchObject({
      ok: true,
      data: { expiresInMs: 238_200, summary: { reference: "B9GXWPLY" } },
    });
    expect(first).toMatchObject({
      data: { summary: { reference: "B9GXWPLY" } },
    });
    expect(cookies.get(COOKIE)).toMatchObject({
      value: token,
      options: { maxAge: 1139 },
    });
    expect(allowHold).toHaveBeenCalledTimes(1);
    expect(provider.createHold).toHaveBeenCalledTimes(1);
  });

  it("leaves an earlier hold's cookie alone when the limit refuses a new one", async function keepsEarlierHold() {
    const { cookies, allowHold } = setUp();
    const holdTable = await holdTableAction();
    await holdTable(LUNCH);
    const lunchToken = cookies.get(COOKIE)?.value;
    allowHold.mockResolvedValue(false);

    const response = await holdTable(DINNER);

    expect(response).toMatchObject({
      ok: false,
      error: { code: ErrorCode.ServiceUnavailable },
    });
    expect(cookies.get(COOKIE)?.value).toBe(lunchToken);
  });

  it("asks the limit without an IP when the request has none", async function noIp() {
    const { allowHold } = setUp();
    edges.forwardedFor = null;
    const holdTable = await holdTableAction();

    await holdTable(DINNER);

    expect(allowHold).toHaveBeenCalledWith(null);
  });

  it("sends field errors as plain data, beside the field they belong to", async function fieldErrors() {
    setUp();
    const holdTable = await holdTableAction();

    const response = await holdTable({ ...DINNER, time: "25:00" });

    expect(response).toStrictEqual({
      ok: false,
      error: {
        code: ErrorCode.ValidationError,
        message: "Choose a time.",
        fieldErrors: { time: "Choose a time." },
      },
    });
  });

  it("answers with a safe message, never a throw, when the request breaks", async function crash() {
    setUp();
    edges.cookieStore = null;
    const holdTable = await holdTableAction();

    const response = await holdTable(DINNER);

    expect(response).toStrictEqual({
      ok: false,
      error: {
        code: ErrorCode.InternalError,
        message: expect.any(String),
      },
    });
    expect(JSON.stringify(response)).not.toContain("outside a request");
  });
});

describe("the submitGuestDetails action", function guestDetailsActionTests() {
  async function held() {
    const edgesSetUp = setUp();
    vi.resetModules();
    const actions = await import("@/actions/bookings");
    await actions.holdTable(DINNER);
    return { ...edgesSetUp, actions };
  }

  it("books the table, forgets the hold and sends the confirmation", async function confirms() {
    const { cookies, actions } = await held();

    const response = await actions.submitGuestDetails(GUEST_DETAILS);

    expect(response).toStrictEqual({
      ok: true,
      data: {
        kind: "confirmed",
        reference: "B9GXWPLY",
        summary: expect.objectContaining({ timeLabel: "7:30 pm" }),
      },
    });
    expect(cookies.has(COOKIE)).toBe(false);
  });

  it("keeps the hold while the guest pays, sending Stripe's step", async function payment() {
    const { provider, cookies, actions } = await held();
    provider.submitHoldGuest.mockResolvedValue(
      ok<TResDiaryGuestOutcome, TResDiaryFailure>({
        kind: "payment",
        amountCents: 2000,
        amountText: "€20.00",
        stripe: STRIPE_STEP,
      }),
    );

    const response = await actions.submitGuestDetails(GUEST_DETAILS);

    expect(response).toMatchObject({
      ok: true,
      data: { kind: "payment", amountText: "€20.00", stripe: STRIPE_STEP },
    });
    expect(cookies.has(COOKIE)).toBe(true);
  });

  it.each([
    [
      "forgets the hold when ResDiary has lost it",
      { ...GUEST_DETAILS },
      err<TResDiaryGuestOutcome, TResDiaryFailure>({
        kind: "not_found",
        operation: "submitHoldGuest",
      }),
      {
        code: ErrorCode.HoldExpired,
        message: "Your table hold ran out. Please choose a time again.",
      },
      false,
    ],
    [
      "keeps the cookie for a form from another tab",
      { ...GUEST_DETAILS, holdReference: "BOTHERTAB" },
      null,
      {
        code: ErrorCode.NotFound,
        message:
          "Your booking changed in another tab. Please start again here.",
      },
      true,
    ],
    [
      "keeps the hold while the guest fixes a field",
      { ...GUEST_DETAILS, email: "not-an-email" },
      null,
      {
        code: ErrorCode.ValidationError,
        message: "Please enter a valid email address.",
        fieldErrors: { email: "Please enter a valid email address." },
      },
      true,
    ],
  ])("%s", async function failures(_case, details, reply, error, kept) {
    const { provider, cookies, actions } = await held();
    if (reply) {
      provider.submitHoldGuest.mockResolvedValue(reply);
    }

    const response = await actions.submitGuestDetails(details);

    expect(response).toStrictEqual({ ok: false, error });
    expect(cookies.has(COOKIE)).toBe(kept);
  });
});
