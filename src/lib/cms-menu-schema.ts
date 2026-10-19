import { z } from "zod";
import { MENU_SLUGS } from "@/lib/constants";

import {
  keyedMenuArray,
  menuBookingSchema,
  menuCourseSchema,
  menuEditorialShape,
  menuImageSchema,
  menuKeySchema,
  menuPriceSchema,
  menuTextSchema,
  optionalMenuTextSchema,
} from "@/lib/menu-schema";
import { restaurantMenuSchema } from "@/lib/restaurant-menu-schema";

const wineSchema = z.object({
  _key: menuKeySchema,
  name: menuTextSchema,
  region: optionalMenuTextSchema,
  vintage: optionalMenuTextSchema,
  glass: menuPriceSchema.nullish(),
  bottle: menuPriceSchema.nullish(),
  available: z.boolean().optional(),
});
const wineCategorySchema = z.object({
  shortHeading: optionalMenuTextSchema,
  emphasized: z.boolean().optional(),
  compactVintageHeading: z.boolean().optional(),
  mobileTopPadding: z.number().nonnegative().optional(),
  mobileHeadingGap: z.number().nonnegative().optional(),
  _key: menuKeySchema,
  heading: menuTextSchema,
  showVintage: z.boolean().default(false),
  showGlass: z.boolean().default(false),
  wines: keyedMenuArray(wineSchema),
});
const wineColumnSchema = z.object({
  _key: menuKeySchema,
  categories: keyedMenuArray(wineCategorySchema),
});
const wineSectionSchema = z
  .object({
    _key: menuKeySchema,
    heading: menuTextSchema,
    description: optionalMenuTextSchema,
    highlighted: z.boolean().optional(),
    desktopBottomPadding: z.number().nonnegative().optional(),
    mobileBottomPadding: z.number().nonnegative().optional(),
    columns: keyedMenuArray(wineColumnSchema).refine(
      (columns) => columns.length <= 2,
      "Use at most two desktop columns.",
    ),
  })
  .refine((section) => {
    const keys = section.columns.flatMap((column) =>
      column.categories.map((category) => category._key),
    );
    return new Set(keys).size === keys.length;
  }, "Category keys must be unique across the section.");

export const wineMenuSchema = z.object({
  ...menuEditorialShape,
  _type: z.literal("wineMenu"),
  slug: z.literal("wine"),
  indexLabel: menuTextSchema,
  sections: keyedMenuArray(wineSectionSchema),
});

export const drinksMenuSchema = z
  .object({
    ...menuEditorialShape,
    _type: z.literal("drinksMenu"),
    slug: z.literal("cocktails"),
    cocktailSections: keyedMenuArray(menuCourseSchema),
    spirits: keyedMenuArray(menuCourseSchema),
    spiritsHeading: menuTextSchema,
    spiritsDescription: optionalMenuTextSchema,
  })
  .refine((menu) => {
    const keys = [...menu.cocktailSections, ...menu.spirits].map(
      (section) => section._key,
    );
    return new Set(keys).size === keys.length;
  }, "Drink section keys must be unique.");

const setMenuSchema = z.object({
  _key: menuKeySchema,
  title: menuTextSchema,
  price: menuPriceSchema,
  summary: menuTextSchema,
  cardDescription: optionalMenuTextSchema,
  serviceTimes: optionalMenuTextSchema,
  inclusions: z
    .array(menuTextSchema)
    .nullish()
    .transform((items) => items ?? []),
  courses: keyedMenuArray(menuCourseSchema),
});

export const setMenuCollectionSchema = z.object({
  ...menuEditorialShape,
  _type: z.literal("setMenuCollection"),
  slug: z.enum(["group-set-menu", "seasonal"]),
  inclusionsHeading: optionalMenuTextSchema,
  menus: keyedMenuArray(setMenuSchema),
});

export const cmsMenuSchema = z.union([
  restaurantMenuSchema,
  wineMenuSchema,
  drinksMenuSchema,
  setMenuCollectionSchema,
]);

const menuSlugSchema = z.enum(MENU_SLUGS);
export const menusPageSchema = z.object({
  eyebrow: menuTextSchema,
  heading: menuTextSchema,
  description: menuTextSchema,
  image: menuImageSchema,
  booking: menuBookingSchema,
  navigationLabel: menuTextSchema,
  navigation: z
    .array(z.object({ menu: menuSlugSchema, label: menuTextSchema }))
    .length(MENU_SLUGS.length)
    .refine(
      (items) =>
        new Set(items.map((item) => item.menu)).size === MENU_SLUGS.length,
      "Include each menu once.",
    ),
});

export const menuCollectionNavigationSchema = z
  .array(
    z.object({
      slug: z.enum(["group-set-menu", "seasonal"]),
      menus: keyedMenuArray(
        z.object({ _key: menuKeySchema, title: menuTextSchema }),
      ),
    }),
  )
  .refine(
    (items) => new Set(items.map((item) => item.slug)).size === items.length,
    "Collection URL names must be unique.",
  );
