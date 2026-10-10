import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { FOOTER_STYLES, MOBILE_FOOTER_CONTENT } from "@/lib/constants/footer";
import { ebGaramond } from "@/lib/fonts";
import type { IMenuNavigationLink } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MobileFooterNavigation() {
  return (
    <div
      data-footer-homepage-extra
      className={cn(FOOTER_STYLES.mobileDivider, "order-3 xl:hidden")}
    >
      {MOBILE_FOOTER_CONTENT.navigation.map(({ heading, links }) => (
        <nav
          key={heading}
          aria-label={heading}
          className="not-first:shadow-[inset_0_1px_0_var(--soft-stone)]"
        >
          <h2
            className={cn(
              ebGaramond.className,
              "flex h-[52px] items-center justify-between border-b border-soft-stone text-xl leading-[26px] font-medium",
            )}
          >
            {heading}
            <ChevronRight
              aria-hidden="true"
              className="size-4 text-peploe-burgundy"
            />
          </h2>
          <ul className="pt-1 pb-3">
            {links.map(({ label, href }: IMenuNavigationLink) => (
              <li key={label}>
                <Button
                  asChild={Boolean(href)}
                  type={href ? undefined : "button"}
                  variant="brand-nav"
                  aria-disabled={href ? undefined : true}
                  className="h-11 w-full justify-start rounded-none p-0 text-base leading-[22px] font-normal text-text-secondary"
                >
                  {href ? <Link href={href}>{label}</Link> : label}
                </Button>
              </li>
            ))}
          </ul>
        </nav>
      ))}
    </div>
  );
}
