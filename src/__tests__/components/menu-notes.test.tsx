import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { MenuNotes } from "@/components/app/molecules/menu-notes";
import type { IMenuNotesContent } from "@/lib/types";

vi.mock("@/lib/fonts", () => ({
  ebGaramond: { className: "" },
  ebGaramondItalic: { className: "" },
}));

const menu: IMenuNotesContent = {
  notes: ["Ask our team about the menu."],
  allergens: {
    heading: "Allergen information",
    description: "Tell your server about dietary requirements.",
  },
};

describe("menu notes reading order", () => {
  it.each([{}, { compact: true }, { collection: true }])(
    "shows allergen information as static content for %j",
    (layout) => {
      const html = renderToStaticMarkup(<MenuNotes menu={menu} {...layout} />);
      expect(html).toMatch(/<h2[^>]*>.*Allergen information.*<\/h2>/);
      expect(html).toContain("Tell your server about dietary requirements.");
      expect(html).not.toContain("<details");
      expect(html).not.toContain("<summary");
    },
  );
  it("reads allergens before notes in the compact layout", () => {
    const html = renderToStaticMarkup(<MenuNotes menu={menu} compact />);
    expect(html.indexOf("Allergen information")).toBeGreaterThan(-1);
    expect(html.indexOf("Allergen information")).toBeLessThan(
      html.indexOf("Ask our team about the menu."),
    );
  });

  it("reads notes before allergens in the standard layout", () => {
    const html = renderToStaticMarkup(<MenuNotes menu={menu} />);
    expect(html.indexOf("Ask our team about the menu.")).toBeGreaterThan(-1);
    expect(html.indexOf("Ask our team about the menu.")).toBeLessThan(
      html.indexOf("Allergen information"),
    );
  });

  it("retains allergen information when there are no notes", () => {
    const html = renderToStaticMarkup(
      <MenuNotes menu={{ notes: [], allergens: menu.allergens }} compact />,
    );
    expect(html).toContain("Allergen information");
    expect(html).toContain("Tell your server about dietary requirements.");
    expect(html).not.toContain("<details");
    expect(html).toContain("<h2");
  });

  it("omits the panel when neither notes nor allergens exist", () => {
    expect(
      renderToStaticMarkup(<MenuNotes menu={{ notes: [] }} compact />),
    ).toBe("");
  });
});
