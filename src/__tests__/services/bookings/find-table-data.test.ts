import { err } from "neverthrow";
import { describe, expect, it, vi } from "vitest";

import {
  errorLogs,
  fakeProvider,
  NOW,
  service,
  setUpBookingTests,
} from "@/__tests__/services/bookings/fixtures";
import { ErrorCode } from "@/lib/enums";
import { logToSentry } from "@/lib/error-handler";
import { createBookingService } from "@/services/bookings";

vi.mock("@/lib/error-handler", () => ({ logToSentry: vi.fn() }));

setUpBookingTests();

describe("getFindTableData", function findTableDataTests() {
  it("gives the guest range and calendar from ResDiary's settings", async function readsSandbox() {
    const result = await service().getFindTableData();

    expect(result._unsafeUnwrap()).toEqual({
      partySize: { min: 1, max: 7, default: 2 },
      calendar: {
        today: "2026-10-15",
        lastDate: "2027-10-15",
        defaultDate: "2026-10-15",
        closedWeekdays: [1],
        closedPeriods: [],
      },
      terms: [
        'Please note we may require a valid credit card number to confirm bookings. Unless we specifically refer to a "refundable deposit", we do NOT charge anything to the credit card unless there is a "no show" of which we have no prior notice.',
        "Refundable deposits are credited in full to your account balance on payment on departure.",
      ],
    });
  });

  describe("the booking terms", function termsTests() {
    async function termsFrom(termsHtml: string) {
      const result = await service(
        fakeProvider({ termsHtml }),
      ).getFindTableData();
      return result._unsafeUnwrap().terms;
    }

    it("puts each line and list item in its own paragraph", async function splitsBlocks() {
      const terms = await termsFrom(
        "<div>Deposits<br>are refundable.<br/></div><ul><li>Arrive on time.</li><li>Call to cancel.</li></ul>",
      );

      expect(terms).toEqual([
        "Deposits",
        "are refundable.",
        "Arrive on time.",
        "Call to cancel.",
      ]);
    });

    it("joins a paragraph the editor wrapped over several lines", async function joinsWrapped() {
      const terms = await termsFrom(
        "<p>Please cancel at least\n\t24 hours ahead&#10;by phone.</p>",
      );

      expect(terms).toEqual([
        "Please cancel at least 24 hours ahead by phone.",
      ]);
    });

    it("decodes the characters an editor encodes, once", async function decodesEntities() {
      const terms = await termsFrom(
        "<p>Peploe&rsquo;s &amp; Co&#8217;s terms:&nbsp;&euro;10 &#x2014; &lt;b&gt; &amp;lt; &unknown;</p>",
      );

      expect(terms).toEqual([
        "Peploe’s & Co’s terms: €10 — <b> &lt; &unknown;",
      ]);
    });

    it("leaves out styles, scripts and comments pasted from a word processor", async function dropsHidden() {
      const terms = await termsFrom(
        "<!--[if gte mso 9]><xml>Word</xml><![endif]--><style>p.MsoNormal { margin: 0 }</style><p>Cancel 24 hours ahead.</p><script>track()</script>",
      );

      expect(terms).toEqual(["Cancel 24 hours ahead."]);
    });

    it.each([
      ["none", ""],
      ["only empty markup", "<p>&nbsp;</p>\n<p><br></p>"],
    ])(
      "gives the phone and email when ResDiary has %s",
      async function fallsBack(_case, termsHtml) {
        expect(await termsFrom(termsHtml)).toEqual([
          "For our booking terms, please call us on +353 1 676 3144 or email reception@peploes.com.",
        ]);
      },
    );
  });

  it("gives both ResDiary reads one 8-second deadline", async function sharesDeadline() {
    const provider = fakeProvider();

    await service(provider).getFindTableData();

    const deadline = { deadlineAt: NOW.getTime() + 8000 };
    expect(provider.getRules).toHaveBeenCalledWith("2026-10-15", deadline);
    expect(provider.getClosedDates).toHaveBeenCalledWith(deadline);
  });

  it.each([
    ["2026-10-14T23:30:00Z", "2026-10-15"],
    ["2026-10-15T22:59:59Z", "2026-10-15"],
    ["2026-10-15T23:00:01Z", "2026-10-16"],
  ])(
    "at %s, today is %s in Dublin",
    async function readsDublinToday(instant, today) {
      vi.setSystemTime(new Date(instant));

      const result = await service().getFindTableData();

      expect(result._unsafeUnwrap().calendar.today).toBe(today);
    },
  );

  it("caps the guests at Peploe's 7 when ResDiary allows more, flagging it once for review", async function siteCap() {
    const bookings = service(fakeProvider({ maxPartySize: 30 }));

    const result = await bookings.getFindTableData();
    await bookings.getFindTableData();

    expect(result._unsafeUnwrap().partySize).toEqual({
      min: 1,
      max: 7,
      default: 2,
    });
    const flagged = vi
      .mocked(console.warn)
      .mock.calls.filter((call) =>
        String(call).includes('"maxPartySize":30,"siteMaxPartySize":7'),
      );
    expect(flagged).toHaveLength(1);
  });

  it("keeps ResDiary's guest limit when it is stricter than Peploe's", async function stricterLimit() {
    const result = await service(
      fakeProvider({ maxPartySize: 5 }),
    ).getFindTableData();

    expect(result._unsafeUnwrap().partySize.max).toBe(5);
  });

  it.each([
    [{ defaultPartySize: 12, maxPartySize: 10 }, 7],
    [{ defaultPartySize: 1, minPartySize: 2 }, 2],
  ])(
    "keeps the default party size inside the range (%o)",
    async function clampsDefault(rules, expected) {
      const result = await service(fakeProvider(rules)).getFindTableData();

      expect(result._unsafeUnwrap().partySize.default).toBe(expected);
    },
  );

  it.each([
    [365, "2027-10-15"],
    [1, "2026-10-16"],
    [null, null],
    [0, null],
  ])(
    "with %s days ahead, the last date is %s",
    async function setsLastDate(maxDaysAhead, lastDate) {
      const result = await service(
        fakeProvider({ maxDaysAhead }),
      ).getFindTableData();

      expect(result._unsafeUnwrap().calendar.lastDate).toBe(lastDate);
    },
  );

  it("starts on the next open day when today is closed", async function skipsClosedToday() {
    vi.setSystemTime(new Date("2026-10-19T08:00:00Z"));

    const result = await service().getFindTableData();

    expect(result._unsafeUnwrap().calendar.defaultDate).toBe("2026-10-20");
  });

  it("starts after a closed period that covers today", async function skipsClosedPeriod() {
    const provider = fakeProvider(
      {},
      { closedPeriods: [{ from: "2026-10-14", to: "2026-10-17" }] },
    );

    const result = await service(provider).getFindTableData();

    expect(result._unsafeUnwrap().calendar.defaultDate).toBe("2026-10-18");
  });

  it("keeps only the closed periods that touch the calendar", async function trimsPeriods() {
    const provider = fakeProvider(
      { maxDaysAhead: 30 },
      {
        closedPeriods: [
          { from: "2026-09-01", to: "2026-09-30" },
          { from: "2026-10-10", to: "2026-10-15" },
          { from: "2026-11-14", to: "2026-11-20" },
          { from: "2026-11-15", to: "2026-11-20" },
          { from: "2027-01-01", to: "2027-01-02" },
        ],
      },
    );

    const result = await service(provider).getFindTableData();

    expect(result._unsafeUnwrap().calendar.closedPeriods).toEqual([
      { from: "2026-10-10", to: "2026-10-15" },
      { from: "2026-11-14", to: "2026-11-20" },
    ]);
  });

  it.each([
    ["the next 31 days are closed", 365, "2026-12-13"],
    ["every day up to the last date is closed", 1, "2026-10-16"],
  ])(
    "falls back to today when %s",
    async function fallsBackToToday(_case, maxDaysAhead, closedTo) {
      const provider = fakeProvider(
        { maxDaysAhead },
        { closedPeriods: [{ from: "2026-10-15", to: closedTo }] },
      );

      const result = await service(provider).getFindTableData();

      expect(result._unsafeUnwrap().calendar.defaultDate).toBe("2026-10-15");
    },
  );

  it("carries on with no closed days when ResDiary cannot send them", async function survivesClosedDates() {
    const provider = fakeProvider();
    provider.getClosedDates.mockResolvedValue(
      err({ kind: "unavailable", operation: "getClosedDates" }),
    );

    const result = await service(provider).getFindTableData();

    expect(result._unsafeUnwrap().calendar).toMatchObject({
      closedWeekdays: [],
      closedPeriods: [],
      defaultDate: "2026-10-15",
    });
    expect(console.warn).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  describe("when it cannot serve the calendar", function failureTests() {
    it("offers the phone number and email when ResDiary is not set up, without a log", async function notConfigured() {
      const provider = fakeProvider();
      provider.getRules.mockResolvedValue(
        err({ kind: "not_configured", operation: "getRules" }),
      );
      provider.getClosedDates.mockResolvedValue(
        err({ kind: "not_configured", operation: "getClosedDates" }),
      );

      const result = await service(provider).getFindTableData();

      const error = result._unsafeUnwrapErr();
      expect(error.code).toBe(ErrorCode.ServiceUnavailable);
      expect(error.message).toContain("+353 1 676 3144");
      expect(error.message).toContain("reception@peploes.com");
      expect(console.warn).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
    });

    it("stays off without the hold secret, before asking ResDiary", async function noHoldSecret() {
      const provider = fakeProvider();

      const result = await createBookingService({
        provider,
        holdSecret: null,
      }).getFindTableData();

      expect(result._unsafeUnwrapErr().code).toBe(ErrorCode.ServiceUnavailable);
      expect(provider.getRules).not.toHaveBeenCalled();
      expect(provider.getClosedDates).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
    });

    it("answers unavailable when the rules cannot be read, leaving the log to the provider", async function rulesFail() {
      const provider = fakeProvider();
      provider.getRules.mockResolvedValue(
        err({ kind: "unavailable", operation: "getRules", detail: "timeout" }),
      );

      const result = await service(provider).getFindTableData();

      expect(result._unsafeUnwrapErr().code).toBe(ErrorCode.ServiceUnavailable);
      expect(console.error).not.toHaveBeenCalled();
    });

    it("refuses party limits that cannot work, naming both", async function impossibleLimits() {
      const result = await service(
        fakeProvider({ minPartySize: 4, maxPartySize: 2 }),
      ).getFindTableData();

      expect(result._unsafeUnwrapErr().code).toBe(ErrorCode.ServiceUnavailable);
      expect(console.error).toHaveBeenCalledTimes(1);
      expect(errorLogs()).toContain('\\"minPartySize\\":4');
      expect(errorLogs()).toContain('\\"maxPartySize\\":2');
    });

    it("refuses party limits that start above Peploe's 7", async function minimumAboveCap() {
      const result = await service(
        fakeProvider({ minPartySize: 8, maxPartySize: 10 }),
      ).getFindTableData();

      expect(result._unsafeUnwrapErr().code).toBe(ErrorCode.ServiceUnavailable);
      expect(errorLogs()).toContain('\\"siteMaxPartySize\\":7');
    });

    it("refuses a calendar with every weekday closed", async function everyDayClosed() {
      const provider = fakeProvider(
        {},
        { closedWeekdays: [0, 1, 2, 3, 4, 5, 6] },
      );

      const result = await service(provider).getFindTableData();

      expect(result._unsafeUnwrapErr().code).toBe(ErrorCode.ServiceUnavailable);
      expect(console.error).toHaveBeenCalledTimes(1);
    });

    it("logs and captures an unexpected throw once", async function unexpectedThrow() {
      const provider = fakeProvider();
      provider.getRules.mockRejectedValue(new Error("boom"));

      const result = await service(provider).getFindTableData();

      expect(result._unsafeUnwrapErr().code).toBe(ErrorCode.ServiceUnavailable);
      expect(console.error).toHaveBeenCalledTimes(1);
      expect(errorLogs()).toContain("boom");
      expect(logToSentry).toHaveBeenCalledTimes(1);
    });
  });
});
