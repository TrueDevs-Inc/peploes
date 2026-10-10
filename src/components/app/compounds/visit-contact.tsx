import { MapPin } from "lucide-react";
import Image from "next/image";

import styles from "@/components/app/compounds/visit-contact.module.css";
import { VisitContactDetails } from "@/components/app/compounds/visit-contact-details";
import { Button } from "@/components/ui/button";
import { RESTAURANT_CONTACT, RESTAURANT_OPENING_HOURS } from "@/lib/constants";
import { VISIT_CONTACT_CONTENT } from "@/lib/constants/visit-contact";
import { dmSans, ebGaramond } from "@/lib/fonts";
import { cn } from "@/lib/utils";

function VisitBookingButton() {
  return (
    <Button
      type="button"
      variant="brand-primary"
      aria-disabled="true"
      className={cn(styles.action, styles.booking)}
    >
      {VISIT_CONTACT_CONTENT.bookingLabel}
      <span aria-hidden="true">→</span>
    </Button>
  );
}

function VisitHero() {
  return (
    <section className={styles.hero} aria-labelledby="visit-title">
      <div className={styles.heroImage}>
        <Image
          {...VISIT_CONTACT_CONTENT.hero.image}
          width={765}
          height={1020}
          preload
          sizes="(min-width: 1584px) calc(50vw + 220px), (min-width: 1280px) calc(100vw - 572px), (min-width: 1024px) 55vw, 100vw"
          className={styles.heroPhoto}
        />
      </div>
      <div className="site-container">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>{VISIT_CONTACT_CONTENT.hero.eyebrow}</p>
          <h1 id="visit-title">{VISIT_CONTACT_CONTENT.hero.heading}</h1>
          <p className={styles.heroAddress}>
            {VISIT_CONTACT_CONTENT.hero.address}
          </p>
          <p className={styles.description}>
            {VISIT_CONTACT_CONTENT.hero.description}
          </p>
          <div className={styles.heroActions}>
            <VisitBookingButton />
            <Button
              asChild
              variant="brand-contact"
              className={cn(styles.action, styles.directions)}
            >
              <a href={VISIT_CONTACT_CONTENT.directionsUrl}>
                <MapPin aria-hidden="true" className="size-4" />
                {VISIT_CONTACT_CONTENT.directionsLabel}
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function VisitContactInformation() {
  return (
    <section
      className={styles.contact}
      id="opening-hours"
      aria-label="Opening hours, address and contact"
    >
      <div className={cn("site-container", styles.contactGrid)}>
        <div className={styles.contactItem}>
          <Image src="/peploes-visit-clock.svg" alt="" width={48} height={48} />
          <div>
            <h2>{VISIT_CONTACT_CONTENT.contact.hoursHeading}</h2>
            <dl className={styles.hours}>
              {RESTAURANT_OPENING_HOURS.map((item) => (
                <div key={item.days}>
                  <dt>{item.days}</dt>
                  <dd>{item.hours}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
        <div className={styles.contactItem}>
          <Image
            src="/peploes-events-location.svg"
            alt=""
            width={48}
            height={48}
          />
          <div>
            <h2>{VISIT_CONTACT_CONTENT.contact.addressHeading}</h2>
            <address>{VISIT_CONTACT_CONTENT.contact.address}</address>
          </div>
        </div>
        <div className={styles.contactItem}>
          <Image
            src="/peploes-visit-contact.svg"
            alt=""
            width={48}
            height={48}
          />
          <div>
            <h2>{VISIT_CONTACT_CONTENT.contact.heading}</h2>
            <div className={styles.contactLinks}>
              <a href={`tel:${RESTAURANT_CONTACT.phone}`}>
                {RESTAURANT_CONTACT.phoneLabel}
              </a>
              <a href={`mailto:${RESTAURANT_CONTACT.email}`}>
                {RESTAURANT_CONTACT.email}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function VisitLocation() {
  return (
    <section className={cn("site-container", styles.location)} id="find-us">
      <div className={styles.locationGrid}>
        <div className={styles.locationCopy}>
          <p className={styles.eyebrow}>
            {VISIT_CONTACT_CONTENT.location.eyebrow}
          </p>
          <h2 className={styles.heading}>
            {VISIT_CONTACT_CONTENT.location.heading}
          </h2>
          <p className={styles.description}>
            {VISIT_CONTACT_CONTENT.location.description}
          </p>
        </div>
        <a
          href={VISIT_CONTACT_CONTENT.directionsUrl}
          className={styles.map}
          aria-label="Get directions to Peploe’s on Google Maps"
        >
          <Image
            {...VISIT_CONTACT_CONTENT.location.map}
            fill
            sizes="(min-width: 1584px) 844px, (min-width: 1280px) 53vw, (min-width: 1024px) 52vw, calc(100vw - 48px)"
            className={styles.cover}
          />
        </a>
      </div>
      <div className={styles.transport}>
        <h3 className={styles.eyebrow}>
          {VISIT_CONTACT_CONTENT.location.transportHeading}
        </h3>
        <ul className={styles.transportGrid}>
          {VISIT_CONTACT_CONTENT.location.transport.map((item) => (
            <li key={item.heading}>
              <Image src={item.icon} alt="" width={48} height={48} />
              <div>
                <h4>{item.heading}</h4>
                <p className={cn("accent" in item && styles.accent)}>
                  {item.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function VisitClosing() {
  return (
    <section className={styles.closing}>
      <Image
        {...VISIT_CONTACT_CONTENT.closing.image}
        fill
        sizes="100vw"
        className={styles.cover}
      />
      <div className="site-container">
        <div className={styles.closingCopy}>
          <p className={styles.eyebrow}>
            {VISIT_CONTACT_CONTENT.closing.eyebrow}
          </p>
          <h2 className={styles.heading}>
            {VISIT_CONTACT_CONTENT.closing.heading}
          </h2>
          <p>{VISIT_CONTACT_CONTENT.closing.description}</p>
          <VisitBookingButton />
        </div>
      </div>
    </section>
  );
}

export function VisitContact() {
  return (
    <main className={cn(dmSans.className, ebGaramond.variable, styles.page)}>
      <VisitHero />
      <VisitContactInformation />
      <VisitLocation />
      <VisitContactDetails />
      <VisitClosing />
    </main>
  );
}
