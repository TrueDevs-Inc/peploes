import {
  NAVBAR_CONTENT,
  RESTAURANT_ADDRESS,
  RESTAURANT_OPENING_HOURS,
  ROUTES,
} from "@/lib/constants";
import type { IFooterContent } from "@/lib/types";

export const FOOTER_CREDIT = {
  prefix: "Made with care by",
  brandEmphasis: "True",
  brandSuffix: "Devs",
  href: "https://truedevs.tech/?utm_source=peploes&utm_medium=referral&utm_campaign=client_credit&utm_content=footer",
} as const;

export const FOOTER_CONTENT: IFooterContent = {
  homeLabel: "Peploe’s home",
  address: `${RESTAURANT_ADDRESS.streetAddress}, ${RESTAURANT_ADDRESS.locality}`,
  tagline: "A Dublin Restaurant",
  contactHeading: "Contact",
  openingHoursHeading: "Opening Hours",
  openingHours: RESTAURANT_OPENING_HOURS,
  exploreHeading: "Explore",
  exploreLinks: [
    { label: "Menus", href: ROUTES.MENUS },
    { label: "Our Story", href: ROUTES.OUR_STORY },
    { label: NAVBAR_CONTENT.groupsLabel, href: ROUTES.PRIVATE_DINING },
    { label: "What’s On", href: ROUTES.WHATS_ON },
    { label: "The Journal", href: ROUTES.JOURNAL },
    {
      label: "Visit & Contact",
      href: ROUTES.VISIT_CONTACT,
    },
  ],
  newsletter: {
    heading: "A Letter from Gina",
    description:
      "Seasonal notes from St Stephen's Green — food, wine, people and what's happening at Peploe's.",
    emailLabel: "Your email address",
    submitLabel: "Subscribe",
    loadingLabel: "Loading signup…",
    pendingLabel: "Sending…",
    unknownError:
      "We could not confirm your signup request. Please check your inbox before trying again.",
    status: "Thanks for signing up.",
    unavailableError:
      "Newsletter signup is temporarily unavailable. Please try again later.",
    rateLimitError: "Too many signup requests. Please try again later.",
    deliveryError:
      "We could not send your signup request. Please try again later.",
    requiredError: "Please enter your email address.",
    invalidError: "Please enter a valid email address, such as name@gmail.com.",
  },
  copyright: "© 2026 Peploe’s",
  legalNavigationLabel: "Legal and accessibility",
  legalLabels: [
    {
      label: "Privacy Policy",
      shortLabel: "Privacy",
      href: ROUTES.PRIVACY_POLICY,
    },
    { label: "Terms", href: ROUTES.TERMS_CONDITIONS },
    { label: "Accessibility", href: ROUTES.ACCESSIBILITY_POLICY },
    {
      label: "Booking & Cancellation",
      shortLabel: "Booking",
      href: ROUTES.BOOKING_CANCELLATION_TERMS,
    },
  ],
  instagramHref: "https://www.instagram.com/peploesstephensgreen/",
  instagramLabel: "Peploe’s on Instagram",
  facebookHref: "https://www.facebook.com/Peploes",
  facebookLabel: "Peploe’s on Facebook",
};

export const FOOTER_STYLES = {
  heading:
    "text-[22px] leading-7 font-medium text-ink after:mt-1 after:block after:h-0.5 after:w-8 after:bg-peploe-burgundy xl:text-2xl xl:leading-[30px] xl:after:-mb-px",
  contactLink:
    "flex min-h-11 w-fit items-center gap-2 rounded-[4px] border border-peploe-burgundy/25 py-2.5 pr-5 pl-4 text-[15px] leading-[22px] font-medium text-peploe-burgundy underline-offset-4 hover:underline focus-visible:ring-peploe-burgundy focus-visible:ring-offset-warm-cream xl:min-h-0 xl:rounded-sm xl:border-0 xl:p-0 xl:text-base",
  mobileDivider:
    "relative after:absolute after:inset-x-0 after:-bottom-10 after:h-px after:bg-soft-stone xl:after:hidden",
} as const;

export const MOBILE_FOOTER_CONTENT = {
  contactHeading: "Find Us & Get in Touch",
  locationLabel: RESTAURANT_ADDRESS.streetAddress,
  navigation: [
    {
      heading: FOOTER_CONTENT.exploreHeading,
      links: FOOTER_CONTENT.exploreLinks,
    },
  ],
} as const;
