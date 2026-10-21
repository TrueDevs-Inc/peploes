import { defineField, defineType } from "sanity";

export const menuDish = defineType({
  name: "menuDish",
  title: "Dish",
  type: "object",
  fields: [
    defineField({
      name: "priceDecimalPlaces",
      type: "number",
      hidden: true,
      readOnly: true,
      options: { list: [0, 2] },
    }),
    defineField({
      name: "name",
      title: "Dish name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "price",
      title: "Price in euros (optional)",
      description: "Leave empty to hide the price on the website.",
      type: "number",
      validation: (rule) => rule.min(0).precision(2),
    }),
  ],
});
