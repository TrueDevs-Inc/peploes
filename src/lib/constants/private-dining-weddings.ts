import type { IPrivateDiningPageContent } from "@/lib/types";

export const WEDDINGS = {
  title: "Weddings at Peploe’s",
  seoDescription:
    "Celebrate an intimate Dublin wedding at Peploe’s, with exclusive restaurant hire, seasonal menus, wine tasting and thoughtful finishing touches.",
  hero: {
    eyebrow: "Weddings at Peploe’s",
    heading: "A day to remember, in a\nsetting like no other.",
    description:
      "An intimate and elegant setting in the heart of Dublin for your wedding celebration, with exceptional food, wine and warm hospitality.",
    image: {
      src: "/peploes-events-wedding-toast.webp",
      alt: "White flowers and candlelight on a wedding table.",
    },
    action: "Enquire About Your Wedding",
  },
  enquiry: {
    eyebrow: "Let’s talk",
    heading: "We’d love to hear\nabout your plans.",
    description:
      "All wedding enquiries are handled directly by our team. Tell us a little about your day and we’ll be in touch.",
    formEyebrow: "Plan your wedding",
    messageLabel: "Tell us about your wedding",
    consent: true,
    contacts: true,
  },
  closing: {
    heading: "A day entirely your own.",
    description:
      "An intimate celebration in the heart of Dublin, shaped around you from the first toast to the last dance.",
    image: { src: "/peploes-events-terrace.webp", alt: "" },
  },
} as const satisfies IPrivateDiningPageContent;

export const WEDDING_DAY = {
  eyebrow: "Your day at Peploe’s",
  heading: "From your first toast to the last dance.",
  description:
    "We’ll work with you to create a wedding day that feels entirely yours. Relaxed, stylish and unforgettable, with exceptional food, wine and a setting that brings everything together.",
  items: [
    {
      _key: "arrive",
      heading: "Arrive",
      description: "Champagne and\nwelcome drinks in\nthe bar and terrace.",
    },
    {
      _key: "gather",
      heading: "Gather",
      description: "Canapés, drinks\nand welcome\nwords.",
    },
    {
      _key: "dine",
      heading: "Dine",
      description:
        "Up to approximately 80\nguests seated together\nfor your wedding meal.",
    },
    {
      _key: "celebrate",
      heading: "Celebrate",
      description: "Drinks, music and\nthe evening celebration\ncontinues.",
    },
  ],
};

export const WEDDING_HIRE = {
  eyebrow: "Entirely yours",
  heading: "Exclusive use for\nyour special day.",
  description:
    "Peploe’s can be hired exclusively for your wedding, giving you and your guests use of the restaurant, bar and terrace. Sunday weddings can also be arranged.",
  image: {
    src: "/peploes-events-wedding-place-setting.webp",
    alt: "Red flowers and candlelight throughout Peploe’s dining room.",
  },
};

export const WEDDING_DETAILS = {
  eyebrow: "Made around you",
  heading: "The details that make it yours.",
  description:
    "Your wedding at Peploe’s is shaped around you, from the menu and wine to the finishing touches.",
  featured: {
    eyebrow: "Featured",
    heading: "Menu & wine tasting",
    description:
      "A menu and wine tasting is included ahead of the wedding to finalise your choices with our team. Menus and wine selections are tailored to each couple, using the best seasonal ingredients and Peploe’s favourite pairings.",
    image: {
      src: "/peploes-events-wedding-tasting.webp",
      alt: "A chef finishing a dish in the Peploe’s kitchen.",
    },
  },
  items: [
    {
      _key: "flowers",
      heading: "Flowers",
      description:
        "We can work with your florist to arrange particular flowers or a style that feels right for your day.",
    },
    {
      _key: "cakes",
      heading: "Celebration cakes",
      description:
        "Our pastry team can create a cake tailored to your preferences with sufficient notice. You’re also welcome to arrange your own.",
    },
    {
      _key: "music",
      heading: "Live music",
      description:
        "Live music can be accommodated for exclusive weddings, subject to arrangements being agreed with our team.",
    },
    {
      _key: "food",
      heading: "Canapés & drinks",
      description:
        "From Champagne and cocktails to canapés and additional wines, the details can be tailored around your celebration.",
    },
  ],
};
