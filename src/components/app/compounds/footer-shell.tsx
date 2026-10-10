"use client";

import { usePathname } from "next/navigation";

import styles from "@/components/app/compounds/footer.module.css";
import { ROUTES } from "@/lib/constants";
import type { IFooterShellProps } from "@/lib/types";
import { cn } from "@/lib/utils";

export function FooterShell({ children, className }: IFooterShellProps) {
  const pathname = usePathname();

  return (
    <footer
      className={cn(
        className,
        (pathname === ROUTES.PRIVATE_DINING ||
          pathname === ROUTES.CORPORATE_EVENTS) &&
          styles.privateDiningFooter,
        pathname === ROUTES.CORPORATE_EVENTS && styles.corporateFooter,
        pathname === ROUTES.CELEBRATIONS && styles.celebrationFooter,
      )}
    >
      {children}
    </footer>
  );
}
