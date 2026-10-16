import { ebGaramond } from "@/lib/fonts";
import type { INavigationShelfProps } from "@/lib/types";
import { cn } from "@/lib/utils";

export function NavigationShelf({
  eyebrow,
  heading,
  action,
  introClassName,
  children,
}: INavigationShelfProps) {
  return (
    <div className="site-container flex items-start gap-14 py-9">
      <div
        className={cn(
          "flex shrink-0 flex-col gap-4 pr-10 shadow-[inset_-1px_0_0_var(--soft-stone)]",
          introClassName,
        )}
      >
        <p className="text-xs leading-4 font-medium tracking-[1.2px] text-peploe-burgundy uppercase">
          {eyebrow}
        </p>
        <p
          className={cn(
            ebGaramond.className,
            "text-[42px] leading-12 font-normal",
          )}
        >
          {heading}
        </p>
        <span aria-hidden="true" className="h-0.5 w-11 bg-peploe-burgundy" />
        {action}
      </div>
      {children}
    </div>
  );
}
