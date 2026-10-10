import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import styles from "@/components/app/compounds/private-dining.module.css";
import { PrivateDiningEnquiry } from "@/components/app/compounds/private-dining-enquiry";
import { PrivateDiningClosing } from "@/components/app/molecules/private-dining-closing";
import { PrivateDiningFeatures } from "@/components/app/molecules/private-dining-features";
import { PrivateDiningHeading } from "@/components/app/molecules/private-dining-heading";
import { PrivateDiningHero } from "@/components/app/molecules/private-dining-hero";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import {
  PRIVATE_DINING,
  PRIVATE_DINING_BENEFITS,
  PRIVATE_DINING_GATHERINGS,
  PRIVATE_DINING_MENUS,
} from "@/lib/constants/private-dining";
import { ebGaramond } from "@/lib/fonts";
import { cn } from "@/lib/utils";

export function PrivateDining() {
  return (
    <>
      <PrivateDiningHero hero={PRIVATE_DINING.hero} variant="overview" />
      <section className={cn("site-container", styles.gatherings)}>
        <PrivateDiningHeading {...PRIVATE_DINING_GATHERINGS} />
        <ul className={styles.gatheringCards}>
          {PRIVATE_DINING_GATHERINGS.items.map((item, index) => (
            <li key={item._key}>
              <div className={styles.gatheringImage}>
                <Image
                  src={item.image.src}
                  alt={item.image.alt}
                  fill
                  sizes="(min-width: 1584px) 464px, (min-width: 1280px) calc((100vw - 192px) / 3), (min-width: 1024px) calc((100vw - 96px) / 3), (min-width: 640px) calc((100vw - 80px) / 2), calc(100vw - 48px)"
                  className={styles.cover}
                />
              </div>
              <div className={styles.gatheringCopy}>
                <p className={styles.cardNumber}>
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className={ebGaramond.className}>
                  {"mobileTitle" in item ? (
                    <>
                      <span className={styles.desktopTitle}>{item.title}</span>
                      <span className={styles.mobileTitle}>
                        {item.mobileTitle}
                      </span>
                    </>
                  ) : (
                    item.title
                  )}
                </h3>
                <p className={cn(ebGaramond.className, styles.cardDescription)}>
                  {item.description}
                </p>
                <Button
                  asChild
                  variant="brand-text"
                  className={styles.cardLink}
                >
                  <Link href={item.href}>
                    {PRIVATE_DINING_GATHERINGS.action}
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section className={styles.benefits} aria-label="Gathering at Peploe’s">
        <PrivateDiningFeatures
          items={PRIVATE_DINING_BENEFITS}
          className="site-container"
        />
      </section>
      <section className={styles.overviewMenus}>
        <div className={styles.overviewMenuImage}>
          <Image
            src={PRIVATE_DINING_MENUS.image.src}
            alt={PRIVATE_DINING_MENUS.image.alt}
            fill
            sizes="(min-width: 1024px) 45vw, 100vw"
            className={styles.cover}
          />
        </div>
        <div className={styles.overviewMenuCopy}>
          <PrivateDiningHeading
            eyebrow={PRIVATE_DINING_MENUS.eyebrow}
            heading={PRIVATE_DINING_MENUS.heading}
          />
          <p className={cn(ebGaramond.className, styles.menuDescription)}>
            {PRIVATE_DINING_MENUS.description}
          </p>
          <p className={styles.menuEligibility}>
            {PRIVATE_DINING_MENUS.eligibility}
          </p>
          <Button asChild variant="brand-contact" className={styles.action}>
            <Link href={ROUTES.GROUP_SET_MENU}>
              {PRIVATE_DINING_MENUS.action}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </Button>
          <Image
            src={PRIVATE_DINING_MENUS.illustration}
            alt=""
            width={106}
            height={222}
            className={styles.botanical}
          />
        </div>
      </section>
      <PrivateDiningEnquiry content={PRIVATE_DINING.enquiry} compact />
      <PrivateDiningClosing
        content={PRIVATE_DINING.closing}
        imageSizes="(min-width: 1024px) 100vw, 153.85vw"
        className={styles.overviewClosing}
      />
    </>
  );
}
