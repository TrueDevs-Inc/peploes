import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import styles from "@/components/app/compounds/visit-contact-details.module.css";
import { Button } from "@/components/ui/button";
import { RESTAURANT_CONTACT, ROUTES } from "@/lib/constants";
import { VISIT_CONTACT_DETAILS } from "@/lib/constants/visit-contact-details";
import { cn } from "@/lib/utils";

export function VisitContactDetails() {
  return (
    <>
      <section
        aria-labelledby="visit-reservation-heading"
        className={styles.reservation}
      >
        <div
          data-scroll-reveal
          className={cn("site-container", styles.reservationGrid)}
        >
          <div>
            <p className={styles.eyebrow}>
              {VISIT_CONTACT_DETAILS.reservation.eyebrow}
            </p>
            <h2 id="visit-reservation-heading" className={styles.heading}>
              {VISIT_CONTACT_DETAILS.reservation.heading}
            </h2>
            <p className={styles.description}>
              {VISIT_CONTACT_DETAILS.reservation.description}
            </p>
          </div>
          <div className={styles.reservationActions}>
            <Button
              asChild
              variant="brand-primary-inverse"
              className={styles.bookingButton}
            >
              <Link href={ROUTES.BOOK_A_TABLE}>
                {VISIT_CONTACT_DETAILS.reservation.bookingLabel}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="brand-secondary-inverse"
              className={styles.phoneButton}
            >
              <a href={`tel:${RESTAURANT_CONTACT.phone}`}>
                <Image
                  src={VISIT_CONTACT_DETAILS.reservation.phoneIcon}
                  alt=""
                  width={16}
                  height={16}
                  className="shrink-0"
                />
                {VISIT_CONTACT_DETAILS.reservation.phoneLabel}
              </a>
            </Button>
            <Button asChild variant="brand-text" className={styles.emailLink}>
              <a href={`mailto:${RESTAURANT_CONTACT.email}`}>
                <span>{VISIT_CONTACT_DETAILS.reservation.emailLabel}</span>
                <ArrowRight aria-hidden="true" className="size-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="visit-dining-heading"
        className={cn("section-divider-subtle-bottom", styles.dining)}
      >
        <div className="site-container">
          <div data-scroll-reveal className={styles.diningIntro}>
            <div>
              <p className={styles.eyebrow}>
                {VISIT_CONTACT_DETAILS.dining.eyebrow}
              </p>
              <h2 id="visit-dining-heading" className={styles.heading}>
                {VISIT_CONTACT_DETAILS.dining.heading}
              </h2>
            </div>
            <p className={styles.diningDescription}>
              {VISIT_CONTACT_DETAILS.dining.description}
            </p>
          </div>
          <ul className={styles.services}>
            {VISIT_CONTACT_DETAILS.dining.services.map((service) => (
              <li
                data-scroll-reveal
                className={styles.service}
                key={service.heading}
              >
                <Image
                  src={service.icon}
                  alt=""
                  width={48}
                  height={48}
                  className={styles.serviceIcon}
                />
                <h3 className={styles.serviceHeading}>{service.heading}</h3>
                <p className={styles.serviceHours}>{service.hours}</p>
                {service.detail && (
                  <p className={styles.serviceDetail}>{service.detail}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className={cn("site-container", styles.practicalities)}>
        <section
          data-scroll-reveal
          aria-labelledby="visit-accessibility-heading"
        >
          <p className={styles.eyebrow}>
            {VISIT_CONTACT_DETAILS.accessibility.eyebrow}
          </p>
          <h2 id="visit-accessibility-heading" className={styles.heading}>
            {VISIT_CONTACT_DETAILS.accessibility.heading}
          </h2>
          <p className={styles.description}>
            {VISIT_CONTACT_DETAILS.accessibility.description}
          </p>
        </section>
        <section
          data-scroll-reveal
          aria-labelledby="visit-gatherings-heading"
          className={styles.gatherings}
        >
          <p className={styles.eyebrow}>
            {VISIT_CONTACT_DETAILS.gatherings.eyebrow}
          </p>
          <h2 id="visit-gatherings-heading" className={styles.heading}>
            {VISIT_CONTACT_DETAILS.gatherings.heading}
          </h2>
          <p className={styles.description}>
            {VISIT_CONTACT_DETAILS.gatherings.description}
          </p>
          <Button
            asChild
            variant="brand-contact"
            className={styles.gatheringsButton}
          >
            <Link href={ROUTES.PRIVATE_DINING}>
              <span>{VISIT_CONTACT_DETAILS.gatherings.label}</span>
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </Button>
        </section>
      </div>
    </>
  );
}
