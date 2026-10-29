import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import styles from "@/components/app/compounds/wine.module.css";
import { Button } from "@/components/ui/button";
import { ROUTES, WINE_CONTENT } from "@/lib/constants";
import { dmSans, ebGaramond } from "@/lib/fonts";
import { cn } from "@/lib/utils";

export function Wine() {
  return (
    <section
      id="wine"
      aria-labelledby="wine-heading"
      className={cn(
        dmSans.className,
        "relative isolate scroll-mt-20 bg-ink text-warm-cream before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:z-10 before:h-[1.5px] before:bg-soft-stone/50",
      )}
    >
      <div className="absolute inset-0 lg:h-[calc(100%/0.9815)] lg:origin-top lg:scale-y-[0.9815]">
        <Image
          src={WINE_CONTENT.image.src}
          alt={WINE_CONTENT.image.alt}
          fill
          sizes="100vw"
          className="object-cover lg:object-[center_40.15%]"
        />
      </div>
      <div
        aria-hidden="true"
        className={cn(styles.overlay, "absolute inset-0")}
      />

      <div className="site-container relative">
        <div className="flex min-h-[720px] w-full max-w-[748px] flex-col justify-end gap-[18px] pt-[210px] pb-[52px] sm:min-h-0 sm:justify-start sm:gap-8 sm:py-20">
          <p
            data-scroll-reveal
            className="flex items-center gap-2.5 text-sm leading-4 font-medium tracking-[0.1em] uppercase"
          >
            <span
              aria-hidden="true"
              className="h-0.5 w-12 shrink-0 bg-current"
            />
            {WINE_CONTENT.eyebrow}
          </p>

          <h2
            data-scroll-reveal
            id="wine-heading"
            className={cn(
              ebGaramond.className,
              "text-[42px] leading-[42px] font-medium sm:text-[52px] sm:leading-[58px] sm:tracking-[-0.5px] lg:text-[60px] lg:leading-[66px]",
            )}
          >
            {WINE_CONTENT.heading}
          </h2>

          <p
            data-scroll-reveal
            className="text-base leading-6 text-warm-cream/90 sm:text-lg sm:text-warm-cream/85"
          >
            {WINE_CONTENT.description}
          </p>

          <div
            data-scroll-reveal
            className="flex flex-col items-start gap-2.5 sm:gap-6"
          >
            <Button
              asChild
              variant="brand-primary"
              size="cta"
              className="w-full sm:w-[220px]"
            >
              <Link href={ROUTES.WINE}>
                {WINE_CONTENT.primaryCtaLabel}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </Button>
            <Button
              type="button"
              variant="brand-text"
              aria-disabled="true"
              className="h-11 w-full gap-2 rounded-[4px] border border-warm-cream/70 px-5 has-[>svg]:px-5 text-base leading-[22px] font-medium sm:leading-6 text-warm-cream max-sm:hover:bg-peploe-burgundy max-sm:hover:no-underline sm:w-auto sm:rounded-none sm:border-0 sm:px-0 sm:has-[>svg]:px-0"
            >
              {WINE_CONTENT.secondaryCtaLabel}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
