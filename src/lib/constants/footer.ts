import {
  NAVBAR_CONTENT,
  RESTAURANT_OPENING_HOURS,
  ROUTES,
} from "@/lib/constants";
import type { IFooterContent } from "@/lib/types";

export const FOOTER_CONTENT: IFooterContent = {
  homeLabel: "Peploe’s home",
  address: "16 St Stephen's Green, Dublin 2",
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
    { label: "The Journal" },
    { label: "Visit & Contact", href: ROUTES.VISIT_CONTACT },
    { label: "Gift Vouchers" },
  ],
  newsletter: {
    heading: "A Letter from Gina",
    description:
      "Seasonal notes from St Stephen's Green — food, wine, people and what's happening at Peploe's.",
    emailLabel: "Your email address",
    submitLabel: "Subscribe",
    status: "Newsletter signup is not available yet.",
  },
  copyright: "© 2026 Peploe’s",
  legalNavigationLabel: "Legal and accessibility",
  legalLabels: [
    { label: "Privacy" },
    { label: "Terms" },
    { label: "Cookie Preferences", shortLabel: "Cookies" },
    { label: "Accessibility" },
  ],
  instagramLabel: "Peploe’s on Instagram",
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
  openingTimesLabel: "View full opening times",
  locationLabel: "16 St Stephen's Green",
  directionsLabel: "Directions",
  navigation: [
    {
      heading: "Explore",
      links: [
        { label: "Menus", href: ROUTES.MENUS },
        { label: "Our Story", href: ROUTES.OUR_STORY },
        { label: "What's On", href: ROUTES.WHATS_ON },
        { label: "Visit & Contact", href: ROUTES.VISIT_CONTACT },
        { label: "The Journal" },
      ],
    },
    {
      heading: "Occasions",
      links: [
        { label: "Groups & Celebrations", href: ROUTES.CELEBRATIONS },
        { label: "Corporate & Exclusive Hire", href: ROUTES.CORPORATE_EVENTS },
        { label: "Weddings", href: ROUTES.WEDDINGS },
      ],
    },
    {
      heading: "Peploe's",
      links: [
        { label: "People & Produce" },
        { label: "Gift Vouchers" },
        { label: "Contact", href: ROUTES.VISIT_CONTACT },
      ],
    },
  ],
} as const;
