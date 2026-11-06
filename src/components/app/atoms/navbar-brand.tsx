import Link from "next/link";

import { FOCUS_RING, NAVBAR_CONTENT, ROUTES } from "@/lib/constants";
import type { INavbarBrandProps } from "@/lib/types";
import { cn } from "@/lib/utils";

export function NavbarBrand({ onClick }: INavbarBrandProps) {
  return (
    <Link
      href={ROUTES.HOME}
      onClick={onClick}
      aria-label={NAVBAR_CONTENT.homeLabel}
      className={cn(
        FOCUS_RING,
        "flex h-[52px] w-[82px] min-w-11 items-center justify-center rounded-sm focus-visible:ring-peploe-burgundy xl:w-[95px] xl:shrink-0",
      )}
    >
      <span
        aria-hidden="true"
        className="h-[52px] w-full bg-ink mask-[url('/peploes-logo-mask.webp')] mask-contain mask-center mask-no-repeat"
      />
    </Link>
  );
}
