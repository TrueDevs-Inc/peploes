import { defineField, defineType, type SlugValue } from "sanity";
import { JOURNAL_LIMITS, JOURNAL_SLUG_PATTERN } from "../../src/lib/constants";
import { menuTextSchema } from "../../src/lib/menu-schema";

export function validateJournalText(value: unknown) {
  return (
    menuTextSchema.safeParse(value).success || "Enter text that is not blank."
  );
}

export function validateJournalSlug(value: SlugValue | undefined) {
  const slug = value?.current;
  return (
    (typeof slug === "string" &&
      slug.length <= JOURNAL_LIMITS.MAX_SLUG_LENGTH &&
      JOURNAL_SLUG_PATTERN.test(slug)) ||
    `Use lowercase words separated by hyphens, up to ${JOURNAL_LIMITS.MAX_SLUG_LENGTH} characters.`
  );
}

export const journalParagraph = defineType({
  name: "journalParagraph",
  title: "Paragraph",
  type: "object",
  fields: [
    defineField({
      name: "text",
      type: "text",
      validation: (rule) => rule.required().custom(validateJournalText),
    }),
  ],
  preview: { select: { title: "text" } },
});

export const journalHeading = defineType({
  name: "journalHeading",
  title: "Heading",
  type: "object",
  fields: [
    defineField({
      name: "text",
      type: "string",
      validation: (rule) => rule.required().custom(validateJournalText),
    }),
    defineField({
      name: "level",
      title: "Heading level",
      type: "number",
      options: {
        list: [
          { title: "Heading 2", value: 2 },
          { title: "Heading 3", value: 3 },
        ],
      },
      initialValue: 2,
      validation: (rule) => rule.required().integer().min(2).max(3),
    }),
  ],
  preview: { select: { title: "text" } },
});

export const journalImage = defineType({
  name: "journalImage",
  title: "Image",
  type: "object",
  fields: [
    defineField({
      name: "image",
      type: "menuImage",
      validation: (rule) => rule.required().assetRequired(),
    }),
    defineField({ name: "caption", type: "string" }),
  ],
  preview: {
    select: { title: "image.alt", subtitle: "caption", media: "image" },
  },
});

export const journalQuote = defineType({
  name: "journalQuote",
  title: "Quote",
  type: "object",
  fields: [
    defineField({
      name: "text",
      type: "text",
      validation: (rule) => rule.required().custom(validateJournalText),
    }),
    defineField({ name: "attribution", type: "string" }),
  ],
  preview: { select: { title: "text", subtitle: "attribution" } },
});
