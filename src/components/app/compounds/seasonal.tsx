import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import styles from "@/components/app/compounds/seasonal.module.css";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { SEASONAL_CONTENT } from "@/lib/constants/seasonal";
import { dmSans, ebGaramond } from "@/lib/fonts";
import { cn } from "@/lib/utils";

function SeasonalHero() {
  const { hero } = SEASONAL_CONTENT;

  return (
    <section className={styles.hero} aria-labelledby="seasonal-title">
      <div className={styles.heroImage}>
        <Image
          {...hero.image}
          fill
          preload
          sizes="(min-width: 1024px) 74vw, (min-width: 640px) 100vw, 130vw"
          className={styles.cover}
        />
      </div>
      <div className="site-container">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>{hero.eyebrow}</p>
          <h1 id="seasonal-title">{hero.heading}</h1>
          <p className={styles.description}>{hero.description}</p>
        </div>
      </div>
    </section>
  );
}

function SeasonalDiary() {
  const { diary } = SEASONAL_CONTENT;

  return (
    <section className={styles.diary} aria-labelledby="seasonal-diary">
      <div className="site-container">
        <div className={styles.diaryIntroduction}>
          <div>
            <p className={styles.eyebrow}>{diary.eyebrow}</p>
            <h2 id="seasonal-diary">{diary.heading}</h2>
          </div>
          <p>{diary.description}</p>
        </div>
        <div className={styles.months}>
          {diary.months.map((month) => (
            <section
              key={month.name}
              className={styles.month}
              aria-labelledby={`seasonal-${month.name.toLowerCase()}`}
            >
              <h3
                id={`seasonal-${month.name.toLowerCase()}`}
                className={styles.monthHeading}
              >
                {month.name}
              </h3>
              <ul>
                {month.events.map((event) => (
                  <li key={event.title} className={styles.event}>
                    <p className={styles.eventDate}>
                      <span className={styles.day}>{event.day}</span>
                      <span>{month.abbreviation}</span>
                    </p>
                    <div className={styles.eventCopy}>
                      <p className={styles.category}>{event.category}</p>
                      <h4>{event.title}</h4>
                      <p className={styles.eventDescription}>
                        {event.description}
                      </p>
                      <Button
                        asChild
                        variant="brand-text"
                        className={styles.eventAction}
                      >
                        <Link href={`${ROUTES.WHATS_ON}/${event.slug}`}>
                          {event.action}
                          <ArrowRight aria-hidden="true" className="size-4" />
                        </Link>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}

function SeasonalTerrace() {
  const { terrace } = SEASONAL_CONTENT;

  return (
    <section className={styles.terrace} aria-labelledby="seasonal-terrace">
      <div className={styles.terraceImage}>
        <Image
          {...terrace.image}
          fill
          sizes="(min-width: 1024px) 41vw, 100vw"
          className={styles.cover}
        />
      </div>
      <div className="site-container">
        <div className={styles.terraceCopy}>
          <h2 id="seasonal-terrace">{terrace.heading}</h2>
          <p className={styles.description}>{terrace.description}</p>
        </div>
      </div>
    </section>
  );
}

export function SeasonalJoin() {
  const { join } = SEASONAL_CONTENT;

  return (
    <section className={styles.join} aria-labelledby="seasonal-join">
      <div className={styles.joinImage}>
        <Image
          {...join.image}
          fill
          sizes="(min-width: 1024px) 141vw, (min-width: 640px) 100vw, 150vw"
          className={styles.cover}
        />
      </div>
      <div className="site-container">
        <div className={styles.joinCopy}>
          <p className={styles.eyebrow}>{join.eyebrow}</p>
          <h2 id="seasonal-join">{join.heading}</h2>
          <p className={styles.description}>{join.description}</p>
          <div className={styles.joinActions}>
            <Button
              type="button"
              aria-disabled="true"
              variant="brand-primary"
              className={styles.bookingAction}
            >
              {join.bookingAction}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Button>
            <Button
              asChild
              variant="brand-secondary-inverse"
              className={styles.contactAction}
            >
              <Link href={ROUTES.VISIT_CONTACT}>
                {join.contactAction}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Seasonal() {
  return (
    <main className={cn(dmSans.className, ebGaramond.variable, styles.page)}>
      <SeasonalHero />
      <SeasonalDiary />
      <SeasonalTerrace />
      <SeasonalJoin />
    </main>
  );
}
