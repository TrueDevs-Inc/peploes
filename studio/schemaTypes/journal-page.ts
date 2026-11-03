import { defineField, defineType } from "sanity";
import { JOURNAL_LIMITS } from "../../src/lib/constants";
import { validateJournalText } from "./journal-fields";

export const journalPage = defineType({
  name: "journalPage",
  title: "Journal page settings",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Search title",
      type: "string",
      validation: (rule) => rule.required().custom(validateJournalText),
    }),
    defineField({
      name: "seoDescription",
      title: "Search description",
      type: "text",
      validation: (rule) =>
        rule
          .required()
          .max(JOURNAL_LIMITS.MAX_SEO_DESCRIPTION_CHARACTERS)
          .custom(validateJournalText),
    }),
    defineField({
      name: "hero",
      title: "Page introduction",
      type: "object",
      validation: (rule) => rule.required(),
      fields: [
        defineField({
          name: "eyebrow",
          title: "Small heading",
          type: "string",
          validation: (rule) => rule.required().custom(validateJournalText),
        }),
        defineField({
          name: "heading",
          type: "text",
          rows: 2,
          validation: (rule) => rule.required().custom(validateJournalText),
        }),
        defineField({
          name: "standfirst",
          title: "Short introduction",
          type: "string",
          validation: (rule) => rule.required().custom(validateJournalText),
        }),
        defineField({
          name: "description",
          type: "text",
          validation: (rule) => rule.required().custom(validateJournalText),
        }),
        defineField({ name: "image", type: "menuImage" }),
      ],
    }),
    defineField({
      name: "featuredArticle",
      title: "Featured article",
      type: "reference",
      to: [{ type: "journalArticle" }],
      options: { filter: "enabled != false" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "listing",
      title: "Article listing",
      type: "object",
      validation: (rule) => rule.required(),
      fields: [
        defineField({
          name: "heading",
          type: "string",
          validation: (rule) => rule.required().custom(validateJournalText),
        }),
        defineField({ name: "description", type: "text" }),
        defineField({
          name: "allLabel",
          title: "All categories label",
          type: "string",
          validation: (rule) => rule.required().custom(validateJournalText),
        }),
        defineField({
          name: "articleAction",
          title: "Article link label",
          type: "string",
          validation: (rule) => rule.required().custom(validateJournalText),
        }),
        defineField({
          name: "loadMoreAction",
          title: "Load more button label",
          type: "string",
          validation: (rule) => rule.required().custom(validateJournalText),
        }),
        defineField({
          name: "emptyMessage",
          title: "Message when there are no articles",
          type: "string",
          validation: (rule) => rule.required().custom(validateJournalText),
        }),
      ],
    }),
    defineField({
      name: "closing",
      title: "Closing banner",
      type: "object",
      validation: (rule) => rule.required(),
      fields: [
        defineField({
          name: "heading",
          type: "string",
          validation: (rule) => rule.required().custom(validateJournalText),
        }),
        defineField({
          name: "image",
          type: "menuImage",
          validation: (rule) => rule.required().assetRequired(),
        }),
      ],
    }),
  ],
  preview: {
    prepare() {
      return { title: "Journal page settings" };
    },
  },
});
