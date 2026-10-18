import { afterEach, describe, expect, it, vi } from "vitest";

import {
  fakeProvider,
  HOLD_SECRET,
  setUpBookingTests,
} from "@/__tests__/services/bookings/fixtures";

vi.mock("@/lib/error-handler", () => ({ logToSentry: vi.fn() }));

setUpBookingTests();

describe("the hold secret setting", function holdSecretSettingTests() {
  afterEach(function resetEnv() {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it.each([
    ["set", HOLD_SECRET, true],
    ["missing", "", false],
  ])(
    "turns booking on only when BOOKING_HOLD_SECRET is %s",
    async function readsSecret(_case, secret, on) {
      vi.stubEnv("BOOKING_HOLD_SECRET", secret);
      vi.resetModules();
      const { createBookingService: fromEnv } = await import(
        "@/services/bookings"
      );

      const result = await fromEnv({
        provider: fakeProvider(),
      }).getFindTableData();

      expect(result.isOk()).toBe(on);
    },
  );
});
