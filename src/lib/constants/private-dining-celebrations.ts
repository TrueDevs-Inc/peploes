import type {
  IPrivateDiningFeature,
  IPrivateDiningPageContent,
} from "@/lib/types";

export const CELEBRATIONS = {
  title: "Groups & Celebrations",
  seoDescription:
    "Plan a birthday, anniversary, family gathering or celebration at Peploe’s in Dublin, with seasonal group menus and thoughtful personal touches.",
  hero: {
    eyebrow: "Celebrations & gatherings",
    heading: "A table worth\ngathering around.",
    description:
      "From milestone birthdays and family celebrations to long lunches with friends, Peploe’s is a warm Dublin setting for bringing people together.",
    image: {
      src: "/peploes-events-gathering.webp",
      alt: "Guests gathered around tables in Peploe’s bustling dining room.",
    },
    action: "Plan Your Celebration",
  },
  enquiry: {
    eyebrow: "Let’s talk",
    heading: "We like to talk\nthings through.",
    description:
      "All group bookings are handled directly by our team rather than through the standard online booking system.",
    formEyebrow: "Plan your celebration",
    occasionLabel: "Celebration type",
    occasions: [
      "Birthday",
      "Anniversary",
      "Family occasion",
      "Gathering with friends",
      "Wedding celebration",
      "Seasonal gathering",
      "Other",
    ],
    messageLabel: "Tell us about your celebration",
    consent: true,
    contacts: true,
  },
  closing: {
    heading: "Some occasions deserve a little more time\naround the table.",
    description:
      "From birthdays and anniversaries to long lunches with family and friends, Peploe’s is made for gathering.",
    image: { src: "/peploes-events-gathering.webp", alt: "" },
  },
} as const satisfies IPrivateDiningPageContent;

export const CELEBRATION_OCCASIONS = {
  eyebrow: "Every reason to gather",
  heading: "Some occasions are planned. Others simply deserve a good table.",
  items: [
    {
      _key: "milestones",
      heading: "Milestones",
      illustration: "/peploes-events-milestones.svg",
      items: [
        "Birthdays",
        "Milestone birthdays",
        "Anniversaries",
        "Graduations",
        "Retirement celebrations",
      ],
    },
    {
      _key: "family",
      heading: "Family occasions",
      illustration: "/peploes-events-family.svg",
      items: [
        "Christenings",
        "Communions",
        "Confirmations",
        "Baby celebrations",
        "Family gatherings",
      ],
    },
    {
      _key: "friends",
      heading: "Gatherings with friends",
      illustration: "/peploes-events-friends.svg",
      items: ["Long lunches", "Group dinners", "Reunions", "Leaving parties"],
    },
    {
      _key: "weddings",
      heading: "Around the wedding",
      illustration: "/peploes-events-rings.svg",
      items: [
        "Engagement celebrations",
        "Pre-wedding celebrations",
        "Post-wedding lunches and dinners",
        "Hen lunches and dinners",
      ],
    },
    {
      _key: "seasonal",
      heading: "Seasonal & personal occasions",
      illustration: "/peploes-events-candle.svg",
      items: [
        "Christmas gatherings",
        "Family Christmas celebrations",
        "Memorial gatherings\nand family occasions",
      ],
    },
  ] satisfies readonly IPrivateDiningFeature[],
};

export const CELEBRATION_DETAILS = {
  eyebrow: "Made personal",
  heading: "The little things matter.",
  description:
    "From celebration cakes and fresh flowers to table decorations, our team can help with the details to make your occasion feel personal.",
  items: [
    {
      _key: "cakes",
      heading: "Celebration cakes",
      description:
        "Made in-house by our pastry team with a minimum of two weeks’ notice and tailored to your preferences.",
    },
    {
      _key: "flowers",
      heading: "Flowers",
      description:
        "Fresh flowers arrive weekly, and specific flowers or a particular table arrangement can be discussed with the team.",
    },
  ],
};

export const CELEBRATION_MENUS = {
  eyebrow: "Group dining",
  heading: "Menus made for gathering.",
  paragraphs: [
    "Groups of more than 10 guests dine from our group menus, designed around seasonal dishes and Peploe’s favourites.",
  ],
};

export const CELEBRATION_PLANNING = {
  eyebrow: "Good to know",
  heading: "Planning a larger gathering?",
  items: [
    {
      _key: "groups",
      heading: "Groups throughout the restaurant",
      description:
        "Seating is arranged according to group size and availability.",
      illustration: "/peploes-events-seating.svg",
    },
    {
      _key: "hire",
      heading: "Larger occasions",
      description: "Partial or exclusive hire can be discussed with the team.",
      illustration: "/peploes-events-hire.svg",
    },
    {
      _key: "deposit",
      heading: "Groups of 16+",
      description: "A deposit is required.",
      illustration: "/peploes-events-deposit.svg",
    },
  ] satisfies readonly IPrivateDiningFeature[],
};
