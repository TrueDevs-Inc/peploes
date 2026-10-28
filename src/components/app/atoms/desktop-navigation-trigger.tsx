import Link from "next/link";

import { Button } from "@/components/ui/button";
import { FOCUS_RING } from "@/lib/constants";
import type { IDesktopNavigationTriggerProps } from "@/lib/types";
import { cn } from "@/lib/utils";

export function DesktopNavigationTrigger({
  item: { id, label, href, content },
  isOpen,
  isActive,
  isCurrent,
  panelId,
  onFocus,
  onToggle,
  onOpen,
}: IDesktopNavigationTriggerProps) {
  return (
    <Button
      asChild={Boolean(href)}
      type={href ? undefined : "button"}
      data-navigation-trigger
      data-navigation-id={id}
      data-active={isActive}
      variant="brand-nav"
      aria-disabled={content || href ? undefined : true}
      aria-current={isCurrent ? "page" : undefined}
      aria-expanded={content ? isOpen : undefined}
      aria-controls={content ? panelId : undefined}
      onFocus={onFocus}
      onClick={content && !href ? onToggle : undefined}
      onKeyDown={(event) => {
        if (content && event.key === "ArrowDown") {
          event.preventDefault();
          onOpen();
        }
      }}
      className={cn(
        FOCUS_RING,
        "h-11 rounded-sm p-0 text-base leading-[22px] font-medium text-ink focus-visible:ring-peploe-burgundy data-[active=true]:text-peploe-burgundy data-[active=true]:underline",
        isOpen && "text-peploe-burgundy underline",
      )}
    >
      {href ? <Link href={href}>{label}</Link> : label}
    </Button>
  );
}
