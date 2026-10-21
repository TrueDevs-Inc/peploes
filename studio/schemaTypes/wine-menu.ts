import { defineArrayMember, defineField, defineType } from "sanity";
import { menuFields } from "./menu-fields";

export const menuWine = defineType({
  name: "menuWine",
  title: "Wine",
  type: "object",
  fields: [
    defineField({
      name: "name",
      title: "Wine name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "region", type: "string" }),
    defineField({
      name: "vintage",
      type: "string",
      description: "A year or NV for non-vintage.",
    }),
    defineField({
      name: "glass",
      title: "Glass price in euros",
      type: "number",
      validation: (rule) => rule.min(0).precision(2),
    }),
    defineField({
      name: "bottle",
      title: "Bottle price in euros",
      type: "number",
      validation: (rule) => rule.min(0).precision(2),
    }),
    defineField({
      name: "available",
      title: "Available",
      type: "boolean",
      initialValue: true,
      description: "Switch off to hide this wine from the website.",
    }),
  ],
  preview: { select: { title: "name", subtitle: "region" } },
});
export const menuWineCategory = defineType({
  name: "menuWineCategory",
  title: "Wine category",
  type: "object",
  fields: [
    defineField({
      name: "shortHeading",
      title: "Short index heading",
      type: "string",
    }),
    defineField({
      name: "emphasized",
      type: "boolean",
      hidden: true,
      readOnly: true,
    }),
    defineField({
      name: "compactVintageHeading",
      type: "boolean",
      hidden: true,
      readOnly: true,
    }),
    defineField({
      name: "mobileTopPadding",
      type: "number",
      hidden: true,
      readOnly: true,
      validation: (rule) => rule.min(0),
    }),
    defineField({
      name: "mobileHeadingGap",
      type: "number",
      hidden: true,
      readOnly: true,
      validation: (rule) => rule.min(0),
    }),
    defineField({
      name: "heading",
      title: "Category or country",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "showVintage",
      title: "Show vintage column",
      type: "boolean",
      initialValue: true,
    }),
    defineField({
      name: "showGlass",
      title: "Show glass price column",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "wines",
      type: "array",
      of: [defineArrayMember({ type: "menuWine" })],
    }),
  ],
  preview: { select: { title: "heading" } },
});
export const menuWineColumn = defineType({
  name: "menuWineColumn",
  title: "Desktop column",
  type: "object",
  fields: [
    defineField({
      name: "categories",
      type: "array",
      of: [defineArrayMember({ type: "menuWineCategory" })],
    }),
  ],
  preview: { select: { title: "categories.0.heading" } },
});
export const menuWineSection = defineType({
  name: "menuWineSection",
  title: "Wine section",
  type: "object",
  fields: [
    defineField({
      name: "desktopBottomPadding",
      type: "number",
      hidden: true,
      readOnly: true,
      validation: (rule) => rule.min(0),
    }),
    defineField({
      name: "mobileBottomPadding",
      type: "number",
      hidden: true,
      readOnly: true,
      validation: (rule) => rule.min(0),
    }),
    defineField({
      name: "heading",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "description", type: "text", rows: 3 }),
    defineField({ name: "highlighted", type: "boolean", initialValue: false }),
    defineField({
      name: "columns",
      title: "Desktop columns",
      type: "array",
      of: [defineArrayMember({ type: "menuWineColumn" })],
      validation: (rule) => rule.max(2),
    }),
  ],
  preview: { select: { title: "heading" } },
});
export const wineMenu = defineType({
  name: "wineMenu",
  title: "Wine menu",
  type: "document",
  initialValue: {
    slug: { _type: "slug", current: "wine" },
    indexLabel: "Browse the wine list",
  },
  fields: [
    ...menuFields(["wine"]),
    defineField({
      name: "indexLabel",
      title: "Wine index label",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "sections",
      title: "Wine sections",
      type: "array",
      of: [defineArrayMember({ type: "menuWineSection" })],
    }),
  ],
  preview: { select: { title: "title" } },
});
