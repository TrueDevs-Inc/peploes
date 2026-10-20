import type { cookies } from "next/headers";
import { afterEach, describe, expect, expectTypeOf, it, vi } from "vitest";

import { fakeCookieStore } from "@/__tests__/mocks/cookie-store";
import {
  forgetHoldToken,
  pageHoldReference,
  readHoldToken,
  storeHoldToken,
} from "@/lib/booking-cookie";
import type { IHoldCookieStore } from "@/lib/types";

afterEach(function resetEnv() {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("the hold cookie", function holdCookieTests() {
  it("accepts the cookie store Next.js gives actions and routes", function fitsNextStore() {
    expectTypeOf<
      Awaited<ReturnType<typeof cookies>>
    >().toExtend<IHoldCookieStore>();
  });

  it("stores each hold's token in its own cookie, where page scripts cannot read it", function storesToken() {
    const { store, cookies } = fakeCookieStore();

    storeHoldToken(store, "B9GXWPLY", "signed.token", 1199);

    expect(cookies.get("peploes_booking_hold_B9GXWPLY")).toEqual({
      value: "signed.token",
      options: {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
        maxAge: 1199,
      },
    });
  });

  it("keeps the cookie on HTTPS in production", async function secureInProduction() {
    vi.stubEnv("NODE_ENV", "production");
    vi.resetModules();
    const { storeHoldToken: storeInProduction } = await import(
      "@/lib/booking-cookie"
    );
    const { store, cookies } = fakeCookieStore();

    storeInProduction(store, "B9GXWPLY", "signed.token", 1199);

    expect(cookies.get("peploes_booking_hold_B9GXWPLY")?.options).toMatchObject(
      { secure: true },
    );
  });

  it("reads back only the named hold's token", function readsToken() {
    const { store } = fakeCookieStore();

    const before = readHoldToken(store, "B9GXWPLY");
    storeHoldToken(store, "B9GXWPLY", "signed.token", 1199);

    expect(before).toBeUndefined();
    expect(readHoldToken(store, "B9GXWPLY")).toBe("signed.token");
    expect(readHoldToken(store, "BOTHERTAB")).toBeUndefined();
    expect(readHoldToken(store, undefined)).toBeUndefined();
  });

  it("forgets one hold and leaves another tab's hold alone", function forgetsToken() {
    const { store, cookies } = fakeCookieStore();
    storeHoldToken(store, "B9GXWPLY", "first.token", 1199);
    storeHoldToken(store, "BOTHERTAB", "other.token", 1199);

    forgetHoldToken(store, "B9GXWPLY");
    forgetHoldToken(store, undefined);

    expect(cookies.has("peploes_booking_hold_B9GXWPLY")).toBe(false);
    expect(readHoldToken(store, "BOTHERTAB")).toBe("other.token");
  });

  it.each([
    [{ holdReference: "B9GXWPLY", time: "19:30" }, "B9GXWPLY"],
    [{ holdReference: "../B9GX" }, undefined],
    [{ holdReference: "B9GX;path=/" }, undefined],
    [{ holdReference: "" }, undefined],
    [{ holdReference: 425_742 }, undefined],
    [{}, undefined],
    [null, undefined],
  ])(
    "takes the hold reference from %o only when it can be a booking reference",
    function readsPageReference(input, reference) {
      expect(pageHoldReference(input)).toBe(reference);
    },
  );
});
