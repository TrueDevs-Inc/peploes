import { bookingJson, bookingQuery } from "@/lib/booking-response";
import { bookings } from "@/services/bookings";

export async function GET(request: Request) {
  return bookingJson(await bookings.getTimes(bookingQuery(request)));
}
