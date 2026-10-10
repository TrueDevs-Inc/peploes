import { ArrowRight } from "lucide-react";
import Link from "next/link";

import styles from "@/components/app/compounds/private-dining.module.css";
import { PrivateDiningImageSection } from "@/components/app/compounds/private-dining-image-section";
import { Button } from "@/components/ui/button";
import {
  PRIVATE_DINING_MENU_IMAGE,
  PRIVATE_DINING_MENU_LINKS,
} from "@/lib/constants/private-dining";
import { ebGaramond } from "@/lib/fonts";
import type { IPrivateDiningMenuProps } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PrivateDiningMenus({
  heading,
  paragraphs,
  imageFirst = false,
  className,
}: IPrivateDiningMenuProps) {
  return (
    <PrivateDiningImageSection
      className={cn(styles.menuPromo, className)}
      heading={heading}
      image={PRIVATE_DINING_MENU_IMAGE}
      imageFirst={imageFirst}
    >
      <div className={cn(ebGaramond.className, styles.menuDescriptions)}>
        {paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <ul className={styles.menuLinks}>
        {PRIVATE_DINING_MENU_LINKS.map((menu) => (
          <li key={menu.href}>
            <h3 className={ebGaramond.className}>{menu.title}</h3>
            <Button asChild variant="brand-text">
              <Link href={menu.href}>
                {menu.label}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </Button>
          </li>
        ))}
      </ul>
    </PrivateDiningImageSection>
  );
}
