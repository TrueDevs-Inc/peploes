import Image from "next/image";
import styles from "@/components/app/compounds/private-dining.module.css";
import { PrivateDiningEnquiry } from "@/components/app/compounds/private-dining-enquiry";
import { PrivateDiningFeatureSection } from "@/components/app/compounds/private-dining-feature-section";
import { PrivateDiningImageSection } from "@/components/app/compounds/private-dining-image-section";
import { PrivateDiningClosing } from "@/components/app/molecules/private-dining-closing";
import { PrivateDiningHeading } from "@/components/app/molecules/private-dining-heading";
import { PrivateDiningHero } from "@/components/app/molecules/private-dining-hero";
import { PrivateDiningMenus } from "@/components/app/molecules/private-dining-menus";
import {
  CORPORATE_CAPACITY,
  CORPORATE_EVENTS,
  CORPORATE_HIRE,
  CORPORATE_LOCATION,
  CORPORATE_MENUS,
  CORPORATE_OCCASIONS,
  CORPORATE_SPACES,
} from "@/lib/constants/private-dining-corporate";
import { ebGaramond } from "@/lib/fonts";
import { cn } from "@/lib/utils";

export function PrivateDiningCorporate() {
  return (
    <div className={styles.corporatePage}>
      <PrivateDiningHero hero={CORPORATE_EVENTS.hero} variant="corporate" />
      <section className={cn(styles.paleSection, styles.corporateOccasions)}>
        <div className="site-container">
          <PrivateDiningHeading {...CORPORATE_OCCASIONS} />
          <ul className={styles.corporateOccasionList}>
            {CORPORATE_OCCASIONS.items.map((item) => (
              <li key={item._key}>
                <h3 className={ebGaramond.className}>{item.heading}</h3>
                <p>{item.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <PrivateDiningImageSection
        className={styles.exclusiveHire}
        heading={CORPORATE_HIRE}
        image={CORPORATE_HIRE.image}
      >
        <p className={styles.hireNote}>{CORPORATE_HIRE.note}</p>
      </PrivateDiningImageSection>
      <section className={styles.capacity}>
        <div className="site-container">
          <PrivateDiningHeading {...CORPORATE_CAPACITY} />
          <ul className={styles.capacityGrid}>
            {CORPORATE_CAPACITY.items.map((item) => (
              <li key={item._key}>
                <Image
                  src={item.illustration}
                  alt=""
                  width={48}
                  height={48}
                  className={styles.illustration}
                />
                <h3 className={cn(ebGaramond.className, styles.capacityFigure)}>
                  {item.figure}
                </h3>
                {"label" in item && (
                  <p className={cn(ebGaramond.className, styles.capacityLabel)}>
                    {item.label}
                  </p>
                )}
                <p>{item.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section aria-label="Spaces for your event">
        <ul className={styles.spaces}>
          {CORPORATE_SPACES.map((space) => (
            <li key={space._key}>
              <div className={styles.spaceImage}>
                <Image
                  src={space.image.src}
                  alt={space.image.alt}
                  fill
                  unoptimized={space.image.unoptimized}
                  sizes="(min-width: 1024px) 33vw, 100vw"
                  className={styles.cover}
                />
              </div>
              <div className={styles.spaceCopy}>
                <h3>{space.title}</h3>
                <p>{space.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <PrivateDiningMenus
        className={styles.corporateMenus}
        heading={CORPORATE_MENUS}
        paragraphs={CORPORATE_MENUS.paragraphs}
        imageFirst
      />
      <PrivateDiningFeatureSection
        content={CORPORATE_LOCATION}
        className={styles.location}
      />
      <PrivateDiningEnquiry content={CORPORATE_EVENTS.enquiry} />
      <PrivateDiningClosing
        content={CORPORATE_EVENTS.closing}
        className={styles.corporateClosing}
      />
    </div>
  );
}
