import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  addDays,
  dublinNow,
  dublinToday,
  firstFreeBookingDate,
  guestsLabel,
  isBookableDay,
  isCalendarDate,
  isClockTime,
  isInPeriod,
  longDateLabel,
  shortDateLabel,
  timeLabel,
  weekdayOf,
} from "@/lib/dates";

beforeEach(function useFakeClock() {
  vi.useFakeTimers({ toFake: ["Date"] });
});

afterEach(function useRealClock() {
  vi.useRealTimers();
});

describe("Dublin today and now", function dublinClockTests() {
  it.each([
    ["2026-10-14T23:30:00Z", "2026-10-15", "00:30"],
    ["2026-10-15T08:37:00Z", "2026-10-15", "09:37"],
    ["2026-10-24T23:30:00Z", "2026-10-25", "00:30"],
    ["2026-10-25T01:30:00Z", "2026-10-25", "01:30"],
    ["2026-12-31T23:59:00Z", "2026-12-31", "23:59"],
    ["2027-01-01T00:00:00Z", "2027-01-01", "00:00"],
  ])("at %s it is %s %s in Dublin", function readsDublin(instant, date, time) {
    vi.setSystemTime(new Date(instant));

    expect(dublinToday()).toBe(date);
    expect(dublinNow()).toEqual({ date, time });
  });
});

describe("addDays", function addDaysTests() {
  it.each([
    ["2026-10-15", 365, "2027-10-15"],
    ["2026-10-24", 1, "2026-10-25"],
    ["2026-10-25", 1, "2026-10-26"],
    ["2026-03-28", 1, "2026-03-29"],
    ["2026-12-31", 1, "2027-01-01"],
    ["2028-02-28", 1, "2028-02-29"],
    ["2026-10-15", 0, "2026-10-15"],
    ["2026-10-15", -1, "2026-10-14"],
  ])(
    "%s plus %i days is %s, across clock changes and year ends",
    function addsCalendarDays(date, days, expected) {
      expect(addDays(date, days)).toBe(expected);
    },
  );
});

describe("weekdayOf and isInPeriod", function calendarTests() {
  it.each([
    ["2026-10-18", 0],
    ["2026-10-19", 1],
    ["2026-10-24", 6],
  ])("%s is weekday %i (0 = Sunday)", function readsWeekday(date, weekday) {
    expect(weekdayOf(date)).toBe(weekday);
  });

  it("includes both ends of a period", function includesBothEnds() {
    const period = { from: "2026-12-24", to: "2026-12-26" };

    expect(isInPeriod("2026-12-23", period)).toBe(false);
    expect(isInPeriod("2026-12-24", period)).toBe(true);
    expect(isInPeriod("2026-12-26", period)).toBe(true);
    expect(isInPeriod("2026-12-27", period)).toBe(false);
  });
});

describe("isBookableDay", function bookableDayTests() {
  const calendar = {
    today: "2026-10-21",
    lastDate: "2026-12-20",
    defaultDate: "2026-10-21",
    closedWeekdays: [1],
    closedPeriods: [{ from: "2026-11-10", to: "2026-11-12" }],
  };

  it.each([
    ["today", "2026-10-21", true],
    ["yesterday", "2026-10-20", false],
    ["the last bookable date", "2026-12-20", true],
    ["the day after the last bookable date", "2026-12-21", false],
    ["a closed weekday", "2026-10-26", false],
    ["the first day of a closed period", "2026-11-10", false],
    ["the last day of a closed period", "2026-11-12", false],
    ["the day after a closed period", "2026-11-13", true],
  ])("%s (%s) bookable: %s", function checksDay(_label, date, bookable) {
    expect(isBookableDay(date, calendar)).toBe(bookable);
  });

  it("has no end when ResDiary sets no last date", function noLastDate() {
    expect(isBookableDay("2027-06-01", { ...calendar, lastDate: null })).toBe(
      true,
    );
  });
});

describe("firstFreeBookingDate", function firstFreeBookingDateTests() {
  const calendar = {
    today: "2026-10-01",
    lastDate: "2026-12-20",
    defaultDate: "2026-10-31",
    closedWeekdays: [1],
    closedPeriods: [{ from: "2026-11-04", to: "2026-11-06" }],
  };

  it("finds the first free day in the next month beyond the current grid", function crossesMonthEnd() {
    expect(
      firstFreeBookingDate("2026-10-31", calendar, [[], ["2026-11-03"]]),
    ).toBe("2026-11-03");
  });

  it("ignores earlier grid days and finds the earliest bookable date across both replies", function ignoresEarlierDays() {
    expect(
      firstFreeBookingDate("2026-10-31", calendar, [
        ["2026-10-30", "2026-11-01"],
        ["2026-11-03", "2026-10-29"],
      ]),
    ).toBe("2026-11-01");
  });

  it("includes the current date when it is free", function includesCurrentDate() {
    expect(
      firstFreeBookingDate("2026-10-31", calendar, [["2026-10-31"], []]),
    ).toBe("2026-10-31");
  });

  it("skips closed weekdays and closed periods", function skipsClosedDays() {
    expect(
      firstFreeBookingDate("2026-10-31", calendar, [
        [],
        ["2026-11-02", "2026-11-04", "2026-11-06", "2026-11-07"],
      ]),
    ).toBe("2026-11-07");
  });

  it("keeps the last bookable date and rejects days beyond it", function respectsLastDate() {
    const ending = { ...calendar, lastDate: "2026-11-03" };
    expect(
      firstFreeBookingDate("2026-10-31", ending, [[], ["2026-11-03"]]),
    ).toBe("2026-11-03");
    expect(
      firstFreeBookingDate("2026-10-31", ending, [[], ["2026-11-07"]]),
    ).toBeUndefined();
  });

  it("ignores days before today even if the default date is older", function respectsToday() {
    expect(
      firstFreeBookingDate("2026-10-31", { ...calendar, today: "2026-11-03" }, [
        ["2026-11-01"],
        ["2026-11-03"],
      ]),
    ).toBe("2026-11-03");
  });

  it("does not follow the next month's grid into a third month", function limitsMonthRange() {
    expect(
      firstFreeBookingDate("2026-10-31", { ...calendar, lastDate: null }, [
        [],
        ["2026-12-01"],
      ]),
    ).toBeUndefined();
  });

  it("crosses the year end with no last date", function crossesYearEnd() {
    expect(
      firstFreeBookingDate("2026-12-31", { ...calendar, lastDate: null }, [
        [],
        ["2027-01-02"],
      ]),
    ).toBe("2027-01-02");
  });

  it("has no replacement when neither month has a free day", function noFreeDays() {
    expect(
      firstFreeBookingDate("2026-10-31", calendar, [[], []]),
    ).toBeUndefined();
  });

  it.each([undefined, "loading", "failed"] as const)(
    "has no replacement when the current month is empty and the next month is %j",
    function noReplacement(nextMonth) {
      expect(
        firstFreeBookingDate("2026-10-31", calendar, [[], nextMonth]),
      ).toBeUndefined();
    },
  );

  it("uses a current-month free day while next month is loading", function doesNotWaitUnnecessarily() {
    expect(
      firstFreeBookingDate("2026-10-30", calendar, [["2026-10-31"], "loading"]),
    ).toBe("2026-10-31");
  });
});

describe("isCalendarDate and isClockTime", function formatTests() {
  it.each([
    ["2026-10-23", true],
    ["2028-02-29", true],
    ["2026-02-29", false],
    ["2026-13-01", false],
    ["2026-1-5", false],
    ["23/10/2026", false],
    ["2026-10-23T00:00", false],
  ])("%s is a calendar date: %s", function checksDate(value, expected) {
    expect(isCalendarDate(value)).toBe(expected);
  });

  it.each([
    ["00:00", true],
    ["23:59", true],
    ["24:00", false],
    ["23:60", false],
    ["7:30", false],
    ["19:30:00", false],
  ])("%s is a clock time: %s", function checksTime(value, expected) {
    expect(isClockTime(value)).toBe(expected);
  });
});

describe("labels", function labelTests() {
  it.each([
    ["00:00", "12:00 am"],
    ["00:15", "12:15 am"],
    ["09:05", "9:05 am"],
    ["12:00", "12:00 pm"],
    ["12:30", "12:30 pm"],
    ["19:30", "7:30 pm"],
    ["23:45", "11:45 pm"],
  ])("time %s reads %s", function labelsTime(time, label) {
    expect(timeLabel(time)).toBe(label);
  });

  it("writes dates the way the design does", function labelsDates() {
    expect(longDateLabel("2026-10-23")).toBe("Friday, 23 October 2026");
    expect(shortDateLabel("2026-10-23")).toBe("Fri, 23 Oct 2026");
    expect(shortDateLabel("2026-09-01")).toBe("Tue, 1 Sep 2026");
  });

  it("counts guests", function labelsGuests() {
    expect(guestsLabel(1)).toBe("1 guest");
    expect(guestsLabel(2)).toBe("2 guests");
  });
});
