import { err, ok } from "neverthrow";
import { describe, expect, it, vi } from "vitest";

import {
  fakeProvider,
  NOVEMBER_OPEN,
  NOW,
  openDays,
  rulesOn,
  service,
  setUpBookingTests,
} from "@/__tests__/services/bookings/fixtures";
import { ErrorCode } from "@/lib/enums";
import { logToSentry } from "@/lib/error-handler";
import { createBookingService } from "@/services/bookings";

vi.mock("@/lib/error-handler", () => ({ logToSentry: vi.fn() }));

setUpBookingTests();

const NOVEMBER = { from: "2026-11-01", to: "2026-11-30", partySize: "2" };

describe("getCalendarDays", function calendarDaysTests() {
  it("lists the open days of the month on screen", async function listsOpenDays() {
    const provider = fakeProvider();

    const result = await service(provider).getCalendarDays(NOVEMBER);

    expect(result._unsafeUnwrap()).toEqual({
      from: "2026-11-01",
      to: "2026-11-30",
      partySize: 2,
      openDates: NOVEMBER_OPEN,
    });
    expect(provider.getAvailableDates).toHaveBeenCalledWith(
      { from: "2026-11-01", to: "2026-11-30", partySize: 2 },
      { deadlineAt: NOW.getTime() + 8000 },
    );
  });

  it("asks only from today when the month began in the past", async function startsToday() {
    const provider = fakeProvider();

    await service(provider).getCalendarDays({
      ...NOVEMBER,
      from: "2026-10-01",
      to: "2026-10-31",
    });

    expect(provider.getAvailableDates).toHaveBeenCalledWith(
      { from: "2026-10-15", to: "2026-10-31", partySize: 2 },
      expect.anything(),
    );
  });

  it("asks only up to the last bookable day", async function stopsAtLastDate() {
    const provider = fakeProvider({ maxDaysAhead: 30 });

    await service(provider).getCalendarDays(NOVEMBER);

    expect(provider.getAvailableDates).toHaveBeenCalledWith(
      { from: "2026-11-01", to: "2026-11-14", partySize: 2 },
      expect.anything(),
    );
  });

  it.each([
    ["already past", { from: "2026-09-01", to: "2026-09-30" }, {}],
    [
      "past the last bookable day",
      { from: "2026-12-01", to: "2026-12-31" },
      { maxDaysAhead: 30 },
    ],
  ])(
    "answers no open days for a month %s, without asking ResDiary",
    async function outsideWindow(_case, month, rules) {
      const provider = fakeProvider(rules);

      const result = await service(provider).getCalendarDays({
        ...NOVEMBER,
        ...month,
      });

      expect(result._unsafeUnwrap().openDates).toEqual([]);
      expect(provider.getAvailableDates).not.toHaveBeenCalled();
    },
  );

  it("keeps only days inside the range that have times and are not closed", async function filtersDays() {
    const provider = fakeProvider();
    provider.getAvailableDates.mockResolvedValue(
      ok({
        dates: [
          { date: "2026-11-02", times: [{ time: "19:30", nextDay: false }] },
          { date: "2026-11-03", times: [] },
          { date: "2026-11-04", times: [{ time: "19:30", nextDay: false }] },
          { date: "2026-12-01", times: [{ time: "19:30", nextDay: false }] },
          { date: "2026-11-04", times: [{ time: "20:00", nextDay: false }] },
        ],
        missing: null,
      }),
    );

    const result = await service(provider).getCalendarDays(NOVEMBER);

    expect(result._unsafeUnwrap().openDates).toEqual(["2026-11-04"]);
  });

  it("warns when ResDiary leaves part of the range unchecked", async function warnsOnMissing() {
    const provider = fakeProvider();
    provider.getAvailableDates.mockResolvedValue(
      ok({
        ...openDays(NOVEMBER_OPEN),
        missing: { from: "2026-11-20", to: "2026-11-30" },
      }),
    );

    const result = await service(provider).getCalendarDays(NOVEMBER);

    expect(result._unsafeUnwrap().openDates).toEqual(NOVEMBER_OPEN);
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  describe("checking the request", function requestTests() {
    it.each([
      ["a date that is not a date", { from: "1/11/2026" }, "date"],
      ["an end before the start", { to: "2026-10-31" }, "date"],
      ["more than six weeks", { to: "2026-12-31" }, "date"],
      ["a guest count that is not a number", { partySize: "abc" }, "partySize"],
    ])(
      "refuses %s before asking ResDiary",
      async function refuses(_case, change, field) {
        const provider = fakeProvider();

        const result = await service(provider).getCalendarDays({
          ...NOVEMBER,
          ...change,
        });

        const error = result._unsafeUnwrapErr();
        expect(error.code).toBe(ErrorCode.ValidationError);
        expect(Object.keys(error.fieldErrors ?? {})).toEqual([field]);
        expect(provider.getAvailableDates).not.toHaveBeenCalled();
      },
    );

    it.each([
      ["exactly six weeks", "2026-12-12", true],
      ["a day over six weeks", "2026-12-13", false],
    ])(
      "a grid of %s from 1 November is read: %s",
      async function sixWeekGrid(_case, to, accepted) {
        const provider = fakeProvider();

        const result = await service(provider).getCalendarDays({
          ...NOVEMBER,
          to,
        });

        expect(result.isOk()).toBe(accepted);
        expect(provider.getAvailableDates).toHaveBeenCalledTimes(
          accepted ? 1 : 0,
        );
      },
    );

    it("lets the range decide a future month when only today's limits are stricter", async function todaysLimitsAreNotGlobal() {
      const provider = fakeProvider();
      rulesOn(provider, "2026-10-15", { maxPartySize: 2 });

      const result = await service(provider).getCalendarDays({
        ...NOVEMBER,
        partySize: "6",
      });

      expect(result.isOk()).toBe(true);
      expect(provider.getAvailableDates).toHaveBeenCalledTimes(1);
    });

    it("refuses more guests than Peploe's 7 when ResDiary allows 10, before asking it", async function checksGuests() {
      const provider = fakeProvider({ maxPartySize: 10 });

      const result = await service(provider).getCalendarDays({
        ...NOVEMBER,
        partySize: "8",
      });

      expect(result._unsafeUnwrapErr().fieldErrors).toEqual({
        partySize:
          "For more than 7 guests, please call us on +353 1 676 3144 or email reception@peploes.com.",
      });
      expect(provider.getAvailableDates).not.toHaveBeenCalled();
    });
  });

  describe("when it cannot read the calendar", function failureTests() {
    it("answers unavailable when the range read fails, leaving the log to the provider", async function rangeFails() {
      const provider = fakeProvider();
      provider.getAvailableDates.mockResolvedValue(
        err({ kind: "unavailable", operation: "getAvailableDates" }),
      );

      const result = await service(provider).getCalendarDays(NOVEMBER);

      expect(result._unsafeUnwrapErr().code).toBe(ErrorCode.ServiceUnavailable);
      expect(console.error).not.toHaveBeenCalled();
    });

    it("leaves the log to the provider when ResDiary refuses a range", async function rangeRejected() {
      const provider = fakeProvider();
      provider.getAvailableDates.mockResolvedValue(
        err({
          kind: "rejected",
          operation: "getAvailableDates",
          fields: ["to"],
        }),
      );

      const result = await service(provider).getCalendarDays(NOVEMBER);

      expect(result._unsafeUnwrapErr().code).toBe(ErrorCode.ServiceUnavailable);
      expect(console.error).not.toHaveBeenCalled();
    });

    it("answers unavailable when today's rules fail", async function rulesFail() {
      const provider = fakeProvider();
      provider.getRules.mockResolvedValue(
        err({ kind: "unavailable", operation: "getRules" }),
      );

      const result = await service(provider).getCalendarDays(NOVEMBER);

      expect(result._unsafeUnwrapErr().code).toBe(ErrorCode.ServiceUnavailable);
      expect(provider.getAvailableDates).not.toHaveBeenCalled();
    });

    it("stays off without the hold secret", async function noHoldSecret() {
      const provider = fakeProvider();

      const result = await createBookingService({
        provider,
        holdSecret: null,
      }).getCalendarDays(NOVEMBER);

      expect(result._unsafeUnwrapErr().code).toBe(ErrorCode.ServiceUnavailable);
      expect(provider.getRules).not.toHaveBeenCalled();
    });

    it("logs and captures an unexpected throw once", async function unexpectedThrow() {
      const provider = fakeProvider();
      provider.getAvailableDates.mockRejectedValue(new Error("boom"));

      const result = await service(provider).getCalendarDays(NOVEMBER);

      expect(result._unsafeUnwrapErr().code).toBe(ErrorCode.ServiceUnavailable);
      expect(logToSentry).toHaveBeenCalledTimes(1);
    });
  });
});
