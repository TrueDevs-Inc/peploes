import { defineField, defineType } from "sanity";
import { JOURNAL_LIMITS } from "../../src/lib/constants";
import { validateJournalSlug, validateJournalText } from "./journal-fields";

export const journalCategory = defineType({
  name: "journalCategory",
  title: "Journal categories",
  type: "document",
  fields: [
    defineField({
      name: "name",
      type: "string",
      validation: (rule) => rule.required().custom(validateJournalText),
    }),
    defineField({
      name: "slug",
      title: "Category URL name",
      type: "slug",
      options: { source: "name", maxLength: JOURNAL_LIMITS.MAX_SLUG_LENGTH },
      validation: (rule) => rule.required().custom(validateJournalSlug),
    }),
    defineField({
      name: "sortOrder",
      title: "Navigation order",
      type: "number",
      description: "Lower numbers appear first in the category navigation.",
      validation: (rule) => rule.integer().min(0).max(999),
    }),
  ],
  preview: { select: { title: "name" } },
});
