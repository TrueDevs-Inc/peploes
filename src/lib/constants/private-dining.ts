import { ROUTES } from "@/lib/constants";
import type {
  IPrivateDiningFeature,
  IPrivateDiningPageContent,
} from "@/lib/types";

export const PRIVATE_DINING = {
  title: "Private Dining & Events",
  seoDescription:
    "Gather at Peploe’s for celebrations, corporate events and intimate Dublin weddings, with group menus and a dedicated events team.",
  hero: {
    eyebrow: "Private Dining & Events",
    heading: "Life tastes\nbetter together.",
    description:
      "From long lunches and family celebrations to business dinners and intimate city weddings, Peploe’s offers a warm setting for bringing people together in the heart of Dublin.",
    image: {
      src: "/peploes-private-dining-hero.webp",
      alt: "A table by the window in Peploe’s dining room.",
    },
  },
  enquiry: {
    eyebrow: "Plan your gathering",
    heading: "Tell us what you’re planning.",
    description:
      "Whether it’s a special celebration, a corporate event or a wedding, our team will be happy to help with availability, menus and all the details to make your occasion feel just right.",
    occasionLabel: "Occasion type",
    occasions: [
      "Groups & Celebrations",
      "Corporate Event",
      "Exclusive Hire",
      "Wedding",
      "Other",
    ],
    messageLabel: "Tell us about your gathering",
  },
  closing: {
    heading: "Good food brings\npeople together.",
    description:
      "Let our team help you create an occasion to remember at Peploe’s.",
    image: {
      src: "/peploes-private-dining-table.webp",
      alt: "Wine and seasonal dishes on a table with red flowers.",
    },
    contacts: true,
  },
} as const satisfies IPrivateDiningPageContent;

export const PRIVATE_DINING_GATHERINGS = {
  eyebrow: "Three ways to gather",
  heading: "Every occasion has a place at our table.",
  action: "Find out more",
  items: [
    {
      _key: "celebrations",
      title: "Celebrations & Gatherings",
      mobileTitle: "Groups & Celebrations",
      description:
        "Birthdays, anniversaries, family gatherings, long lunches and special occasions. Perfect for bringing people together.",
      image: {
        src: "/peploes-private-dining-celebrations.webp",
        alt: "The Peploe’s bar team preparing drinks.",
      },
      href: ROUTES.CELEBRATIONS,
    },
    {
      _key: "corporate",
      title: "Corporate Events &\nExclusive Hire",
      mobileTitle: "Corporate Events & Exclusive Hire",
      description:
        "Client lunches, team dinners, company celebrations and private events, with partial or exclusive hire available.",
      image: {
        src: "/peploes-private-dining-service.webp",
        alt: "A waiter welcoming guests in the restaurant.",
      },
      href: ROUTES.CORPORATE_EVENTS,
    },
    {
      _key: "weddings",
      title: "Weddings",
      description:
        "Intimate city weddings in the heart of Dublin, centred on exceptional food, wine and a setting full of character.",
      image: {
        src: "/peploes-private-dining-feast.webp",
        alt: "A celebratory roast with flowers and candlelight.",
      },
      href: ROUTES.WEDDINGS,
    },
  ],
} as const;

export const PRIVATE_DINING_BENEFITS = [
  {
    _key: "dining",
    heading: "Group dining for special occasions",
    illustration: "/peploes-occasions.svg",
  },
  {
    _key: "menus",
    heading: "Bespoke menus with\nseasonal ingredients",
    illustration: "/peploes-food-wine.svg",
  },
  {
    _key: "wine",
    heading: "An exceptional selection of wine to choose from",
    illustration: "/peploes-hospitality.svg",
  },
  {
    _key: "location",
    heading: "A central Dublin location\nbeside St Stephen’s Green",
    illustration: "/peploes-events-location.svg",
  },
] as const satisfies readonly IPrivateDiningFeature[];

export const PRIVATE_DINING_MENUS = {
  eyebrow: "Group set menus",
  heading: "Thoughtfully created\nfor sharing.",
  description:
    "Our group set menus are designed for relaxed and memorable dining, with seasonal dishes and Peploe’s favourites, available for lunch and dinner.",
  eligibility: "For groups of more than 10 guests.",
  action: "View Group Set Menus",
  illustration: "/peploes-private-dining-botanical.png",
  image: {
    src: "/peploes-private-dining-steak.webp",
    alt: "A guest enjoying steak at Peploe’s.",
  },
};

export const PRIVATE_DINING_FORM = {
  heading: "Tell us what you’re planning.",
  date: "Preferred date",
  guests: "Number of guests",
  guestCounts: Array.from({ length: 30 }, (_, index) => index + 1),
  name: "Your name",
  company: "Company",
  email: "Email address",
  consent: {
    beforePolicy: "I agree to the ",
    policy: "privacy policy",
    afterPolicy: " for enquiries.",
  },
  submit: "Send Enquiry",
  unavailable:
    "Online enquiries are not available yet. Please call or email our team.",
  emailAction: "Email Reception",
};

export const PRIVATE_DINING_MENU_LINKS = [
  {
    title: "Group Set Lunch",
    label: "View Lunch Menu",
    href: `${ROUTES.GROUP_SET_MENU}#group-set-lunch`,
  },
  {
    title: "Group Set Dinner",
    label: "View Dinner Menu",
    href: `${ROUTES.GROUP_SET_MENU}#group-set-dinner`,
  },
] as const;

export const PRIVATE_DINING_MENU_IMAGE = {
  src: "/peploes-events-set-menu.webp",
  alt: "A group set menu and wine glasses laid out for dinner.",
};
