import "server-only";

import { pageHoldSchema } from "@/lib/booking-schema";
import { BOOKING_HOLD_COOKIE } from "@/lib/constants/booking";
import { isProduction } from "@/lib/env";
import type { IHoldCookieStore } from "@/lib/types";

function cookieName(reference: string): string {
  return `${BOOKING_HOLD_COOKIE.namePrefix}${reference}`;
}

export function pageHoldReference(input: unknown): string | undefined {
  const page = pageHoldSchema.safeParse(input);
  return page.success ? page.data.holdReference : undefined;
}

export function storeHoldToken(
  store: IHoldCookieStore,
  reference: string,
  token: string,
  maxAgeSeconds: number,
): void {
  store.set(cookieName(reference), token, {
    httpOnly: true,
    secure: isProduction(),
    sameSite: BOOKING_HOLD_COOKIE.sameSite,
    path: BOOKING_HOLD_COOKIE.path,
    maxAge: maxAgeSeconds,
  });
}

export function readHoldToken(
  store: IHoldCookieStore,
  reference: string | undefined,
): string | undefined {
  return reference ? store.get(cookieName(reference))?.value : undefined;
}

export function forgetHoldToken(
  store: IHoldCookieStore,
  reference: string | undefined,
): void {
  if (reference) {
    store.delete({
      name: cookieName(reference),
      path: BOOKING_HOLD_COOKIE.path,
    });
  }
}
