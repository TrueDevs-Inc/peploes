import { TableBookPage } from "@/components/app/compounds/table-book-page";
import { ROUTES } from "@/lib/constants";
import { TABLE_BOOK_PAGE_CONTENT } from "@/lib/constants/table-book-page";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata = buildSeoMetadata({
  title: TABLE_BOOK_PAGE_CONTENT.title,
  description: TABLE_BOOK_PAGE_CONTENT.description,
  url: ROUTES.BOOK_A_TABLE,
  image: TABLE_BOOK_PAGE_CONTENT.hero.image.src,
  imageAlt: TABLE_BOOK_PAGE_CONTENT.hero.image.alt,
  // Keep the design-only booking page out of search until reservations are connected.
  noIndex: true,
});

export default function BookATablePage() {
  return <TableBookPage />;
}
