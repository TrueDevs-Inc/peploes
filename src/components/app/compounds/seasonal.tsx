import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import styles from "@/components/app/compounds/seasonal.module.css";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { dmSans, ebGaramond } from "@/lib/fonts";
import { seasonalPath } from "@/lib/seasonal-data";
import type {
  ISeasonalJoinProps,
  ISeasonalProps,
  TWhatsOnPage,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export function Seasonal({ content, months }: ISeasonalProps) {
  return (
    <main className={cn(dmSans.className, ebGaramond.variable, styles.page)}>
      <SeasonalHero {...content.hero} />
      <SeasonalDiary content={content} months={months} />
      {content.terrace && <SeasonalTerrace {...content.terrace} />}
      <SeasonalJoin join={content.join} />
    </main>
  );
}

export function SeasonalJoin({ join }: ISeasonalJoinProps) {
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
          <div className="mt-6 flex flex-col gap-2.5 sm:mt-7 sm:flex-row sm:flex-wrap sm:gap-5">
            <Button
              type="button"
              aria-disabled="true"
              variant="brand-primary"
              className="h-auto min-h-11 w-full max-w-full gap-2 whitespace-normal rounded-[4px] px-5 py-2.5 text-base leading-[22px] has-[>svg]:px-5 sm:w-auto sm:min-w-[156px] sm:gap-1 sm:leading-6"
            >
              <span className="min-w-0 [overflow-wrap:anywhere]">
                {join.bookingAction}
              </span>
              <ArrowRight aria-hidden="true" className="size-4" />
            </Button>
            <Button
              asChild
              variant="brand-secondary-inverse"
              className="h-auto min-h-11 w-full max-w-full gap-2 whitespace-normal rounded-[4px] px-5 py-2.5 text-base leading-[22px] has-[>svg]:px-5 sm:w-auto sm:min-w-[148px] sm:gap-1.5 sm:px-[18px] sm:py-[9px] sm:leading-6 sm:has-[>svg]:px-[18px]"
            >
              <Link href={ROUTES.VISIT_CONTACT}>
                <span className="min-w-0 [overflow-wrap:anywhere]">
                  {join.contactAction}
                </span>
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function SeasonalHero(hero: TWhatsOnPage["hero"]) {
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

function SeasonalDiary({ content, months }: ISeasonalProps) {
  const { diary } = content;

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
          {months.length === 0 && <p>{diary.emptyMessage}</p>}
          {months.map((month) => (
            <section
              key={month.key}
              className={styles.month}
              aria-labelledby={`seasonal-${month.key}`}
            >
              <h3 id={`seasonal-${month.key}`} className={styles.monthHeading}>
                {month.name}
              </h3>
              <ul>
                {month.events.map((event) => (
                  <li key={event._id} className={styles.event}>
                    <p className={styles.eventDate}>
                      <span className={styles.day}>{event.day}</span>
                      <span>{month.abbreviation}</span>
                    </p>
                    <div className={styles.eventCopy}>
                      <p className={styles.category}>{event.category}</p>
                      <h4>{event.title}</h4>
                      <p className={styles.eventDescription}>{event.summary}</p>
                      <Button
                        asChild
                        variant="brand-text"
                        className={styles.eventAction}
                      >
                        <Link href={seasonalPath(event.slug)}>
                          {event.action ?? diary.action}
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

function SeasonalTerrace(terrace: NonNullable<TWhatsOnPage["terrace"]>) {
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
