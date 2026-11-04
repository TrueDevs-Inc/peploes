import { err, ok } from "neverthrow";
import { describe, expect, it, vi } from "vitest";

import {
  ALLOW_HOLDS,
  DINNER,
  fakeProvider,
  GUEST_DETAILS,
  HOLD,
  HOLD_QUERY,
  STRIPE_STEP,
  service,
  setUpBookingTests,
} from "@/__tests__/services/bookings/fixtures";
import { ErrorCode } from "@/lib/enums";
import { logToSentry } from "@/lib/error-handler";

vi.mock("@/lib/error-handler", () => ({ logToSentry: vi.fn() }));

setUpBookingTests();

function observations(): string {
  return vi.mocked(console.log).mock.calls.flat().join("\n");
}

describe("booking reconciliation evidence", () => {
  it("links a hold and confirmed submission without logging guest data or tokens", async () => {
    const bookings = service();
    const hold = (
      await bookings.holdTable(DINNER, ALLOW_HOLDS)
    )._unsafeUnwrap();

    await bookings.submitGuestDetails(GUEST_DETAILS, hold.holdToken);

    const logs = observations();
    expect(logs).toContain('"event":"hold_created"');
    expect(logs).toContain('"event":"details_submitted"');
    expect(logs).toContain('"event":"confirmed"');
    const ids = [...logs.matchAll(/"correlationId":"([a-f0-9]{64})"/g)].map(
      (match) => match[1],
    );
    expect(ids).toHaveLength(3);
    expect(new Set(ids).size).toBe(1);
    for (const privateValue of [
      GUEST_DETAILS.email,
      GUEST_DETAILS.mobile,
      GUEST_DETAILS.specialRequests,
      HOLD.reference,
      hold.holdToken,
    ]) {
      expect(logs).not.toContain(privateValue);
    }
  });

  it.each(["payment", "card"] as const)(
    "keeps a %s requirement separate from a later ResDiary confirmation",
    async (kind) => {
      const provider = fakeProvider();
      provider.submitHoldGuest.mockResolvedValue(
        ok({
          kind,
          amountCents: 2000,
          amountText: "€20.00",
          stripe: STRIPE_STEP,
        }),
      );
      const bookings = service(provider);
      const hold = (
        await bookings.holdTable(DINNER, ALLOW_HOLDS)
      )._unsafeUnwrap();
      const submitted = (
        await bookings.submitGuestDetails(GUEST_DETAILS, hold.holdToken)
      )._unsafeUnwrap();
      const token = "holdCookie" in submitted ? submitted.holdCookie.token : "";

      await bookings.getHoldStatus(HOLD_QUERY, token);
      expect(observations()).toContain(`"event":"${kind}_required"`);
      expect(observations()).toContain('"event":"status_pending"');
      expect(observations()).not.toContain('"event":"confirmed"');
      expect(observations()).not.toContain(STRIPE_STEP.clientSecret);

      provider.getHoldStatus.mockResolvedValue(
        ok({ status: "confirmed", reference: HOLD.reference }),
      );
      const recovered = await bookings.getHoldStatus(HOLD_QUERY, token);

      expect(recovered._unsafeUnwrap().status).toBe("confirmed");
      expect(observations()).toContain('"event":"status_confirmed"');
      expect(logToSentry).not.toHaveBeenCalled();
    },
  );

  it("alerts on an unknown submission and links a later recovery without resubmitting", async () => {
    const provider = fakeProvider();
    provider.submitHoldGuest.mockResolvedValue(
      err({ kind: "outcome_unknown", operation: "submitHoldGuest" }),
    );
    provider.getHoldStatus.mockResolvedValue(
      ok({ status: "unknown", reference: HOLD.reference }),
    );
    const bookings = service(provider);
    const hold = (
      await bookings.holdTable(DINNER, ALLOW_HOLDS)
    )._unsafeUnwrap();

    const result = await bookings.submitGuestDetails(
      GUEST_DETAILS,
      hold.holdToken,
    );
    const error = result._unsafeUnwrapErr();
    expect(error.holdCookie).toBeDefined();
    expect(logToSentry).toHaveBeenCalledWith(
      "Booking outcome needs reconciliation",
      expect.objectContaining({
        tags: { bookingReconciliation: "required" },
        context: {
          operation_data: {
            event: "outcome_unknown",
            correlationId: expect.stringMatching(/^[a-f0-9]{64}$/),
            revision: 1,
          },
        },
      }),
    );
    const alert = JSON.stringify(vi.mocked(logToSentry).mock.calls);
    expect(alert).not.toContain(String(HOLD.holdId));
    expect(alert).not.toContain(HOLD.reference);
    expect(alert).not.toContain(GUEST_DETAILS.email);

    provider.getHoldStatus.mockResolvedValue(
      ok({ status: "confirmed", reference: HOLD.reference }),
    );
    await bookings.getHoldStatus(HOLD_QUERY, error.holdCookie?.token);

    expect(observations()).toContain('"event":"status_confirmed"');
    expect(provider.submitHoldGuest).toHaveBeenCalledTimes(1);
    expect(provider.createHold).toHaveBeenCalledTimes(1);
  });

  it("records an attempted hold even when its creation reply is lost", async () => {
    const provider = fakeProvider();
    provider.createHold.mockResolvedValue(
      err({ kind: "outcome_unknown", operation: "createHold" }),
    );

    await service(provider).holdTable(DINNER, ALLOW_HOLDS);

    expect(observations()).toContain('"event":"hold_requested"');
    const failures = vi.mocked(console.error).mock.calls.flat().join("\n");
    expect(failures).toContain('"event":"hold_outcome_unknown"');
    expect(failures).not.toContain('"holdId"');
    expect(provider.createHold).toHaveBeenCalledTimes(1);
  });

  it.each(["unavailable", "not_found"] as const)(
    "keeps the first submission unresolved when its retry returns %s",
    async (kind) => {
      const provider = fakeProvider();
      provider.submitHoldGuest
        .mockResolvedValueOnce(
          err({ kind: "outcome_unknown", operation: "submitHoldGuest" }),
        )
        .mockResolvedValueOnce(err({ kind, operation: "submitHoldGuest" }));
      const bookings = service(provider);
      const hold = (
        await bookings.holdTable(DINNER, ALLOW_HOLDS)
      )._unsafeUnwrap();

      const result = await bookings.submitGuestDetails(
        GUEST_DETAILS,
        hold.holdToken,
      );

      const failure = result._unsafeUnwrapErr();
      expect(failure.code).toBe(ErrorCode.OutcomeUnknown);
      expect(failure.clearHold).toBeUndefined();
      expect(failure.holdCookie).toBeDefined();
      expect(logToSentry).toHaveBeenCalledWith(
        "Booking outcome needs reconciliation",
        expect.objectContaining({
          tags: { bookingReconciliation: "required" },
        }),
      );
      expect(observations()).not.toContain('"event":"details_rejected"');
      expect(provider.submitHoldGuest).toHaveBeenCalledTimes(2);

      provider.getHoldStatus.mockResolvedValue(
        ok({ status: "confirmed", reference: HOLD.reference }),
      );
      const recovered = await bookings.getHoldStatus(
        HOLD_QUERY,
        failure.holdCookie?.token,
      );

      expect(recovered._unsafeUnwrap().status).toBe("confirmed");
      expect(provider.submitHoldGuest).toHaveBeenCalledTimes(2);
      expect(provider.createHold).toHaveBeenCalledTimes(1);
    },
  );

  it.each(["unknown", "unavailable"] as const)(
    "alerts when a submitted booking's status is %s without logging provider detail",
    async (state) => {
      const provider = fakeProvider();
      provider.submitHoldGuest.mockResolvedValue(
        ok({
          kind: "payment",
          amountCents: 2000,
          amountText: "€20.00",
          stripe: STRIPE_STEP,
        }),
      );
      const bookings = service(provider);
      const hold = (
        await bookings.holdTable(DINNER, ALLOW_HOLDS)
      )._unsafeUnwrap();
      const submitted = (
        await bookings.submitGuestDetails(GUEST_DETAILS, hold.holdToken)
      )._unsafeUnwrap();
      const token = "holdCookie" in submitted ? submitted.holdCookie.token : "";
      provider.getHoldStatus.mockResolvedValue(
        state === "unknown"
          ? ok({ status: "unknown", reference: HOLD.reference })
          : err({
              kind: "unavailable",
              operation: "getHoldStatus",
              detail: "guest@example.test pi_secret_private",
            }),
      );

      const result = await bookings.getHoldStatus(HOLD_QUERY, token);

      expect(result.isErr() || result.value.status === "pending").toBe(true);
      expect(logToSentry).toHaveBeenCalledTimes(1);
      const alerts = JSON.stringify(vi.mocked(logToSentry).mock.calls);
      expect(alerts).toContain(`status_${state}`);
      expect(alerts).not.toContain("guest@example.test");
      expect(alerts).not.toContain("pi_secret_private");
      expect(provider.submitHoldGuest).toHaveBeenCalledTimes(1);
    },
  );
});
