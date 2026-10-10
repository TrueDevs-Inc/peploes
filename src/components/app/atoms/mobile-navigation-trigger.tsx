import Link from "next/link";

import { Button } from "@/components/ui/button";
import { FOCUS_RING } from "@/lib/constants";
import type { IMobileNavigationTriggerProps } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MobileNavigationTrigger({
  item,
  isExpanded,
  panelId,
  onNavigate,
  onToggle,
}: IMobileNavigationTriggerProps) {
  return (
    <div
      className={cn(
        "flex items-center",
        isExpanded && "shadow-[inset_0_-1px_0_var(--peploe-burgundy)]",
      )}
    >
      {item.href && (
        <Button
          asChild
          variant="brand-nav"
          className={cn(
            FOCUS_RING,
            "h-auto min-h-12 min-w-0 flex-1 justify-start rounded-none px-2 py-2.5 text-left text-base leading-6 font-medium whitespace-normal focus-visible:ring-peploe-burgundy",
            isExpanded && "text-peploe-burgundy",
          )}
        >
          <Link href={item.href} onClick={onNavigate}>
            {item.label}
          </Link>
        </Button>
      )}
      {(!item.href || item.children) && (
        <Button
          type="button"
          variant="brand-nav"
          aria-label={item.href ? `${item.label} submenu` : undefined}
          aria-disabled={item.children ? undefined : true}
          aria-expanded={item.children ? isExpanded : undefined}
          aria-controls={item.children ? panelId : undefined}
          onClick={item.children ? onToggle : undefined}
          className={cn(
            FOCUS_RING,
            "h-auto min-h-12 gap-4 rounded-none px-2 py-2.5 text-left text-base leading-6 font-medium whitespace-normal hover:no-underline focus-visible:ring-peploe-burgundy",
            item.href ? "w-12 justify-center" : "w-full justify-between",
            isExpanded && "text-peploe-burgundy",
          )}
        >
          {!item.href && <span>{item.label}</span>}
          {item.children && (
            <span
              aria-hidden="true"
              className="size-6 shrink-0 text-center text-xl leading-6 font-normal"
            >
              {isExpanded ? "−" : "+"}
            </span>
          )}
        </Button>
      )}
    </div>
  );
}
