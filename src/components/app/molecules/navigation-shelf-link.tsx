import Link from "next/link";

import { Button } from "@/components/ui/button";
import { FOCUS_RING } from "@/lib/constants";
import { ebGaramond } from "@/lib/fonts";
import type { INavigationShelfLinkProps } from "@/lib/types";
import { cn } from "@/lib/utils";

export function NavigationShelfLink({
  label,
  description,
  href,
  className,
}: INavigationShelfLinkProps) {
  return (
    <div
      className={cn("flex min-h-[72px] min-w-0 flex-col gap-1.5", className)}
    >
      <Button
        asChild={Boolean(href)}
        type={href ? undefined : "button"}
        variant="brand-nav"
        aria-disabled={href ? undefined : true}
        className={cn(
          FOCUS_RING,
          ebGaramond.className,
          "relative -mt-1 min-h-11 h-auto w-fit max-w-full shrink-0 justify-start rounded-sm p-0 pb-2 text-left text-2xl leading-[30px] font-medium whitespace-normal after:absolute after:bottom-0.5 after:left-0 after:h-0.5 after:w-8 after:bg-peploe-burgundy after:opacity-0 after:transition-opacity after:duration-(--duration-interaction) hover:no-underline hover:after:opacity-100 focus-visible:ring-peploe-burgundy motion-reduce:after:transition-none",
        )}
      >
        {href ? <Link href={href}>{label}</Link> : label}
      </Button>
      {description && <p className="text-sm leading-[21px]">{description}</p>}
    </div>
  );
}
