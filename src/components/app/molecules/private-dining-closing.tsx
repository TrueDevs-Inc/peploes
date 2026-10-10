import Image from "next/image";

import styles from "@/components/app/compounds/private-dining.module.css";
import { PrivateDiningContacts } from "@/components/app/molecules/private-dining-contacts";
import { ebGaramond } from "@/lib/fonts";
import type { IPrivateDiningClosingProps } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PrivateDiningClosing({
  content,
  imageSizes = "100vw",
  className,
}: IPrivateDiningClosingProps) {
  return (
    <section className={cn(styles.closing, className)}>
      <div className={styles.closingImage}>
        <Image
          src={content.image.src}
          alt={content.image.alt}
          fill
          sizes={imageSizes}
          className={styles.cover}
        />
      </div>
      <div className={cn("site-container", styles.closingCopy)}>
        {content.contacts && (
          <span aria-hidden="true" className={styles.heroRule} />
        )}
        <h2 className={cn(ebGaramond.className, styles.heading)}>
          {content.heading}
        </h2>
        <p>{content.description}</p>
        {content.contacts && <PrivateDiningContacts />}
      </div>
    </section>
  );
}
