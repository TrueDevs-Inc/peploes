import { ArrowRight } from "lucide-react";
import Link from "next/link";

import styles from "@/components/app/compounds/seasonal-event.module.css";
import { Button } from "@/components/ui/button";
import type { ISeasonalEventActionProps } from "@/lib/types";

export function SeasonalEventAction({
  label,
  href,
}: ISeasonalEventActionProps) {
  const content = (
    <>
      {label}
      <ArrowRight aria-hidden="true" className="size-4" />
    </>
  );

  return href ? (
    <Button asChild variant="brand-text" className={styles.textAction}>
      <Link href={href}>{content}</Link>
    </Button>
  ) : (
    <Button
      type="button"
      aria-disabled="true"
      variant="brand-text"
      className={styles.textAction}
    >
      {content}
    </Button>
  );
}
