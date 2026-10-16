import { ROUTES } from "@/lib/constants";
import type { IWhatsOnEvent } from "@/lib/types";

export const whatsOnEvents: readonly IWhatsOnEvent[] = [
  {
    id: "lobster-week",
    href: `${ROUTES.WHATS_ON}/lobster-season`,
    category: "Seasonal special",
    title: "Lobster Week Returns",
    description:
      "A Peploe’s favourite is back. Enjoy a specially curated menu celebrating the best of the season, with fresh Irish lobster at its heart.",
    image: {
      src: "/peploes-lobster.jpg",
      alt: "Lobster served with seasonal vegetables in the restaurant.",
    },
    ctaLabel: "Explore Lobster Week",
  },
  {
    id: "seasonal-wine-dinner",
    href: `${ROUTES.WHATS_ON}/italian-wine-dinner`,
    category: "Special event",
    title: "A Seasonal Wine Dinner",
    description:
      "An intimate evening exploring remarkable wines and seasonal dishes, hosted by our team and special guests.",
    image: {
      src: "/peploes-wine-dinner.jpg",
      alt: "Wine being poured at a table set for dinner.",
    },
    ctaLabel: "Find out more",
  },
  {
    id: "sunday-at-peploes",
    href: `${ROUTES.WHATS_ON}/sunday-at-peploes`,
    category: "At Peploe’s",
    title: "Sunday at Peploe’s",
    description:
      "Long lunches, great company and the perfect end to the week, in the heart of St Stephen’s Green.",
    image: {
      src: "/peploes-sunday.png",
      alt: "Guests sharing lunch around a long table at Peploe’s.",
    },
    ctaLabel: "See more",
    mobileCtaLabel: "Find out more",
  },
];
