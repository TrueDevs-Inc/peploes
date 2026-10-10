import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import styles from "@/components/app/compounds/groups-occasions.module.css";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
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
          <div className="flex max-w-[720px] flex-col items-start gap-4 sm:gap-7">
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
              className="h-11 w-[216px] rounded-[4px] bg-warm-cream px-5 has-[>svg]:px-5 text-base leading-[22px] font-medium text-peploe-burgundy shadow-none"
            >
              <Link href={ROUTES.PRIVATE_DINING}>
                {GROUPS_OCCASIONS_CONTENT.ctaLabel}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <ul className="site-container grid items-center gap-[18px] pt-8 pb-12 sm:gap-8 sm:pt-12 sm:pb-20 xl:grid-cols-3 xl:gap-25">
        {GROUPS_OCCASIONS_CONTENT.occasions.map((occasion) => (
          <li
            key={occasion.title}
            className="relative grid min-w-0 grid-cols-[124px_minmax(0,1fr)] gap-5 pr-3 pl-5 before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-soft-stone max-sm:min-h-[187px]! max-[360px]:grid-cols-[96px_minmax(0,1fr)] sm:grid-cols-[minmax(0,180px)_minmax(140px,1fr)] sm:px-0 sm:before:hidden xl:before:top-1/2 xl:before:-left-10 xl:before:block xl:before:h-[100px] xl:before:-translate-y-1/2 xl:first:before:hidden"
            style={{ minHeight: occasion.minHeight }}
          >
            <div className="relative overflow-hidden rounded-[2px]">
              <Image
                src={occasion.image.src}
                alt={occasion.image.alt}
                fill
                sizes="360px"
                className="object-cover"
              />
            </div>
            <div className="flex min-w-0 flex-col sm:gap-2.5">
              <div className="flex flex-col gap-2.5">
                <h3
                  className={cn(
                    ebGaramond.className,
                    "text-2xl leading-[30px] font-medium",
                  )}
                >
                  {occasion.title}
                </h3>
                <p className="text-sm leading-[21px] text-text-secondary">
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
                asChild
                variant="brand-text"
                aria-label={`${GROUPS_OCCASIONS_CONTENT.cardCtaLabel} ${occasion.title}`}
                className="mt-auto h-11 self-start rounded-none px-0 has-[>svg]:px-0 text-base leading-[22px] font-medium text-peploe-burgundy"
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
    </section>
  );
}
