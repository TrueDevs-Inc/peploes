import { defineField, defineType } from "sanity";

export const whatsOnPage = defineType({
  name: "whatsOnPage",
  title: "What’s On page settings",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Search title",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "seoDescription",
      title: "Search description",
      type: "text",
      validation: (r) => r.required().max(160),
    }),
    defineField({
      name: "hero",
      title: "Page introduction",
      type: "seasonalHero",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "diary",
      type: "object",
      validation: (r) => r.required(),
      fields: [
        defineField({
          name: "eyebrow",
          type: "string",
          validation: (r) => r.required(),
        }),
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
          name: "action",
          title: "Event link label",
          type: "string",
          initialValue: "Find Out More",
          validation: (r) => r.required(),
        }),
        defineField({
          name: "emptyMessage",
          title: "Message when there are no upcoming events",
          type: "string",
          validation: (r) => r.required(),
        }),
      ],
    }),
    defineField({
      name: "terrace",
      title: "Terrace feature (optional)",
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
          name: "image",
          type: "menuImage",
          validation: (r) => r.required().assetRequired(),
        }),
      ],
    }),
    defineField({
      name: "join",
      title: "Shared closing invitation",
      type: "object",
      validation: (r) => r.required(),
      fields: [
        defineField({
          name: "eyebrow",
          type: "string",
          validation: (r) => r.required(),
        }),
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
          validation: (r) => r.required(),
        }),
        defineField({
          name: "contactAction",
          title: "Contact link label",
          type: "string",
          validation: (r) => r.required(),
        }),
        defineField({
          name: "image",
          type: "menuImage",
          validation: (r) => r.required().assetRequired(),
        }),
      ],
    }),
  ],
  preview: {
    prepare() {
      return { title: "What’s On page settings" };
    },
  },
});
