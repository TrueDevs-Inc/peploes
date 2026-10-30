import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import styles from "@/components/app/compounds/groups-occasions.module.css";
import { Button } from "@/components/ui/button";
import { FOCUS_RING, ROUTES } from "@/lib/constants";
import { GROUPS_OCCASIONS_CONTENT } from "@/lib/constants/groups-occasions";
import { dmSans, ebGaramond } from "@/lib/fonts";
import { cn } from "@/lib/utils";

export function GroupsOccasions() {
  return (
    <section
      id="groups-occasions"
      aria-labelledby="groups-occasions-heading"
      className={cn(dmSans.className, "scroll-mt-20 bg-warm-cream text-ink")}
    >
      <div className="relative isolate flex min-h-[560px] items-end bg-ink text-warm-cream sm:block sm:min-h-0">
        <Image
          src={GROUPS_OCCASIONS_CONTENT.image.src}
          alt={GROUPS_OCCASIONS_CONTENT.image.alt}
          fill
          sizes="(min-width: 1024px) 100vw, 720px"
          className="object-cover lg:object-[center_60%]"
        />
        <div
          aria-hidden="true"
          className={cn(styles.overlay, "absolute inset-0")}
        />

        <div className="site-container relative pt-[185px] pb-10 sm:pt-20 sm:pb-12">
          <div
            data-scroll-reveal
            className="flex max-w-[720px] flex-col items-start gap-4 sm:gap-7"
          >
            <p className="flex items-center gap-2.5 text-sm leading-4 font-medium tracking-[0.1em] uppercase">
              <span
                aria-hidden="true"
                className="h-0.5 w-12 shrink-0 bg-current"
              />
              {GROUPS_OCCASIONS_CONTENT.eyebrow}
            </p>

            <h2
              id="groups-occasions-heading"
              className={cn(
                ebGaramond.className,
                "text-[42px] leading-[42px] font-medium sm:text-[52px] sm:leading-[58px] lg:text-[60px] lg:leading-[66px]",
              )}
            >
              {GROUPS_OCCASIONS_CONTENT.heading}
            </h2>

            <p className="max-w-[520px] text-base leading-6 text-warm-cream/90">
              {GROUPS_OCCASIONS_CONTENT.description}
            </p>

            <Button
              asChild
              variant="brand-primary-inverse"
              size="cta"
              className="w-[216px]"
            >
              <Link href={ROUTES.PRIVATE_DINING}>
                {GROUPS_OCCASIONS_CONTENT.ctaLabel}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="site-container">
        <ul className="grid items-center gap-10 pt-8 pb-12 sm:gap-8 sm:pt-12 sm:pb-20 xl:w-[calc(100%+59px)] xl:max-w-[1355px] xl:grid-cols-3 xl:items-stretch xl:gap-7">
          {GROUPS_OCCASIONS_CONTENT.occasions.map((occasion) => (
            <li key={occasion.title} className={styles.card} data-image-card>
              <Link
                data-card-image
                href={occasion.href}
                aria-label={occasion.title}
                className={cn(FOCUS_RING, styles.image, "group")}
              >
                {/* Landscape sources need enough pixels for their portrait crop. */}
                <Image
                  src={occasion.image.src}
                  alt={occasion.image.alt}
                  fill
                  sizes="(min-width: 1280px) 280px, (min-width: 640px) 360px, (max-width: 359px) 244px, 280px"
                  className="object-cover transition-transform duration-(--duration-base) ease-out motion-safe:group-hover:scale-105 motion-safe:group-focus-visible:scale-105 motion-reduce:transition-none"
                />
              </Link>
              <div data-scroll-reveal className={styles.copy}>
                <div className={styles.introduction}>
                  <h3 className={cn(ebGaramond.className, styles.title)}>
                    {occasion.title}
                  </h3>
                  <p className={styles.description}>
                    {occasion.mobileDescription ? (
                      <>
                        <span className="sm:hidden">
                          {occasion.mobileDescription}
                        </span>
                        <span className="hidden sm:inline">
                          {occasion.description}
                        </span>
                      </>
                    ) : (
                      occasion.description
                    )}
                  </p>
                </div>
                <Button
                  data-card-action
                  asChild
                  variant="brand-text"
                  aria-label={`${GROUPS_OCCASIONS_CONTENT.cardCtaLabel} ${occasion.title}`}
                  className={styles.action}
                >
                  <Link href={occasion.href}>
                    {GROUPS_OCCASIONS_CONTENT.cardCtaLabel}
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
