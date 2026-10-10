import { RESTAURANT_CONTACT } from "@/lib/constants";

export const VISIT_CONTACT_DETAILS = {
  reservation: {
    eyebrow: "Reservation assistance",
    heading: "Can’t find your preferred date?",
    description:
      "Peploe’s intentionally keeps some tables and selected dates outside the online booking system. If the date you’re looking for isn’t showing online, it does not necessarily mean the restaurant is fully booked. Please call or email our team and we’ll be happy to help.",
    bookingLabel: "Check Online Availability",
    phoneLabel: `Call ${RESTAURANT_CONTACT.phoneLabel}`,
    phoneIcon: "/peploes-visit-phone.svg",
    emailLabel: `Email ${RESTAURANT_CONTACT.email}`,
  },
  dining: {
    eyebrow: "Dining hours",
    heading: "When to join us.",
    description:
      "From a leisurely lunch to pre-theatre dining or a late dinner, Peploe’s is open throughout the week, with a warm welcome.",
    services: [
      {
        heading: "Lunch",
        hours: "12pm – 4:30pm",
        detail: "Last orders 4:45pm",
        icon: "/peploes-visit-lunch.svg",
      },
      {
        heading: "Pre-Theatre",
        hours: "5pm – 6pm",
        detail: "Monday – Friday",
        icon: "/peploes-visit-theatre.svg",
      },
      {
        heading: "Dinner",
        hours: "From 5pm until late",
        detail: "",
        icon: "/peploes-visit-dinner.svg",
      },
      {
        heading: "Bank Holidays",
        hours: "5pm until late",
        detail: "Dinner only",
        icon: "/peploes-visit-bank-holidays.svg",
      },
    ],
  },
  accessibility: {
    eyebrow: "Accessibility",
    heading: "All are welcome.",
    description:
      "Peploe’s is wheelchair accessible. If you or someone in your party has specific accessibility requirements, please let our team know when booking and we’ll be happy to assist.",
  },
  gatherings: {
    eyebrow: "Planning something larger?",
    heading: "Gather at Peploe’s.",
    description:
      "For group dining, corporate events, exclusive hire and weddings, explore our dedicated Private Dining & Events pages.",
    label: "Explore Private Dining & Events",
  },
} as const;
