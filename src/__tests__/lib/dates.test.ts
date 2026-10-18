import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  addDays,
  dublinNow,
  dublinToday,
  guestsLabel,
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
