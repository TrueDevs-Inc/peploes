import { defineField, defineType } from "sanity";
import { JOURNAL_LIMITS } from "../../src/lib/constants";
import { validateJournalSlug, validateJournalText } from "./journal-fields";

export const journalArticle = defineType({
  name: "journalArticle",
  title: "Journal articles",
  type: "document",
  groups: [
    { name: "main", title: "Main information", default: true },
    { name: "content", title: "Article content" },
    { name: "seo", title: "Search settings" },
  ],
  initialValue: { enabled: true, noIndex: true },
  fields: [
    defineField({
      name: "enabled",
      title: "Show on website",
      type: "boolean",
      group: "main",
      description: "Turning this off and publishing hides this article.",
    }),
    defineField({
      name: "title",
      type: "string",
      group: "main",
      validation: (rule) => rule.required().custom(validateJournalText),
    }),
    defineField({
      name: "slug",
      title: "Page URL name",
      type: "slug",
      group: "main",
      options: { source: "title", maxLength: JOURNAL_LIMITS.MAX_SLUG_LENGTH },
      validation: (rule) => rule.required().custom(validateJournalSlug),
    }),
    defineField({
      name: "standfirst",
      title: "Short introduction",
      type: "text",
      group: "main",
      validation: (rule) => rule.required().custom(validateJournalText),
    }),
    defineField({
      name: "date",
      type: "date",
      group: "main",
      options: { dateFormat: "YYYY-MM-DD" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "listingOrder",
      title: "Listing order",
      type: "number",
      group: "main",
      description:
        "Lower numbers appear first in the Journal grid. Leave empty to follow ordered stories, newest first. Related stories still use their dates.",
      validation: (rule) => rule.integer().min(0),
    }),
    defineField({
      name: "readTimeMinutes",
      title: "Reading time in minutes",
      type: "number",
      group: "main",
      validation: (rule) =>
        rule
          .required()
          .integer()
          .min(1)
          .max(JOURNAL_LIMITS.MAX_READ_TIME_MINUTES),
    }),
    defineField({
      name: "author",
      type: "string",
      group: "main",
      validation: (rule) => rule.required().custom(validateJournalText),
    }),
    defineField({
      name: "category",
      type: "reference",
      group: "main",
      to: [{ type: "journalCategory" }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "heroImage",
      title: "Main image",
      type: "menuImage",
      group: "main",
      validation: (rule) => rule.required().assetRequired(),
    }),
    defineField({
      name: "intro",
      title: "Introduction banner",
      type: "text",
      group: "content",
      description: "Appears in the full-width banner before the article body.",
      validation: (rule) => rule.required().custom(validateJournalText),
    }),
    defineField({
      name: "blocks",
      title: "Article body",
      type: "array",
      group: "content",
      of: [
        { type: "journalParagraph" },
        { type: "journalHeading" },
        { type: "journalImage" },
        { type: "journalQuote" },
      ],
      validation: (rule) =>
        rule.required().min(1).max(JOURNAL_LIMITS.MAX_BLOCKS),
    }),
    defineField({
      name: "seoDescription",
      title: "Search description",
      type: "text",
      group: "seo",
      validation: (rule) =>
        rule
          .required()
          .max(JOURNAL_LIMITS.MAX_SEO_DESCRIPTION_CHARACTERS)
          .custom(validateJournalText),
    }),
    defineField({
      name: "noIndex",
      title: "Keep out of search engines",
      type: "boolean",
      group: "seo",
      description:
        "Keep this on for test content. Turn off only for approved public content.",
    }),
  ],
  orderings: [
    {
      title: "Newest first",
      name: "dateDesc",
      by: [{ field: "date", direction: "desc" }],
    },
  ],
  preview: {
    select: { title: "title", subtitle: "category.name", media: "heroImage" },
  },
});
