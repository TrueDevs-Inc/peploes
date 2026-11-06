"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { READ_MORE_COLLAPSED_HEIGHT } from "@/lib/constants";
import type { IReadMoreProps } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ReadMore({ children, className }: IReadMoreProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div className={className}>
      <div
        ref={contentRef}
        className={cn(
          "overflow-hidden whitespace-pre-line transition-all duration-300 ease-in-out",
          !isExpanded && "relative",
        )}
        style={{
          maxHeight: isExpanded
            ? contentRef.current?.scrollHeight
            : READ_MORE_COLLAPSED_HEIGHT,
        }}
      >
        {children}
        {!isExpanded && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent" />
        )}
      </div>
      <Button
        variant="plain"
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="mt-1 text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
      >
        {isExpanded ? "- read less" : "+ read more"}
      </Button>
    </div>
  );
}
