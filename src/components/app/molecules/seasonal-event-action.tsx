import { ArrowRight } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import styles from "@/components/app/compounds/seasonal-event.module.css";
import { Button } from "@/components/ui/button";
import type { ISeasonalEventActionProps } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SeasonalEventAction({
  label,
  href,
  className,
}: ISeasonalEventActionProps) {
  const content = (
    <>
      {label}
      <ArrowRight aria-hidden="true" className="size-4" />
    </>
  );

  return href ? (
    <Button
      asChild
      variant="brand-text"
      className={cn(styles.textAction, className)}
    >
      <Link href={href as Route}>{content}</Link>
    </Button>
  ) : (
    <Button
      type="button"
      aria-disabled="true"
      variant="brand-text"
      className={cn(styles.textAction, className)}
    >
      {content}
    </Button>
  );
}
