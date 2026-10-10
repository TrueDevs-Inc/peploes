import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { DrinksMenu } from "@/components/app/compounds/drinks-menu";
import { MenuDish } from "@/components/app/molecules/menu-dish";
import type { IDrinksMenuContent, IMenuDish } from "@/lib/types";

vi.mock("@/lib/fonts", () => ({
  dmSans: { className: "" },
  ebGaramond: { className: "" },
  ebGaramondItalic: { className: "" },
}));

const drinksMenu: IDrinksMenuContent = {
  slug: "cocktails",
  title: "Drinks",
  seoDescription: "Sample drinks menu",
  cocktailSections: [],
  spiritsHeading: "Spirits",
  spirits: [],
  notes: [],
  booking: {
    heading: "Join us",
    label: "Book a Table",
    image: { src: "/table.jpg", alt: "A dining table" },
  },
};

describe("menu price rendering", () => {
  it.each([
    { label: "default", price: 7, expected: "€7" },
    { label: "override", price: 7, priceDecimalPlaces: 2, expected: "€7.00" },
    { label: "missing", price: null, priceDecimalPlaces: 2, expected: null },
    { label: "zero", price: 0, priceDecimalPlaces: 2, expected: "€0.00" },
  ] satisfies (Pick<IMenuDish, "price" | "priceDecimalPlaces"> & {
    label: string;
    expected: string | null;
  })[])(
    "renders a food price with $label formatting",
    ({ label, expected, ...price }) => {
      const html = renderToStaticMarkup(
        <MenuDish dish={{ _key: label, name: "Sample dish", ...price }} />,
      );

      expect(html).toContain("Sample dish");
      expect(html.match(/€\d+(?:\.\d+)?/g) ?? []).toEqual(
        expected === null ? [] : [expected],
      );
    },
  );

  it("honors cocktail precision without removing unpriced drinks", () => {
    const html = renderToStaticMarkup(
      <DrinksMenu
        menu={{
          ...drinksMenu,
          cocktailSections: [
            {
              _key: "aperitifs",
              heading: "Aperitifs",
              columns: 1,
              dishes: [
                { _key: "default", name: "Default cocktail", price: 12 },
                {
                  _key: "override",
                  name: "Precise cocktail",
                  price: 12,
                  priceDecimalPlaces: 2,
                },
                {
                  _key: "missing",
                  name: "Unpriced cocktail",
                  priceDecimalPlaces: 2,
                },
                { _key: "zero", name: "Complimentary cocktail", price: 0 },
              ],
            },
          ],
        }}
      />,
    );

    expect(html).toContain("Unpriced cocktail");
    expect(html.match(/€\d+(?:\.\d+)?/g)).toEqual(["€12", "€12.00", "€0"]);
  });

  it("retains spirit decimals by default and permits a whole-price override", () => {
    const html = renderToStaticMarkup(
      <DrinksMenu
        menu={{
          ...drinksMenu,
          spirits: [
            {
              _key: "spirits",
              heading: "Selection",
              columns: 1,
              dishes: [
                { _key: "default", name: "Default spirit", price: 7.5 },
                {
                  _key: "override",
                  name: "Whole-price spirit",
                  price: 375,
                  priceDecimalPlaces: 0,
                },
                { _key: "missing", name: "Unpriced spirit" },
                { _key: "zero", name: "Complimentary spirit", price: 0 },
              ],
            },
          ],
        }}
      />,
    );

    expect(html).toContain("Unpriced spirit");
    expect(html.match(/€\d+(?:\.\d+)?/g)).toEqual(["€7.50", "€375", "€0.00"]);
  });
});
