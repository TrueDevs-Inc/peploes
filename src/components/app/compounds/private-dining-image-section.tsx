import Image from "next/image";

import styles from "@/components/app/compounds/private-dining.module.css";
import { PrivateDiningHeading } from "@/components/app/molecules/private-dining-heading";
import type { IPrivateDiningImageSectionProps } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PrivateDiningImageSection({
  heading,
  image,
  className,
  imageFirst = false,
  contained = false,
  children,
}: IPrivateDiningImageSectionProps) {
  return (
    <section
      className={cn(
        styles.imageSection,
        imageFirst && styles.imageFirst,
        className,
      )}
    >
      <div className={styles.promoImage}>
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes="(min-width: 1024px) 55vw, 100vw"
          className={styles.cover}
        />
      </div>
      <div className={contained ? undefined : "site-container"}>
        <div data-scroll-reveal className={styles.promoCopy}>
          <PrivateDiningHeading {...heading} />
          {children}
        </div>
      </div>
    </section>
  );
}
