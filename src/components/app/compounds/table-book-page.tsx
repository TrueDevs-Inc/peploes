import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import styles from "@/components/app/compounds/table-book-page.module.css";
import { TableBookingPanel } from "@/components/app/compounds/table-booking-panel";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { TABLE_BOOK_PAGE_CONTENT } from "@/lib/constants/table-book-page";
import { dmSans, ebGaramond } from "@/lib/fonts";
import { cn } from "@/lib/utils";

export function TableBookPage() {
  return (
    <main className={cn(dmSans.className, ebGaramond.variable, styles.page)}>
      <section className={styles.hero} aria-labelledby="table-book-title">
        <div className={styles.heroImage}>
          <Image
            {...TABLE_BOOK_PAGE_CONTENT.hero.image}
            width={4094}
            height={1971}
            preload
            sizes="(min-width: 1024px) 49vw, (min-width: 640px) 560px, 100vw"
            className={styles.heroPhoto}
          />
        </div>
        <div
          data-scroll-reveal
          className={cn("site-container", styles.heroCopy)}
        >
          <p className={styles.eyebrow}>
            {TABLE_BOOK_PAGE_CONTENT.hero.eyebrow}
          </p>
          <h1 id="table-book-title">{TABLE_BOOK_PAGE_CONTENT.hero.heading}</h1>
          <p className={styles.introduction}>
            {TABLE_BOOK_PAGE_CONTENT.hero.description}
          </p>
        </div>
      </section>
      <div data-scroll-reveal className={styles.bookingContainer}>
        <TableBookingPanel />
      </div>
      <section className={styles.groups} aria-labelledby="booking-groups-title">
        <div className={styles.groupImage}>
          <Image
            {...TABLE_BOOK_PAGE_CONTENT.groups.image}
            width={1440}
            height={1920}
            sizes="(min-width: 1024px) 38vw, 100vw"
            className={styles.groupPhoto}
          />
        </div>
        <div
          data-scroll-reveal
          className={cn(
            "section-divider-subtle-bottom lg:section-divider-subtle",
            styles.groupCopy,
          )}
        >
          <p className={styles.eyebrow}>
            {TABLE_BOOK_PAGE_CONTENT.groups.eyebrow}
          </p>
          <h2 id="booking-groups-title">
            {TABLE_BOOK_PAGE_CONTENT.groups.heading}
          </h2>
          <p className={styles.groupDescription}>
            {TABLE_BOOK_PAGE_CONTENT.groups.description}
          </p>
          <Button
            asChild
            variant="brand-contact"
            className={styles.groupAction}
          >
            <Link href={ROUTES.PRIVATE_DINING}>
              {TABLE_BOOK_PAGE_CONTENT.groups.action}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
