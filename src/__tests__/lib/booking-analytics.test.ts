import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GA4Event } from "@/lib/enums";
import { installFakeBrowser } from "../helpers/browser";

vi.mock("@/lib/env", () => ({
  isProduction: () => true,
  env: {
    NEXT_PUBLIC_GA_MEASUREMENT_ID: "G-BOOKING",
  },
}));

beforeEach(() => vi.resetModules());
afterEach(() => vi.unstubAllGlobals());

describe("booking funnel", () => {
  it("correlates stages with an opaque attempt and never sends the reference or guest fields", async () => {
    const browser = installFakeBrowser();
    const booking = await import("@/lib/analytics/booking");
    const attemptId = booking.beginBookingSearch();
    booking.bindBookingAttempt("ABC12345", attemptId);
    booking.trackBooking(GA4Event.BookingHold, "succeeded", {
      reference: "ABC12345",
      ...{
        firstName: "Synthetic Guest",
        email: "synthetic@example.test",
        mobile: "0871234567",
        specialRequests: "private request",
      },
    });
    const [, name, params] = browser.gtag.mock.calls[0];
    expect(name).toBe("booking_hold");
    expect(params).toMatchObject({
      attempt_id: attemptId,
      result: "succeeded",
      error_code: "NONE",
    });
    expect(JSON.stringify(params)).not.toMatch(
      /ABC12345|Synthetic|synthetic|0871234567|private request/,
    );
    expect(attemptId).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it("keeps a recovered hold's attempt across reloads and confirms it once", async () => {
    const browser = installFakeBrowser();
    const booking = await import("@/lib/analytics/booking");
    const attempt = booking.beginBookingSearch();
    booking.bindBookingAttempt("ABC12345", attempt);
    await booking.trackBookingConfirmed("ABC12345");
    vi.resetModules();
    const restored = await import("@/lib/analytics/booking");
    browser.session.clear();
    restored.resumeBookingAttempt("ABC12345");
    restored.trackBooking(GA4Event.BookingAvailability, "available");
    restored.trackBooking(GA4Event.BookingRecovery, "confirmed", {
      reference: "ABC12345",
    });
    await restored.trackBookingConfirmed("ABC12345");
    expect(
      browser.gtag.mock.calls.filter((call) => call[1] === "booking_confirmed"),
    ).toHaveLength(1);
    expect(browser.gtag.mock.calls.at(-1)?.[2]).toMatchObject({
      attempt_id: attempt,
    });
  });

  it("a failed transport does not permanently suppress a recovered confirmation", async () => {
    const browser = installFakeBrowser();
    browser.gtag.mockImplementationOnce(() => {
      throw new Error("blocked transport");
    });
    const booking = await import("@/lib/analytics/booking");
    booking.bindBookingAttempt("ABC12345", booking.beginBookingSearch());
    await booking.trackBookingConfirmed("ABC12345");
    vi.resetModules();
    const recovered = await import("@/lib/analytics/booking");
    await recovered.trackBookingConfirmed("ABC12345");
    await recovered.trackBookingConfirmed("ABC12345");
    expect(browser.gtag).toHaveBeenCalledTimes(2);
  });

  it("an unavailable cross-tab lock cannot interrupt a confirmed booking", async () => {
    const browser = installFakeBrowser();
    vi.stubGlobal("navigator", {
      locks: {
        request() {
          throw new Error("Storage access denied");
        },
      },
    });
    const booking = await import("@/lib/analytics/booking");
    expect(() => booking.trackBookingConfirmed("ABC12345")).not.toThrow();
    expect(browser.gtag).toHaveBeenCalledOnce();
  });

  it("does not turn payment acceptance into a confirmed booking", async () => {
    const browser = installFakeBrowser();
    const booking = await import("@/lib/analytics/booking");
    booking.trackBooking(GA4Event.BookingPayment, "accepted", {
      paymentKind: "deposit",
    });
    expect(browser.gtag.mock.calls.map((call) => call[1])).toEqual([
      "booking_payment",
    ]);
  });

  it("keeps events safe and usable when browser storage is blocked", async () => {
    const browser = installFakeBrowser({ blockSessionStorage: true });
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("blocked");
      },
    });
    const booking = await import("@/lib/analytics/booking");
    await booking.trackBookingConfirmed("ABC12345");
    await booking.trackBookingConfirmed("ABC12345");
    expect(
      browser.gtag.mock.calls.filter((call) => call[1] === "booking_confirmed"),
    ).toHaveLength(1);
  });
});
