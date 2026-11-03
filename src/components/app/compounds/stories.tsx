import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import styles from "@/components/app/compounds/stories.module.css";
import { StoryCard } from "@/components/app/molecules/story-card";
import { Button } from "@/components/ui/button";
import { MOBILE_HOME_CONTENT, ROUTES } from "@/lib/constants";
import { STORIES_CONTENT } from "@/lib/constants/stories";
import { dmSans, ebGaramond } from "@/lib/fonts";
import {
  getJournalArticlePath,
  getJournalCategoryPath,
} from "@/lib/journal-data";
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
        <div data-scroll-reveal className="flex flex-col items-start gap-4">
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
            asChild
            variant="brand-text"
            className="h-11 rounded-none px-0 has-[>svg]:px-0 text-base leading-6 font-medium text-peploe-burgundy"
          >
            <Link href={ROUTES.JOURNAL}>
              {STORIES_CONTENT.ctaLabel}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </Button>
        </div>

        <div className="grid items-start gap-[18px] text-warm-cream sm:gap-7 xl:grid-cols-2">
          <StoryCard className="relative isolate flex min-h-[460px] flex-col justify-end overflow-hidden rounded-[4px] bg-ink p-6 sm:min-h-[520px] sm:p-10 xl:min-h-[640px]">
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
            <Link
              href={ROUTES.OUR_STORY}
              aria-hidden="true"
              tabIndex={-1}
              className="absolute inset-0"
            />
            <div
              data-story-copy
              className="relative flex flex-col gap-[9px] sm:gap-4"
            >
              <p className="text-[11px] leading-[14px] font-medium tracking-[1.2px] uppercase sm:text-sm sm:leading-5 sm:tracking-[0.1em]">
                <span data-story-text>{STORIES_CONTENT.family.eyebrow}</span>
              </p>
              <h3
                className={cn(
                  ebGaramond.className,
                  "text-[30px] leading-[31px] font-normal sm:text-[38px] sm:leading-[44px]",
                )}
              >
                <span data-story-text>
                  {STORIES_CONTENT.family.heading}
                  <br />
                  {STORIES_CONTENT.family.headingContinuation}
                </span>
              </h3>
              <div id="family-story-details" data-story-details>
                <p className="text-sm leading-5 text-warm-cream/90 sm:text-[15px] sm:leading-[22px]">
                  <span data-story-text>
                    {STORIES_CONTENT.family.description}
                  </span>
                </p>
                <div className="sm:pt-3">
                  <StoryAction
                    label={STORIES_CONTENT.family.ctaLabel}
                    filled
                    href={ROUTES.OUR_STORY}
                  />
                </div>
              </div>
            </div>
          </StoryCard>

          <div className="grid min-w-0 gap-[18px] sm:gap-7">
            <StoryCard className="relative isolate flex min-h-[390px] items-end justify-end overflow-hidden rounded-[4px] bg-ink sm:min-h-[308px] sm:items-center">
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
              <Link
                href={getJournalCategoryPath("people-produce")}
                aria-hidden="true"
                tabIndex={-1}
                className="absolute inset-0"
              />
              <div
                data-story-copy
                className="relative flex w-full flex-col gap-[9px] p-6 sm:w-1/2 sm:gap-3 sm:p-8"
              >
                <p className="text-[11px] leading-[14px] font-medium tracking-[1.2px] uppercase sm:text-xs sm:leading-[18px] sm:tracking-[0.1em]">
                  <span data-story-text>{STORIES_CONTENT.produce.eyebrow}</span>
                </p>
                <h3
                  className={cn(
                    ebGaramond.className,
                    "text-[30px] leading-[31px] font-normal sm:text-2xl sm:leading-[30px]",
                  )}
                >
                  <span data-story-text>{STORIES_CONTENT.produce.heading}</span>
                </h3>
                <div id="produce-story-details" data-story-details>
                  <p className="text-sm leading-5">
                    <span data-story-text>
                      {STORIES_CONTENT.produce.description}
                    </span>
                  </p>
                  <StoryAction
                    label={STORIES_CONTENT.produce.ctaLabel}
                    href={getJournalCategoryPath("people-produce")}
                  />
                </div>
              </div>
            </StoryCard>

            <div className="grid gap-[18px] sm:grid-cols-2 sm:gap-7">
              <StoryCard className="relative isolate flex min-h-[330px] flex-col justify-end overflow-hidden rounded-[4px] bg-ink p-6 sm:min-h-[308px]">
                <Image
                  src={STORIES_CONTENT.gina.image.src}
                  alt={STORIES_CONTENT.gina.image.alt}
                  fill
                  sizes="(min-width: 1584px) 339px, (min-width: 1280px) calc((100vw - 228px) / 4), (min-width: 640px) calc((100vw - 76px) / 2), calc(100vw - 48px)"
                  className="object-cover"
                />
                <div
                  aria-hidden="true"
                  className={cn(styles.ginaOverlay, "absolute inset-0")}
                />
                <Link
                  href={getJournalArticlePath("wine-things-just-happen")}
                  aria-hidden="true"
                  tabIndex={-1}
                  className="absolute inset-0 sm:hidden"
                />
                <Link
                  href={getJournalArticlePath("some-things-have-changed")}
                  aria-hidden="true"
                  tabIndex={-1}
                  className="absolute inset-0 hidden sm:block"
                />
                <div
                  data-story-copy
                  className="relative flex flex-col gap-[9px] sm:gap-2"
                >
                  <p className="text-[11px] leading-[14px] font-medium tracking-[1.2px] uppercase sm:text-xs sm:leading-[18px] sm:tracking-[0.1em]">
                    <span data-story-text className="sm:hidden">
                      {MOBILE_HOME_CONTENT.ginaEyebrow}
                    </span>
                    <span data-story-text className="hidden sm:inline">
                      {STORIES_CONTENT.gina.eyebrow}
                    </span>
                  </p>
                  <h3
                    className={cn(
                      ebGaramond.className,
                      "text-[30px] leading-[31px] font-normal sm:text-xl sm:leading-[26px]",
                    )}
                  >
                    <span data-story-text className="sm:hidden">
                      {MOBILE_HOME_CONTENT.ginaHeading}
                    </span>
                    <span data-story-text className="hidden sm:inline">
                      {STORIES_CONTENT.gina.heading}
                    </span>
                  </h3>
                  <div
                    id="gina-story-details"
                    data-story-details
                    className="sm:pt-2"
                  >
                    <div className="flex sm:hidden">
                      <StoryAction
                        label={STORIES_CONTENT.gina.ctaLabel}
                        href={getJournalArticlePath("wine-things-just-happen")}
                      />
                    </div>
                    <div className="hidden sm:flex">
                      <StoryAction
                        label={STORIES_CONTENT.gina.ctaLabel}
                        href={getJournalArticlePath("some-things-have-changed")}
                      />
                    </div>
                  </div>
                </div>
              </StoryCard>

              <StoryCard className="relative isolate flex min-h-[330px] flex-col justify-end overflow-hidden rounded-[4px] bg-ink p-6 sm:min-h-[308px]">
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
                <Link
                  href={getJournalArticlePath("the-art-of-peploes")}
                  aria-hidden="true"
                  tabIndex={-1}
                  className="absolute inset-0"
                />
                <div
                  data-story-copy
                  className="relative flex flex-col gap-[9px] sm:gap-2"
                >
                  <p className="text-[11px] leading-[14px] font-medium tracking-[1.2px] uppercase sm:text-xs sm:leading-[18px] sm:tracking-[0.1em]">
                    <span data-story-text>{STORIES_CONTENT.art.eyebrow}</span>
                  </p>
                  <h3
                    className={cn(
                      ebGaramond.className,
                      "text-[30px] leading-[31px] font-normal sm:text-xl sm:leading-[26px]",
                    )}
                  >
                    <span data-story-text>{STORIES_CONTENT.art.heading}</span>
                  </h3>
                  <div id="art-story-details" data-story-details>
                    <p className="hidden text-[13px] leading-[18px] text-warm-cream/80 sm:block">
                      <span data-story-text>
                        {STORIES_CONTENT.art.description}
                      </span>
                    </p>
                    <div className="sm:pt-2">
                      <StoryAction
                        label={STORIES_CONTENT.art.ctaLabel}
                        href={getJournalArticlePath("the-art-of-peploes")}
                      />
                    </div>
                  </div>
                </div>
              </StoryCard>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
