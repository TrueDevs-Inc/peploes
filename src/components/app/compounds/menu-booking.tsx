import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { MENU_PAGE_CONTENT } from "@/lib/constants/menu-page";
import { dmSans, ebGaramond, ebGaramondItalic } from "@/lib/fonts";
import type {
  IMenuBooking,
  IMenuBookingProps,
  IMenuBookingStyle,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export function MenuBooking({
  booking = MENU_PAGE_CONTENT.booking,
}: IMenuBookingProps) {
  const actionContent = (
    <>
      {booking.label}
      <ArrowRight aria-hidden="true" className="size-4" />
    </>
  );
  return (
    <section
      aria-labelledby="menu-booking-heading"
      style={getMenuBookingStyle(booking)}
      className={cn(
        "relative isolate flex min-h-[330px] items-end overflow-hidden bg-ink text-warm-cream xl:min-h-[220px] xl:items-center",
        booking.description && "min-h-[360px] xl:min-h-64",
        booking.tallOnMobile && "min-h-[390px]",
      )}
    >
      <Image
        src={booking.image.src}
        alt={booking.image.alt}
        fill
        sizes="100vw"
        className="-z-20 object-cover object-center xl:[object-position:var(--menu-booking-image-position)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-(image:--menu-booking-mobile-overlay) xl:bg-(image:--menu-booking-desktop-overlay)"
      />
      <div
        data-scroll-reveal
        className={cn(
          "site-container flex flex-col items-end gap-6 py-(--menu-booking-mobile-padding) xl:py-12",
          !booking.description && "xl:gap-4",
          booking.description && "xl:py-10",
          booking.fullWidthOnMobile && "gap-4 xl:gap-6",
        )}
      >
        <h2
          id="menu-booking-heading"
          className={cn(
            booking.description
              ? ebGaramond.className
              : ebGaramondItalic.className,
            "max-w-[280px] text-right text-[29px] leading-[33px] xl:max-w-none xl:text-[28px] xl:leading-[1.2]",
            booking.description &&
              "max-w-[342px] text-[30px] leading-[31px] xl:w-(--menu-booking-content-width) xl:text-[30px] xl:leading-9 xl:[text-align:var(--menu-booking-text-align)]",
          )}
        >
          {booking.heading}
        </h2>
        {booking.description && (
          <p
            className={cn(
              ebGaramond.className,
              "-mt-3 max-w-full text-right text-base leading-[21px] xl:w-(--menu-booking-content-width) xl:leading-5 xl:[text-align:var(--menu-booking-text-align)]",
              booking.fullWidthOnMobile && "-mt-0.5 leading-[22px] xl:-mt-3",
            )}
          >
            {booking.description}
          </p>
        )}
        <Button
          asChild={Boolean(booking.href)}
          type={booking.href ? undefined : "button"}
          variant="brand-primary-inverse"
          aria-disabled={booking.href ? undefined : true}
          className={cn(
            dmSans.className,
            "h-11 rounded-[4px] px-5 text-base has-[>svg]:px-5",
            booking.fullWidthOnMobile && "w-full xl:w-auto",
          )}
        >
          {booking.href ? (
            <Link href={booking.href}>{actionContent}</Link>
          ) : (
            actionContent
          )}
        </Button>
      </div>
    </section>
  );
}

function getMenuBookingStyle(booking: IMenuBooking): IMenuBookingStyle {
  return {
    "--menu-booking-mobile-padding": `${booking.mobilePadding ?? 40}px`,
    "--menu-booking-mobile-overlay":
      booking.mobileOverlay ?? MENU_PAGE_CONTENT.booking.mobileOverlay,
    "--menu-booking-desktop-overlay":
      booking.desktopOverlay ?? MENU_PAGE_CONTENT.booking.desktopOverlay,
    "--menu-booking-image-position": booking.image.desktopPosition ?? "center",
    "--menu-booking-content-width": `${booking.desktopContentWidth ?? 465}px`,
    "--menu-booking-text-align": booking.desktopTextAlign ?? "right",
  };
}
