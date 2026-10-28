import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { BOOKING_BANNER_CONTENT, ROUTES } from "@/lib/constants";
import { dmSans, ebGaramond, ebGaramondItalic } from "@/lib/fonts";
import { cn } from "@/lib/utils";

export function BookingBanner() {
  return (
    <section
      id="book-a-table"
      aria-labelledby="booking-banner-heading"
      className={cn(
        dmSans.className,
        "isolate scroll-mt-20 overflow-hidden bg-button-primary-pressed text-warm-cream",
      )}
    >
      <div className="site-container-inset relative min-h-[410px] py-[54px] sm:min-h-0 sm:py-[72px]">
        <Image
          src={BOOKING_BANNER_CONTENT.image.src}
          alt={BOOKING_BANNER_CONTENT.image.alt}
          width={472}
          height={472}
          sizes="(min-width: 640px) 472px, 310px"
          className="pointer-events-none absolute -right-[120px] -bottom-20 h-[310px] w-[310px] max-w-none opacity-24 sm:-top-6 sm:-right-[104px] sm:bottom-auto sm:h-[472px] sm:w-[472px] sm:opacity-15 lg:opacity-35"
        />

        <div
          data-scroll-reveal
          className="relative flex flex-col items-start gap-6 sm:gap-7"
        >
          <div className="flex flex-col gap-4 sm:gap-6">
            <h2
              id="booking-banner-heading"
              className={cn(
                ebGaramond.className,
                "text-[38px] leading-[41px] font-normal sm:text-[48px] sm:leading-[54px]",
              )}
            >
              {BOOKING_BANNER_CONTENT.heading}{" "}
              <span className="sm:hidden">
                {BOOKING_BANNER_CONTENT.emphasizedHeading}
              </span>
              <em
                className={cn(ebGaramondItalic.className, "hidden sm:inline")}
              >
                {BOOKING_BANNER_CONTENT.emphasizedHeading}
              </em>
            </h2>
            <p className="text-base leading-6">
              {BOOKING_BANNER_CONTENT.description}
            </p>
          </div>

          <Button
            asChild
            variant="brand-primary-inverse"
            size="cta"
            className="w-full sm:w-[156px]"
          >
            <Link href={ROUTES.BOOK_A_TABLE}>
              {BOOKING_BANNER_CONTENT.ctaLabel}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
