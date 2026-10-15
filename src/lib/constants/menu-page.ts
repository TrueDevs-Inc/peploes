import { ROUTES } from "@/lib/constants";
import { GROUP_SET_MENU } from "@/lib/constants/group-set-menu";
import { SEASONAL_MENU } from "@/lib/constants/seasonal-menu";
import type { IMenuPageContent } from "@/lib/types";

export const MENU_PAGE_CONTENT = {
  eyebrow: "Menus",
  heading: "Food, wine and\ngood company.",
  description:
    "Seasonal Irish ingredients, familiar favourites and an exceptional wine list, served in a room worth being in.",
  image: {
    src: "/peploes-wine-dinner.jpg",
    alt: "Wine being poured at a table in Peploe’s.",
  },
  navigationLabel: "Restaurant menus",
  navigation: [
    { label: "Lunch", href: ROUTES.LUNCH },
    { label: "Dinner", href: ROUTES.DINNER },
    { label: "Pre-Theatre", href: ROUTES.PRE_THEATRE },
    { label: "Wine", href: ROUTES.WINE, compactDesktop: true },
    { label: "Cocktails", href: ROUTES.COCKTAILS, compactDesktop: true },
    {
      label: "Group Set Menu",
      href: ROUTES.GROUP_SET_MENU,
      compactDesktop: true,
      children: GROUP_SET_MENU.menus.map((menu) => ({
        label: menu.title,
        href: `${ROUTES.GROUP_SET_MENU}#${menu._key}`,
      })),
    },
    {
      label: "Seasonal",
      href: ROUTES.SEASONAL,
      compactDesktop: true,
      children: SEASONAL_MENU.menus.map((menu) => ({
        label: menu.title,
        href: `${ROUTES.SEASONAL}#${menu._key}`,
      })),
    },
  ],
  booking: {
    desktopOverlay: "linear-gradient(90deg,rgba(32,16,9,0),rgb(32,16,9))",
    mobileOverlay:
      "linear-gradient(180deg,rgba(32,16,9,0.031373),rgba(32,16,9,0.658824) 58%,rgba(32,16,9,0.941176))",
    heading: "Good food deserves good company.",
    label: "Book a Table",
    href: ROUTES.BOOK_A_TABLE,
    image: {
      src: "/peploes-menu-booking.jpg",
      alt: "Candlelit tables and artwork in Peploe’s dining room.",
    },
  },
} as const satisfies IMenuPageContent;
