import { err, ok } from "neverthrow";
import { describe, expect, it, vi } from "vitest";

import {
  ALLOW_HOLDS,
  DINNER,
  FRIDAY,
  fakeProvider,
  HOLD,
  LUNCH,
  NOW,
  rulesReadFor,
  searching,
  service,
  setUpBookingTests,
  slot,
  TIMES,
} from "@/__tests__/services/bookings/fixtures";
import { ErrorCode } from "@/lib/enums";
import { logToSentry } from "@/lib/error-handler";
import { createBookingService } from "@/services/bookings";

vi.mock("@/lib/error-handler", () => ({ logToSentry: vi.fn() }));

setUpBookingTests();

const TIME_GONE = "That time is no longer available. Please choose another.";
const REFUSE_HOLDS = () => Promise.resolve(false);

describe("holdTable", function holdTableTests() {
  describe("the visitor's hold limit", function holdLimitTests() {
    it("refuses a new hold over the limit before ResDiary holds anything", async function overLimit() {
      const provider = fakeProvider();

      const result = await service(provider).holdTable(DINNER, REFUSE_HOLDS);

      expect(result._unsafeUnwrapErr()).toEqual({
        code: ErrorCode.ServiceUnavailable,
        message:
          "Online booking isn't available right now. Please call us on +353 1 676 3144 or email reception@peploes.ie.",
      });
      expect(provider.createHold).not.toHaveBeenCalled();
    });

    it("asks the limit once, after the checks and right before holding", async function asksLast() {
      const provider = fakeProvider();
      const gate = vi.fn(ALLOW_HOLDS);

      await service(provider).holdTable(DINNER, gate);

      expect(gate).toHaveBeenCalledTimes(1);
      const [asked] = gate.mock.invocationCallOrder;
      expect(asked).toBeGreaterThan(
        Math.max(...provider.searchTimes.mock.invocationCallOrder),
      );
      expect(asked).toBeLessThan(
        provider.createHold.mock.invocationCallOrder[0],
      );
    });

    it.each([
      ["bad input", fakeProvider, { ...DINNER, time: "25:00" }],
      ["a closed day", fakeProvider, { ...DINNER, searchDate: "2026-10-19" }],
      ["a time that has gone", () => searching([slot("12:30")]), DINNER],
    ])(
      "never asks the limit for %s",
      async function notAskedBeforeHolding(_case, provider, input) {
        const gate = vi.fn(ALLOW_HOLDS);

        await service(provider()).holdTable(input, gate);

        expect(gate).not.toHaveBeenCalled();
      },
    );

    it.each(["pending", "confirmed"] as const)(
      "never asks the limit when ResDiary has the same hold %s",
      async function notAskedForSameHold(status) {
        const provider = fakeProvider();
        const first = await service(provider).holdTable(DINNER, ALLOW_HOLDS);
        provider.getHoldStatus.mockResolvedValue(
          ok({ status, reference: HOLD.reference }),
        );
        const gate = vi.fn(ALLOW_HOLDS);

        await service(provider).holdTable(
          DINNER,
          gate,
          first._unsafeUnwrap().holdToken,
        );

        expect(gate).not.toHaveBeenCalled();
      },
    );
  });

  it("holds the table and returns a signed token with the summary", async function holds() {
    const provider = fakeProvider();

    const result = await service(provider).holdTable(DINNER, ALLOW_HOLDS);

    const hold = result._unsafeUnwrap();
    expect(hold.holdToken).toMatch(/^[\w-]+\.[\w-]+$/);
    expect(hold.expiresInMs).toBe(298_200);
    expect(hold.cookieMaxAgeSeconds).toBe(1199);
    expect(hold.summary).toEqual({
      reference: "B9GXWPLY",
      date: FRIDAY,
      dateLabel: "Fri, 23 Oct 2026",
      time: "19:30",
      timeLabel: "7:30 pm",
      partySize: 2,
      guestsLabel: "2 guests",
      offer: {
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
    });
    expect(provider.createHold).toHaveBeenCalledWith(
      { date: FRIDAY, time: "19:30", partySize: 2 },
      { deadlineAt: NOW.getTime() + 5000 },
    );
  });

  it("holds a dinner time with no tick box: continuing is agreeing to the return time", async function noTick() {
    const provider = fakeProvider();

    const result = await service(provider).holdTable(DINNER, ALLOW_HOLDS);

    expect(result._unsafeUnwrap().summary.offer.returnBy).toMatchObject({
      label: "8:30 pm",
      required: true,
    });
    expect(provider.createHold).toHaveBeenCalledTimes(1);
  });

  it("holds a lunch time, showing its return time as information", async function holdsLunch() {
    const result = await service().holdTable(LUNCH, ALLOW_HOLDS);

    expect(result._unsafeUnwrap().summary.offer.returnBy).toEqual({
      time: "14:00",
      label: "2:00 pm",
      nextDay: false,
      required: false,
    });
  });

  it("uses ResDiary's return time, never one the browser sends", async function ignoresBrowserReturnBy() {
    const result = await service().holdTable(
      {
        ...DINNER,
        offer: {
          kind: "standard",
          returnBy: { time: "23:30", label: "11:30 pm", nextDay: false },
        },
        returnBy: "23:30",
      },
      ALLOW_HOLDS,
    );

    expect(result._unsafeUnwrap().summary.offer).toMatchObject({
      returnBy: { time: "20:30" },
    });
  });

  it("holds an after-midnight time on the searched date", async function holdsAfterMidnight() {
    const provider = searching([slot("00:15", { date: "2026-10-24" })]);

    const result = await service(provider).holdTable(
      {
        ...LUNCH,
        time: "00:15",
      },
      ALLOW_HOLDS,
    );

    expect(result._unsafeUnwrap().summary).toMatchObject({
      date: "2026-10-24",
      dateLabel: "Sat, 24 Oct 2026",
      timeLabel: "12:15 am",
    });
    expect(provider.createHold).toHaveBeenCalledWith(
      { date: FRIDAY, time: "00:15", partySize: 2 },
      expect.anything(),
    );
  });

  it("follows a shorter hold set by the restaurant", async function shortHold() {
    const provider = fakeProvider();
    provider.createHold.mockResolvedValue(
      ok({ ...HOLD, expiresInMs: 120_000 }),
    );

    const hold = (
      await service(provider).holdTable(DINNER, ALLOW_HOLDS)
    )._unsafeUnwrap();

    expect(hold.expiresInMs).toBe(120_000);
    expect(hold.cookieMaxAgeSeconds).toBe(1020);
  });

  describe("refusing before holding", function refusalTests() {
    it.each([
      [
        "a closed day",
        { searchDate: "2026-10-19" },
        { date: "We're closed that day." },
      ],
      [
        "11 guests when the most is 10",
        { partySize: 11 },
        { partySize: "For more than 10 guests, please call or email us." },
      ],
      [
        "a promotion while promotions are off",
        { offer: { kind: "promotion", promotionId: 3041 } },
        { offer: "Choose a time." },
      ],
      [
        "a time that is not a time",
        { time: "25:00" },
        { time: "Choose a time." },
      ],
      [
        "a date that is not a date",
        { searchDate: "23/10/2026" },
        { date: "Choose a date." },
      ],
    ])(
      "refuses %s without searching",
      async function refuses(_case, change, fieldErrors) {
        const provider = fakeProvider();

        const result = await service(provider).holdTable(
          {
            ...DINNER,
            ...change,
          },
          ALLOW_HOLDS,
        );

        const error = result._unsafeUnwrapErr();
        expect(error.code).toBe(ErrorCode.ValidationError);
        expect(error.fieldErrors).toEqual(fieldErrors);
        expect(provider.searchTimes).not.toHaveBeenCalled();
        expect(provider.createHold).not.toHaveBeenCalled();
      },
    );

    it("never reads a closed day's rules", async function closedDayRules() {
      const provider = fakeProvider();

      await service(provider).holdTable(
        {
          ...DINNER,
          searchDate: "2026-10-19",
        },
        ALLOW_HOLDS,
      );

      expect(rulesReadFor(provider, "2026-10-19")).toBe(false);
    });

    it.each([
      ["taken since the guest searched", [slot("12:30")], NOW],
      [
        "passed while the guest looked",
        TIMES.slots,
        new Date("2026-10-23T18:31:00Z"),
      ],
      [
        "now only bookable with a promotion",
        [slot("19:30", { standard: false })],
        NOW,
      ],
    ])(
      "answers time gone when it was %s",
      async function timeGone(_case, slots, now) {
        vi.setSystemTime(now);
        const provider = searching(slots);

        const result = await service(provider).holdTable(DINNER, ALLOW_HOLDS);

        expect(result._unsafeUnwrapErr()).toMatchObject({
          code: ErrorCode.Conflict,
          message: TIME_GONE,
        });
        expect(provider.createHold).not.toHaveBeenCalled();
      },
    );

    it("answers unavailable when the check before holding fails", async function checkFails() {
      const provider = fakeProvider();
      provider.searchTimes.mockResolvedValue(
        err({ kind: "unavailable", operation: "searchTimes" }),
      );

      const result = await service(provider).holdTable(DINNER, ALLOW_HOLDS);

      expect(result._unsafeUnwrapErr().code).toBe(ErrorCode.ServiceUnavailable);
      expect(provider.createHold).not.toHaveBeenCalled();
    });

    it("stays off without the hold secret", async function noHoldSecret() {
      const provider = fakeProvider();

      const result = await createBookingService({
        provider,
        holdSecret: null,
      }).holdTable(DINNER, ALLOW_HOLDS);

      expect(result._unsafeUnwrapErr().code).toBe(ErrorCode.ServiceUnavailable);
      expect(provider.searchTimes).not.toHaveBeenCalled();
    });
  });

  describe("when the hold fails", function holdFailureTests() {
    it.each([
      [
        "a 500 and the time is gone",
        { kind: "outcome_unknown", httpStatus: 500 },
        [slot("12:30")],
        ErrorCode.Conflict,
      ],
      [
        "a lost reply and the time is gone (maybe our own hold)",
        { kind: "outcome_unknown", detail: "timeout" },
        [slot("12:30")],
        ErrorCode.Conflict,
      ],
      [
        "a 500 and the time is still offered",
        { kind: "outcome_unknown", httpStatus: 500 },
        TIMES.slots,
        ErrorCode.ServiceUnavailable,
      ],
      [
        "a 429 and the time is still offered",
        { kind: "unavailable", httpStatus: 429 },
        TIMES.slots,
        ErrorCode.ServiceUnavailable,
      ],
    ] as const)(
      "searches again after %s",
      async function recovers(_case, failure, slots, code) {
        const provider = fakeProvider();
        provider.createHold.mockResolvedValue(
          err({ ...failure, operation: "createHold" }),
        );
        provider.searchTimes
          .mockResolvedValueOnce(ok(TIMES))
          .mockResolvedValueOnce(
            ok({ mayRequireCard: false, slots: [...slots] }),
          );

        const result = await service(provider).holdTable(DINNER, ALLOW_HOLDS);

        expect(result._unsafeUnwrapErr().code).toBe(code);
        expect(provider.searchTimes).toHaveBeenLastCalledWith(
          { date: FRIDAY, partySize: 2 },
          { deadlineAt: NOW.getTime() + 2500 },
        );
      },
    );

    it("times each step from when the one before it ends", async function slidingBudget() {
      const provider = fakeProvider();
      provider.searchTimes.mockImplementationOnce(function slowCheck() {
        vi.setSystemTime(NOW.getTime() + 3000);
        return Promise.resolve(ok(TIMES));
      });
      provider.createHold.mockImplementation(function slowHold() {
        vi.setSystemTime(NOW.getTime() + 7500);
        return Promise.resolve(
          err({ kind: "outcome_unknown", operation: "createHold" }),
        );
      });

      await service(provider).holdTable(DINNER, ALLOW_HOLDS);

      expect(provider.searchTimes.mock.calls[0]?.[1]).toEqual({
        deadlineAt: NOW.getTime() + 5000,
      });
      expect(provider.createHold.mock.calls[0]?.[1]).toEqual({
        deadlineAt: NOW.getTime() + 3000 + 5000,
      });
      expect(provider.searchTimes.mock.calls[1]?.[1]).toEqual({
        deadlineAt: NOW.getTime() + 7500 + 2500,
      });
    });

    it("answers unavailable when the second search also fails", async function recoveryFails() {
      const provider = fakeProvider();
      provider.createHold.mockResolvedValue(
        err({ kind: "outcome_unknown", operation: "createHold" }),
      );
      provider.searchTimes
        .mockResolvedValueOnce(ok(TIMES))
        .mockResolvedValueOnce(
          err({ kind: "unavailable", operation: "searchTimes" }),
        );

      const result = await service(provider).holdTable(DINNER, ALLOW_HOLDS);

      expect(result._unsafeUnwrapErr().code).toBe(ErrorCode.ServiceUnavailable);
    });

    it("answers unavailable without searching again when the hold never reached ResDiary", async function notSent() {
      const provider = fakeProvider();
      provider.createHold.mockResolvedValue(
        err({
          kind: "unavailable",
          operation: "createHold",
          detail: "network",
        }),
      );

      const result = await service(provider).holdTable(DINNER, ALLOW_HOLDS);

      expect(result._unsafeUnwrapErr().code).toBe(ErrorCode.ServiceUnavailable);
      expect(provider.searchTimes).toHaveBeenCalledTimes(1);
    });

    it("logs an error when ResDiary refuses a hold our checks allowed", async function holdRejected() {
      const provider = fakeProvider();
      provider.createHold.mockResolvedValue(
        err({
          kind: "rejected",
          operation: "createHold",
          fields: ["VisitTime"],
        }),
      );

      const result = await service(provider).holdTable(DINNER, ALLOW_HOLDS);

      expect(result._unsafeUnwrapErr().code).toBe(ErrorCode.ServiceUnavailable);
      expect(console.error).toHaveBeenCalledTimes(1);
    });

    it("answers outcome unknown when something throws, since a hold may exist", async function unexpectedThrow() {
      const provider = fakeProvider();
      provider.createHold.mockRejectedValue(new Error("boom"));

      const result = await service(provider).holdTable(DINNER, ALLOW_HOLDS);

      expect(result._unsafeUnwrapErr().code).toBe(ErrorCode.OutcomeUnknown);
      expect(logToSentry).toHaveBeenCalledTimes(1);
    });
  });

  describe("an existing hold", function existingHoldTests() {
    async function firstHold(provider = fakeProvider(), input = DINNER) {
      const result = await service(provider).holdTable(input, ALLOW_HOLDS);
      return { provider, token: result._unsafeUnwrap().holdToken };
    }

    it("hands back the same hold for the same choice while ResDiary still holds it", async function reuses() {
      const { provider, token } = await firstHold();
      vi.setSystemTime(NOW.getTime() + 60_000);

      const again = await service(provider).holdTable(
        DINNER,
        ALLOW_HOLDS,
        token,
      );

      const hold = again._unsafeUnwrap();
      expect(hold.holdToken).toBe(token);
      expect(hold.expiresInMs).toBe(238_200);
      expect(hold.summary.reference).toBe("B9GXWPLY");
      expect(provider.getHoldStatus).toHaveBeenCalledWith(425742, {
        deadlineAt: NOW.getTime() + 63_000,
      });
      expect(provider.createHold).toHaveBeenCalledTimes(1);
    });

    it("measures the hold on our own clock, not ResDiary's", async function ourClock() {
      const provider = fakeProvider();
      provider.createHold.mockResolvedValue(
        ok({ ...HOLD, expiresAt: NOW.getTime() + 260_000 }),
      );
      const { token } = await firstHold(provider);
      vi.setSystemTime(NOW.getTime() + 260_000);

      const again = await service(provider).holdTable(
        DINNER,
        ALLOW_HOLDS,
        token,
      );

      expect(again._unsafeUnwrap().expiresInMs).toBe(38_200);
      expect(provider.createHold).toHaveBeenCalledTimes(1);
    });

    it.each([
      [
        "ResDiary has dropped it",
        function dropped(provider: ReturnType<typeof fakeProvider>) {
          provider.getHoldStatus.mockResolvedValue(
            ok({ status: "failed", reference: HOLD.reference }),
          );
        },
      ],
      [
        "its status cannot be read",
        function unreadable(provider: ReturnType<typeof fakeProvider>) {
          provider.getHoldStatus.mockResolvedValue(
            err({ kind: "unavailable", operation: "getHoldStatus" }),
          );
        },
      ],
      [
        "it has under 30 seconds left",
        function nearlyOver() {
          vi.setSystemTime(NOW.getTime() + 270_000);
        },
      ],
    ])("makes a new hold when %s", async function replaces(_case, arrange) {
      const { provider, token } = await firstHold();
      arrange(provider);

      const again = await service(provider).holdTable(
        DINNER,
        ALLOW_HOLDS,
        token,
      );

      expect(again.isOk()).toBe(true);
      expect(provider.createHold).toHaveBeenCalledTimes(2);
    });

    it("tells the guest they already booked when ResDiary has confirmed the same hold", async function alreadyBooked() {
      const { provider, token } = await firstHold();
      provider.getHoldStatus.mockResolvedValue(
        ok({ status: "confirmed", reference: HOLD.reference }),
      );

      const again = await service(provider).holdTable(
        DINNER,
        ALLOW_HOLDS,
        token,
      );

      expect(again._unsafeUnwrapErr()).toEqual({
        code: ErrorCode.Conflict,
        message:
          "You've already booked this table. Your booking reference is B9GXWPLY.",
      });
      expect(provider.createHold).toHaveBeenCalledTimes(1);
    });

    it("makes a new hold for a different time, leaving the old one to expire", async function differentTime() {
      const { provider, token } = await firstHold(fakeProvider(), LUNCH);

      const again = await service(provider).holdTable(
        DINNER,
        ALLOW_HOLDS,
        token,
      );

      expect(again._unsafeUnwrap().summary.time).toBe("19:30");
      expect(provider.getHoldStatus).not.toHaveBeenCalled();
      expect(provider.createHold).toHaveBeenCalledTimes(2);
    });

    it.each([
      [
        "tampered with",
        function tamper(token: string) {
          return `${token.slice(0, -1)}${token.endsWith("A") ? "B" : "A"}`;
        },
      ],
      [
        "signed with another secret",
        async function foreign() {
          const other = createBookingService({
            provider: fakeProvider(),
            holdSecret: "another-test-only-secret-0123456789abcdef",
          });
          return (await other.holdTable(DINNER, ALLOW_HOLDS))._unsafeUnwrap()
            .holdToken;
        },
      ],
      [
        "not a token at all",
        function garbage() {
          return "not-a-token";
        },
      ],
    ])(
      "ignores a token %s, with a warning",
      async function ignoresBadToken(_case, change) {
        const { provider, token } = await firstHold();
        const badToken = await change(token);

        const again = await service(provider).holdTable(
          DINNER,
          ALLOW_HOLDS,
          badToken,
        );

        expect(again.isOk()).toBe(true);
        expect(provider.getHoldStatus).not.toHaveBeenCalled();
        expect(provider.createHold).toHaveBeenCalledTimes(2);
        expect(console.warn).toHaveBeenCalledTimes(1);
        expect(
          JSON.stringify(vi.mocked(console.warn).mock.calls),
        ).not.toContain(badToken);
      },
    );
  });
});
