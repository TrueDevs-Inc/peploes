import { createClient } from "@sanity/client";
import { Schema } from "@sanity/schema";
import { builtinTypes } from "@sanity/schema/_internal";
import { validateDocument } from "@sanity/validation";
import { expect, test } from "vitest";
import { menuImage } from "./schemaTypes/menu-fields";
import {
  seasonalMenuCard,
  seasonalRelatedPage,
} from "./schemaTypes/seasonal-fields";

const schema = Schema.compile({
  name: "card-editing",
  types: [
    ...builtinTypes,
    ...["restaurantMenu", "wineMenu", "drinksMenu", "setMenuCollection"].map(
      (name) => ({
        name,
        type: "document",
        fields: [{ name: "title", type: "string" }],
      }),
    ),
    menuImage,
    seasonalMenuCard,
    seasonalRelatedPage,
    {
      name: "event",
      type: "document",
      fields: [
        { name: "menuCard", type: "seasonalMenuCard" },
        { name: "relatedCard", type: "seasonalRelatedPage" },
      ],
    },
  ],
});
const client = createClient({
  projectId: "testproject",
  dataset: "development",
  apiVersion: "2026-10-06",
  useCdn: false,
});

test.each([
  {
    name: "existing menu reference",
    field: "menuCard",
    link: { menu: { _type: "reference", _ref: "dinner" } },
    valid: true,
  },
  {
    name: "new card without destination",
    field: "menuCard",
    link: {},
    valid: false,
  },
  {
    name: "empty URL with an old reference",
    field: "menuCard",
    link: { href: "", menu: { _type: "reference", _ref: "dinner" } },
    valid: false,
  },
  {
    name: "new URL card",
    field: "menuCard",
    link: { href: "/menus/dinner" },
    valid: true,
  },
  {
    name: "unsafe URL on an old card",
    field: "menuCard",
    link: {
      href: "javascript:alert(1)",
      menu: { _type: "reference", _ref: "dinner" },
    },
    valid: false,
  },
  {
    name: "related card without destination",
    field: "relatedCard",
    link: {},
    valid: false,
  },
])("validates editing $name", async ({ field, link, valid }) => {
  const result = await validateDocument({
    schema,
    client,
    getDocumentExists: async () => true,
    document: {
      _id: "event",
      _type: "event",
      _rev: "test",
      _createdAt: "2026-10-22T00:00:00Z",
      _updatedAt: "2026-10-22T00:00:00Z",
      [field]: {
        _type:
          field === "menuCard" ? "seasonalMenuCard" : "seasonalRelatedPage",
        title: "Dinner",
        description: "A seasonal dinner",
        action: "Explore",
        image: {
          _type: "menuImage",
          alt: "Dining room",
          asset: {
            _type: "reference",
            _ref: "image-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-800x600-jpg",
          },
        },
        ...link,
      },
    },
  });
  expect(result.markers.filter((marker) => marker.level === "error")).toEqual(
    valid
      ? []
      : expect.arrayContaining([
          expect.objectContaining({ path: [field, "href"] }),
        ]),
  );
});
