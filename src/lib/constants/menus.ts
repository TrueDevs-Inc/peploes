import { ROUTES } from "@/lib/constants";
import type { IMenusContent } from "@/lib/types";

export const MENUS_CONTENT: IMenusContent = {
  eyebrow: "Our Menus",
  heading: "Good food brings people together.",
  description:
    "A seasonally inspired menu, classic favourites and a few Peploe's signature dishes, all served with care in a setting made for good company.",
  categoriesLabel: "Menu categories",
  categories: [
    {
      label: "Lunch",
      description: "Elegant dishes for daytime dining.",
      href: ROUTES.LUNCH,
    },
    {
      label: "Dinner",
      description: "A classic Peploe’s experience.",
      href: ROUTES.DINNER,
    },
    {
      label: "Pre-Theatre",
      description: "Perfect for an evening in the city.",
      href: ROUTES.PRE_THEATRE,
    },
    {
      label: "Wine",
      description: "An exceptional cellar, carefully curated.",
      href: ROUTES.WINE,
    },
    {
      label: "Cocktails",
      description: "Timeless classics and creative serves.",
      href: ROUTES.COCKTAILS,
    },
    {
      label: "Seasonal",
      description: "Inspired by the best of each season.",
      href: ROUTES.SEASONAL,
    },
  ],
  ctaLabel: "Explore Our Menus",
  image: {
    src: "/peploes-dining-room.jpg",
    alt: "Guests dining at Peploe’s, surrounded by red banquettes and colourful murals.",
  },
};

export const MENUS_SHELF_COLUMNS = [0, 1, 2].map((column) =>
  MENUS_CONTENT.categories.filter((_, index) => index % 3 === column),
);
