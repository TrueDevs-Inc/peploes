"use client";

import Link from "next/link";

import { trackCustomEvent } from "@/lib/analytics/client";
import type {
  TTrackedAnchorProps,
  TTrackedInteraction,
  TTrackedLinkProps,
} from "@/lib/types";

function report({ event, ...params }: TTrackedInteraction): void {
  trackCustomEvent(event, params);
}

export function TrackedLink({
  interaction,
  onClick,
  ...props
}: TTrackedLinkProps) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        report(interaction);
        onClick?.(event);
      }}
    />
  );
}

// tel:, mailto: and map links stay plain anchors; only closed ids are reported.
export function TrackedAnchor({
  interaction,
  onClick,
  href,
  children,
  ...props
}: TTrackedAnchorProps) {
  return (
    <a
      {...props}
      href={href}
      onClick={(event) => {
        report(interaction);
        onClick?.(event);
      }}
    >
      {children}
    </a>
  );
}
