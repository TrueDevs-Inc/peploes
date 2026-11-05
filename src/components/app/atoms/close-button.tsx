"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ICloseButtonProps } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CloseButton({
  onClick,
  className,
  ariaLabel = "Close",
}: ICloseButtonProps) {
  return (
    <Button
      variant="plain"
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        "absolute right-4 top-4 z-20 flex size-8 items-center justify-center rounded-full border text-muted-foreground/50 transition-all hover:border-foreground/60 hover:text-foreground",
        className,
      )}
    >
      <X className="size-4" />
    </Button>
  );
}
