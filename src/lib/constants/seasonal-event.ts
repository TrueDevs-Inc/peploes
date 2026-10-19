import type { ISeasonalEventContent } from "@/lib/types";

// Approved Figma template copy; replace with event content before publishing.
export const SEASONAL_EVENT_CONTENT: ISeasonalEventContent = {
  title: "Campaign/Event Title",
  seoDescription:
    "An event page template for seasonal dining, menu highlights and experiences at Peploe’s.",
  hero: {
    eyebrow: "What’s On",
    heading: "Campaign/Event\nTitle",
    description:
      "Seasonal Irish ingredients, familiar favourites and an exceptional wine list, served in a room worth being in.A short introductory summary for this campaign page goes here. Use this area to explain the occasion, season, or event in a concise and inviting way.",
    image: {
      src: "/peploes-wine-dinner.jpg",
      alt: "Wine and a meal on a table at Peploe’s",
    },
  },
  details: [
    {
      label: "Date",
      description: "Date range\n1 November – 31 December",
      icon: { src: "/peploes-event-calendar.svg", width: 48, height: 48 },
    },
    {
      label: "Timings",
      description: "Partial or exclusive hire can be discussed with the team.",
      icon: { src: "/peploes-visit-clock.svg", width: 48, height: 48 },
    },
    {
      label: "Price",
      description: "A deposit is required.",
      icon: { src: "/peploes-events-deposit.svg", width: 48, height: 48 },
    },
    {
      label: "Menu choices",
      description: "Key information",
      icon: { src: "/peploes-events-menu.svg", width: 48, height: 48 },
    },
  ],
  menu: {
    eyebrow: "Food & Drink",
    heading: "Menu & Experience",
    description:
      "This section can be used to showcase a dedicated menu for an event or experience, or to highlight menu moments and key dishes. Use one or both modules depending on the content type.",
    cards: [
      {
        title: "Related Menu One",
        description:
          "A short description of this menu or experience goes here.",
        action: "View Menu",
        image: {
          src: "/peploes-event-seafood.jpg",
          alt: "Fresh lobster, shellfish and seasonal ingredients",
        },
      },
      {
        title: "Related Item Two",
        description:
          "A short description of this item or experience goes here.",
        action: "Find Out More",
        image: {
          src: "/peploes-event-salmon.jpg",
          alt: "A salmon dish served with seasonal vegetables",
        },
      },
    ],
  },
  story: {
    eyebrow: "Section Eyebrow",
    heading: "Section Heading",
    paragraphs: [
      {
        _key: "paragraph-7",
        text: "This is a space for a more detailed description of the campaign. You can share the story, highlight what makes it special, and give visitors a sense of what to expect.",
      },
      {
        _key: "paragraph-184",
        text: "Add a second paragraph here to include any further details, such as menus, experiences, or why it’s the perfect occasion to visit Peploe’s.",
      },
    ],
    image: {
      src: "/peploes-event-candlelit-room.jpg",
      alt: "Candlelit tables with red flowers beside the restaurant windows",
    },
  },
  gallery: {
    eyebrow: "Gallery",
    heading: "Moments at Peploe’s",
    images: [
      {
        src: "/peploes-sunday.png",
        alt: "Guests sharing a meal around a long table at Peploe’s",
      },
      {
        src: "/peploes-event-night-entrance.png",
        alt: "Peploe’s entrance and terrace lit up at night",
      },
      {
        src: "/peploes-event-christmas.jpg",
        alt: "Christmas turkey and ham with wine and festive decorations",
      },
    ],
  },
  invitation: {
    heading: "Make It Happen",
    description:
      "From St Stephen’s Green into a warmer world of food, wine and hospitality.",
    bookingAction: "Book this Experience",
    enquiryAction: "Make an Inquiry",
    image: {
      src: "/peploes-entrance-backdrop.png",
      alt: "Guests enjoying dinner in Peploe’s warmly lit dining room",
    },
  },
  related: {
    eyebrow: "More to Explore",
    cards: [
      {
        title: "Related Campaign",
        description: "A short description goes here to entice visitors.",
        action: "Find Out More",
        image: {
          src: "/peploes-event-table.jpg",
          alt: "A dining table set with white flowers at Peploe’s",
        },
      },
      {
        title: "Seasonal Highlight",
        description: "A short description goes here to entice visitors.",
        action: "Find Out More",
        image: {
          src: "/peploes-family.png",
          alt: "The Peploe’s team welcoming guests in the dining room",
        },
      },
      {
        title: "Special Event",
        description: "A short description goes here to entice visitors.",
        action: "Find Out More",
        image: {
          src: "/peploes-seasonal-hero.jpg",
          alt: "A bartender preparing cocktails at Peploe’s bar",
        },
      },
    ],
  },
};
