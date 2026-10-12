import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import styles from "@/components/app/compounds/stories.module.css";
import { Button } from "@/components/ui/button";
import { MOBILE_HOME_CONTENT, ROUTES } from "@/lib/constants";
import { STORIES_CONTENT } from "@/lib/constants/stories";
import { dmSans, ebGaramond } from "@/lib/fonts";
import type { IStoryActionProps } from "@/lib/types";
import { cn } from "@/lib/utils";

function StoryAction({ label, filled = false, href }: IStoryActionProps) {
  const content = (
    <>
      {label}
      <ArrowRight aria-hidden="true" className="size-4" />
    </>
  );

  return (
    <Button
      asChild={Boolean(href)}
      type={href ? undefined : "button"}
      variant={filled ? "brand-primary-inverse" : "brand-secondary-inverse"}
      aria-disabled={href ? undefined : true}
      className={cn(
        "h-auto min-h-11 max-w-full self-start rounded-[4px] border border-warm-cream/70 px-4 has-[>svg]:px-4 text-base leading-6 font-medium whitespace-normal shadow-none sm:px-5 sm:has-[>svg]:px-5",
        filled
          ? "bg-warm-cream text-peploe-burgundy"
          : "bg-transparent text-warm-cream max-sm:rounded-none max-sm:border-0 max-sm:px-0 max-sm:has-[>svg]:px-0 max-sm:hover:bg-transparent max-sm:hover:underline",
      )}
    >
      {href ? <Link href={href}>{content}</Link> : content}
    </Button>
  );
}

export function Stories() {
  return (
    <section
      aria-labelledby="stories-heading"
      className={cn(dmSans.className, "bg-warm-cream text-ink")}
    >
      <div className="site-container flex flex-col gap-8 pt-12 pb-14 sm:gap-12 sm:py-20 lg:gap-[72px] xl:pb-[76px]">
        <div className="flex flex-col items-start gap-4">
          <p className="flex items-center gap-2.5 text-[11px] leading-4 font-medium tracking-[0.1em] text-peploe-burgundy uppercase sm:mb-3 sm:text-sm">
            <span
              aria-hidden="true"
              className="h-0.5 w-12 shrink-0 bg-current"
            />
            {STORIES_CONTENT.eyebrow}
          </p>
          <h2
            id="stories-heading"
            className={cn(
              ebGaramond.className,
              "text-[42px] leading-[42px] font-medium sm:text-[52px] sm:leading-[58px] lg:text-[60px] lg:leading-[66px]",
            )}
          >
            {STORIES_CONTENT.headingLines[0]}
            <br className="hidden lg:block" />
            <span className="lg:hidden"> </span>
            {STORIES_CONTENT.headingLines[1]}
          </h2>
          <p className="text-base leading-6 text-text-secondary sm:text-lg">
            {STORIES_CONTENT.description}
          </p>
          <Button
            type="button"
            variant="brand-text"
            aria-disabled="true"
            className="h-11 rounded-none px-0 has-[>svg]:px-0 text-base leading-6 font-medium text-peploe-burgundy"
          >
            {STORIES_CONTENT.ctaLabel}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
        </div>

        <div className="grid items-start gap-[18px] text-warm-cream sm:gap-7 xl:w-[calc(100%+4px)] xl:grid-cols-[repeat(2,minmax(0,636px))]">
          <article className="relative isolate flex min-h-[460px] flex-col justify-end overflow-hidden rounded-[4px] bg-ink p-6 sm:min-h-[520px] sm:p-10 xl:min-h-[640px]">
            <Image
              src={STORIES_CONTENT.family.image.src}
              alt={STORIES_CONTENT.family.image.alt}
              fill
              sizes="(min-width: 1280px) 960px, max(780px, calc(100vw - 48px))"
              className="object-cover"
            />
            <div
              aria-hidden="true"
              className={cn(styles.familyOverlay, "absolute inset-0")}
            />
            <div className="relative flex flex-col gap-[9px] sm:gap-4">
              <p className="text-[11px] leading-[14px] font-medium tracking-[1.2px] uppercase sm:text-sm sm:leading-5 sm:tracking-[0.1em]">
                {STORIES_CONTENT.family.eyebrow}
              </p>
              <h3
                className={cn(
                  ebGaramond.className,
                  "text-[30px] leading-[31px] font-normal sm:text-[38px] sm:leading-[44px]",
                )}
              >
                {STORIES_CONTENT.family.heading}
                <br className="hidden sm:block" />
                <span className="sm:hidden"> </span>
                {STORIES_CONTENT.family.headingContinuation}
              </h3>
              <p className="text-sm leading-5 text-warm-cream/90 sm:text-[15px] sm:leading-[22px]">
                {STORIES_CONTENT.family.description}
              </p>
              <div className="sm:pt-3">
                <StoryAction
                  label={STORIES_CONTENT.family.ctaLabel}
                  filled
                  href={ROUTES.OUR_STORY}
                />
              </div>
            </div>
          </article>

          <div className="grid min-w-0 gap-[18px] sm:gap-7">
            <article className="relative isolate flex min-h-[390px] items-end justify-end overflow-hidden rounded-[4px] bg-ink sm:min-h-[308px] sm:items-center">
              <Image
                src={STORIES_CONTENT.produce.image.src}
                alt={STORIES_CONTENT.produce.image.alt}
                fill
                sizes="(min-width: 640px) max(955px, calc(100vw - 48px)), 1302px"
                className="object-cover sm:object-right"
              />
              <div
                aria-hidden="true"
                className={cn(styles.produceOverlay, "absolute inset-0")}
              />
              <div className="relative flex w-full flex-col gap-[9px] p-6 sm:w-1/2 sm:gap-3 sm:p-8">
                <p className="text-[11px] leading-[14px] font-medium tracking-[1.2px] uppercase sm:text-xs sm:leading-[18px] sm:tracking-[0.1em]">
                  {STORIES_CONTENT.produce.eyebrow}
                </p>
                <h3
                  className={cn(
                    ebGaramond.className,
                    "text-[30px] leading-[31px] font-normal sm:text-2xl sm:leading-[30px]",
                  )}
                >
                  {STORIES_CONTENT.produce.heading}
                </h3>
                <p className="text-sm leading-5">
                  {STORIES_CONTENT.produce.description}
                </p>
                <StoryAction label={STORIES_CONTENT.produce.ctaLabel} />
              </div>
            </article>

            <div className="grid gap-[18px] sm:grid-cols-2 sm:gap-7">
              <article className="relative isolate flex min-h-[330px] flex-col justify-end overflow-hidden rounded-[4px] bg-ink p-6 sm:min-h-[308px]">
                <Image
                  src={STORIES_CONTENT.gina.image.src}
                  alt={STORIES_CONTENT.gina.image.alt}
                  fill
                  sizes="(min-width: 1440px) 304px, (min-width: 1280px) calc((100vw - 224px) / 4), (min-width: 640px) calc((100vw - 76px) / 2), calc(100vw - 48px)"
                  className="object-cover"
                />
                <div
                  aria-hidden="true"
                  className={cn(styles.ginaOverlay, "absolute inset-0")}
                />
                <div className="relative flex flex-col gap-[9px] sm:gap-2">
                  <p className="text-[11px] leading-[14px] font-medium tracking-[1.2px] uppercase sm:text-xs sm:leading-[18px] sm:tracking-[0.1em]">
                    <span className="sm:hidden">
                      {MOBILE_HOME_CONTENT.ginaEyebrow}
                    </span>
                    <span className="hidden sm:inline">
                      {STORIES_CONTENT.gina.eyebrow}
                    </span>
                  </p>
                  <h3
                    className={cn(
                      ebGaramond.className,
                      "text-[30px] leading-[31px] font-normal sm:text-xl sm:leading-[26px]",
                    )}
                  >
                    <span className="sm:hidden">
                      {MOBILE_HOME_CONTENT.ginaHeading}
                    </span>
                    <span className="hidden sm:inline">
                      {STORIES_CONTENT.gina.heading}
                    </span>
                  </h3>
                  <div className="sm:pt-2">
                    <StoryAction label={STORIES_CONTENT.gina.ctaLabel} />
                  </div>
                </div>
              </article>

              <article className="relative isolate flex min-h-[330px] flex-col justify-end overflow-hidden rounded-[4px] bg-ink p-6 sm:min-h-[308px]">
                <Image
                  src={STORIES_CONTENT.art.image.src}
                  alt={STORIES_CONTENT.art.image.alt}
                  fill
                  sizes="(min-width: 1280px) 512px, (min-width: 640px) max(512px, calc((100vw - 76px) / 2)), max(512px, calc(100vw - 48px))"
                  className="object-cover"
                />
                <div
                  aria-hidden="true"
                  className={cn(styles.artOverlay, "absolute inset-0")}
                />
                <div className="relative flex flex-col gap-[9px] sm:gap-2">
                  <p className="text-[11px] leading-[14px] font-medium tracking-[1.2px] uppercase sm:text-xs sm:leading-[18px] sm:tracking-[0.1em]">
                    {STORIES_CONTENT.art.eyebrow}
                  </p>
                  <h3
                    className={cn(
                      ebGaramond.className,
                      "text-[30px] leading-[31px] font-normal sm:text-xl sm:leading-[26px]",
                    )}
                  >
                    {STORIES_CONTENT.art.heading}
                  </h3>
                  <p className="hidden text-[13px] leading-[18px] text-warm-cream/80 sm:block">
                    {STORIES_CONTENT.art.description}
                  </p>
                  <div className="sm:pt-2">
                    <StoryAction label={STORIES_CONTENT.art.ctaLabel} />
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
