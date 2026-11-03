import {
  ArrowRight,
  Clock3,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import Link from "next/link";
import {
  TrackedAnchor,
  TrackedLink,
} from "@/components/app/atoms/tracked-link";
import { FooterMeta } from "@/components/app/compounds/footer-meta";
import { MobileFooterNavigation } from "@/components/app/compounds/mobile-footer-navigation";
import { NewsletterSignup } from "@/components/app/molecules/newsletter-signup";
import { Button } from "@/components/ui/button";
import { FOCUS_RING, RESTAURANT_CONTACT, ROUTES } from "@/lib/constants";
import {
  FOOTER_CONTENT,
  FOOTER_STYLES,
  MOBILE_FOOTER_CONTENT,
} from "@/lib/constants/footer";
import { GA4Event } from "@/lib/enums";
import { dmSans, ebGaramond } from "@/lib/fonts";
import { cn } from "@/lib/utils";

export function Footer() {
  return (
    <footer
      className={cn(
        dmSans.className,
        "border-t border-soft-stone bg-warm-cream text-ink",
      )}
    >
      <div
        data-footer-container
        className="site-container-inset pt-8 pb-[clamp(12px,1.125vw,13.5px)] xl:pt-20"
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
            <NewsletterSignup />
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
                      <Link href={href} prefetch={true}>
                        {label}
                        <ArrowRight
                          aria-hidden="true"
                          className="size-4 text-peploe-burgundy xl:hidden"
                        />
                      </Link>
                    ) : (
                      <>
                        {label}
                        <ArrowRight
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
              <TrackedAnchor
                interaction={{
                  event: GA4Event.ContactClick,
                  placement: "footer",
                  destination: "phone",
                }}
                href={`tel:${RESTAURANT_CONTACT.phone}`}
                className={cn(FOCUS_RING, FOOTER_STYLES.contactLink)}
              >
                <Phone aria-hidden="true" className="size-4 shrink-0" />
                {RESTAURANT_CONTACT.phoneLabel}
              </TrackedAnchor>
              <TrackedAnchor
                interaction={{
                  event: GA4Event.ContactClick,
                  placement: "footer",
                  destination: "email",
                }}
                href={`mailto:${RESTAURANT_CONTACT.email}`}
                className={cn(FOCUS_RING, FOOTER_STYLES.contactLink)}
              >
                <Mail aria-hidden="true" className="size-4 shrink-0" />
                {RESTAURANT_CONTACT.email}
              </TrackedAnchor>
            </div>
            <div
              data-footer-social
              className="mt-4 flex items-center gap-0 xl:mt-6"
            >
              <Button
                asChild
                variant="brand-nav"
                aria-label={FOOTER_CONTENT.instagramLabel}
                className="size-11 justify-start p-0 text-ink has-[>svg]:px-0"
              >
                <a
                  href={FOOTER_CONTENT.instagramHref}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Instagram
                    aria-hidden="true"
                    className="size-7"
                    strokeWidth={1.75}
                  />
                </a>
              </Button>
              <Button
                asChild
                variant="brand-nav"
                aria-label={FOOTER_CONTENT.facebookLabel}
                className="size-11 justify-start p-0 text-ink has-[>svg]:px-0"
              >
                <a
                  href={FOOTER_CONTENT.facebookHref}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Facebook
                    aria-hidden="true"
                    className="size-7"
                    strokeWidth={1.75}
                  />
                </a>
              </Button>
            </div>
            <div className="mt-6 xl:relative xl:pt-[25px] xl:before:absolute xl:before:inset-x-0 xl:before:top-0 xl:before:h-px xl:before:bg-soft-stone">
              <h3 className="flex items-center gap-2 text-sm leading-5 font-medium xl:leading-[21px]">
                <Clock3 aria-hidden="true" className="size-4 shrink-0" />
                {FOOTER_CONTENT.openingHoursHeading}
              </h3>
              <dl className="mt-4 space-y-3 text-sm leading-[21px] text-text-secondary xl:mt-3 xl:space-y-2">
                {FOOTER_CONTENT.openingHours.map(({ days, hours }) => (
                  <div key={days} className="flex justify-between gap-3">
                    <dt>{days}</dt>
                    <dd className="shrink-0">{hours}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div
              data-footer-homepage-extra
              className="mt-6 flex flex-col items-start xl:hidden"
            >
              <Button asChild variant="brand-contact" size="cta">
                <TrackedLink
                  href={`${ROUTES.VISIT_CONTACT}#find-us`}
                  interaction={{
                    event: GA4Event.DirectionsClick,
                    placement: "footer",
                  }}
                >
                  <MapPin aria-hidden="true" className="size-4" />
                  {MOBILE_FOOTER_CONTENT.locationLabel}
                </TrackedLink>
              </Button>
            </div>
          </section>
        </div>

        <FooterMeta />
      </div>
    </footer>
  );
}
