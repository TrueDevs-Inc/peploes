import { defineArrayMember, defineField, defineType } from "sanity";
import { menuFields } from "./menu-fields";

export const drinksMenu = defineType({
  name: "drinksMenu",
  title: "Cocktails and spirits",
  type: "document",
  initialValue: {
    slug: { _type: "slug", current: "cocktails" },
    spiritsHeading: "Spirits",
  },
  fields: [
    ...menuFields(["cocktails"]),
    defineField({
      name: "cocktailSections",
      title: "Cocktail sections",
      type: "array",
      of: [defineArrayMember({ type: "menuCourse" })],
    }),
    defineField({
      name: "spiritsHeading",
      title: "Spirits heading",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "spiritsDescription",
      title: "Spirits description",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "spirits",
      title: "Spirit categories",
      type: "array",
      of: [defineArrayMember({ type: "menuCourse" })],
    }),
  ],
  preview: { select: { title: "title" } },
});
