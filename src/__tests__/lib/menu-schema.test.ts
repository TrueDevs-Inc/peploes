import { describe, expect, it } from "vitest";
import {
  drinksMenuSchema,
  menusPageSchema,
  setMenuCollectionSchema,
} from "@/lib/cms-menu-schema";
import {
  menuCourseSchema,
  menuImageSchema,
  menuPriceSchema,
} from "@/lib/menu-schema";

const image = {
  src: "https://cdn.sanity.io/images/testproject/development/photo-800x600.jpg",
  alt: "Dining room",
};
const dish = { _key: "soup", name: "Soup" };
const course = {
  _key: "starters",
  heading: "Starters",
  columns: 2,
  dishes: [dish],
};

describe("menu validation", () => {
  it.each([1, 3])(
    "ignores a two-column split override after changing to %s columns",
    (columns) => {
      const result = menuCourseSchema.parse({
        ...course,
        columns,
        firstColumnCount: 1,
      });
      expect(result.firstColumnCount).toBeUndefined();
    },
  );
  it.each([-1, 12.555, Infinity, NaN])(
    "rejects an invalid euro price: %s",
    (price) => {
      expect(menuPriceSchema.safeParse(price).success).toBe(false);
    },
  );
  it("preserves missing prices without replacing them with zero", () => {
    expect(menuCourseSchema.parse(course).dishes[0].price).toBeUndefined();
  });
  it("rejects repeated dish keys that would break React identity", () => {
    expect(
      menuCourseSchema.safeParse({ ...course, dishes: [dish, dish] }).success,
    ).toBe(false);
  });
  it("rejects section keys that cannot be used as stable anchors", () => {
    expect(
      menuCourseSchema.safeParse({ ...course, _key: "two words" }).success,
    ).toBe(false);
  });
  it("rejects images from unapproved hosts", () => {
    expect(
      menuImageSchema.safeParse({
        ...image,
        src: "https://example.com/photo.jpg",
      }).success,
    ).toBe(false);
  });
  it("requires meaningful image alt text", () => {
    expect(menuImageSchema.safeParse({ ...image, alt: "  " }).success).toBe(
      false,
    );
  });
  it("keeps seasonal entries, inclusions and service times in editor order", () => {
    const result = setMenuCollectionSchema.parse({
      _type: "setMenuCollection",
      slug: "seasonal",
      title: "Seasonal",
      seoDescription: "Seasonal dining",
      menus: [
        {
          _key: "lobster",
          title: "Lobster Week",
          price: 70,
          summary: "All guests",
          serviceTimes: "July",
          inclusions: ["Bread", "Sides"],
          courses: [course],
        },
        {
          _key: "christmas",
          title: "Christmas",
          price: 90,
          summary: "Groups",
          courses: [],
        },
      ],
    });
    expect(
      result.menus.map(({ _key, inclusions, serviceTimes }) => ({
        _key,
        inclusions,
        serviceTimes,
      })),
    ).toEqual([
      { _key: "lobster", inclusions: ["Bread", "Sides"], serviceTimes: "July" },
      { _key: "christmas", inclusions: [], serviceTimes: undefined },
    ]);
  });
  it("accepts empty cocktail sections while keeping separately ordered spirits", () => {
    const result = drinksMenuSchema.parse({
      _type: "drinksMenu",
      slug: "cocktails",
      title: "Cocktails",
      seoDescription: "Drinks",
      spiritsHeading: "Spirits",
      cocktailSections: [{ ...course, dishes: [] }],
      spirits: [{ ...course, _key: "gin" }],
    });
    expect(result.cocktailSections[0].dishes).toEqual([]);
  });
  it("rejects a repeated page in shared menu navigation", () => {
    expect(
      menusPageSchema.safeParse({
        eyebrow: "Menus",
        heading: "Our menus",
        description: "Explore",
        image,
        booking: { heading: "Visit", label: "Book", image },
        navigationLabel: "Menus",
        navigation: Array.from({ length: 7 }, () => ({
          menu: "lunch",
          label: "Lunch",
        })),
      }).success,
    ).toBe(false);
  });
});
