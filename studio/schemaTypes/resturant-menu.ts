import { defineArrayMember, defineField, defineType } from "sanity";
import { menuFields } from "./menu-fields";

export const restaurantMenu = defineType({
  name: "restaurantMenu",
  title: "Restaurant menu",
  type: "document",
  fields: [
    ...menuFields(["lunch", "dinner", "pre-theatre"]),
    defineField({
      name: "introLayout",
      title: "Introduction layout",
      type: "string",
      options: { list: [{ title: "Editorial", value: "editorial" }] },
      description: "Leave empty for the standard menu introduction.",
    }),
    defineField({
      name: "courses",
      title: "Menu sections",
      type: "array",
      of: [defineArrayMember({ type: "menuCourse" })],
    }),
  ],
  validation: (rule) =>
    rule.custom((document) =>
      document?.serviceTimes ? true : "Add serving times.",
    ),
  preview: { select: { title: "title", subtitle: "slug.current" } },
});
