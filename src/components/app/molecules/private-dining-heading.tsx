import styles from "@/components/app/compounds/private-dining.module.css";
import { ebGaramond } from "@/lib/fonts";
import type { IPrivateDiningHeadingProps } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PrivateDiningHeading({
  eyebrow,
  heading,
  description,
  className,
}: IPrivateDiningHeadingProps) {
  return (
    <div data-scroll-reveal className={cn(styles.sectionHeading, className)}>
      <p className={styles.eyebrow}>{eyebrow}</p>
      <h2 className={cn(ebGaramond.className, styles.heading)}>{heading}</h2>
      {description && <p className={styles.description}>{description}</p>}
    </div>
  );
}
