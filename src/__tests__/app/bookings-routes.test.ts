import { err, ok } from "neverthrow";
import { afterEach, describe, expect, it, vi } from "vitest";

import { fakeCookieStore } from "@/__tests__/mocks/cookie-store";
import {
  ALLOW_HOLDS,
  DINNER,
  FRIDAY,
  fakeProvider,
  HOLD,
  HOLD_SECRET,
  NOVEMBER_OPEN,
  service,
  setUpBookingTests,
} from "@/__tests__/services/bookings/fixtures";
import { storeHoldToken } from "@/lib/booking-cookie";
import { ErrorCode } from "@/lib/enums";
import type { IHoldCookieStore, TBookingProvider } from "@/lib/types";

const edges = vi.hoisted(() => ({
  provider: null as TBookingProvider | null,
  cookieStore: null as IHoldCookieStore | null,
}));

vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve(edges.cookieStore),
}));
vi.mock("@/lib/resdiary-provider", () => ({
  get resdiary() {
    return edges.provider;
  },
}));
vi.mock("@/lib/error-handler", () => ({ logToSentry: vi.fn() }));

setUpBookingTests();

afterEach(function resetEnv() {
  vi.unstubAllEnvs();
});

const COOKIE = "peploes_booking_hold_B9GXWPLY";

function setUp(provider = fakeProvider()) {
  const browser = fakeCookieStore();
  edges.provider = provider;
  edges.cookieStore = browser.store;
  vi.stubEnv("BOOKING_HOLD_SECRET", HOLD_SECRET);
  vi.resetModules();
  return { provider, browser };
}

function get(path: string) {
  return new Request(`http://localhost${path}`);
}

describe("GET /api/bookings/times", function timesRouteTests() {
  it("answers the day's times, never cached", async function times() {
    setUp();
    const { GET } = await import("@/app/api/bookings/times/route");

    const response = await GET(
      get(`/api/bookings/times?date=${FRIDAY}&partySize=2`),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({
      ok: true,
      data: expect.objectContaining({ date: FRIDAY, partySize: 2 }),
    });
  });

  it("answers 422 with the field's message for a bad query", async function badQuery() {
    setUp();
    const { GET } = await import("@/app/api/bookings/times/route");

    const response = await GET(
      get("/api/bookings/times?date=23-10-2026&partySize=2"),
    );

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({
      ok: false,
      error: {
        code: ErrorCode.ValidationError,
        message: "Choose a date.",
        fieldErrors: { date: "Choose a date." },
      },
    });
  });

  it("answers 503 when ResDiary cannot be read", async function down() {
    const provider = fakeProvider();
    provider.searchTimes.mockResolvedValue(
      err({ kind: "unavailable", operation: "searchTimes" }),
    );
    setUp(provider);
    const { GET } = await import("@/app/api/bookings/times/route");

    const response = await GET(
      get(`/api/bookings/times?date=${FRIDAY}&partySize=2`),
    );

    expect(response.status).toBe(503);
  });
});

describe("with online booking off", function bookingOffTests() {
  it.each([
    ["times", `/api/bookings/times?date=${FRIDAY}&partySize=2`],
    [
      "calendar",
      "/api/bookings/calendar?from=2026-11-01&to=2026-11-30&partySize=2",
    ],
    [
      "hold-status",
      `/api/bookings/hold-status?holdReference=${HOLD.reference}&holdRevision=1`,
    ],
  ])(
    "%s answers 503 without asking ResDiary",
    async function bookingOff(route, path) {
      const { provider } = setUp();
      vi.stubEnv("BOOKING_HOLD_SECRET", "");
      vi.resetModules();
      const { GET } = await import(`@/app/api/bookings/${route}/route`);

      const response = await GET(get(path));

      expect(response.status).toBe(503);
      expect(provider.getRules).not.toHaveBeenCalled();
      expect(provider.getHoldStatus).not.toHaveBeenCalled();
    },
  );
});

describe("GET /api/bookings/calendar", function calendarRouteTests() {
  it("answers the month's open days", async function calendar() {
    setUp();
    const { GET } = await import("@/app/api/bookings/calendar/route");

    const response = await GET(
      get("/api/bookings/calendar?from=2026-11-01&to=2026-11-30&partySize=2"),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({
      ok: true,
      data: expect.objectContaining({
        from: "2026-11-01",
        to: "2026-11-30",
        openDates: NOVEMBER_OPEN,
      }),
    });
  });

  it("answers 422 for a range longer than the calendar shows", async function tooLong() {
    const { provider } = setUp();
    const { GET } = await import("@/app/api/bookings/calendar/route");

    const response = await GET(
      get("/api/bookings/calendar?from=2026-11-01&to=2026-12-13&partySize=2"),
    );

    expect(response.status).toBe(422);
    expect(provider.getAvailableDates).not.toHaveBeenCalled();
  });
});

describe("GET /api/bookings/hold-status", function holdStatusRouteTests() {
  function statusFor(holdReference: string) {
    return get(
      `/api/bookings/hold-status?holdReference=${holdReference}&holdRevision=1`,
    );
  }

  async function holding(status: "pending" | "confirmed" | "failed") {
    const { provider, browser } = setUp();
    const hold = await service(provider).holdTable(DINNER, ALLOW_HOLDS);
    const { holdToken, cookieMaxAgeSeconds } = hold._unsafeUnwrap();
    storeHoldToken(
      browser.store,
      HOLD.reference,
      holdToken,
      cookieMaxAgeSeconds,
    );
    provider.getHoldStatus.mockResolvedValue(
      ok({ status, reference: HOLD.reference }),
    );
    return { cookies: browser.cookies, provider };
  }

  it("answers 404 and deletes a cookie it cannot read", async function unreadable() {
    const { browser } = setUp();
    storeHoldToken(browser.store, HOLD.reference, "not-a-signed-token", 600);
    const { GET } = await import("@/app/api/bookings/hold-status/route");

    const response = await GET(statusFor(HOLD.reference));

    expect(response.status).toBe(404);
    expect(browser.cookies.has(COOKIE)).toBe(false);
  });

  it("answers 404 when the browser has no hold", async function noHold() {
    setUp();
    const { GET } = await import("@/app/api/bookings/hold-status/route");

    const response = await GET(statusFor(HOLD.reference));

    expect(response.status).toBe(404);
  });

  it("keeps the cookie while ResDiary is still confirming", async function pending() {
    const { cookies } = await holding("pending");
    const { GET } = await import("@/app/api/bookings/hold-status/route");

    const response = await GET(statusFor(HOLD.reference));

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toMatchObject({
      ok: true,
      data: { status: "pending" },
    });
    expect(cookies.has(COOKIE)).toBe(true);
  });

  it("leaves this hold's cookie alone when asked about a hold the browser does not have", async function otherTab() {
    const { cookies, provider } = await holding("failed");
    provider.getHoldStatus.mockClear();
    const { GET } = await import("@/app/api/bookings/hold-status/route");

    const response = await GET(statusFor("BOTHERTAB"));

    expect(response.status).toBe(404);
    expect(cookies.has(COOKIE)).toBe(true);
    expect(provider.getHoldStatus).not.toHaveBeenCalled();
  });

  it("forgets a hold ResDiary has dropped", async function failed() {
    const { cookies } = await holding("failed");
    const { GET } = await import("@/app/api/bookings/hold-status/route");

    const response = await GET(statusFor(HOLD.reference));

    expect(await response.json()).toMatchObject({
      ok: true,
      data: { status: "failed" },
    });
    expect(cookies.has(COOKIE)).toBe(false);
  });

  it("answers 503 and keeps the cookie when ResDiary cannot be read", async function down() {
    const { cookies, provider } = await holding("pending");
    provider.getHoldStatus.mockResolvedValue(
      err({ kind: "unavailable", operation: "getHoldStatus" }),
    );
    const { GET } = await import("@/app/api/bookings/hold-status/route");

    const response = await GET(statusFor(HOLD.reference));

    expect(response.status).toBe(503);
    expect(cookies.has(COOKIE)).toBe(true);
  });

  it("forgets the hold once ResDiary has confirmed the booking", async function confirmed() {
    const { cookies } = await holding("confirmed");
    const { GET } = await import("@/app/api/bookings/hold-status/route");

    const response = await GET(statusFor(HOLD.reference));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      ok: true,
      data: { status: "confirmed", reference: "B9GXWPLY" },
    });
    expect(cookies.has(COOKIE)).toBe(false);
  });
});
