import { err, ok } from "neverthrow";
import { describe, expect, it, vi } from "vitest";

import {
  ALLOW_HOLDS,
  DINNER,
  errorLogs,
  fakeProvider,
  HOLD,
  HOLD_QUERY,
  HOLD_SECRET,
  service,
  setUpBookingTests,
} from "@/__tests__/services/bookings/fixtures";
import { ErrorCode } from "@/lib/enums";
import type { IResDiaryHoldStatus } from "@/lib/types";
import { createBookingService } from "@/services/bookings";

vi.mock("@/lib/error-handler", () => ({ logToSentry: vi.fn() }));

setUpBookingTests();

const ILLNESS = { id: 26950, label: "Illness" };
const CHANGE_OF_PLANS = { id: 26952, label: "Change of plans" };

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

function cancellationEnabledService(provider: ReturnType<typeof fakeProvider>) {
  return createBookingService({
    provider,
    holdSecret: HOLD_SECRET,
    allowHoldCancellation: true,
  });
}

describe("releaseHold", function releaseHoldTests() {
  it("keeps pending holds when automatic cancellation is not enabled", async function releaseDisabled() {
    const { provider, token } = await held();
    const booking = createBookingService({ provider, holdSecret: HOLD_SECRET });

    const result = await booking.releaseHold(HOLD_QUERY, token);

    expect(result._unsafeUnwrapErr().code).toBe(ErrorCode.Forbidden);
    expect(provider.cancelHold).not.toHaveBeenCalled();
    expect(provider.getCancellationReasons).not.toHaveBeenCalled();
    expect(
      (await booking.getFindTableData())._unsafeUnwrap().allowHoldCancellation,
    ).toBe(false);
  });

  it("shows an already confirmed booking even with automatic cancellation disabled", async function confirmedWithReleaseDisabled() {
    const { provider, token } = await held();
    resdiarySays(provider, "confirmed");
    const booking = createBookingService({ provider, holdSecret: HOLD_SECRET });

    expect(
      (await booking.releaseHold(HOLD_QUERY, token))._unsafeUnwrap(),
    ).toMatchObject({ kind: "confirmed" });
    expect(provider.cancelHold).not.toHaveBeenCalled();
  });

  it.each(["failed", "cancelled"] as const)(
    "recognises an already %s hold when automatic cancellation is disabled",
    async function endedWithReleaseDisabled(status) {
      const { provider, token } = await held();
      resdiarySays(provider, status);
      const booking = createBookingService({
        provider,
        holdSecret: HOLD_SECRET,
      });

      expect(
        (await booking.releaseHold(HOLD_QUERY, token))._unsafeUnwrap(),
      ).toEqual({ kind: "released" });
      expect(provider.cancelHold).not.toHaveBeenCalled();
    },
  );

  it("cancels a pending hold on ResDiary with the change-of-plans reason", async function releasesPending() {
    const { provider, token } = await held();
    provider.getCancellationReasons.mockResolvedValue(
      ok([ILLNESS, CHANGE_OF_PLANS]),
    );

    const result = await cancellationEnabledService(provider).releaseHold(
      HOLD_QUERY,
      token,
    );

    expect(result._unsafeUnwrap()).toEqual({ kind: "released" });
    expect(provider.cancelHold).toHaveBeenCalledTimes(1);
    expect(provider.cancelHold.mock.calls[0]?.[0]).toEqual({
      holdId: HOLD.holdId,
      reference: HOLD.reference,
      reasonId: CHANGE_OF_PLANS.id,
    });
  });

  it("uses the first usable reason when none mentions a change", async function firstReason() {
    const { provider, token } = await held();
    provider.getCancellationReasons.mockResolvedValue(ok([ILLNESS]));

    await cancellationEnabledService(provider).releaseHold(HOLD_QUERY, token);

    expect(provider.cancelHold.mock.calls[0]?.[0]).toMatchObject({
      reasonId: ILLNESS.id,
    });
  });

  it("never cancels a booking ResDiary has already confirmed, and shows it instead", async function keepsConfirmed() {
    const { provider, token } = await held();
    resdiarySays(provider, "confirmed");

    const result = await cancellationEnabledService(provider).releaseHold(
      HOLD_QUERY,
      token,
    );

    expect(result._unsafeUnwrap()).toEqual({
      kind: "confirmed",
      reference: HOLD.reference,
      summary: expect.objectContaining({ timeLabel: "7:30 pm" }),
    });
    expect(provider.cancelHold).not.toHaveBeenCalled();
  });

  it("shows the booking when ResDiary confirms it during release", async function confirmedDuringRelease() {
    const { provider, token } = await held();
    provider.cancelHold.mockResolvedValue(ok("confirmed"));

    const result = await cancellationEnabledService(provider).releaseHold(
      HOLD_QUERY,
      token,
    );

    expect(result._unsafeUnwrap()).toEqual({
      kind: "confirmed",
      reference: HOLD.reference,
      summary: expect.objectContaining({ timeLabel: "7:30 pm" }),
    });
  });

  it.each(["failed", "cancelled"] as const)(
    "treats a hold ResDiary reports as %s as already released",
    async function alreadyGone(status) {
      const { provider, token } = await held();
      resdiarySays(provider, status);

      const result = await cancellationEnabledService(provider).releaseHold(
        HOLD_QUERY,
        token,
      );

      expect(result._unsafeUnwrap()).toEqual({ kind: "released" });
      expect(provider.cancelHold).not.toHaveBeenCalled();
    },
  );

  it("doesn't cancel when ResDiary's hold status can't be read or isn't known", async function statusUnclear() {
    const { provider, token } = await held();
    provider.getHoldStatus.mockResolvedValueOnce(
      err({ kind: "unavailable", operation: "getHoldStatus" }),
    );
    const unread = await cancellationEnabledService(provider).releaseHold(
      HOLD_QUERY,
      token,
    );
    resdiarySays(provider, "unknown");
    const unknown = await cancellationEnabledService(provider).releaseHold(
      HOLD_QUERY,
      token,
    );

    for (const result of [unread, unknown]) {
      expect(result._unsafeUnwrapErr()).toMatchObject({
        code: ErrorCode.ServiceUnavailable,
      });
    }
    expect(provider.cancelHold).not.toHaveBeenCalled();
  });

  it("refuses and logs when ResDiary has no reason the site may use", async function noReason() {
    const { provider, token } = await held();
    provider.getCancellationReasons.mockResolvedValue(ok([]));

    const result = await cancellationEnabledService(provider).releaseHold(
      HOLD_QUERY,
      token,
    );

    expect(result._unsafeUnwrapErr()).toMatchObject({
      code: ErrorCode.ServiceUnavailable,
    });
    expect(provider.cancelHold).not.toHaveBeenCalled();
    expect(errorLogs()).toContain("cancellation reason");
  });

  it("reports unavailable when ResDiary doesn't apply the cancel", async function notApplied() {
    const { provider, token } = await held();
    provider.cancelHold.mockResolvedValue(
      err({ kind: "outcome_unknown", operation: "cancelHold" }),
    );

    const result = await cancellationEnabledService(provider).releaseHold(
      HOLD_QUERY,
      token,
    );

    expect(result._unsafeUnwrapErr()).toMatchObject({
      code: ErrorCode.ServiceUnavailable,
    });
    expect(result._unsafeUnwrapErr().clearHold).toBeUndefined();
  });

  it("refuses another tab's revision and a missing token without asking ResDiary", async function refusesOthers() {
    const { provider, token } = await held();

    const otherTab = await cancellationEnabledService(provider).releaseHold(
      { ...HOLD_QUERY, holdRevision: 2 },
      token,
    );
    const missing = await cancellationEnabledService(provider).releaseHold(
      HOLD_QUERY,
      undefined,
    );

    expect(otherTab._unsafeUnwrapErr().code).toBe(ErrorCode.NotFound);
    expect(missing._unsafeUnwrapErr()).toMatchObject({
      code: ErrorCode.NotFound,
      clearHold: true,
    });
    expect(provider.getHoldStatus).not.toHaveBeenCalled();
    expect(provider.cancelHold).not.toHaveBeenCalled();
  });
});
