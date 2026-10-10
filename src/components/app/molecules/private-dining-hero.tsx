import { ArrowRight } from "lucide-react";
import Image from "next/image";

import styles from "@/components/app/compounds/private-dining.module.css";
import { Button } from "@/components/ui/button";
import { ebGaramond } from "@/lib/fonts";
import type { IPrivateDiningHeroProps } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PrivateDiningHero({ hero, variant }: IPrivateDiningHeroProps) {
  return (
    <section
      className={cn(styles.hero, styles[variant])}
      aria-labelledby="private-dining-title"
    >
      <div className={styles.heroImage}>
        <Image
          src={hero.image.src}
          alt={hero.image.alt}
          fill
          preload
          sizes={
            variant === "overview" ? "100vw" : "(min-width: 1024px) 60vw, 100vw"
          }
          className={styles.cover}
        />
      </div>
      <div className={cn("site-container", styles.heroContainer)}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>{hero.eyebrow}</p>
          <h1
            id="private-dining-title"
            className={cn(ebGaramond.className, styles.heroTitle)}
          >
            {hero.heading}
          </h1>
          <p className={styles.heroDescription}>{hero.description}</p>
          {hero.action ? (
            <Button asChild variant="brand-primary" className={styles.action}>
              <a href="#enquire">
                {hero.action}
                {variant === "corporate" ? (
                  <span aria-hidden="true">→</span>
                ) : (
                  <ArrowRight aria-hidden="true" className="size-4" />
                )}
              </a>
            </Button>
          ) : (
            <span aria-hidden="true" className={styles.heroRule} />
          )}
        </div>
      </div>
    </section>
  );
}
