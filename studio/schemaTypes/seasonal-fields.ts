import { defineField, defineType } from "sanity";
import { cardDescriptionSchema } from "../../src/lib/card-description";
import { pageLinkSchema } from "../../src/lib/link-schema";

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
  title: "Linked card",
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
      title: "Previous menu link",
      type: "reference",
      to: [
        { type: "restaurantMenu" },
        { type: "wineMenu" },
        { type: "drinksMenu" },
        { type: "setMenuCollection" },
      ],
      readOnly: true,
      hidden: ({ value }) => !value,
      description:
        "Kept for existing cards. Set Button URL to replace this link.",
    }),
    defineField({
      name: "href",
      title: "Button URL",
      type: "string",
      description:
        "Paste any page path (/menus/dinner) or full website URL (https://example.com). Required unless this card has a previous menu link.",
      validation: (rule) =>
        rule.custom((value, context) => {
          if (value !== undefined)
            return (
              pageLinkSchema.safeParse(value).success ||
              "Enter a valid page path or http(s) URL."
            );
          const parent = context.parent;
          if (
            parent &&
            typeof parent === "object" &&
            "menu" in parent &&
            parent.menu &&
            typeof parent.menu === "object" &&
            "_ref" in parent.menu &&
            typeof parent.menu._ref === "string" &&
            parent.menu._ref.length > 0
          )
            return true;
          return "Enter a Button URL.";
        }),
    }),
  ],
});
export const seasonalMenuHighlight = defineType({
  name: "seasonalMenuHighlight",
  title: "On-page menu highlight",
  type: "object",
  fields: seasonalMenuCard.fields.filter(
    (field) =>
      field.name !== "href" && field.name !== "action" && field.name !== "menu",
  ),
});
export const seasonalRelatedPage = defineType({
  name: "seasonalRelatedPage",
  title: "Linked card",
  type: "object",
  fields: seasonalMenuCard.fields
    .filter((field) => field.name !== "menu")
    .map((field) =>
      field.name === "description"
        ? defineField({
            name: "description",
            type: "text",
            description: "Maximum 12 words.",
            validation: (rule) =>
              rule
                .required()
                .custom(
                  (value) =>
                    !value ||
                    cardDescriptionSchema.safeParse(value).success ||
                    "Use no more than 12 words.",
                ),
          })
        : field,
    ),
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
      title: "Booking button label",
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
