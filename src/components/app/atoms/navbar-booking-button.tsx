import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { NAVBAR_CONTENT, ROUTES } from "@/lib/constants";
import type { INavbarBookingButtonProps } from "@/lib/types";
import { cn } from "@/lib/utils";

export function NavbarBookingButton({
  onNavigate,
  className,
  label,
}: INavbarBookingButtonProps) {
  return (
    <Button
      asChild
      variant="brand-primary"
      size="cta"
      className={cn("w-[99px] xl:w-[156px]", className)}
    >
      <Link href={ROUTES.BOOK_A_TABLE} onNavigate={onNavigate}>
        {label ?? (
          <>
            <span className="xl:hidden">
              {NAVBAR_CONTENT.mobileBookingLabel}
            </span>
            <span className="hidden xl:inline">
              {NAVBAR_CONTENT.bookingLabel}
            </span>
          </>
        )}
        <ArrowRight aria-hidden="true" className="size-4" />
      </Link>
    </Button>
  );
}
