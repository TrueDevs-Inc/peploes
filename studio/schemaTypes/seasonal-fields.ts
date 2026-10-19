import { defineField, defineType } from "sanity";
import { SEASONAL_RELATED_PAGES } from "../../src/lib/constants";

export const seasonalHero = defineType({
  name: "seasonalHero",
  title: "Introduction",
  type: "object",
  fields: [
    defineField({
      name: "eyebrow",
      title: "Small heading",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "heading",
      type: "text",
      rows: 2,
      validation: (r) => r.required(),
    }),
    defineField({
      name: "description",
      type: "text",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "image",
      type: "menuImage",
      validation: (r) => r.required().assetRequired(),
    }),
  ],
});
export const seasonalDetail = defineType({
  name: "seasonalDetail",
  title: "Event detail",
  type: "object",
  fields: [
    defineField({
      name: "icon",
      type: "string",
      options: {
        list: [
          { title: "Date", value: "date" },
          { title: "Time", value: "time" },
          { title: "Price", value: "price" },
          { title: "Menu", value: "menu" },
        ],
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "label",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "description",
      type: "text",
      rows: 2,
      validation: (r) => r.required(),
    }),
  ],
  preview: { select: { title: "label", subtitle: "description" } },
});
export const seasonalMenuCard = defineType({
  name: "seasonalMenuCard",
  title: "Linked menu",
  type: "object",
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "description",
      type: "text",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "image",
      type: "menuImage",
      validation: (r) => r.required().assetRequired(),
    }),
    defineField({
      name: "action",
      title: "Link label",
      type: "string",
      initialValue: "View Menu",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "menu",
      type: "reference",
      to: [
        { type: "restaurantMenu" },
        { type: "wineMenu" },
        { type: "drinksMenu" },
        { type: "setMenuCollection" },
      ],
      validation: (r) => r.required(),
    }),
  ],
});
export const seasonalMenuHighlight = defineType({
  name: "seasonalMenuHighlight",
  title: "On-page menu highlight",
  type: "object",
  fields: seasonalMenuCard.fields.filter(
    (field) => field.name !== "menu" && field.name !== "action",
  ),
});
export const seasonalRelatedPage = defineType({
  name: "seasonalRelatedPage",
  title: "Menu or group page",
  type: "object",
  fields: [
    ...seasonalMenuCard.fields.filter((field) => field.name !== "menu"),
    defineField({
      name: "href",
      title: "Destination page",
      type: "string",
      options: {
        list: Object.entries(SEASONAL_RELATED_PAGES).map(([title, value]) => ({
          title,
          value,
        })),
      },
      description:
        "Choose an existing page. Journal destinations are pending until the Journal is built.",
      validation: (rule) =>
        rule
          .required()
          .custom(
            (value) =>
              !value ||
              Object.values(SEASONAL_RELATED_PAGES).some(
                (page) => page === value,
              ) ||
              "Choose an existing menu or group page.",
          ),
    }),
  ],
});
export const seasonalStory = defineType({
  name: "seasonalStory",
  title: "Story",
  type: "object",
  fields: [
    defineField({
      name: "eyebrow",
      title: "Small heading",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "heading",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "paragraphs",
      type: "array",
      of: [
        {
          type: "object",
          name: "seasonalParagraph",
          title: "Paragraph",
          fields: [
            defineField({
              name: "text",
              type: "text",
              validation: (r) => r.required(),
            }),
          ],
          preview: { select: { title: "text" } },
        },
      ],
      validation: (r) => r.required().min(1),
    }),
    defineField({
      name: "image",
      type: "menuImage",
      validation: (r) => r.required().assetRequired(),
    }),
  ],
});
export const seasonalInvitation = defineType({
  name: "seasonalInvitation",
  title: "Invitation banner",
  type: "object",
  fields: [
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
      name: "bookingAction",
      title: "Booking button label (currently inactive)",
      type: "string",
      initialValue: "Book this Experience",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "enquiryAction",
      title: "Contact link label",
      type: "string",
      initialValue: "Make an Inquiry",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "image",
      type: "menuImage",
      validation: (r) => r.required().assetRequired(),
    }),
  ],
});
