import type {
  IPrivateDiningFeature,
  IPrivateDiningPageContent,
} from "@/lib/types";

export const CORPORATE_EVENTS = {
  title: "Corporate Events & Exclusive Hire",
  seoDescription:
    "Host client lunches, team dinners and company celebrations at Peploe’s on St Stephen’s Green, with partial and exclusive restaurant hire.",
  hero: {
    eyebrow: "Corporate events & exclusive hire",
    heading: "An exceptional setting for\nbusiness and celebration.",
    description:
      "From client lunches and team dinners to company celebrations and private events, Peploe’s offers a stylish and welcoming setting in the heart of Dublin.",
    image: {
      src: "/peploes-events-corporate-table.webp",
      alt: "A long table set for a private event at Peploe’s.",
    },
    action: "Enquire About Your Event",
  },
  enquiry: {
    eyebrow: "Let’s talk",
    heading: "We’d be delighted\nto discuss your event.",
    description:
      "All corporate events and exclusive hire enquiries are handled directly by our team. Tell us a little about your plans and we’ll be in touch.",
    formEyebrow: "Plan your event",
    occasionLabel: "Event type",
    occasions: [
      "Client lunch",
      "Team dinner",
      "Company celebration",
      "Launch or private event",
      "Exclusive hire",
      "Other",
    ],
    messageLabel: "Tell us about your event",
    company: true,
    consent: true,
    contacts: true,
  },
  closing: {
    heading: "From business\nto celebration.",
    description:
      "A central Dublin setting for lunches, dinners, launches and private occasions.",
    image: {
      src: "/peploes-events-st-stephens-green.webp",
      alt: "A historic view of St Stephen’s Green, its gardens and surrounding Dublin buildings.",
    },
  },
} as const satisfies IPrivateDiningPageContent;

export const CORPORATE_OCCASIONS = {
  eyebrow: "Corporate events",
  heading: "Business feels different around a great table.",
  description:
    "Whether you’re hosting clients, bringing your team together or marking a company milestone, our restaurant provides a refined and relaxed environment, with exceptional food, wine and service.",
  items: [
    {
      _key: "clients",
      heading: "Client lunches",
      description:
        "A polished setting for hosting clients over good food and wine.",
    },
    {
      _key: "team",
      heading: "Team dinners",
      description:
        "Bring your team together in a relaxed setting away from the office.",
    },
    {
      _key: "company",
      heading: "Company celebrations",
      description:
        "Mark milestones and successes with exceptional food, wine and hospitality.",
    },
    {
      _key: "launches",
      heading: "Launches & Private events",
      description:
        "From product launches to private functions and larger corporate occasions.",
    },
  ],
};

export const CORPORATE_HIRE = {
  eyebrow: "Exclusive hire",
  heading: "A restaurant to call your own.",
  description:
    "For larger events, Peploe’s is available for partial or exclusive hire. Whether it’s a company celebration, private dining experience or a special event, our team will work with you to create an occasion that feels right for your guests.",
  note: "Exclusive hire fees may apply depending on the date, time and requirements of the event.",
  image: {
    src: "/peploes-events-cellar-room.webp",
    alt: "The collection of wines in Peploe’s cellar.",
  },
};

export const CORPORATE_CAPACITY = {
  eyebrow: "Capacity & layout",
  heading: "A flexible space for your event.",
  items: [
    {
      _key: "seated",
      figure: "80",
      label: "seated",
      description: "in the restaurant",
      illustration: "/peploes-events-seating-light.svg",
    },
    {
      _key: "reception",
      figure: "~100",
      label: "seated + standing",
      description: "for receptions",
      illustration: "/peploes-events-standing.svg",
    },
    {
      _key: "spaces",
      figure: "Restaurant\n+ bar + terrace",
      description: "can be hired exclusively",
      illustration: "/peploes-events-restaurant-light.svg",
    },
    {
      _key: "dates",
      figure: "January – October",
      label: "Best availability for exclusive events.",
      description:
        "Limited availability in November & December. Sunday opening can also be arranged for events.",
      illustration: "/peploes-events-dates.svg",
    },
  ],
};

export const CORPORATE_SPACES = [
  {
    _key: "reception",
    title: "Drinks reception",
    description: "Bar and terrace for welcoming guests.",
    image: {
      src: "/peploes-events-bar.webp",
      alt: "The bar at Peploe’s.",
      unoptimized: true,
    },
  },
  {
    _key: "dining",
    title: "Dining room",
    description: "Elegant setting for seated lunches and dinners.",
    image: {
      src: "/peploes-events-dining-room.webp",
      alt: "Peploe’s dining room and its painted wall mural.",
      unoptimized: true,
    },
  },
  {
    _key: "terrace",
    title: "Terrace",
    description: "A relaxed space for pre or post-dinner drinks.",
    image: {
      src: "/peploes-events-terrace.webp",
      alt: "The sheltered outdoor terrace at Peploe’s.",
      unoptimized: false,
    },
  },
] as const;

export const CORPORATE_MENUS = {
  eyebrow: "Food & drink",
  heading: "Made around the occasion.",
  paragraphs: [
    "Our Group Set Lunch and Group Set Dinner menus are available for corporate dining, while larger events and exclusive hire can be tailored around the occasion.",
    "From bespoke menus and wine selections to drinks receptions, canapés and additional touches, our team can help shape the food and drink experience to suit your event.",
  ],
};

export const CORPORATE_LOCATION = {
  eyebrow: "Location matters",
  heading: "In the heart of Dublin.",
  items: [
    {
      _key: "location",
      heading: "St Stephen’s Green",
      description: "A central Dublin location,\nright on the doorstep.",
      illustration: "/peploes-events-location.svg",
    },
    {
      _key: "transport",
      heading: "Excellent transport links",
      description: "Luas nearby and DART\nwithin easy reach.",
      illustration: "/peploes-events-bus.svg",
    },
    {
      _key: "taxi",
      heading: "Taxi rank nearby",
      description: "A convenient pick-up\nand drop-off point.",
      illustration: "/peploes-events-taxi.svg",
    },
    {
      _key: "access",
      heading: "Wheelchair accessible",
      description: "Please speak to our team\nfor any specific requirements.",
      illustration: "/peploes-events-accessible.svg",
    },
  ] satisfies readonly IPrivateDiningFeature[],
};
