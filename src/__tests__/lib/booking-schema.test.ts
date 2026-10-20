import { describe, expect, it } from "vitest";

import {
  calendarQuerySchema,
  guestDetailsSchema,
  holdInputSchema,
  holdReferenceSchema,
  timesQuerySchema,
} from "@/lib/booking-schema";

describe("timesQuerySchema", function timesQueryTests() {
  it("reads the guest count from query text", function coercesGuests() {
    expect(
      timesQuerySchema.parse({ date: "2026-10-23", partySize: "2" }),
    ).toEqual({ date: "2026-10-23", partySize: 2 });
  });

  it.each(["23/10/2026", "2026-02-30", "2026-13-01", "", undefined])(
    "refuses the date %o",
    function refusesDate(date) {
      const result = timesQuerySchema.safeParse({ date, partySize: 2 });

      expect(result.error?.issues).toEqual([
        expect.objectContaining({ path: ["date"], message: "Choose a date." }),
      ]);
    },
  );

  it.each([
    "2.5",
    "abc",
    "0",
    "-1",
    "",
    undefined,
    true,
    [5],
    "0x10",
    "1e1",
    " 3 ",
    Number.NaN,
  ])("refuses the guest count %o", function refusesGuests(partySize) {
    const result = timesQuerySchema.safeParse({
      date: "2026-10-23",
      partySize,
    });

    expect(result.error?.issues).toEqual([
      expect.objectContaining({
        path: ["partySize"],
        message: "Choose the number of guests.",
      }),
    ]);
  });
});

describe("calendarQuerySchema", function calendarQueryTests() {
  it("reads a month and the guest count from query text", function readsMonth() {
    expect(
      calendarQuerySchema.parse({
        from: "2026-11-01",
        to: "2026-11-30",
        partySize: "2",
      }),
    ).toEqual({ from: "2026-11-01", to: "2026-11-30", partySize: 2 });
  });

  it("refuses a date that is not a date", function refusesDate() {
    const result = calendarQuerySchema.safeParse({
      from: "2026-11-31",
      to: "2026-11-30",
      partySize: 2,
    });

    expect(result.error?.issues).toEqual([
      expect.objectContaining({ path: ["from"], message: "Choose a date." }),
    ]);
  });
});

describe("holdInputSchema", function holdInputTests() {
  const CHOICE = {
    searchDate: "2026-10-23",
    time: "19:30",
    partySize: "2",
    offer: { kind: "standard" },
  };

  it("reads the choice; continuing is agreeing, so there is no return tick", function readsChoice() {
    expect(
      holdInputSchema.parse({ ...CHOICE, returnByAccepted: false }),
    ).toEqual({ ...CHOICE, partySize: 2 });
  });

  it("reads the guest count sent as a number, as from the page", function readsNumber() {
    expect(holdInputSchema.parse({ ...CHOICE, partySize: 2 }).partySize).toBe(
      2,
    );
  });

  it("keeps only the offer's kind, dropping a return time the browser adds", function dropsBrowserReturnBy() {
    expect(
      holdInputSchema.parse({
        ...CHOICE,
        offer: { kind: "standard", returnBy: { time: "23:30" } },
      }).offer,
    ).toEqual({ kind: "standard" });
  });

  it.each([
    [{ time: "7:30 pm" }, "time"],
    [{ time: "24:00" }, "time"],
    [{ offer: { kind: "promotion", promotionId: 3041 } }, "offer"],
    [{ offer: undefined }, "offer"],
  ])(
    "refuses %o under its field, asking for a time",
    function refuses(change, field) {
      const result = holdInputSchema.safeParse({ ...CHOICE, ...change });

      expect(
        result.error?.issues.map((issue) => [issue.path[0], issue.message]),
      ).toEqual([[field, "Choose a time."]]);
    },
  );
});

describe("holdReferenceSchema", function holdReferenceTests() {
  it.each([1, "1"])(
    "reads the revision %o",
    function readsRevision(holdRevision) {
      expect(
        holdReferenceSchema.parse({ holdReference: "B9GXWPLY", holdRevision })
          .holdRevision,
      ).toBe(1);
    },
  );

  it.each([true, [1], "0x1", "1e0", 0, 1.5])(
    "refuses the revision %o",
    function refusesRevision(holdRevision) {
      expect(
        holdReferenceSchema.safeParse({
          holdReference: "B9GXWPLY",
          holdRevision,
        }).success,
      ).toBe(false);
    },
  );
});

describe("guestDetailsSchema", function guestDetailsTests() {
  const DETAILS = {
    firstName: "Test",
    surname: "Guest",
    email: "guest@example.test",
    mobileCountryCode: "+353",
    mobile: "087 123 4567",
    specialRequests: "Window seat please",
    termsAccepted: true,
  };

  function messages(change: Record<string, unknown>) {
    const result = guestDetailsSchema.safeParse({ ...DETAILS, ...change });
    return result.error?.issues.map((issue) => [issue.path[0], issue.message]);
  }

  it("cleans the details for ResDiary", function cleans() {
    expect(
      guestDetailsSchema.parse({ ...DETAILS, email: " Guest@Example.com " }),
    ).toEqual({
      firstName: "Test",
      surname: "Guest",
      email: "Guest@Example.com",
      mobileCountryCode: 353,
      mobile: "0871234567",
      specialRequests: "Window seat please",
      termsAccepted: true,
    });
  });

  it.each(["O'Brien", "Nic Dhiarmada", "José", "李"])(
    "keeps the name %s as typed",
    function keepsNames(name) {
      expect(
        guestDetailsSchema.parse({ ...DETAILS, firstName: name }),
      ).toMatchObject({ firstName: name });
    },
  );

  it.each([
    [{ firstName: "  " }, "firstName", "Please enter your name."],
    [{ surname: "" }, "surname", "Please enter your surname."],
    [{ firstName: "x".repeat(101) }, "firstName", "Please enter your name."],
    [{ email: "guest@" }, "email", "Please enter a valid email address."],
    [{ email: "@example.com" }, "email", "Please enter a valid email address."],
    [
      { email: `${"x".repeat(243)}@example.com` },
      "email",
      "Please enter a valid email address.",
    ],
    [{ mobileCountryCode: "0" }, "mobileCountryCode", "Choose a country code."],
    [
      { mobileCountryCode: "1000" },
      "mobileCountryCode",
      "Choose a country code.",
    ],
    [
      { mobileCountryCode: "abc" },
      "mobileCountryCode",
      "Choose a country code.",
    ],
    [{ mobile: "abc" }, "mobile", "Please enter a valid mobile number."],
    [{ mobile: "12345" }, "mobile", "Please enter a valid mobile number."],
    [
      { mobile: "1".repeat(16) },
      "mobile",
      "Please enter a valid mobile number.",
    ],
    [
      { mobile: "+353871234567" },
      "mobile",
      "Enter the number without the country code.",
    ],
    [
      { mobile: "00353871234567" },
      "mobile",
      "Enter the number without the country code.",
    ],
    [
      { specialRequests: "x".repeat(1001) },
      "specialRequests",
      "Please keep requests under 1,000 characters.",
    ],
    [
      { termsAccepted: false },
      "termsAccepted",
      "Please accept the booking terms.",
    ],
  ])("refuses %o", function refuses(change, field, message) {
    expect(messages(change)).toEqual([[field, message]]);
  });

  it.each([
    ["a 100-character name", { firstName: "x".repeat(100) }],
    ["a 254-character email", { email: `${"x".repeat(242)}@example.com` }],
    ["a 6-digit mobile", { mobile: "123456" }],
    ["a 15-digit mobile", { mobile: "1".repeat(15) }],
    ["1,000 characters of requests", { specialRequests: "x".repeat(1000) }],
  ])("accepts %s, the longest allowed", function acceptsLongest(_case, change) {
    expect(messages(change)).toBeUndefined();
  });

  it.each([
    ["+353", 353],
    ["00353", 353],
    [" 353 ", 353],
    [44, 44],
    [undefined, 353],
  ])(
    "reads the country code %o as %i",
    function readsCountryCode(code, expected) {
      expect(
        guestDetailsSchema.parse({ ...DETAILS, mobileCountryCode: code })
          .mobileCountryCode,
      ).toBe(expected);
    },
  );

  it("reads (087) 123-4567 as digits", function readsMobile() {
    expect(
      guestDetailsSchema.parse({ ...DETAILS, mobile: "(087) 123-4567" }).mobile,
    ).toBe("0871234567");
  });

  it("leaves out blank requests and keeps newlines and emoji", function readsRequests() {
    const requests = `High chair, please 👶\nNear the window${"x".repeat(960)}`;

    expect(
      guestDetailsSchema.parse({ ...DETAILS, specialRequests: "   " })
        .specialRequests,
    ).toBeUndefined();
    expect(
      guestDetailsSchema.parse({ ...DETAILS, specialRequests: requests })
        .specialRequests,
    ).toBe(requests);
  });
});
