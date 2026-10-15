import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { SeasonalJoin } from "@/components/app/compounds/seasonal";
import seasonalStyles from "@/components/app/compounds/seasonal.module.css";
import styles from "@/components/app/compounds/seasonal-event.module.css";
import { SeasonalEventRelated } from "@/components/app/compounds/seasonal-event-related";
import { SeasonalEventAction } from "@/components/app/molecules/seasonal-event-action";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { SEASONAL_EVENT_CONTENT } from "@/lib/constants/seasonal-event";
import { dmSans, ebGaramond } from "@/lib/fonts";
import { cn } from "@/lib/utils";

export function SeasonalEvent() {
  const { hero, details, menu, story, gallery, invitation, related } =
    SEASONAL_EVENT_CONTENT;

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
          <div className={styles.heroCopy}>
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
              <div key={detail.label} className={styles.detail}>
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
            <p className={cn(styles.eyebrow, styles.ruledEyebrow)}>
              {menu.eyebrow}
            </p>
            <h2 id="event-menu">{menu.heading}</h2>
            <p className={styles.menuDescription}>{menu.description}</p>
            <div className={styles.menuCards}>
              {menu.cards.map((card) => (
                <article key={card.title} className={styles.menuCard}>
                  <div className={styles.menuImage}>
                    <Image
                      {...card.image}
                      fill
                      sizes="(min-width: 1440px) 628px, (min-width: 1280px) calc((100vw - 184px) / 2), (min-width: 640px) calc((100vw - 88px) / 2), calc(100vw - 48px)"
                      className={styles.cover}
                    />
                  </div>
                  <div className={styles.menuCardCopy}>
                    <h3>{card.title}</h3>
                    <p>{card.description}</p>
                    <SeasonalEventAction label={card.action} href={card.href} />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {story && (
        <section className={styles.story} aria-labelledby="event-story">
          <div className={cn("site-container", styles.storyContent)}>
            <div className={styles.storyCopy}>
              <p className={cn(styles.eyebrow, styles.ruledEyebrow)}>
                {story.eyebrow}
              </p>
              <h2 id="event-story">{story.heading}</h2>
              {story.paragraphs.map((paragraph) => (
                <p key={paragraph} className={styles.storyParagraph}>
                  {paragraph}
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
            <p className={cn(styles.eyebrow, styles.ruledEyebrow)}>
              {gallery.eyebrow}
            </p>
            <h2 id="event-gallery">{gallery.heading}</h2>
            <div className={styles.galleryImages}>
              {gallery.images.map((photo) => (
                <div key={photo.src} className={styles.galleryImage}>
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

      <section className={styles.invitation} aria-labelledby="event-invitation">
        <Image
          {...invitation.image}
          fill
          sizes="100vw"
          className={styles.cover}
        />
        <div className="site-container">
          <div className={styles.invitationCopy}>
            <h2 id="event-invitation">{invitation.heading}</h2>
            <p>{invitation.description}</p>
            <div className={styles.invitationActions}>
              <Button
                type="button"
                aria-disabled="true"
                variant="brand-primary"
              >
                {invitation.bookingAction}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Button>
              <Button asChild variant="brand-secondary-inverse">
                <Link href={ROUTES.VISIT_CONTACT}>
                  {invitation.enquiryAction}
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {related && related.cards.length > 0 && (
        <SeasonalEventRelated content={related} />
      )}
      <SeasonalJoin />
    </main>
  );
}
