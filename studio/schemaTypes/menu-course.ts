import { defineArrayMember, defineField, defineType } from "sanity";

export const menuCourse = defineType({
  name: "menuCourse",
  title: "Menu section",
  type: "object",
  fields: [
    defineField({
      name: "heading",
      title: "Section heading",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "kind",
      title: "Section type",
      type: "string",
      initialValue: "other",
      description: "Choose the course that best describes this section.",
      options: {
        list: [
          { title: "Small bites", value: "small-bites" },
          { title: "Starters", value: "starters" },
          { title: "Main courses", value: "mains" },
          { title: "Desserts", value: "desserts" },
          { title: "Sides", value: "sides" },
          { title: "Other", value: "other" },
        ],
      },
    }),
    defineField({
      name: "columns",
      title: "Columns on large screens",
      type: "number",
      initialValue: 2,
      options: { list: [1, 2, 3] },
      validation: (rule) => rule.required().integer().min(1).max(3),
    }),
    defineField({
      name: "firstColumnCount",
      title: "Dishes in first column",
      type: "number",
      description: "Optional adjustment for a two-column section.",
      hidden: ({ parent }) => parent?.columns !== 2,
      validation: (rule) => rule.integer().min(1),
    }),
    defineField({
      name: "dishes",
      title: "Dishes or drinks",
      type: "array",
      of: [defineArrayMember({ type: "menuDish" })],
      description: "Empty sections are hidden on the website.",
    }),
  ],
  preview: { select: { title: "heading" } },
});
