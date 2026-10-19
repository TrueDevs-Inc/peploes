import { z } from "zod";
import {
  MENU_SLUGS,
  SEASONAL_GALLERY_LIMITS,
  SEASONAL_RELATED_PAGES,
} from "@/lib/constants";
import {
  keyedMenuArray,
  menuImageSchema,
  menuKeySchema,
  menuTextSchema,
  optionalMenuTextSchema,
} from "@/lib/menu-schema";

const text = menuTextSchema;
const image = menuImageSchema.pick({ src: true, alt: true });
export const seasonalSlugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const date = z.string().date();
const introduction = z.object({
  eyebrow: text,
  heading: text,
  description: text,
});
const hero = introduction.extend({ image });
const invitation = z.object({
  heading: text,
  description: text,
  bookingAction: text,
  enquiryAction: text,
  image,
});
export const seasonalCardSchema = z.object({
  _id: text,
  slug: seasonalSlugSchema,
  title: text,
  summary: text,
  action: optionalMenuTextSchema,
  category: text,
  date,
  endDate: date.nullish(),
  kind: z.enum(["campaign", "event", "menuMoment"]),
  noIndex: z.boolean().default(true),
  _updatedAt: z.string().datetime(),
  hero,
});
const menuCard = z.object({
  _key: menuKeySchema,
  title: text,
  description: text,
  action: text,
  image,
  menu: z.enum(MENU_SLUGS),
});
const menuHighlight = menuCard.omit({ action: true, menu: true }).extend({
  _type: z.literal("seasonalMenuHighlight"),
});
const relatedPage = menuCard.omit({ menu: true }).extend({
  _type: z.literal("seasonalRelatedPage"),
  href: z.nativeEnum(SEASONAL_RELATED_PAGES),
});
const relatedCard = z.object({
  _id: text,
  title: text,
  summary: text,
  slug: seasonalSlugSchema,
  hero,
});
export const seasonalEntrySchema = seasonalCardSchema
  .extend({
    seoDescription: text,
    details: keyedMenuArray(
      z.object({
        _key: menuKeySchema,
        label: text,
        description: text,
        icon: z.enum(["date", "time", "price", "menu"]),
      }),
    ),
    menu: introduction
      .extend({ cards: keyedMenuArray(z.union([menuHighlight, menuCard])) })
      .nullish(),
    story: z
      .object({
        eyebrow: text,
        heading: text,
        paragraphs: keyedMenuArray(
          z.object({ _key: menuKeySchema, text }),
        ).refine((items) => items.length > 0, "Add at least one paragraph."),
        image,
      })
      .nullish(),
    gallery: z
      .object({
        eyebrow: text,
        heading: text,
        images: keyedMenuArray(image.extend({ _key: menuKeySchema })).refine(
          (images) =>
            images.length >= SEASONAL_GALLERY_LIMITS.MIN_IMAGES &&
            images.length <= SEASONAL_GALLERY_LIMITS.MAX_IMAGES,
          "Use three to five photos.",
        ),
      })
      .nullish(),
    invitation: invitation.nullish(),
    related: z
      .object({
        eyebrow: text,
        action: text,
        cards: z.array(z.union([relatedPage, relatedCard])),
      })
      .nullish(),
  })
  .refine((entry) => !entry.endDate || entry.endDate >= entry.date, {
    message: "End date must be on or after the start.",
    path: ["endDate"],
  });

export const whatsOnPageSchema = z.object({
  title: text,
  seoDescription: text,
  hero,
  diary: introduction.extend({ emptyMessage: text, action: text }),
  terrace: z.object({ heading: text, description: text, image }).nullish(),
  join: hero.extend({ bookingAction: text, contactAction: text }),
});
