import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { FOCUS_RING } from "@/lib/constants";
import { FOOTER_CONTENT, MOBILE_FOOTER_CONTENT } from "@/lib/constants/footer";
import { ebGaramond } from "@/lib/fonts";
import type { IMenuNavigationLink } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MobileFooterNavigation() {
  return (
    <div data-footer-homepage-extra className="order-3 xl:hidden">
      {MOBILE_FOOTER_CONTENT.navigation.map(({ heading, links }) => (
        <nav key={heading} aria-label={heading}>
          <details
            className="group [&::details-content]:grid [&::details-content]:grid-rows-[0fr] [&::details-content]:opacity-0 [&::details-content]:transition-[grid-template-rows,opacity,content-visibility] [&::details-content]:duration-(--duration-base) [&::details-content]:ease-in-out [&::details-content]:transition-discrete [&[open]::details-content]:grid-rows-[1fr] [&[open]::details-content]:opacity-100 [&[open]::details-content]:duration-(--duration-slow) motion-reduce:[&::details-content]:transition-none"
            open={heading === FOOTER_CONTENT.exploreHeading}
          >
            <summary
              className={cn(
                FOCUS_RING,
                "cursor-pointer list-none focus-visible:ring-peploe-burgundy focus-visible:ring-offset-warm-cream [&::-webkit-details-marker]:hidden",
              )}
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
                  className="size-4 text-peploe-burgundy group-open:rotate-90"
                />
              </h2>
            </summary>
            <div className="min-h-0 overflow-hidden">
              <ul className="pt-1 pb-3">
                {links.map(({ label, href }: IMenuNavigationLink) => (
                  <li key={label}>
                    <Button
                      asChild={Boolean(href)}
                      type={href ? undefined : "button"}
                      variant="brand-nav"
                      aria-disabled={href ? undefined : true}
                      className="h-11 w-full justify-start rounded-none p-0 text-base leading-[22px] font-normal text-text-secondary focus-visible:ring-inset"
                    >
                      {href ? <Link href={href}>{label}</Link> : label}
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          </details>
        </nav>
      ))}
    </div>
  );
}
