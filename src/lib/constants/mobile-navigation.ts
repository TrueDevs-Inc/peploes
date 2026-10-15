import {
  NAVBAR_CONTENT,
  RESTAURANT_CONTACT,
  RESTAURANT_OPENING_HOURS,
  ROUTES,
} from "@/lib/constants";
import { GROUPS_SHELF_CONTENT } from "@/lib/constants/groups-shelf";
import { MENUS_CONTENT } from "@/lib/constants/menus";
import type { IMobileNavigationContent } from "@/lib/types";

export const MOBILE_NAVIGATION_CONTENT = {
  openLabel: "Open menu",
  closeLabel: "Close menu",
  title: "Navigation menu",
  navigationLabel: "Mobile navigation",
  items: [
    {
      id: "menus",
      label: NAVBAR_CONTENT.menusLabel,
      children: MENUS_CONTENT.categories.map(({ label, href }) => ({
        label,
        href,
      })),
    },
    {
      id: "our-story",
      label: NAVBAR_CONTENT.ourStoryLabel,
      href: ROUTES.OUR_STORY,
    },
    {
      id: "groups-occasions",
      label: NAVBAR_CONTENT.groupsLabel,
      href: ROUTES.PRIVATE_DINING,
      children: GROUPS_SHELF_CONTENT.destinations.map(({ label, href }) => ({
        label,
        href,
      })),
    },
    {
      id: "whats-on",
      label: NAVBAR_CONTENT.whatsOnLabel,
      href: ROUTES.WHATS_ON,
    },
    {
      id: "visit-contact",
      label: NAVBAR_CONTENT.visitContactLabel,
      href: ROUTES.VISIT_CONTACT,
    },
  ],
  giftVouchersLabel: "Gift Vouchers",
  openingHoursHeading: "Opening Hours",
  openingHours: RESTAURANT_OPENING_HOURS,
  address: "16 St Stephen’s Green, Dublin 2",
  phoneAction: {
    href: `tel:${RESTAURANT_CONTACT.phone}`,
    label: RESTAURANT_CONTACT.phoneLabel,
  },
  emailAction: {
    href: `mailto:${RESTAURANT_CONTACT.email}`,
    label: RESTAURANT_CONTACT.email,
  },
  brandPhrase: "People make Peploe’s.",
} as const satisfies IMobileNavigationContent;
