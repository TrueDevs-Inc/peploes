"use client";

import { useRef } from "react";

import { CloseButton } from "@/components/app/atoms/close-button";
import { FOCUS_RING } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function WineIndexCloseButton() {
  const containerRef = useRef<HTMLDivElement>(null);

  function closeIndex() {
    const details = containerRef.current?.closest("details");
    if (!details) return;
    details.open = false;
    details.querySelector("summary")?.focus();
  }

  return (
    <div ref={containerRef} className="hidden xl:contents">
      <CloseButton
        ariaLabel="Close wine list"
        onClick={closeIndex}
        className={cn(
          FOCUS_RING,
          "-top-[60px] right-0 size-11 rounded-none border-0 text-ink hover:text-peploe-burgundy focus-visible:ring-peploe-burgundy",
        )}
      />
    </div>
  );
}
