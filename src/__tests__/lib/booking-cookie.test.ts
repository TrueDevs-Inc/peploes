import type { cookies } from "next/headers";
import { afterEach, describe, expect, expectTypeOf, it, vi } from "vitest";

import { fakeCookieStore } from "@/__tests__/mocks/cookie-store";
import {
  forgetHoldToken,
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

  it("stores the token where page scripts cannot read it, for the hold's lifetime", function storesToken() {
    const { store, cookies } = fakeCookieStore();

    storeHoldToken(store, "signed.token", 1199);

    expect(cookies.get("peploes_booking_hold")).toEqual({
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

    storeInProduction(store, "signed.token", 1199);

    expect(cookies.get("peploes_booking_hold")?.options).toMatchObject({
      secure: true,
    });
  });

  it("reads the stored token back, or nothing when there is no cookie", function readsToken() {
    const { store } = fakeCookieStore();

    const before = readHoldToken(store);
    storeHoldToken(store, "signed.token", 1199);

    expect(before).toBeUndefined();
    expect(readHoldToken(store)).toBe("signed.token");
  });

  it("forgets the token", function forgetsToken() {
    const { store, cookies } = fakeCookieStore();
    storeHoldToken(store, "signed.token", 1199);

    forgetHoldToken(store);

    expect(cookies.has("peploes_booking_hold")).toBe(false);
    expect(readHoldToken(store)).toBeUndefined();
  });
});
