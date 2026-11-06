import { connection } from "next/server";

import { TableBookPage } from "@/components/app/compounds/table-book-page";
import { toBookingResponse } from "@/lib/booking-response";
import { ROUTES } from "@/lib/constants";
import { TABLE_BOOK_PAGE_CONTENT } from "@/lib/constants/table-book-page";
import { buildSeoMetadata } from "@/lib/seo";
import { bookings } from "@/services/bookings";

export const metadata = buildSeoMetadata({
  title: TABLE_BOOK_PAGE_CONTENT.title,
  description: TABLE_BOOK_PAGE_CONTENT.description,
  url: ROUTES.BOOK_A_TABLE,
  image: TABLE_BOOK_PAGE_CONTENT.hero.image.src,
  imageAlt: TABLE_BOOK_PAGE_CONTENT.hero.image.alt,
});

export default async function BookATablePage() {
  await connection();
  const booking = bookings.getFindTableData().then(toBookingResponse);
  return <TableBookPage booking={booking} />;
}
