import {
  type ConditionalPropertyCallbackContext,
  defineArrayMember,
  defineField,
  defineType,
} from "sanity";

// Keep saved presentation values in the schema so existing layouts stay unchanged.
export const menuImage = defineType({
  name: "menuImage",
  title: "Menu image",
  type: "image",
  validation: (rule) => rule.assetRequired(),
  fields: [
    defineField({
      name: "desktopCrop",
      type: "object",
      hidden: true,
      readOnly: true,
      fields: [
        defineField({
          name: "widthPercent",
          type: "number",
          validation: (rule) => rule.positive(),
        }),
        defineField({
          name: "aspectRatio",
          type: "number",
          validation: (rule) => rule.positive(),
        }),
        defineField({ name: "leftPercent", type: "number" }),
        defineField({ name: "topPx", type: "number" }),
        defineField({
          name: "rotationDegrees",
          type: "number",
          validation: (rule) => rule.min(-360).max(360),
        }),
      ],
    }),
    defineField({
      name: "desktopPosition",
      type: "string",
      hidden: true,
      readOnly: true,
    }),
    defineField({
      name: "mobilePosition",
      type: "string",
      hidden: true,
      readOnly: true,
    }),
    defineField({
      name: "rotation",
      type: "number",
      hidden: true,
      readOnly: true,
      validation: (rule) => rule.min(-360).max(360),
    }),
    defineField({
      name: "alt",
      title: "Image description",
      type: "string",
      description: "Describe the image for visitors using screen readers.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "fit",
      title: "Image fit",
      hidden: true,
      readOnly: true,
      type: "string",
      options: { list: ["contain", "cover"] },
    }),
    defineField({
      name: "scale",
      title: "Image scale",
      hidden: true,
      readOnly: true,
      type: "number",
      validation: (rule) => rule.min(0.5).max(3),
    }),
    defineField({
      name: "desktopScale",
      title: "Desktop photo scale",
      hidden: true,
      readOnly: true,
      type: "number",
      validation: (rule) => rule.min(0.5).max(3),
    }),
  ],
});
export const menuBooking = defineType({
  name: "menuBooking",
  title: "Closing banner",
  type: "object",
  fields: [
    defineField({
      name: "tallOnMobile",
      type: "boolean",
      hidden: true,
      readOnly: true,
    }),
    defineField({
      name: "fullWidthOnMobile",
      type: "boolean",
      hidden: true,
      readOnly: true,
    }),
    defineField({
      name: "mobilePadding",
      type: "number",
      hidden: true,
      readOnly: true,
      validation: (rule) => rule.min(0),
    }),
    defineField({
      name: "mobileOverlay",
      type: "string",
      hidden: true,
      readOnly: true,
    }),
    defineField({
      name: "desktopOverlay",
      type: "string",
      hidden: true,
      readOnly: true,
    }),
    defineField({
      name: "desktopContentWidth",
      type: "number",
      hidden: true,
      readOnly: true,
      validation: (rule) => rule.positive(),
    }),
    defineField({
      name: "desktopTextAlign",
      type: "string",
      hidden: true,
      readOnly: true,
      options: { list: ["left", "right"] },
    }),
    defineField({
      name: "heading",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "description", type: "text", rows: 3 }),
    defineField({
      name: "label",
      title: "Button label",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "image",
      type: "menuImage",
      validation: (rule) => rule.required().assetRequired(),
    }),
  ],
});
export const menuAllergens = defineType({
  name: "menuAllergens",
  title: "Allergen information",
  type: "object",
  fields: [
    defineField({
      name: "heading",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      type: "text",
      validation: (rule) => rule.required(),
    }),
  ],
});

function hideUnusedIntroduction({
  document,
}: ConditionalPropertyCallbackContext) {
  return (
    document?._type === "restaurantMenu" && document.introLayout !== "editorial"
  );
}

export function menuFields(slugs: string[]) {
  return [
    defineField({
      name: "title",
      title: "Menu title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Menu URL name",
      type: "slug",
      description: `Use: ${slugs.join(", ")}. Keep this name unchanged after publishing.`,
      validation: (rule) =>
        rule
          .required()
          .custom(
            (value) =>
              !value?.current ||
              slugs.includes(value.current) ||
              "Use one of the listed menu URL names.",
          ),
    }),
    defineField({
      name: "serviceTimes",
      title: "Serving times",
      type: "string",
    }),
    defineField({
      name: "offer",
      title: "Set-menu offer",
      type: "string",
      description: "For example: 2 Courses €40 / 3 Courses €45.",
    }),
    defineField({
      name: "description",
      title: "Introduction",
      hidden: hideUnusedIntroduction,
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "aside",
      title: "Side introduction",
      hidden: hideUnusedIntroduction,
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "image",
      title: "Introduction image",
      type: "menuImage",
    }),
    defineField({
      name: "imageBeforeAside",
      title: "Image before side introduction",
      hidden: true,
      readOnly: true,
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "seoDescription",
      title: "Search description",
      type: "text",
      rows: 3,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "notes",
      title: "Menu notes",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
    }),
    defineField({ name: "allergens", type: "menuAllergens" }),
    defineField({
      name: "booking",
      title: "Closing banner",
      type: "menuBooking",
      description: "Leave empty to use the shared menu banner.",
    }),
  ];
}
