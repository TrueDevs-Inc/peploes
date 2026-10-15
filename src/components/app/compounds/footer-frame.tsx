"use client";

import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";

import styles from "@/components/app/compounds/footer.module.css";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function FooterFrame({ children, className }: ComponentProps<"footer">) {
  const pathname = usePathname();
  const isMenuPage =
    pathname === ROUTES.MENUS || pathname.startsWith(`${ROUTES.MENUS}/`);
  const isPolicyPage =
    pathname === ROUTES.PRIVACY_COOKIES ||
    pathname === ROUTES.ACCESSIBILITY_POLICY ||
    pathname === ROUTES.TERMS_CONDITIONS ||
    pathname === ROUTES.BOOKING_CANCELLATION_TERMS;
  const isSeasonalPage =
    pathname === ROUTES.WHATS_ON || pathname.startsWith(`${ROUTES.WHATS_ON}/`);

  return (
    <footer
      className={cn(
        className,
        isMenuPage && styles.menuFooter,
        (pathname === ROUTES.PRIVATE_DINING ||
          pathname === ROUTES.CORPORATE_EVENTS ||
          pathname === ROUTES.VISIT_CONTACT ||
          pathname === ROUTES.BOOK_A_TABLE ||
          pathname === ROUTES.OUR_STORY ||
          isSeasonalPage ||
          isPolicyPage) &&
          styles.privateDiningFooter,
        pathname === ROUTES.CORPORATE_EVENTS && styles.corporateFooter,
        pathname === ROUTES.CELEBRATIONS && styles.celebrationFooter,
        (pathname === ROUTES.VISIT_CONTACT ||
          pathname === ROUTES.BOOK_A_TABLE ||
          pathname === ROUTES.OUR_STORY ||
          isSeasonalPage) &&
          styles.visitFooter,
      )}
    >
      {children}
    </footer>
  );
}
