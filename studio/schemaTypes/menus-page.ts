import { defineArrayMember, defineField, defineType } from "sanity";
import { MENU_SLUGS } from "../../src/lib/constants";

export const menuNavigationItem = defineType({
  name: "menuNavigationItem",
  title: "Menu link",
  type: "object",
  fields: [
    defineField({
      name: "label",
      title: "Link label",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "menu",
      title: "Menu page",
      type: "string",
      options: {
        list: [...MENU_SLUGS],
      },
      validation: (rule) => rule.required(),
    }),
  ],
  preview: { select: { title: "label", subtitle: "menu" } },
});
export const menusPage = defineType({
  name: "menusPage",
  title: "Shared menu settings",
  type: "document",
  fields: [
    defineField({
      name: "eyebrow",
      title: "Small heading",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "heading",
      title: "Main heading",
      type: "text",
      rows: 2,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Introduction",
      type: "text",
      rows: 3,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "image",
      title: "Hero image",
      type: "menuImage",
      validation: (rule) => rule.required().assetRequired(),
    }),
    defineField({
      name: "navigationLabel",
      title: "Navigation description",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "navigation",
      title: "Menu links",
      type: "array",
      of: [defineArrayMember({ type: "menuNavigationItem" })],
      validation: (rule) =>
        rule
          .required()
          .length(MENU_SLUGS.length)
          .custom((items) => {
            if (!items) return true;
            const menus = items.map((item) =>
              item && typeof item === "object" && "menu" in item
                ? item.menu
                : undefined,
            );
            return (
              new Set(menus).size === MENU_SLUGS.length ||
              "Include each menu page exactly once."
            );
          }),
    }),
    defineField({
      name: "booking",
      title: "Default closing banner",
      type: "menuBooking",
      validation: (rule) => rule.required(),
    }),
  ],
  preview: { prepare: () => ({ title: "Shared menu settings" }) },
});
