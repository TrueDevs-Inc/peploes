import Image from "next/image";
import styles from "@/components/app/compounds/private-dining.module.css";
import { PrivateDiningEnquiry } from "@/components/app/compounds/private-dining-enquiry";
import { PrivateDiningImageSection } from "@/components/app/compounds/private-dining-image-section";
import { PrivateDiningClosing } from "@/components/app/molecules/private-dining-closing";
import { PrivateDiningFeatures } from "@/components/app/molecules/private-dining-features";
import { PrivateDiningHeading } from "@/components/app/molecules/private-dining-heading";
import { PrivateDiningHero } from "@/components/app/molecules/private-dining-hero";
import {
  WEDDING_DAY,
  WEDDING_DETAILS,
  WEDDING_HIRE,
  WEDDINGS,
} from "@/lib/constants/private-dining-weddings";
import { ebGaramond } from "@/lib/fonts";
import { cn } from "@/lib/utils";

export function PrivateDiningWeddings() {
  return (
    <>
      <PrivateDiningHero hero={WEDDINGS.hero} variant="weddings" />
      <section className={cn(styles.paleSection, styles.weddingDay)}>
        <div className="site-container">
          <PrivateDiningHeading {...WEDDING_DAY} />
          <ol className={styles.weddingSteps}>
            {WEDDING_DAY.items.map((item) => (
              <li key={item._key}>
                <h3 className={ebGaramond.className}>{item.heading}</h3>
                <p>{item.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section className={styles.weddingHire}>
        <div className={styles.weddingHireImage}>
          <Image
            src={WEDDING_HIRE.image.src}
            alt={WEDDING_HIRE.image.alt}
            fill
            sizes="(min-width: 1024px) 52vw, 100vw"
            className={styles.cover}
          />
        </div>
        <PrivateDiningHeading
          {...WEDDING_HIRE}
          className={styles.weddingHireCopy}
        />
      </section>
      <section className={cn("site-container", styles.weddingDetails)}>
        <PrivateDiningHeading {...WEDDING_DETAILS} />
        <PrivateDiningImageSection
          className={styles.weddingTasting}
          heading={WEDDING_DETAILS.featured}
          image={WEDDING_DETAILS.featured.image}
          contained
        />
        <PrivateDiningFeatures
          items={WEDDING_DETAILS.items}
          className={styles.weddingTouches}
        />
      </section>
      <div className={styles.weddingEnquiry}>
        <PrivateDiningEnquiry content={WEDDINGS.enquiry} />
      </div>
      <PrivateDiningClosing
        content={WEDDINGS.closing}
        className={styles.weddingClosing}
      />
    </>
  );
}
