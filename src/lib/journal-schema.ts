import { z } from "zod";
import { JOURNAL_LIMITS, JOURNAL_SLUG_PATTERN } from "@/lib/constants";
import {
  keyedMenuArray,
  menuImageSchema,
  menuKeySchema,
  menuTextSchema,
  optionalMenuTextSchema,
} from "@/lib/menu-schema";

const text = menuTextSchema;
const image = menuImageSchema.pick({ src: true, alt: true });
export const journalSlugSchema = z
  .string()
  .max(JOURNAL_LIMITS.MAX_SLUG_LENGTH)
  .regex(JOURNAL_SLUG_PATTERN);

export const journalCategorySchema = z.object({
  _id: text,
  name: text,
  slug: journalSlugSchema,
});

export const journalArticleCardSchema = z.object({
  _id: text,
  _updatedAt: z.string().datetime(),
  slug: journalSlugSchema,
  title: text,
  standfirst: text,
  date: z.string().date(),
  listingOrder: z
    .number()
    .int()
    .nonnegative()
    .nullish()
    .transform((value) => value ?? undefined)
    .optional(),
  readTimeMinutes: z
    .number()
    .int()
    .positive()
    .max(JOURNAL_LIMITS.MAX_READ_TIME_MINUTES),
  author: text,
  category: journalCategorySchema,
  heroImage: menuImageSchema.pick({
    src: true,
    alt: true,
    desktopPosition: true,
    mobilePosition: true,
  }),
  noIndex: z.boolean().default(true),
});

export const journalBlockSchema = z.discriminatedUnion("_type", [
  z.object({ _key: menuKeySchema, _type: z.literal("journalParagraph"), text }),
  z.object({
    _key: menuKeySchema,
    _type: z.literal("journalHeading"),
    text,
    level: z.union([z.literal(2), z.literal(3)]),
  }),
  z.object({
    _key: menuKeySchema,
    _type: z.literal("journalImage"),
    image,
    caption: optionalMenuTextSchema,
  }),
  z.object({
    _key: menuKeySchema,
    _type: z.literal("journalQuote"),
    text,
    attribution: optionalMenuTextSchema,
  }),
]);

export const journalArticleSchema = journalArticleCardSchema.extend({
  seoDescription: text.max(JOURNAL_LIMITS.MAX_SEO_DESCRIPTION_CHARACTERS),
  intro: text,
  blocks: keyedMenuArray(journalBlockSchema).refine(
    (blocks) => blocks.length > 0 && blocks.length <= JOURNAL_LIMITS.MAX_BLOCKS,
    "Add between one and 200 article blocks.",
  ),
});

export const journalPageSchema = z.object({
  title: text,
  seoDescription: text.max(JOURNAL_LIMITS.MAX_SEO_DESCRIPTION_CHARACTERS),
  hero: z.object({
    eyebrow: text,
    heading: text,
    standfirst: text,
    description: text,
    image: image
      .nullish()
      .transform((value) => value ?? undefined)
      .optional(),
  }),
  featuredArticle: journalArticleCardSchema,
  listing: z.object({
    heading: text,
    description: optionalMenuTextSchema,
    allLabel: text,
    articleAction: text,
    loadMoreAction: text,
    emptyMessage: text,
  }),
  closing: z.object({
    heading: text,
    image,
  }),
});

export const journalPublishedSlugSchema = journalArticleCardSchema.pick({
  slug: true,
  _updatedAt: true,
  noIndex: true,
});
