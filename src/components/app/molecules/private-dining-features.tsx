import Image from "next/image";

import styles from "@/components/app/compounds/private-dining.module.css";
import { ebGaramond } from "@/lib/fonts";
import type { IPrivateDiningFeaturesProps } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PrivateDiningFeatures({
  items,
  className,
}: IPrivateDiningFeaturesProps) {
  return (
    <ul className={cn(styles.features, className)}>
      {items.map((item) => (
        <li key={item._key}>
          {item.illustration && (
            <Image
              src={item.illustration}
              alt=""
              width={48}
              height={48}
              className={styles.illustration}
            />
          )}
          <h3 className={cn(ebGaramond.className, styles.featureHeading)}>
            {item.heading}
          </h3>
          {item.description && <p>{item.description}</p>}
          {item.items && (
            <ul className={styles.occasionList}>
              {item.items.map((text) => (
                <li key={text}>{text}</li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}
