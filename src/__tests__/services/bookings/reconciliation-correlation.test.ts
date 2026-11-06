import { ok } from "neverthrow";
import { describe, expect, it, vi } from "vitest";

import {
  ALLOW_HOLDS,
  DINNER,
  fakeProvider,
  GUEST_DETAILS,
  HOLD,
  LUNCH,
  STRIPE_STEP,
  service,
  setUpBookingTests,
} from "@/__tests__/services/bookings/fixtures";
import { ErrorCode } from "@/lib/enums";

vi.mock("@/lib/error-handler", () => ({ logToSentry: vi.fn() }));

setUpBookingTests();

function correlationIds(): string[] {
  const logs = vi.mocked(console.log).mock.calls.flat().join("\n");
  return [...logs.matchAll(/"correlationId":"([a-f0-9]{64})"/g)].flatMap(
    (match) => (match[1] ? [match[1]] : []),
  );
}

describe("booking reconciliation correlation", () => {
  it("keeps a hold's correlation across moves and service instances while separating other holds", async () => {
    const provider = fakeProvider();
    const first = (
      await service(provider).holdTable(DINNER, ALLOW_HOLDS)
    )._unsafeUnwrap();
    const [originalId] = correlationIds();
    vi.mocked(console.log).mockClear();

    const moved = await service(provider).holdTable(
      LUNCH,
      ALLOW_HOLDS,
      first.holdToken,
    );

    expect(moved._unsafeUnwrap().summary.revision).toBe(2);
    expect(correlationIds()).toEqual([originalId]);
    vi.mocked(console.log).mockClear();

    provider.createHold.mockResolvedValue(
      ok({ ...HOLD, holdId: HOLD.holdId + 1, reference: "BDIFFERENT" }),
    );
    await service(provider).holdTable(DINNER, ALLOW_HOLDS);

    expect(correlationIds()).toHaveLength(1);
    expect(correlationIds()[0]).not.toBe(originalId);
  });

  it("records confirmation recovered by reusing a hold after the payment step", async () => {
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
    await bookings.submitGuestDetails(GUEST_DETAILS, hold.holdToken);
    provider.getHoldStatus.mockResolvedValue(
      ok({ status: "confirmed", reference: HOLD.reference }),
    );
    vi.mocked(console.log).mockClear();

    const recovered = await bookings.holdTable(
      DINNER,
      ALLOW_HOLDS,
      hold.holdToken,
    );

    expect(recovered._unsafeUnwrapErr().code).toBe(ErrorCode.Conflict);
    expect(vi.mocked(console.log).mock.calls.flat().join("\n")).toContain(
      '"event":"status_confirmed"',
    );
    expect(provider.createHold).toHaveBeenCalledTimes(1);
    expect(provider.submitHoldGuest).toHaveBeenCalledTimes(1);
  });
});
