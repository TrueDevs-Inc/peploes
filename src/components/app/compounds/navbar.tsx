import Link from "next/link";

import { NavbarBookingButton } from "@/components/app/atoms/navbar-booking-button";
import { NavbarBrand } from "@/components/app/atoms/navbar-brand";
import { DesktopGroups } from "@/components/app/molecules/desktop-groups";
import { DesktopMenus } from "@/components/app/molecules/desktop-menus";
import { DesktopNavigation } from "@/components/app/molecules/desktop-navigation";
import { MobileNavigation } from "@/components/app/molecules/mobile-navigation";
import { Button } from "@/components/ui/button";
import { NAVBAR_CONTENT, ROUTES } from "@/lib/constants";
import { dmSans, ebGaramondItalic } from "@/lib/fonts";
import { cn } from "@/lib/utils";

export function Navbar() {
  return (
    <header
      className={cn(
        dmSans.className,
        "sticky top-0 z-40 bg-warm-cream text-ink shadow-[inset_0_-1px_0_var(--soft-stone)]",
      )}
    >
      <nav
        aria-label={NAVBAR_CONTENT.navigationLabel}
        className="site-container flex h-[72px] items-center justify-between gap-2 xl:h-[76px] xl:gap-6"
      >
        <DesktopNavigation
          items={[
            {
              id: "menus",
              label: NAVBAR_CONTENT.menusLabel,
              href: ROUTES.MENUS,
              content: <DesktopMenus />,
            },
            {
              id: "our-story",
              label: NAVBAR_CONTENT.ourStoryLabel,
              href: ROUTES.OUR_STORY,
            },
            {
              id: NAVBAR_CONTENT.groupsId,
              label: NAVBAR_CONTENT.groupsLabel,
              href: ROUTES.PRIVATE_DINING,
              content: <DesktopGroups />,
            },
            {
              id: "whats-on",
              label: NAVBAR_CONTENT.whatsOnLabel,
              href: ROUTES.WHATS_ON,
            },
          ]}
        />
        <NavbarBrand />
        <div className="flex shrink-0 items-center gap-3 xl:flex-1 xl:justify-end xl:gap-7">
          <Button
            asChild
            data-navbar-visit
            variant="brand-nav"
            className="hidden h-11 rounded-sm p-0 text-base leading-[22px] font-medium text-ink xl:inline-flex"
          >
            <Link href={ROUTES.VISIT_CONTACT}>
              {NAVBAR_CONTENT.visitContactLabel}
            </Link>
          </Button>
          <Button
            data-navbar-gift
            type="button"
            variant="brand-nav"
            aria-disabled="true"
            className="hidden h-11 rounded-sm p-0 text-base leading-[22px] font-medium text-peploe-burgundy xl:inline-flex"
          >
            {NAVBAR_CONTENT.giftVouchersLabel}
          </Button>
          <NavbarBookingButton />
          <MobileNavigation brandPhraseClassName={ebGaramondItalic.className} />
        </div>
      </nav>
    </header>
  );
}
