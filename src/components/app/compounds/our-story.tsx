import Image from "next/image";
import Link from "next/link";

import styles from "@/components/app/compounds/our-story.module.css";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { OUR_STORY_CONTENT } from "@/lib/constants/our-story";
import { dmSans, ebGaramond } from "@/lib/fonts";
import { cn } from "@/lib/utils";

function StoryHero() {
  const { hero } = OUR_STORY_CONTENT;

  return (
    <section className={styles.hero} aria-labelledby="story-title">
      <div className={styles.heroImage}>
        <Image
          {...hero.image}
          fill
          preload
          sizes="(min-width: 1584px) calc(50vw + 220px), (min-width: 1280px) calc(100vw - 572px), (min-width: 1024px) 60vw, 100vw"
          className={styles.heroPhoto}
        />
      </div>
      <div className="site-container">
        <div className={styles.heroCopy}>
          <p className={cn(styles.eyebrow, styles.leadingRule)}>
            {hero.eyebrow}
          </p>
          <h1 id="story-title">{hero.heading}</h1>
          <p className={styles.description}>{hero.description}</p>
          <p className={styles.establishment}>{hero.establishment}</p>
        </div>
      </div>
    </section>
  );
}

function StoryTimeline() {
  const { philosophy } = OUR_STORY_CONTENT;

  return (
    <section className={styles.philosophy} aria-labelledby="story-philosophy">
      <div className={cn("site-container", styles.philosophyGrid)}>
        <h2 id="story-philosophy" className={styles.philosophyHeading}>
          {philosophy.heading}
        </h2>
        <ol className={styles.timeline} aria-label="Peploe’s through the years">
          {philosophy.milestones.map((milestone) => (
            <li key={milestone.year}>
              <p className={styles.year}>{milestone.year}</p>
              <span className={styles.marker} aria-hidden="true" />
              <h3>{milestone.heading}</h3>
              <p className={styles.milestoneDescription}>
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
    <section className={styles.building} aria-labelledby="story-building">
      <div className={cn("site-container", styles.buildingGrid)}>
        <div className={styles.buildingCopy}>
          <p className={cn(styles.eyebrow, styles.leadingRule)}>
            {building.eyebrow}
          </p>
          <h2 id="story-building" className={styles.heading}>
            {building.heading}
          </h2>
          <p className={styles.description}>{building.description}</p>
          <Button
            asChild
            variant="brand-contact"
            className={cn(styles.action, styles.outlineAction)}
          >
            <Link href={`${ROUTES.VISIT_CONTACT}#find-us`}>
              {building.action}
              <span aria-hidden="true">→</span>
            </Link>
          </Button>
        </div>
        <Image
          {...building.image}
          width={1036}
          height={1084}
          sizes="(min-width: 1584px) 576px, (min-width: 1024px) 36vw, (min-width: 640px) 60vw, calc(100vw - 48px)"
          className={styles.buildingImage}
        />
        <ol
          className={styles.journey}
          aria-label="From St Stephen’s Green to the dining room"
        >
          {building.journey.map((stop) => (
            <li key={stop.label}>
              <p>{stop.label}</p>
              <p>{stop.description}</p>
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
    <section className={styles.founder} aria-labelledby="story-founder">
      {/* Figma leaves this portrait empty until the approved photo is supplied. */}
      <div className={styles.photoPlaceholder} aria-hidden="true" />
      <div className="site-container">
        <div className={styles.founderCopy}>
          <p className={cn(styles.eyebrow, styles.trailingRule)}>
            {founder.eyebrow}
          </p>
          <h2 id="story-founder" className={styles.heading}>
            {founder.heading}
          </h2>
          <p className={styles.description}>{founder.description}</p>
        </div>
      </div>
    </section>
  );
}

function StoryMural() {
  const { mural } = OUR_STORY_CONTENT;

  return (
    <section className={styles.mural} aria-labelledby="story-mural">
      <div className={styles.muralImage}>
        <Image
          {...mural.image}
          fill
          sizes="100vw"
          className={styles.muralPhoto}
        />
      </div>
      <div className="site-container">
        <div className={styles.muralCopy}>
          <p className={cn(styles.eyebrow, styles.trailingRule)}>
            {mural.eyebrow}
          </p>
          <h2 id="story-mural" className={styles.heading}>
            {mural.heading}
          </h2>
          <p className={styles.description}>{mural.description}</p>
          <Button
            type="button"
            aria-disabled="true"
            variant="brand-secondary-inverse"
            className={cn(styles.action, styles.outlineAction)}
          >
            {mural.action}
            <span aria-hidden="true">→</span>
          </Button>
        </div>
      </div>
    </section>
  );
}

function StoryArchive() {
  const { archive } = OUR_STORY_CONTENT;

  return (
    <section className={styles.archive} aria-labelledby="story-archive">
      <div className={styles.archiveImage}>
        <Image
          {...archive.image}
          fill
          sizes="(min-width: 1584px) calc(50vw + 275px), (min-width: 1024px) 64vw, 100vw"
          className={styles.cover}
        />
      </div>
      <div className="site-container">
        <div className={styles.archiveCopy}>
          <p className={styles.eyebrow}>{archive.eyebrow}</p>
          <h2 id="story-archive" className={styles.heading}>
            {archive.heading}
          </h2>
          <p className={styles.description}>{archive.description}</p>
          <Button
            type="button"
            aria-disabled="true"
            variant="brand-contact"
            className={cn(styles.action, styles.outlineAction)}
          >
            {archive.action}
            <span aria-hidden="true">→</span>
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
      className={styles.nextChapter}
      aria-labelledby="story-next-chapter"
    >
      {/* Match the unfilled Gina portrait in the approved frame. */}
      <div className={styles.photoPlaceholder} aria-hidden="true" />
      <div className="site-container">
        <div className={styles.nextChapterCopy}>
          <p className={styles.eyebrow}>{nextChapter.eyebrow}</p>
          <h2 id="story-next-chapter" className={styles.heading}>
            {nextChapter.heading}
          </h2>
          <p className={styles.description}>{nextChapter.description}</p>
        </div>
      </div>
    </section>
  );
}

function StoryToday() {
  const { today } = OUR_STORY_CONTENT;

  return (
    <section className={styles.today} aria-labelledby="story-today">
      <div className={styles.todayImage}>
        <Image {...today.image} fill sizes="100vw" className={styles.cover} />
      </div>
      <div className="site-container">
        <div className={styles.todayCopy}>
          <p className={cn(styles.eyebrow, styles.trailingRule)}>
            {today.eyebrow}
          </p>
          <h2 id="story-today" className={styles.heading}>
            {today.heading}
          </h2>
          <p className={styles.description}>{today.description}</p>
          <Button
            type="button"
            aria-disabled="true"
            variant="brand-primary"
            className={styles.action}
          >
            {today.action}
            <span aria-hidden="true">→</span>
          </Button>
        </div>
      </div>
    </section>
  );
}

export function OurStory() {
  return (
    <main className={cn(dmSans.className, ebGaramond.variable, styles.page)}>
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
