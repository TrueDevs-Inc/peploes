import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { OUR_STORY_CONTENT } from "@/lib/constants/our-story";
import { dmSans, ebGaramond } from "@/lib/fonts";
import { cn } from "@/lib/utils";

function StoryHero() {
  const { hero } = OUR_STORY_CONTENT;

  return (
    <section
      className="relative lg:min-h-[546px]"
      aria-labelledby="story-title"
    >
      <div className="relative h-[300px] sm:h-[400px] lg:absolute lg:inset-y-0 lg:right-0 lg:left-[40%] lg:h-auto lg:after:absolute lg:after:inset-y-0 lg:after:left-0 lg:after:w-[426px] lg:after:max-w-full lg:after:bg-[linear-gradient(90deg,var(--warm-cream)_5.75%,rgb(var(--overlay-cream-rgb)/90%)_28.4%,rgb(var(--overlay-cream-rgb)/0%)_100%)] xl:left-[calc(var(--story-gutter)_+_500px)]">
        <Image
          {...hero.image}
          fill
          preload
          sizes="(min-width: 1584px) calc(50vw + 220px), (min-width: 1280px) calc(100vw - 572px), (min-width: 1024px) 60vw, 100vw"
          className="object-cover object-center"
        />
      </div>
      <div className="site-container">
        <div
          data-scroll-reveal
          className="relative pt-10 pb-12 lg:w-[535px] lg:max-w-[55%] lg:py-20 xl:max-w-none"
        >
          <p className="flex items-center gap-2.5 text-sm leading-4 font-medium tracking-[0.1em] text-peploe-burgundy uppercase before:h-0.5 before:w-12 before:shrink-0 before:bg-current">
            {hero.eyebrow}
          </p>
          <h1
            id="story-title"
            className="mt-6 text-[38px] leading-[42px] text-balance max-[360px]:text-[35px] max-[360px]:leading-10 sm:max-w-[600px] sm:text-[60px] sm:leading-[58px] lg:mt-7 lg:text-[64px] lg:whitespace-pre-line"
          >
            {hero.heading}
          </h1>
          <p className="mt-4 text-lg leading-7 text-text-secondary lg:max-w-[498px]">
            {hero.description}
          </p>
          <p className="mt-6 text-xs leading-4 font-semibold text-peploe-burgundy">
            {hero.establishment}
          </p>
        </div>
      </div>
    </section>
  );
}

function StoryTimeline() {
  const { philosophy } = OUR_STORY_CONTENT;

  return (
    <section
      className="section-divider-subtle bg-[linear-gradient(rgb(46_42_40/10%),transparent_62.47px)] py-12 lg:py-20"
      aria-labelledby="story-philosophy"
    >
      <div className="site-container grid items-center gap-10 lg:min-h-[297px] lg:grid-cols-[525fr_671fr] lg:gap-[60px] xl:gap-[100px] min-[90rem]:grid-cols-[525px_minmax(0,1fr)]">
        <h2
          data-scroll-reveal
          id="story-philosophy"
          className="text-[38px] leading-[42px] after:mt-6 after:block after:h-0.5 after:w-12 after:bg-peploe-burgundy max-[360px]:text-[35px] max-[360px]:leading-10 sm:leading-10 lg:text-[46px] lg:leading-[48px] xl:text-[clamp(46px,calc(5vw_-_18px),54px)] xl:leading-[clamp(48px,3.75vw,54px)] xl:whitespace-pre-line"
        >
          {philosophy.heading}
        </h2>
        <ol
          className="relative grid gap-7 sm:grid-cols-3 sm:gap-9 sm:before:absolute sm:before:top-[59px] sm:before:right-8 sm:before:left-[7px] sm:before:h-px sm:before:bg-peploe-burgundy lg:self-stretch lg:pt-[22px] lg:before:top-[81px]"
          aria-label="Peploe’s through the years"
        >
          {philosophy.milestones.map((milestone) => (
            <li
              data-scroll-reveal
              key={milestone.year}
              className="relative min-w-0 pl-[30px] before:absolute before:top-[14px] before:bottom-[-42px] before:left-[6.5px] before:w-px before:bg-peploe-burgundy last:before:hidden sm:pl-0 sm:before:hidden"
            >
              <p className="font-[family-name:var(--font-eb-garamond),serif] text-[28px] leading-[37px] font-normal text-peploe-burgundy">
                {milestone.year}
              </p>
              <span
                className="absolute top-3 left-0 size-3.5 rounded-full bg-peploe-burgundy sm:relative sm:top-auto sm:mt-[18px] sm:block"
                aria-hidden="true"
              />
              <h3 className="mt-2 text-[25px] leading-[27px] sm:mt-[18px] sm:min-h-[50px] sm:leading-[25px] sm:whitespace-pre-line">
                {milestone.heading}
              </h3>
              <p className="mt-3 text-base leading-6 text-text-secondary sm:mt-[18px] min-[90rem]:max-w-[199.667px]">
                {milestone.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function StoryBuilding() {
  const { building } = OUR_STORY_CONTENT;

  return (
    <section
      className="section-divider-subtle bg-[color-mix(in_srgb,var(--peploe-burgundy)_6%,var(--warm-cream))]"
      aria-labelledby="story-building"
    >
      <div className="site-container grid items-center gap-8 py-12 sm:grid-cols-[minmax(0,1fr)_170px] lg:min-h-[600px] lg:grid-cols-[525fr_23fr_518fr_57fr_173fr] lg:gap-0 lg:py-0">
        <div
          data-scroll-reveal
          className="min-w-0 sm:col-span-full lg:col-[1] lg:py-20"
        >
          <p className="flex items-center gap-2.5 text-sm leading-4 font-medium tracking-[0.1em] text-peploe-burgundy uppercase before:h-0.5 before:w-12 before:shrink-0 before:bg-current">
            {building.eyebrow}
          </p>
          <h2
            id="story-building"
            className="mt-4 text-[38px] leading-[42px] text-balance max-[360px]:text-[35px] max-[360px]:leading-10 sm:text-[52px] sm:leading-[52px] lg:text-[48px] lg:leading-[48px] lg:text-wrap lg:whitespace-pre-line xl:text-[clamp(52px,4.166667vw,60px)] xl:leading-[52px] xl:whitespace-pre"
          >
            {building.heading}
          </h2>
          <p className="mt-4 text-lg leading-7 text-text-secondary xl:whitespace-pre-line">
            {building.description}
          </p>
          <Button
            asChild
            variant="brand-contact"
            className="mt-6 h-auto min-h-11 w-[161px] max-w-full gap-[5px] rounded-[4px] border-0 px-5 py-2.5 text-base leading-6 whitespace-normal shadow-[inset_0_0_0_1px_currentColor] hover:bg-peploe-burgundy hover:text-warm-cream hover:shadow-[inset_0_0_0_1px_var(--peploe-burgundy)] focus-visible:ring-0 forced-colors:[&:not(:focus-visible)]:-outline-offset-1 forced-colors:[&:not(:focus-visible)]:[outline:1px_solid_CanvasText]"
          >
            <Link href={`${ROUTES.VISIT_CONTACT}#find-us`}>
              {building.action}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </Button>
        </div>
        <Image
          {...building.image}
          width={1036}
          height={1084}
          sizes="(min-width: 1584px) 576px, (min-width: 1024px) 36vw, (min-width: 640px) 60vw, calc(100vw - 48px)"
          className="block h-auto w-full object-contain lg:col-[3] xl:mt-[21px] xl:self-start"
        />
        <ol
          className="grid gap-6 sm:gap-1.5 lg:col-[5]"
          aria-label="From St Stephen’s Green to the dining room"
        >
          {building.journey.map((stop) => (
            <li
              data-scroll-reveal
              key={stop.label}
              className="relative pl-6 before:absolute before:top-1.5 before:left-0 before:size-1 before:rounded-full before:bg-ink after:absolute after:top-2.5 after:bottom-[-30px] after:left-[1.5px] after:w-px after:bg-text-secondary last:after:hidden sm:pl-0 sm:before:top-[47px] sm:before:left-[35px] sm:after:top-[51px] sm:after:bottom-0 sm:after:left-[36.5px] sm:last:before:hidden sm:[&:not(:last-child)]:h-24"
            >
              <p className="text-[11px] leading-[17px] font-semibold uppercase">
                {stop.label}
              </p>
              <p className="mt-[5px] text-[11px] leading-[17px] text-text-secondary uppercase sm:whitespace-pre-line">
                {stop.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function StoryFounder() {
  const { founder } = OUR_STORY_CONTENT;

  return (
    <section
      className="lg:section-divider-subtle relative"
      aria-labelledby="story-founder"
    >
      {/* Figma leaves this portrait empty until the approved photo is supplied. */}
      <div
        className="h-60 bg-[#686565] lg:absolute lg:inset-y-0 lg:left-0 lg:h-auto lg:w-[52%] xl:w-[calc(100%_-_var(--story-gutter)_-_490px_-_68px)]"
        aria-hidden="true"
      />
      <div className="site-container">
        <div
          data-scroll-reveal
          className="pt-10 pb-12 lg:ml-auto lg:min-h-[390px] lg:w-[44%] lg:py-[51px] xl:w-[490px]"
        >
          <p className="flex items-center gap-2.5 text-sm leading-4 font-medium tracking-[0.1em] text-peploe-burgundy uppercase after:h-0.5 after:w-12 after:shrink-0 after:bg-current">
            {founder.eyebrow}
          </p>
          <h2
            id="story-founder"
            className="mt-4 text-[38px] leading-[42px] text-balance max-[360px]:text-[35px] max-[360px]:leading-10 sm:text-[52px] sm:leading-[52px] lg:text-[60px] lg:leading-[50px] lg:text-wrap lg:whitespace-pre-line"
          >
            {founder.heading}
          </h2>
          <p className="mt-4 text-lg leading-7 text-text-secondary xl:whitespace-pre-line">
            {founder.description}
          </p>
        </div>
      </div>
    </section>
  );
}

function StoryMural() {
  const { mural } = OUR_STORY_CONTENT;

  return (
    <section
      className="relative overflow-hidden bg-[rgb(var(--overlay-dark-ink-rgb))] text-warm-cream after:pointer-events-none after:absolute after:inset-0 after:bg-[linear-gradient(90deg,rgb(var(--overlay-dark-ink-rgb)/92%),rgb(var(--overlay-dark-ink-rgb)/55%))] lg:after:bg-[linear-gradient(90deg,rgb(var(--overlay-dark-ink-rgb))_12.9636%,rgb(var(--overlay-dark-ink-rgb)/50%)_37.9808%,rgb(var(--overlay-dark-ink-rgb)/0%)_59.5541%)]"
      aria-labelledby="story-mural"
    >
      <div className="absolute inset-0 lg:right-auto lg:left-[11.7249%] lg:w-full">
        <Image
          {...mural.image}
          fill
          sizes="100vw"
          className="object-cover object-top lg:object-top-left"
        />
      </div>
      <div className="site-container">
        <div
          data-scroll-reveal
          className="relative z-1 py-12 lg:min-h-[444px] lg:w-[470px]"
        >
          <p className="flex items-center gap-2.5 text-sm leading-4 font-medium tracking-[0.1em] uppercase after:h-0.5 after:w-12 after:shrink-0 after:bg-current">
            {mural.eyebrow}
          </p>
          <h2
            id="story-mural"
            className="mt-4 text-[38px] leading-[42px] text-balance max-[360px]:text-[35px] max-[360px]:leading-10 sm:text-[52px] sm:leading-[52px] lg:text-[60px] lg:text-wrap lg:whitespace-pre-line"
          >
            {mural.heading}
          </h2>
          <p className="mt-4 text-lg leading-7 lg:whitespace-pre-line">
            {mural.description}
          </p>
          <Button
            type="button"
            aria-disabled="true"
            variant="brand-secondary-inverse"
            className="mt-6 h-auto min-h-11 w-[249px] max-w-full gap-[5px] rounded-[4px] border-0 px-5 py-2.5 text-base leading-6 whitespace-normal shadow-[inset_0_0_0_1px_currentColor] hover:bg-warm-cream hover:text-ink hover:shadow-[inset_0_0_0_1px_var(--warm-cream)] focus-visible:ring-0 forced-colors:[&:not(:focus-visible)]:-outline-offset-1 forced-colors:[&:not(:focus-visible)]:[outline:1px_solid_CanvasText]"
          >
            {mural.action}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}

function StoryArchive() {
  const { archive } = OUR_STORY_CONTENT;

  return (
    <section
      className="relative lg:min-h-[516px]"
      aria-labelledby="story-archive"
    >
      <div className="relative mt-10 aspect-[923/422] lg:absolute lg:inset-y-[47px] lg:right-0 lg:left-[469px] lg:mt-0 lg:aspect-auto xl:left-[calc(var(--story-gutter)_+_445px)]">
        <Image
          {...archive.image}
          fill
          sizes="(min-width: 1584px) calc(50vw + 275px), (min-width: 1024px) 64vw, 100vw"
          className="object-cover"
        />
      </div>
      <div className="site-container">
        <div
          data-scroll-reveal
          className="pt-8 pb-12 lg:relative lg:w-[445px] lg:py-20"
        >
          <p className="flex items-center gap-2.5 text-sm leading-4 font-medium tracking-[0.1em] text-peploe-burgundy uppercase">
            {archive.eyebrow}
          </p>
          <h2
            id="story-archive"
            className="mt-4 text-[38px] leading-[42px] text-balance max-[360px]:text-[35px] max-[360px]:leading-10 sm:text-[52px] sm:leading-[52px] lg:text-[60px] lg:leading-[50px] lg:text-wrap lg:whitespace-pre-line"
          >
            {archive.heading}
          </h2>
          <p className="mt-4 text-lg leading-7 text-text-secondary lg:mt-5 lg:whitespace-pre-line">
            {archive.description}
          </p>
          <Button
            type="button"
            aria-disabled="true"
            variant="brand-contact"
            className="mt-6 h-auto min-h-11 w-[210px] max-w-full gap-[5px] rounded-[4px] border-0 px-5 py-2.5 text-base leading-6 whitespace-normal shadow-[inset_0_0_0_1px_currentColor] hover:bg-peploe-burgundy hover:text-warm-cream hover:shadow-[inset_0_0_0_1px_var(--peploe-burgundy)] focus-visible:ring-0 lg:mt-5 forced-colors:[&:not(:focus-visible)]:-outline-offset-1 forced-colors:[&:not(:focus-visible)]:[outline:1px_solid_CanvasText]"
          >
            {archive.action}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}

function StoryNextChapter() {
  const { nextChapter } = OUR_STORY_CONTENT;

  return (
    <section
      className="lg:section-divider-subtle relative"
      aria-labelledby="story-next-chapter"
    >
      {/* Match the unfilled Gina portrait in the approved frame. */}
      <div
        className="h-60 bg-[#686565] lg:absolute lg:inset-y-0 lg:left-0 lg:h-auto lg:w-[52%] xl:w-[calc(100%_-_var(--story-gutter)_-_527px_-_16px)]"
        aria-hidden="true"
      />
      <div className="site-container">
        <div
          data-scroll-reveal
          className="pt-10 pb-12 lg:ml-auto lg:min-h-[340px] lg:w-[44%] lg:py-12 xl:w-[527px]"
        >
          <p className="flex items-center gap-2.5 text-sm leading-4 font-medium tracking-[0.1em] text-peploe-burgundy uppercase">
            {nextChapter.eyebrow}
          </p>
          <h2
            id="story-next-chapter"
            className="mt-4 text-[38px] leading-[42px] text-balance max-[360px]:text-[35px] max-[360px]:leading-10 sm:text-[52px] sm:leading-[52px] lg:text-[60px] lg:text-wrap lg:whitespace-pre-line xl:whitespace-nowrap"
          >
            {nextChapter.heading}
          </h2>
          <p className="mt-4 text-lg leading-7 text-text-secondary lg:mt-5 xl:whitespace-pre-line">
            {nextChapter.description}
          </p>
        </div>
      </div>
    </section>
  );
}

function StoryToday() {
  const { today } = OUR_STORY_CONTENT;

  return (
    <section
      className="relative overflow-hidden text-warm-cream after:pointer-events-none after:absolute after:inset-0 after:bg-[linear-gradient(90deg,rgb(var(--overlay-dark-ink-rgb)/92%),rgb(var(--overlay-dark-ink-rgb)/55%))] lg:after:bg-[linear-gradient(90deg,rgb(var(--overlay-dark-ink-rgb)),rgb(var(--overlay-dark-ink-rgb)/50%)_51.4423%,rgb(var(--overlay-dark-ink-rgb)/0%))]"
      aria-labelledby="story-today"
    >
      {/* Keep the wrist beneath “dining” as the desktop photograph widens. */}
      <div className="absolute inset-0 min-[90rem]:top-[274px] min-[90rem]:right-auto min-[90rem]:bottom-auto min-[90rem]:left-(--wrist-x) min-[90rem]:aspect-[3/2] min-[90rem]:w-[max(calc(var(--wrist-x)*30/11),calc((100%_-_var(--wrist-x))*30/19))] min-[90rem]:[--wrist-x:calc(var(--story-gutter)_+_456px)] min-[90rem]:[transform:translate(-36.666667%,-57.1875%)]">
        <Image
          {...today.image}
          fill
          sizes="100vw"
          className="object-cover object-[60%_center] lg:object-center"
        />
      </div>
      <div className="site-container">
        <div
          data-scroll-reveal
          className="relative z-1 py-12 lg:min-h-[390px] lg:w-[520px]"
        >
          <p className="flex items-center gap-2.5 text-sm leading-4 font-medium tracking-[0.1em] uppercase after:h-0.5 after:w-12 after:shrink-0 after:bg-current">
            {today.eyebrow}
          </p>
          <h2
            id="story-today"
            className="mt-4 text-[38px] leading-[42px] text-balance max-[360px]:text-[35px] max-[360px]:leading-10 sm:text-[52px] sm:leading-[52px] lg:text-[60px] lg:text-wrap lg:whitespace-pre-line"
          >
            {today.heading}
          </h2>
          <p className="mt-4 text-lg leading-7 lg:mt-5 lg:text-xl lg:whitespace-pre-line">
            {today.description}
          </p>
          <Button
            type="button"
            aria-disabled="true"
            variant="brand-primary"
            className="mt-6 h-auto min-h-11 w-[156px] max-w-full gap-[5px] rounded-[4px] px-5 py-2.5 text-base leading-6 whitespace-nowrap lg:mt-5"
          >
            {today.action}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}

export function OurStory() {
  return (
    <main
      className={cn(
        dmSans.className,
        ebGaramond.variable,
        "bg-warm-cream text-ink xl:[--story-gutter:max(72px,(100%_-_var(--site-content-max-width))/2)] [&_:is(a,button):focus-visible]:outline-offset-4 [&_:is(a,button):focus-visible]:[outline:2px_solid_currentColor] [&_:is(h1,h2,h3)]:font-[family-name:var(--font-eb-garamond),serif] [&_:is(h1,h2,h3)]:font-normal",
      )}
    >
      <StoryHero />
      <StoryTimeline />
      <StoryBuilding />
      <StoryFounder />
      <StoryMural />
      <StoryArchive />
      <StoryNextChapter />
      <StoryToday />
    </main>
  );
}
