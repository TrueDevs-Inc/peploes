import {
  ArrowRight,
  ChevronRight,
  Clock3,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import Link from "next/link";
import { FooterFrame } from "@/components/app/compounds/footer-frame";
import { FooterMeta } from "@/components/app/compounds/footer-meta";
import { MobileFooterNavigation } from "@/components/app/compounds/mobile-footer-navigation";
import { Button } from "@/components/ui/button";
import { FOCUS_RING, RESTAURANT_CONTACT, ROUTES } from "@/lib/constants";
import {
  FOOTER_CONTENT,
  FOOTER_STYLES,
  MOBILE_FOOTER_CONTENT,
} from "@/lib/constants/footer";
import { dmSans, ebGaramond } from "@/lib/fonts";
import { cn } from "@/lib/utils";

export function Footer() {
  return (
    <FooterFrame className={cn(dmSans.className, "bg-warm-cream text-ink")}>
      <div
        data-footer-container
        className="site-container-inset pt-14 pb-10 xl:pt-20"
      >
        <div
          data-footer-columns
          className="grid gap-20 xl:grid-cols-[240fr_160fr_280fr_375fr] xl:gap-[75px] min-[1440px]:grid-cols-[240px_160px_280px_minmax(0,1fr)]"
        >
          <div
            data-footer-section="brand"
            className={cn(
              FOOTER_STYLES.mobileDivider,
              "order-1 flex flex-col gap-3 xl:gap-7",
            )}
          >
            <Link
              href={ROUTES.HOME}
              aria-label={FOOTER_CONTENT.homeLabel}
              className={cn(
                FOCUS_RING,
                "block h-[72px] w-[120px] rounded-sm focus-visible:ring-peploe-burgundy focus-visible:ring-offset-warm-cream xl:w-[134px]",
              )}
            >
              <span
                aria-hidden="true"
                className="block h-full w-full bg-ink mask-[url('/peploes-logo.webp')] mask-contain mask-center mask-no-repeat"
              />
            </Link>
            <div className="space-y-0 xl:space-y-2">
              <address className="text-sm leading-[21px] not-italic">
                {FOOTER_CONTENT.address}
              </address>
              <p className="text-xs leading-[18px] tracking-[0.08em] text-text-secondary uppercase">
                {FOOTER_CONTENT.tagline}
              </p>
            </div>
          </div>

          <section
            data-footer-section="newsletter"
            aria-labelledby="footer-newsletter-heading"
            className={cn(
              FOOTER_STYLES.mobileDivider,
              "order-2 xl:relative xl:order-4 xl:before:absolute xl:before:top-0 xl:before:-left-[37.5px] xl:before:h-[276px] xl:before:w-px xl:before:bg-soft-stone",
            )}
          >
            <h2
              id="footer-newsletter-heading"
              className={cn(
                ebGaramond.className,
                FOOTER_STYLES.heading,
                "text-[28px] leading-[34px] font-normal xl:text-[32px] xl:leading-[38px]",
              )}
            >
              {FOOTER_CONTENT.newsletter.heading}
            </h2>
            <p className="mt-4 text-sm leading-[21px] text-text-secondary xl:mt-6">
              {FOOTER_CONTENT.newsletter.description}
            </p>
            <div
              data-footer-newsletter-controls
              className="mt-4 flex flex-col gap-3 xl:mt-6 xl:flex-row xl:items-end"
            >
              <label htmlFor="footer-newsletter-email" className="sr-only">
                {FOOTER_CONTENT.newsletter.emailLabel}
              </label>
              <input
                id="footer-newsletter-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder={FOOTER_CONTENT.newsletter.emailLabel}
                aria-describedby="footer-newsletter-status"
                className="h-[30px] min-w-0 rounded-none border-b border-border-interactive bg-transparent text-sm leading-[21px] text-ink placeholder:text-text-secondary focus-visible:shadow-[0_2px_0_var(--peploe-burgundy)] focus-visible:outline-none forced-colors:focus-visible:outline-2 forced-colors:focus-visible:outline-offset-2 forced-colors:focus-visible:outline-solid xl:h-11 xl:flex-1"
              />
              <Button
                type="button"
                variant="brand-primary"
                aria-disabled="true"
                aria-describedby="footer-newsletter-status"
                className="h-11 gap-2 rounded-[4px] bg-peploe-burgundy px-5 text-base leading-[22px] font-medium text-warm-cream shadow-none has-[>svg]:px-5"
              >
                {FOOTER_CONTENT.newsletter.submitLabel}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Button>
            </div>
            <p id="footer-newsletter-status" className="sr-only">
              {FOOTER_CONTENT.newsletter.status}
            </p>
          </section>

          <nav
            data-footer-section="explore"
            aria-labelledby="footer-explore-heading"
            className="hidden xl:relative xl:order-2 xl:block xl:before:absolute xl:before:top-0 xl:before:-left-[37.5px] xl:before:h-[276px] xl:before:w-px xl:before:bg-soft-stone"
          >
            <h2
              id="footer-explore-heading"
              className={cn(ebGaramond.className, FOOTER_STYLES.heading)}
            >
              {FOOTER_CONTENT.exploreHeading}
            </h2>
            <ul className="mt-4 xl:mt-6 xl:space-y-[10px]">
              {FOOTER_CONTENT.exploreLinks.map(({ label, href }) => (
                <li
                  key={label}
                  className="border-b border-soft-stone xl:border-0"
                >
                  <Button
                    asChild={Boolean(href)}
                    type={href ? undefined : "button"}
                    variant="brand-nav"
                    aria-disabled={href ? undefined : true}
                    className="flex h-12 w-full justify-between rounded-none p-0 text-sm leading-[21px] font-normal text-ink has-[>svg]:px-0 xl:h-auto xl:justify-start"
                  >
                    {href ? (
                      <Link href={href}>
                        {label}
                        <ChevronRight
                          aria-hidden="true"
                          className="size-4 text-peploe-burgundy xl:hidden"
                        />
                      </Link>
                    ) : (
                      <>
                        {label}
                        <ChevronRight
                          aria-hidden="true"
                          className="size-4 text-peploe-burgundy xl:hidden"
                        />
                      </>
                    )}
                  </Button>
                </li>
              ))}
            </ul>
          </nav>

          <MobileFooterNavigation />

          <section
            data-footer-section="contact"
            aria-labelledby="footer-contact-heading"
            className={cn(
              FOOTER_STYLES.mobileDivider,
              "order-4 xl:relative xl:order-3 xl:before:absolute xl:before:top-0 xl:before:-left-[37.5px] xl:before:h-[276px] xl:before:w-px xl:before:bg-soft-stone",
            )}
          >
            <h2
              id="footer-contact-heading"
              className={cn(ebGaramond.className, FOOTER_STYLES.heading)}
            >
              <span data-footer-mobile-contact-label className="xl:hidden">
                {MOBILE_FOOTER_CONTENT.contactHeading}
              </span>
              <span data-footer-contact-label className="hidden xl:inline">
                {FOOTER_CONTENT.contactHeading}
              </span>
            </h2>
            <div className="mt-4 flex flex-col gap-4 xl:mt-6">
              <a
                href={`tel:${RESTAURANT_CONTACT.phone}`}
                className={cn(FOCUS_RING, FOOTER_STYLES.contactLink)}
              >
                <Phone aria-hidden="true" className="size-4 shrink-0" />
                {RESTAURANT_CONTACT.phoneLabel}
              </a>
              <a
                href={`mailto:${RESTAURANT_CONTACT.email}`}
                className={cn(FOCUS_RING, FOOTER_STYLES.contactLink)}
              >
                <Mail aria-hidden="true" className="size-4 shrink-0" />
                {RESTAURANT_CONTACT.email}
              </a>
            </div>
            <div className="mt-4 xl:relative xl:mt-6 xl:pt-[25px] xl:before:absolute xl:before:inset-x-0 xl:before:top-0 xl:before:h-px xl:before:bg-soft-stone">
              <h3 className="flex items-center gap-2 text-sm leading-5 font-medium xl:leading-[21px]">
                <Clock3 aria-hidden="true" className="size-4 shrink-0" />
                {FOOTER_CONTENT.openingHoursHeading}
              </h3>
              <dl className="mt-2.5 space-y-1.5 text-sm leading-[21px] text-text-secondary xl:mt-3 xl:space-y-2">
                {FOOTER_CONTENT.openingHours.map(({ days, hours }) => (
                  <div key={days} className="flex justify-between gap-3">
                    <dt>{days}</dt>
                    <dd className="shrink-0">{hours}</dd>
                  </div>
                ))}
              </dl>
              <Button
                data-footer-homepage-extra
                asChild
                variant="brand-text"
                className="mt-2.5 flex h-[18px] justify-start rounded-none p-0 has-[>svg]:px-0 text-[13px] leading-[18px] text-peploe-burgundy xl:hidden"
              >
                <Link href={`${ROUTES.VISIT_CONTACT}#opening-hours`}>
                  {MOBILE_FOOTER_CONTENT.openingTimesLabel}
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </Button>
            </div>
            <div
              data-footer-homepage-extra
              className="mt-4 flex flex-col items-start gap-1.5 xl:hidden"
            >
              <Button
                asChild
                variant="brand-contact"
                className="h-11 gap-2 rounded-[4px] border-peploe-burgundy/25 bg-transparent pr-5 pl-4 has-[>svg]:pr-5 has-[>svg]:pl-4 text-[15px] leading-[22px] text-peploe-burgundy"
              >
                <Link href={`${ROUTES.VISIT_CONTACT}#find-us`}>
                  <MapPin aria-hidden="true" className="size-4" />
                  {MOBILE_FOOTER_CONTENT.locationLabel}
                </Link>
              </Button>
              <Button
                asChild
                variant="brand-text"
                className="h-[18px] rounded-none p-0 has-[>svg]:px-0 text-[13px] leading-[18px] text-peploe-burgundy"
              >
                <Link href={`${ROUTES.VISIT_CONTACT}#find-us`}>
                  {MOBILE_FOOTER_CONTENT.directionsLabel}
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </Button>
            </div>
          </section>
        </div>

        <FooterMeta />
      </div>
    </FooterFrame>
  );
}
