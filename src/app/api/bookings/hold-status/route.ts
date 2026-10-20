import { cookies } from "next/headers";

import {
  forgetHoldToken,
  pageHoldReference,
  readHoldToken,
} from "@/lib/booking-cookie";
import { bookingJson, bookingQuery } from "@/lib/booking-response";
import { bookings } from "@/services/bookings";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const query = bookingQuery(request);
  const holdReference = pageHoldReference(query);
  const status = await bookings.getHoldStatus(
    query,
    readHoldToken(cookieStore, holdReference),
  );
  const holdDone = status.isOk()
    ? status.value.clearHold
    : status.error.clearHold === true;
  if (holdDone) {
    forgetHoldToken(cookieStore, holdReference);
  }
  return bookingJson(status);
}
