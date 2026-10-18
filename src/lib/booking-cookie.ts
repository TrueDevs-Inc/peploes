import "server-only";

import { BOOKING_HOLD_COOKIE } from "@/lib/constants/booking";
import { isProduction } from "@/lib/env";
import type { IHoldCookieStore } from "@/lib/types";

export function storeHoldToken(
  store: IHoldCookieStore,
  token: string,
  maxAgeSeconds: number,
): void {
  store.set(BOOKING_HOLD_COOKIE.name, token, {
    httpOnly: true,
    secure: isProduction(),
    sameSite: BOOKING_HOLD_COOKIE.sameSite,
    path: BOOKING_HOLD_COOKIE.path,
    maxAge: maxAgeSeconds,
  });
}

export function readHoldToken(store: IHoldCookieStore): string | undefined {
  return store.get(BOOKING_HOLD_COOKIE.name)?.value;
}

export function forgetHoldToken(store: IHoldCookieStore): void {
  store.delete({
    name: BOOKING_HOLD_COOKIE.name,
    path: BOOKING_HOLD_COOKIE.path,
  });
}
