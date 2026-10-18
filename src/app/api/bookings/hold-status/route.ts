import { cookies } from "next/headers";

import { forgetHoldToken, readHoldToken } from "@/lib/booking-cookie";
import { bookingJson, bookingQuery } from "@/lib/booking-response";
import { bookings } from "@/services/bookings";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const status = await bookings.getHoldStatus(
    bookingQuery(request),
    readHoldToken(cookieStore),
  );
  const holdDone = status.isOk()
    ? status.value.clearHold
    : status.error.clearHold === true;
  if (holdDone) {
    forgetHoldToken(cookieStore);
  }
  return bookingJson(status);
}
