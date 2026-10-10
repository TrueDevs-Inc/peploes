import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { MenuCourse } from "@/components/app/molecules/menu-course";
import type { IMenuCourse } from "@/lib/types";

vi.mock("@/lib/fonts", () => ({ ebGaramond: { className: "" } }));

const dishes = [
  { _key: "soup", name: "Soup" },
  { _key: "salad", name: "Salad" },
  { _key: "prawns", name: "Prawns" },
  { _key: "tuna", name: "Tuna" },
  { _key: "cheese", name: "Cheese" },
  { _key: "aubergine", name: "Aubergine" },
  { _key: "croquettes", name: "Croquettes" },
  { _key: "tomatoes", name: "Tomatoes" },
];

describe("menu course rendering", () => {
  it.each([1, 2, 3] as const)(
    "preserves every dish in reading order with %i columns and a custom first column",
    (columns) => {
      const course: IMenuCourse = {
        _key: "starters",
        heading: "Starters",
        columns,
        firstColumnCount: 2,
        dishes,
      };
      const html = renderToStaticMarkup(<MenuCourse course={course} />);
      const names = Array.from(
        html.matchAll(/<h3[^>]*>(.*?)<\/h3>/g),
        (match) => match[1],
      );

      expect(names).toEqual([
        "Soup",
        "Salad",
        "Prawns",
        "Tuna",
        "Cheese",
        "Aubergine",
        "Croquettes",
        "Tomatoes",
      ]);
    },
  );

  it("keeps the requested first column and distributes the remaining dishes", () => {
    const html = renderToStaticMarkup(
      <MenuCourse
        course={{
          _key: "starters",
          heading: "Starters",
          columns: 3,
          firstColumnCount: 2,
          dishes,
        }}
      />,
    );
    const columns = Array.from(
      html.matchAll(/<ul[^>]*>(.*?)<\/ul>/g),
      (match) =>
        Array.from(
          match[1].matchAll(/<h3[^>]*>(.*?)<\/h3>/g),
          (dish) => dish[1],
        ),
    );

    expect(columns).toEqual([
      ["Soup", "Salad"],
      ["Prawns", "Tuna", "Cheese"],
      ["Aubergine", "Croquettes", "Tomatoes"],
    ]);
  });

  it("omits an empty course", () => {
    expect(
      renderToStaticMarkup(
        <MenuCourse
          course={{ _key: "empty", heading: "Empty", columns: 3, dishes: [] }}
        />,
      ),
    ).toBe("");
  });
});
