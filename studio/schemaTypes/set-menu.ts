import { defineArrayMember, defineField, defineType } from "sanity";
import { menuFields } from "./menu-fields";

export const setMenu = defineType({
  name: "setMenu",
  title: "Set menu",
  type: "object",
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "price",
      title: "Price per person in euros",
      type: "number",
      validation: (rule) => rule.required().min(0).precision(2),
    }),
    defineField({
      name: "summary",
      title: "Eligibility and summary",
      type: "text",
      rows: 3,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "cardDescription",
      title: "Short navigation description",
      type: "string",
    }),
    defineField({
      name: "serviceTimes",
      title: "Service dates and times",
      type: "string",
    }),
    defineField({
      name: "inclusions",
      title: "What is included",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
    }),
    defineField({
      name: "courses",
      type: "array",
      of: [defineArrayMember({ type: "menuCourse" })],
    }),
  ],
  preview: { select: { title: "title", subtitle: "serviceTimes" } },
});
export const setMenuCollection = defineType({
  name: "setMenuCollection",
  title: "Group and seasonal menus",
  type: "document",
  fields: [
    ...menuFields(["group-set-menu", "seasonal"]),
    defineField({
      name: "inclusionsHeading",
      title: "What is included heading",
      type: "string",
    }),
    defineField({
      name: "menus",
      title: "Menus in display order",
      type: "array",
      of: [defineArrayMember({ type: "setMenu" })],
      description:
        "Adding or reordering a menu also updates the website dropdown.",
    }),
  ],
  preview: { select: { title: "title", subtitle: "slug.current" } },
});
