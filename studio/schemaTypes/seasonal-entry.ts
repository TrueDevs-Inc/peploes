import { defineField, defineType } from "sanity";
import { SEASONAL_GALLERY_LIMITS } from "../../src/lib/constants";

export const seasonalEntry = defineType({
  name: "seasonalEntry",
  title: "Events and campaigns",
  type: "document",
  groups: [
    { name: "main", title: "Main information", default: true },
    { name: "sections", title: "Optional sections" },
    { name: "seo", title: "Search settings" },
  ],
  initialValue: { kind: "event", enabled: true, noIndex: true },
  fields: [
    defineField({
      name: "kind",
      title: "Content type",
      type: "string",
      group: "main",
      options: {
        list: [
          { title: "Campaign — Christmas, Lobster Season", value: "campaign" },
          { title: "Event — wine dinner, rugby fixture", value: "event" },
          {
            title: "Menu Moment — Sunday dining, Mother's Day",
            value: "menuMoment",
          },
        ],
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "title",
      type: "string",
      group: "main",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      title: "Page URL name",
      type: "slug",
      group: "main",
      options: { source: "title", maxLength: 96 },
      description:
        "Use lowercase words separated by hyphens. This becomes /seasonal/your-url-name.",
      validation: (r) =>
        r
          .required()
          .custom(
            (value) =>
              !value?.current ||
              /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.current) ||
              "Use lowercase words separated by hyphens.",
          ),
    }),
    defineField({
      name: "enabled",
      title: "Show on website",
      type: "boolean",
      group: "main",
      description:
        "Turning this off and publishing hides this entry and its page.",
    }),
    defineField({
      name: "date",
      title: "Start date",
      type: "date",
      group: "main",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "endDate",
      title: "End date (optional)",
      type: "date",
      group: "main",
      description:
        "Keep a campaign in the diary until this date. Dates use Dublin time.",
      validation: (r) => r.min(r.valueOfField("date")),
    }),
    defineField({
      name: "category",
      title: "Category label",
      type: "string",
      group: "main",
      description:
        "For example: Rugby, Wine Dinner, Christmas or Sunday Dining.",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "summary",
      title: "Short description for the diary",
      type: "text",
      group: "main",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "action",
      title: "Diary link label (optional)",
      type: "string",
      group: "main",
      description:
        "For example: View menus & details or View menu. Leave empty to use the shared diary link label.",
    }),
    defineField({
      name: "hero",
      title: "Page introduction",
      type: "seasonalHero",
      group: "main",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "details",
      title: "Event information",
      type: "array",
      group: "sections",
      of: [{ type: "seasonalDetail" }],
    }),
    defineField({
      name: "menu",
      title: "Menu & Experience",
      type: "object",
      group: "sections",
      fields: [
        defineField({
          name: "eyebrow",
          type: "string",
          validation: (r) => r.required(),
        }),
        defineField({
          name: "heading",
          type: "string",
          validation: (r) => r.required(),
        }),
        defineField({
          name: "description",
          type: "text",
          validation: (r) => r.required(),
        }),
        defineField({
          name: "cards",
          type: "array",
          description:
            "Use a linked menu, an on-page highlight, or one of each.",
          of: [{ type: "seasonalMenuCard" }, { type: "seasonalMenuHighlight" }],
          validation: (r) => r.required().min(1).max(2),
        }),
      ],
    }),
    defineField({ name: "story", type: "seasonalStory", group: "sections" }),
    defineField({
      name: "gallery",
      type: "object",
      group: "sections",
      fields: [
        defineField({
          name: "eyebrow",
          type: "string",
          validation: (r) => r.required(),
        }),
        defineField({
          name: "heading",
          type: "string",
          validation: (r) => r.required(),
        }),
        defineField({
          name: "images",
          type: "array",
          of: [{ type: "menuImage" }],
          validation: (r) =>
            r
              .required()
              .min(SEASONAL_GALLERY_LIMITS.MIN_IMAGES)
              .max(SEASONAL_GALLERY_LIMITS.MAX_IMAGES)
              .unique(),
        }),
      ],
    }),
    defineField({
      name: "invitation",
      type: "seasonalInvitation",
      group: "sections",
    }),
    defineField({
      name: "related",
      title: "More to Explore",
      type: "object",
      group: "sections",
      fields: [
        defineField({
          name: "eyebrow",
          title: "Heading",
          type: "string",
          initialValue: "More to Explore",
          validation: (r) => r.required(),
        }),
        defineField({
          name: "action",
          title: "Link label",
          type: "string",
          initialValue: "Find Out More",
          validation: (r) => r.required(),
        }),
        defineField({
          name: "cards",
          title: "Cards",
          type: "array",
          of: [
            { type: "reference", to: [{ type: "seasonalEntry" }] },
            { type: "seasonalRelatedPage" },
          ],
          validation: (r) => r.required().min(1).max(6).unique(),
        }),
      ],
    }),
    defineField({
      name: "seoDescription",
      title: "Search description",
      type: "text",
      group: "seo",
      validation: (r) => r.required().max(160),
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
      title: "Date",
      name: "dateAsc",
      by: [{ field: "date", direction: "asc" }],
    },
  ],
  preview: {
    select: { title: "title", subtitle: "kind", media: "hero.image" },
  },
});
