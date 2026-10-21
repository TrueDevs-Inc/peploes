import { describe, expect, it } from "vitest";
import { restaurantMenuSchema } from "@/lib/restaurant-menu-schema";

const menu = {
  title: "Dinner",
  slug: "dinner",
  serviceTimes: "From 5pm",
  seoDescription: "Dinner at Peploe's",
  courses: [
    {
      _key: "starters",
      heading: "Starters",
      columns: 2,
      dishes: [{ _key: "soup", name: "Soup", price: 0 }],
    },
  ],
};

describe("published menu validation", () => {
  it("preserves an optional offer entered by an editor", () => {
    expect(
      restaurantMenuSchema.parse({ ...menu, offer: "Two courses €40" }).offer,
    ).toBe("Two courses €40");
  });

  it.each(["lunch", "dinner", "pre-theatre"])(
    "preserves entered and empty dish prices for %s",
    (slug) => {
      const result = restaurantMenuSchema.parse({
        ...menu,
        slug,
        courses: [
          {
            ...menu.courses[0],
            kind: "starters",
            dishes: [
              { _key: "soup", name: "Soup", price: 12.5 },
              { _key: "bread", name: "Bread", price: 0 },
              { _key: "salad", name: "Salad" },
              { _key: "prawns", name: "Prawns", price: null },
            ],
          },
        ],
      });
      expect(result.courses[0].dishes.map((dish) => dish.price)).toEqual([
        12.5,
        0,
        undefined,
        null,
      ]);
    },
  );
});
