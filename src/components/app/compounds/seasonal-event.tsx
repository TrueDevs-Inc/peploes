import { ArrowRight } from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";

import { SeasonalJoin } from "@/components/app/compounds/seasonal";
import seasonalStyles from "@/components/app/compounds/seasonal.module.css";
import styles from "@/components/app/compounds/seasonal-event.module.css";
import { SeasonalEventRelated } from "@/components/app/compounds/seasonal-event-related";
import { SeasonalEventAction } from "@/components/app/molecules/seasonal-event-action";
import { Button } from "@/components/ui/button";
import { FOCUS_RING, ROUTES } from "@/lib/constants";
import { dmSans, ebGaramond } from "@/lib/fonts";
import type { ISeasonalEventProps } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SeasonalEvent({ content, join }: ISeasonalEventProps) {
  const { hero, details, menu, story, gallery, invitation, related } = content;

  return (
    <main
      className={cn(
        dmSans.className,
        ebGaramond.variable,
        seasonalStyles.page,
        styles.page,
      )}
    >
      <section className={styles.hero} aria-labelledby="event-title">
        <Image
          {...hero.image}
          fill
          preload
          sizes="100vw"
          className={cn(styles.cover, styles.heroImage)}
        />
        <div className="site-container">
          <div data-scroll-reveal className={styles.heroCopy}>
            <p className={styles.eyebrow}>{hero.eyebrow}</p>
            <h1 id="event-title">{hero.heading}</h1>
            <span className={styles.heroDivider} aria-hidden="true" />
            <p>{hero.description}</p>
          </div>
        </div>
      </section>

      {details && details.length > 0 && (
        <section className={styles.details} aria-label="Event information">
          <dl className={cn("site-container", styles.detailsList)}>
            {details.map((detail) => (
              <div
                data-scroll-reveal
                key={detail._key ?? detail.label}
                className={styles.detail}
              >
                <dt>
                  <Image
                    {...detail.icon}
                    alt=""
                    className={styles.detailIcon}
                  />
                  {detail.label}
                </dt>
                <dd>{detail.description}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {menu && (
        <section className={styles.menu} aria-labelledby="event-menu">
          <div className={cn("site-container", styles.menuContent)}>
            <p
              data-scroll-reveal
              className={cn(styles.eyebrow, styles.ruledEyebrow)}
            >
              {menu.eyebrow}
            </p>
            <h2 data-scroll-reveal id="event-menu">
              {menu.heading}
            </h2>
            <p data-scroll-reveal className={styles.menuDescription}>
              {menu.description}
            </p>
            <div className={styles.menuCards}>
              {menu.cards.map((card) => {
                const image = (
                  <Image
                    {...card.image}
                    fill
                    sizes="(min-width: 1440px) 628px, (min-width: 1280px) calc((100vw - 184px) / 2), (min-width: 640px) calc((100vw - 88px) / 2), calc(100vw - 48px)"
                    className={cn(
                      styles.cover,
                      "transition-transform duration-(--duration-base) ease-out motion-safe:group-hover:scale-105 motion-safe:group-focus-visible:scale-105 motion-reduce:transition-none",
                    )}
                  />
                );
                return (
                  <article
                    key={card.id ?? card.title}
                    className={styles.menuCard}
                    data-image-card
                  >
                    {card.href ? (
                      <Link
                        href={card.href as Route}
                        aria-label={card.title}
                        data-card-image
                        className={cn(
                          FOCUS_RING,
                          styles.menuImage,
                          "group block overflow-hidden",
                        )}
                      >
                        {image}
                      </Link>
                    ) : (
                      <div className={styles.menuImage}>{image}</div>
                    )}
                    <div data-scroll-reveal className={styles.menuCardCopy}>
                      <h3>{card.title}</h3>
                      <p>{card.description}</p>
                      {card.href && (
                        <SeasonalEventAction
                          label={card.action}
                          href={card.href}
                        />
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {story && (
        <section className={styles.story} aria-labelledby="event-story">
          <div className={cn("site-container", styles.storyContent)}>
            <div data-scroll-reveal className={styles.storyCopy}>
              <p
                data-scroll-reveal
                className={cn(styles.eyebrow, styles.ruledEyebrow)}
              >
                {story.eyebrow}
              </p>
              <h2 id="event-story">{story.heading}</h2>
              {story.paragraphs.map((paragraph) => (
                <p key={paragraph._key} className={styles.storyParagraph}>
                  {paragraph.text}
                </p>
              ))}
            </div>
          </div>
          <div className={styles.storyImage}>
            <Image
              {...story.image}
              fill
              sizes="(min-width: 1024px) 48vw, 100vw"
              className={styles.cover}
            />
          </div>
        </section>
      )}

      {gallery && gallery.images.length > 0 && (
        <section className={styles.gallery} aria-labelledby="event-gallery">
          <div className="site-container">
            <p
              data-scroll-reveal
              className={cn(styles.eyebrow, styles.ruledEyebrow)}
            >
              {gallery.eyebrow}
            </p>
            <h2 data-scroll-reveal id="event-gallery">
              {gallery.heading}
            </h2>
            <div className={styles.galleryImages}>
              {gallery.images.map((photo) => (
                <div
                  key={photo._key ?? photo.src}
                  className={styles.galleryImage}
                >
                  <Image
                    {...photo}
                    fill
                    sizes="(min-width: 1584px) 464px, (min-width: 1280px) calc((100vw - 192px) / 3), (min-width: 640px) calc((100vw - 96px) / 3), calc(100vw - 48px)"
                    className={styles.cover}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {invitation && (
        <section
          className={styles.invitation}
          aria-labelledby="event-invitation"
        >
          <Image
            {...invitation.image}
            fill
            sizes="100vw"
            className={styles.cover}
          />
          <div className="site-container">
            <div data-scroll-reveal className={styles.invitationCopy}>
              <h2 id="event-invitation">{invitation.heading}</h2>
              <p>{invitation.description}</p>
              <div className="mt-6 flex flex-col gap-2.5 sm:mt-7 sm:flex-row sm:flex-wrap sm:gap-4">
                <Button
                  asChild
                  variant="brand-primary"
                  className="h-auto min-h-11 w-full max-w-full gap-2 whitespace-normal rounded-[4px] px-6 py-2.5 text-base leading-[22px] has-[>svg]:px-6 sm:min-h-12 sm:w-auto sm:text-lg sm:leading-[26px] lg:min-w-[249px] lg:px-5 lg:has-[>svg]:px-5"
                >
                  <Link href={ROUTES.BOOK_A_TABLE}>
                    <span className="min-w-0 [overflow-wrap:anywhere]">
                      {invitation.bookingAction}
                    </span>
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="brand-secondary-inverse"
                  className="h-auto min-h-11 w-full max-w-full gap-2 whitespace-normal rounded-none px-6 py-2.5 text-base leading-[22px] has-[>svg]:px-6 sm:min-h-12 sm:w-auto sm:text-lg sm:leading-[26px] lg:min-w-[206px] lg:px-5 lg:has-[>svg]:px-5"
                >
                  <Link href={`${ROUTES.PRIVATE_DINING}#enquire`}>
                    <span className="min-w-0 [overflow-wrap:anywhere]">
                      {invitation.enquiryAction}
                    </span>
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {related && related.cards.length > 0 && (
        <SeasonalEventRelated content={related} />
      )}
      <SeasonalJoin join={join} />
    </main>
  );
}
