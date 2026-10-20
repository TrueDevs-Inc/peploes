import { err, ok } from "neverthrow";
import { describe, expect, it, vi } from "vitest";

import {
  errorLogs,
  FRIDAY,
  fakeProvider,
  NOW,
  RULES,
  rulesOn,
  rulesReadFor,
  searching,
  service,
  setUpBookingTests,
  slot,
} from "@/__tests__/services/bookings/fixtures";
import { ErrorCode } from "@/lib/enums";
import { logToSentry } from "@/lib/error-handler";
import { createBookingService } from "@/services/bookings";

vi.mock("@/lib/error-handler", () => ({ logToSentry: vi.fn() }));

setUpBookingTests();

describe("getTimes", function getTimesTests() {
  it("lists the bookable times with labels and offers", async function listsTimes() {
    const result = await service().getTimes({ date: FRIDAY, partySize: 2 });

    expect(result._unsafeUnwrap()).toEqual({
      date: FRIDAY,
      dateLabel: "Friday, 23 October 2026",
      partySize: 2,
      guestsLabel: "2 guests",
      times: [
        {
          searchDate: FRIDAY,
          date: FRIDAY,
          time: "12:30",
          label: "12:30 pm",
          offers: [
            {
              kind: "standard",
              feeCents: 0,
              mayRequireCard: false,
              returnBy: {
                time: "14:00",
                label: "2:00 pm",
                nextDay: false,
                required: false,
              },
            },
          ],
        },
        {
          searchDate: FRIDAY,
          date: FRIDAY,
          time: "19:30",
          label: "7:30 pm",
          offers: [
            {
              kind: "standard",
              feeCents: 2000,
              mayRequireCard: false,
              returnBy: {
                time: "20:30",
                label: "8:30 pm",
                nextDay: false,
                required: true,
              },
            },
          ],
        },
      ],
      emptyReason: null,
    });
  });

  it("searches within the one 8-second deadline", async function sharesDeadline() {
    const provider = fakeProvider();

    await service(provider).getTimes({ date: FRIDAY, partySize: 2 });

    expect(provider.searchTimes).toHaveBeenCalledWith(
      { date: FRIDAY, partySize: 2 },
      { deadlineAt: NOW.getTime() + 8000 },
    );
  });

  it("marks every offer when ResDiary may ask for a card", async function mayRequireCard() {
    const provider = searching([slot("12:30"), slot("19:30")], true);

    const result = await service(provider).getTimes({
      date: FRIDAY,
      partySize: 7,
    });

    const offers = result._unsafeUnwrap().times.flatMap((time) => time.offers);
    expect(offers.map((offer) => offer.mayRequireCard)).toEqual([true, true]);
  });

  it("has no return time when ResDiary sends none", async function noReturnTime() {
    const provider = searching([slot("12:30")]);

    const result = await service(provider).getTimes({
      date: FRIDAY,
      partySize: 2,
    });

    expect(result._unsafeUnwrap().times[0]?.offers[0]?.returnBy).toBeNull();
  });

  describe("checking the request", function requestTests() {
    it.each([
      [{ date: "23/10/2026", partySize: 2 }, "date", "Choose a date."],
      [
        { date: FRIDAY, partySize: "abc" },
        "partySize",
        "Choose the number of guests.",
      ],
    ])(
      "refuses %o before asking ResDiary",
      async function refusesFormat(input, field, message) {
        const provider = fakeProvider();

        const result = await service(provider).getTimes(input);

        const error = result._unsafeUnwrapErr();
        expect(error.code).toBe(ErrorCode.ValidationError);
        expect(error.fieldErrors).toEqual({ [field]: message });
        expect(provider.getRules).not.toHaveBeenCalled();
        expect(provider.searchTimes).not.toHaveBeenCalled();
      },
    );

    it("refuses yesterday in Dublin before asking ResDiary", async function refusesPast() {
      vi.setSystemTime(new Date("2026-10-14T23:10:00Z"));
      const provider = fakeProvider();

      const result = await service(provider).getTimes({
        date: "2026-10-14",
        partySize: 2,
      });

      expect(result._unsafeUnwrapErr().fieldErrors).toEqual({
        date: "Choose today or a later date.",
      });
      expect(provider.getRules).not.toHaveBeenCalled();
    });

    it("searches the last date but refuses the day after without reading its rules", async function checksWindow() {
      const provider = fakeProvider({ maxDaysAhead: 30 });

      const lastDay = await service(provider).getTimes({
        date: "2026-11-14",
        partySize: 2,
      });
      const dayAfter = await service(provider).getTimes({
        date: "2026-11-15",
        partySize: 2,
      });

      expect(lastDay.isOk()).toBe(true);
      expect(dayAfter._unsafeUnwrapErr().fieldErrors).toEqual({
        date: "Online booking is open up to Sat, 14 Nov 2026.",
      });
      expect(rulesReadFor(provider, "2026-11-15")).toBe(false);
      expect(provider.searchTimes).toHaveBeenCalledTimes(1);
    });

    it("searches any future date when ResDiary sets no limit", async function noWindow() {
      const provider = fakeProvider({ maxDaysAhead: null });

      const result = await service(provider).getTimes({
        date: "2028-01-07",
        partySize: 2,
      });

      expect(result.isOk()).toBe(true);
      expect(provider.searchTimes).toHaveBeenCalledTimes(1);
    });

    it.each([
      [
        "8 guests when ResDiary allows 10 but Peploe's online limit is 7",
        FRIDAY,
        { maxPartySize: 10 },
        8,
        "For more than 7 guests, please call us on +353 1 676 3144 or email reception@peploes.com.",
      ],
      [
        "7 guests when that day allows 6",
        FRIDAY,
        { maxPartySize: 6 },
        7,
        "For more than 6 guests, please call us on +353 1 676 3144 or email reception@peploes.com.",
      ],
      [
        "2 guests when that day starts at 4",
        "2026-12-24",
        { minPartySize: 4 },
        2,
        "Online bookings start at 4 guests.",
      ],
    ])(
      "refuses %s, using the visit date's limits",
      async function checksGuests(_case, date, rules, partySize, message) {
        const provider = fakeProvider();
        rulesOn(provider, date, rules);

        const result = await service(provider).getTimes({ date, partySize });

        expect(result._unsafeUnwrapErr().fieldErrors).toEqual({
          partySize: message,
        });
        expect(provider.searchTimes).not.toHaveBeenCalled();
      },
    );

    it("flags a visit date whose ResDiary limit is above Peploe's 7, once", async function flagsVisitDateCap() {
      const provider = fakeProvider();
      rulesOn(provider, FRIDAY, { maxPartySize: 12 });
      const bookings = service(provider);

      await bookings.getTimes({ date: FRIDAY, partySize: 2 });
      await bookings.getTimes({ date: FRIDAY, partySize: 2 });

      const flagged = vi
        .mocked(console.warn)
        .mock.calls.filter((call) =>
          String(call).includes('"maxPartySize":12,"siteMaxPartySize":7'),
        );
      expect(flagged).toHaveLength(1);
    });

    it("takes the visit date's limits over today's", async function visitDateWins() {
      const provider = fakeProvider();
      rulesOn(provider, "2026-12-24", { minPartySize: 4 });

      const result = await service(provider).getTimes({
        date: "2026-12-23",
        partySize: 2,
      });

      expect(result.isOk()).toBe(true);
    });
  });

  describe("closed days", function closedTests() {
    it.each([
      ["a closed weekday (Monday)", "2026-10-19", {}],
      [
        "a closed period",
        "2026-12-25",
        { closedPeriods: [{ from: "2026-12-24", to: "2026-12-26" }] },
      ],
    ])(
      "answers closed for %s without searching",
      async function answersClosed(_case, date, closed) {
        const provider = fakeProvider({}, closed);

        const result = await service(provider).getTimes({ date, partySize: 2 });

        expect(result._unsafeUnwrap()).toMatchObject({
          times: [],
          emptyReason: "closed",
        });
        expect(rulesReadFor(provider, date)).toBe(false);
        expect(provider.searchTimes).not.toHaveBeenCalled();
      },
    );

    it("searches anyway when the closed days cannot be read", async function searchesWithoutClosedDays() {
      const provider = searching([]);
      provider.getClosedDates.mockResolvedValue(
        err({ kind: "unavailable", operation: "getClosedDates" }),
      );

      const result = await service(provider).getTimes({
        date: "2026-10-19",
        partySize: 2,
      });

      expect(result._unsafeUnwrap().emptyReason).toBe("none_online");
    });
  });

  describe("choosing the times to show", function timeTests() {
    it("drops times up to the current Dublin minute", async function dropsPassed() {
      vi.setSystemTime(new Date("2026-10-23T18:30:00Z"));
      const provider = searching([slot("12:30"), slot("19:30"), slot("19:45")]);

      const result = await service(provider).getTimes({
        date: FRIDAY,
        partySize: 2,
      });

      expect(result._unsafeUnwrap().times.map((time) => time.time)).toEqual([
        "19:45",
      ]);
    });

    it("says every time has passed", async function allPassed() {
      vi.setSystemTime(new Date("2026-10-23T22:50:00Z"));

      const result = await service().getTimes({ date: FRIDAY, partySize: 2 });

      expect(result._unsafeUnwrap()).toMatchObject({
        times: [],
        emptyReason: "all_passed",
      });
    });

    it("still offers tonight's time after midnight once the evening's times have passed", async function lateTimeLeft() {
      vi.setSystemTime(new Date("2026-10-23T22:50:00Z"));
      const provider = searching([
        slot("22:00", { serviceId: 8856 }),
        slot("00:15", { serviceId: 8856 }),
      ]);

      const result = await service(provider).getTimes({
        date: FRIDAY,
        partySize: 2,
      });

      expect(result._unsafeUnwrap()).toMatchObject({
        times: [{ time: "00:15", date: "2026-10-24" }],
        emptyReason: null,
      });
    });

    it.each([
      ["no times", []],
      ["only promotion times", [slot("18:30", { standard: false })]],
    ])(
      "says nothing is online when ResDiary has %s",
      async function noneOnline(_case, slots) {
        const result = await service(searching(slots)).getTimes({
          date: FRIDAY,
          partySize: 2,
        });

        expect(result._unsafeUnwrap()).toMatchObject({
          times: [],
          emptyReason: "none_online",
        });
      },
    );

    it("drops a time that needs a return time ResDiary did not send, with a warning", async function missingReturnTime() {
      const provider = searching([
        slot("12:30"),
        slot("19:30", { leaveTimeRequired: true, leaveTime: null }),
      ]);

      const result = await service(provider).getTimes({
        date: FRIDAY,
        partySize: 2,
      });

      expect(result._unsafeUnwrap().times.map((time) => time.time)).toEqual([
        "12:30",
      ]);
      expect(console.warn).toHaveBeenCalledTimes(1);
    });

    it.each([
      ["flagged by ResDiary", "22:00", true],
      ["earlier than the time itself", "23:30", false],
    ])(
      "puts a return time %s on the next day",
      async function nextDayReturn(_case, time, nextDay) {
        const provider = searching([
          slot(time, {
            leaveTimeRequired: true,
            leaveTime: { time: "00:30", nextDay },
          }),
        ]);

        const result = await service(provider).getTimes({
          date: FRIDAY,
          partySize: 2,
        });

        expect(result._unsafeUnwrap().times[0]?.offers[0]?.returnBy).toEqual({
          time: "00:30",
          label: "12:30 am (next day)",
          nextDay: true,
          required: true,
        });
      },
    );

    it("lists a Dinner time after midnight last, on the next day, as ResDiary dates it on the evening", async function afterMidnight() {
      const provider = searching([
        slot("00:15", { serviceId: 8856 }),
        slot("22:00", { serviceId: 8856 }),
      ]);

      const result = await service(provider).getTimes({
        date: FRIDAY,
        partySize: 2,
      });

      expect(result._unsafeUnwrap().times).toMatchObject([
        { searchDate: FRIDAY, date: FRIDAY, time: "22:00", label: "10:00 pm" },
        {
          searchDate: FRIDAY,
          date: "2026-10-24",
          time: "00:15",
          label: "12:15 am (next day)",
        },
      ]);
      expect(console.warn).not.toHaveBeenCalled();
    });

    it.each([
      [
        "dated the next day by ResDiary",
        slot("00:15", { date: "2026-10-24", serviceId: 8856 }),
        { date: "2026-10-24", label: "12:15 am (next day)" },
      ],
      [
        "at its service's start time",
        slot("18:00", { serviceId: 8856 }),
        { date: FRIDAY, label: "6:00 pm" },
      ],
    ])(
      "places a time %s on the right day",
      async function placesTime(_case, given, expected) {
        const result = await service(searching([given])).getTimes({
          date: FRIDAY,
          partySize: 2,
        });

        expect(result._unsafeUnwrap().times).toMatchObject([
          { searchDate: FRIDAY, ...expected },
        ]);
      },
    );

    it("keeps tonight's time after midnight during the evening", async function notPassedInEvening() {
      vi.setSystemTime(new Date("2026-10-23T19:00:00Z"));
      const provider = searching([
        slot("22:00", { serviceId: 8856 }),
        slot("00:15", { serviceId: 8856 }),
      ]);

      const result = await service(provider).getTimes({
        date: FRIDAY,
        partySize: 2,
      });

      expect(result._unsafeUnwrap().times.map((time) => time.time)).toEqual([
        "22:00",
        "00:15",
      ]);
    });

    it("warns once per service that ResDiary sends without a start time", async function warnsMissingStart() {
      const provider = fakeProvider();
      rulesOn(provider, FRIDAY, {
        services: [{ id: 8857, name: "Late", start: null }],
      });
      const bookings = service(provider);

      await bookings.getTimes({ date: FRIDAY, partySize: 2 });
      await bookings.getTimes({ date: FRIDAY, partySize: 2 });

      const flagged = vi
        .mocked(console.warn)
        .mock.calls.filter((call) => String(call).includes('"serviceId":8857'));
      expect(flagged).toHaveLength(1);
    });

    it("keeps a time whose service start is unknown on its own date", async function unknownService() {
      const provider = searching([
        slot("00:15", { serviceId: 9999 }),
        slot("22:00", { serviceId: 8856 }),
      ]);

      const result = await service(provider).getTimes({
        date: FRIDAY,
        partySize: 2,
      });

      expect(result._unsafeUnwrap().times).toMatchObject([
        { date: FRIDAY, time: "00:15", label: "12:15 am" },
        { date: FRIDAY, time: "22:00" },
      ]);
    });

    it("puts the return time of a time after midnight on the next day", async function afterMidnightReturn() {
      const provider = searching([
        slot("00:15", {
          serviceId: 8856,
          leaveTimeRequired: true,
          leaveTime: { time: "01:15", nextDay: false },
        }),
      ]);

      const result = await service(provider).getTimes({
        date: FRIDAY,
        partySize: 2,
      });

      expect(result._unsafeUnwrap().times[0]?.offers[0]?.returnBy).toEqual({
        time: "01:15",
        label: "1:15 am (next day)",
        nextDay: true,
        required: true,
      });
    });

    it("drops a time dated two days later, with a warning", async function wrongDate() {
      const provider = searching([
        slot("22:00"),
        slot("00:15", { date: "2026-10-25" }),
      ]);

      const result = await service(provider).getTimes({
        date: FRIDAY,
        partySize: 2,
      });

      expect(result._unsafeUnwrap().times.map((time) => time.time)).toEqual([
        "22:00",
      ]);
      expect(console.warn).toHaveBeenCalledTimes(1);
    });

    it("keeps the later of two identical times and sorts them", async function dedupesAndSorts() {
      const provider = searching([
        slot("19:30"),
        slot("12:30"),
        slot("19:30", { feeCents: 2000 }),
      ]);

      const result = await service(provider).getTimes({
        date: FRIDAY,
        partySize: 2,
      });

      const { times } = result._unsafeUnwrap();
      expect(times.map((time) => time.time)).toEqual(["12:30", "19:30"]);
      expect(times[1]?.offers[0]).toMatchObject({ feeCents: 2000 });
    });
  });

  describe("when it cannot search", function failureTests() {
    it("stays off without the hold secret", async function noHoldSecret() {
      const provider = fakeProvider();

      const result = await createBookingService({
        provider,
        holdSecret: null,
      }).getTimes({ date: FRIDAY, partySize: 2 });

      expect(result._unsafeUnwrapErr().code).toBe(ErrorCode.ServiceUnavailable);
      expect(provider.getRules).not.toHaveBeenCalled();
    });

    it("answers unavailable when the visit date's limits cannot work, naming both", async function visitLimitsImpossible() {
      const provider = fakeProvider();
      rulesOn(provider, FRIDAY, { minPartySize: 4, maxPartySize: 2 });

      const result = await service(provider).getTimes({
        date: FRIDAY,
        partySize: 3,
      });

      expect(result._unsafeUnwrapErr().code).toBe(ErrorCode.ServiceUnavailable);
      expect(errorLogs()).toContain('\\"minPartySize\\":4');
      expect(provider.searchTimes).not.toHaveBeenCalled();
    });

    it("answers unavailable when the visit date's limits start above Peploe's 7", async function visitMinimumAboveCap() {
      const provider = fakeProvider();
      rulesOn(provider, FRIDAY, { minPartySize: 8, maxPartySize: 10 });

      const result = await service(provider).getTimes({
        date: FRIDAY,
        partySize: 8,
      });

      expect(result._unsafeUnwrapErr().code).toBe(ErrorCode.ServiceUnavailable);
      expect(provider.searchTimes).not.toHaveBeenCalled();
    });

    it("answers unavailable when the visit date's rules fail", async function visitRulesFail() {
      const provider = fakeProvider();
      provider.getRules.mockImplementation(function rulesFor(day) {
        return Promise.resolve(
          day === FRIDAY
            ? err({ kind: "unavailable", operation: "getRules" })
            : ok(RULES),
        );
      });

      const result = await service(provider).getTimes({
        date: FRIDAY,
        partySize: 2,
      });

      expect(result._unsafeUnwrapErr().code).toBe(ErrorCode.ServiceUnavailable);
      expect(provider.searchTimes).not.toHaveBeenCalled();
    });

    it("answers unavailable when the search fails, leaving the log to the provider", async function searchFails() {
      const provider = fakeProvider();
      provider.searchTimes.mockResolvedValue(
        err({
          kind: "unavailable",
          operation: "searchTimes",
          detail: "timeout",
        }),
      );

      const result = await service(provider).getTimes({
        date: FRIDAY,
        partySize: 2,
      });

      expect(result._unsafeUnwrapErr().code).toBe(ErrorCode.ServiceUnavailable);
      expect(console.error).not.toHaveBeenCalled();
    });

    it("leaves the log to the provider when ResDiary refuses a search", async function searchRejected() {
      const provider = fakeProvider();
      provider.searchTimes.mockResolvedValue(
        err({
          kind: "rejected",
          operation: "searchTimes",
          fields: ["PartySize"],
        }),
      );

      const result = await service(provider).getTimes({
        date: FRIDAY,
        partySize: 2,
      });

      expect(result._unsafeUnwrapErr().code).toBe(ErrorCode.ServiceUnavailable);
      expect(console.error).not.toHaveBeenCalled();
    });

    it("logs and captures an unexpected throw once", async function unexpectedThrow() {
      const provider = fakeProvider();
      provider.searchTimes.mockRejectedValue(new Error("boom"));

      const result = await service(provider).getTimes({
        date: FRIDAY,
        partySize: 2,
      });

      expect(result._unsafeUnwrapErr().code).toBe(ErrorCode.ServiceUnavailable);
      expect(logToSentry).toHaveBeenCalledTimes(1);
    });
  });
});
