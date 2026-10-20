import { err, ok } from "neverthrow";
import { describe, expect, it, vi } from "vitest";

import {
  ALLOW_HOLDS,
  DINNER,
  fakeProvider,
  HOLD,
  HOLD_QUERY,
  NOW,
  service,
  setUpBookingTests,
} from "@/__tests__/services/bookings/fixtures";
import { ErrorCode } from "@/lib/enums";
import { logToSentry } from "@/lib/error-handler";
import type { IResDiaryHoldStatus } from "@/lib/types";
import { createBookingService } from "@/services/bookings";

vi.mock("@/lib/error-handler", () => ({ logToSentry: vi.fn() }));

setUpBookingTests();

async function held(provider = fakeProvider()) {
  const hold = await service(provider).holdTable(DINNER, ALLOW_HOLDS);
  return { provider, token: hold._unsafeUnwrap().holdToken };
}

function resdiarySays(
  provider: ReturnType<typeof fakeProvider>,
  status: IResDiaryHoldStatus["status"],
) {
  provider.getHoldStatus.mockResolvedValue(
    ok({ status, reference: HOLD.reference }),
  );
}

const AFTER_EXPIRY = NOW.getTime() + 300_000;
const TOKEN_EXPIRY = NOW.getTime() + HOLD.expiresInMs;
const GRACE_MS = 15 * 60_000;

describe("getHoldStatus", function getHoldStatusTests() {
  it("still asks ResDiary during the 15 minutes of grace after the hold ends", async function withinGrace() {
    const { provider, token } = await held();
    resdiarySays(provider, "pending");
    vi.setSystemTime(TOKEN_EXPIRY + GRACE_MS - 1000);

    const result = await service(provider).getHoldStatus(HOLD_QUERY, token);

    expect(result._unsafeUnwrap().status).toBe("pending");
    expect(provider.getHoldStatus).toHaveBeenCalledTimes(1);
  });

  it("refuses a signed token kept past the grace, without asking ResDiary", async function pastGrace() {
    const { provider, token } = await held();
    resdiarySays(provider, "confirmed");
    vi.setSystemTime(TOKEN_EXPIRY + GRACE_MS + 1);

    const result = await service(provider).getHoldStatus(HOLD_QUERY, token);

    expect(result._unsafeUnwrapErr()).toMatchObject({
      code: ErrorCode.NotFound,
      clearHold: true,
    });
    expect(provider.getHoldStatus).not.toHaveBeenCalled();
  });

  it("reports a booking ResDiary confirmed, with the token's summary", async function confirmed() {
    const { provider, token } = await held();
    resdiarySays(provider, "confirmed");

    const result = await service(provider).getHoldStatus(HOLD_QUERY, token);

    expect(result._unsafeUnwrap()).toEqual({
      status: "confirmed",
      reference: "B9GXWPLY",
      summary: expect.objectContaining({
        dateLabel: "Fri, 23 Oct 2026",
        timeLabel: "7:30 pm",
        guestsLabel: "2 guests",
      }),
      clearHold: true,
    });
    expect(provider.getHoldStatus).toHaveBeenLastCalledWith(425742, {
      deadlineAt: NOW.getTime() + 3000,
    });
  });

  it.each([
    ["pending, with time left", "pending", NOW.getTime(), "pending", false],
    ["pending, past the hold's end", "pending", AFTER_EXPIRY, "pending", false],
    [
      "confirmed, past the hold's end",
      "confirmed",
      AFTER_EXPIRY,
      "confirmed",
      true,
    ],
    ["failed, with time left", "failed", NOW.getTime(), "failed", true],
    ["failed, past the hold's end", "failed", AFTER_EXPIRY, "expired", true],
    ["cancelled, with time left", "cancelled", NOW.getTime(), "failed", true],
    [
      "cancelled, past the hold's end",
      "cancelled",
      AFTER_EXPIRY,
      "expired",
      true,
    ],
    ["a status it does not know", "unknown", NOW.getTime(), "pending", false],
  ] as const)(
    "maps ResDiary's %s",
    async function maps(_case, resdiary, now, status, clearHold) {
      const { provider, token } = await held();
      resdiarySays(provider, resdiary);
      vi.setSystemTime(now);

      const result = await service(provider).getHoldStatus(HOLD_QUERY, token);

      expect(result._unsafeUnwrap()).toMatchObject({ status, clearHold });
    },
  );

  it("asks ResDiary on every poll and keeps nothing between polls", async function noCache() {
    const { provider, token } = await held();
    const bookings = service(provider);
    provider.getHoldStatus.mockClear();

    await bookings.getHoldStatus(HOLD_QUERY, token);
    vi.setSystemTime(NOW.getTime() + 2000);
    await bookings.getHoldStatus(HOLD_QUERY, token);
    vi.setSystemTime(NOW.getTime() + 4000);
    await bookings.getHoldStatus(HOLD_QUERY, token);

    expect(provider.getHoldStatus).toHaveBeenCalledTimes(3);
  });

  it("logs nothing on a normal poll", async function quietPoll() {
    const { provider, token } = await held();

    await service(provider).getHoldStatus(HOLD_QUERY, token);

    expect(console.log).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  describe("when it cannot tell", function failureTests() {
    it("answers not found without asking ResDiary when the cookie is gone", async function noCookie() {
      const provider = fakeProvider();

      const result = await service(provider).getHoldStatus(
        HOLD_QUERY,
        undefined,
      );

      expect(result._unsafeUnwrapErr().code).toBe(ErrorCode.NotFound);
      expect(provider.getHoldStatus).not.toHaveBeenCalled();
    });

    it.each([
      ["another hold", { holdReference: "BOTHERTAB", holdRevision: 1 }],
      [
        "the hold before another tab moved it",
        { ...HOLD_QUERY, holdRevision: 2 },
      ],
    ])(
      "answers not found without asking ResDiary when the page waits for %s",
      async function otherTab(_case, query) {
        const { provider, token } = await held();
        provider.getHoldStatus.mockClear();

        const result = await service(provider).getHoldStatus(query, token);

        const error = result._unsafeUnwrapErr();
        expect(error.code).toBe(ErrorCode.NotFound);
        expect(error.clearHold).toBeUndefined();
        expect(provider.getHoldStatus).not.toHaveBeenCalled();
      },
    );

    it("answers not found for a tampered token, with a warning", async function tampered() {
      const { provider, token } = await held();
      provider.getHoldStatus.mockClear();

      const result = await service(provider).getHoldStatus(
        HOLD_QUERY,
        `${token.slice(0, -1)}${token.endsWith("A") ? "B" : "A"}`,
      );

      expect(result._unsafeUnwrapErr().code).toBe(ErrorCode.NotFound);
      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(provider.getHoldStatus).not.toHaveBeenCalled();
    });

    it.each([
      ["a 404", "not_found"],
      ["a failed read", "unavailable"],
    ] as const)(
      "keeps the guest waiting after %s",
      async function readFails(_case, kind) {
        const { provider, token } = await held();
        provider.getHoldStatus.mockResolvedValue(
          err({ kind, operation: "getHoldStatus" }),
        );

        const result = await service(provider).getHoldStatus(HOLD_QUERY, token);

        expect(result._unsafeUnwrapErr().code).toBe(
          ErrorCode.ServiceUnavailable,
        );
      },
    );

    it("logs and captures an unexpected throw once", async function unexpectedThrow() {
      const { provider, token } = await held();
      provider.getHoldStatus.mockRejectedValue(new Error("boom"));

      const result = await service(provider).getHoldStatus(HOLD_QUERY, token);

      expect(result._unsafeUnwrapErr().code).toBe(ErrorCode.ServiceUnavailable);
      expect(logToSentry).toHaveBeenCalledTimes(1);
    });

    it("stays off without the hold secret", async function noHoldSecret() {
      const { provider, token } = await held();

      const result = await createBookingService({
        provider,
        holdSecret: null,
      }).getHoldStatus(HOLD_QUERY, token);

      expect(result._unsafeUnwrapErr().code).toBe(ErrorCode.ServiceUnavailable);
    });
  });
});
