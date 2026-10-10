import styles from "@/components/app/compounds/private-dining.module.css";
import { PrivateDiningEnquiry } from "@/components/app/compounds/private-dining-enquiry";
import { PrivateDiningFeatureSection } from "@/components/app/compounds/private-dining-feature-section";
import { PrivateDiningClosing } from "@/components/app/molecules/private-dining-closing";
import { PrivateDiningFeatures } from "@/components/app/molecules/private-dining-features";
import { PrivateDiningHeading } from "@/components/app/molecules/private-dining-heading";
import { PrivateDiningHero } from "@/components/app/molecules/private-dining-hero";
import { PrivateDiningMenus } from "@/components/app/molecules/private-dining-menus";
import {
  CELEBRATION_DETAILS,
  CELEBRATION_MENUS,
  CELEBRATION_OCCASIONS,
  CELEBRATION_PLANNING,
  CELEBRATIONS,
} from "@/lib/constants/private-dining-celebrations";
import { cn } from "@/lib/utils";

export function PrivateDiningCelebrations() {
  return (
    <>
      <PrivateDiningHero hero={CELEBRATIONS.hero} variant="celebrations" />
      <PrivateDiningFeatureSection
        content={CELEBRATION_OCCASIONS}
        className={styles.celebrationOccasions}
        featuresClassName={styles.fiveFeatures}
      />
      <section className={styles.personalDetails}>
        <div className={cn("site-container", styles.personalDetailsContainer)}>
          <PrivateDiningHeading {...CELEBRATION_DETAILS} />
          <PrivateDiningFeatures
            items={CELEBRATION_DETAILS.items}
            className={styles.personalFeatures}
          />
        </div>
      </section>
      <PrivateDiningMenus
        heading={CELEBRATION_MENUS}
        paragraphs={CELEBRATION_MENUS.paragraphs}
        className={styles.celebrationMenus}
      />
      <PrivateDiningFeatureSection
        content={CELEBRATION_PLANNING}
        className={styles.celebrationPlanning}
      />
      <PrivateDiningEnquiry
        content={CELEBRATIONS.enquiry}
        className={styles.celebrationEnquiry}
      />
      <PrivateDiningClosing
        content={CELEBRATIONS.closing}
        className={styles.celebrationClosing}
      />
    </>
  );
}
