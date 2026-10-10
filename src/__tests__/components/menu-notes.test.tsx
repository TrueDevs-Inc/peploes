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
  });

  it("omits the panel when neither notes nor allergens exist", () => {
    expect(
      renderToStaticMarkup(<MenuNotes menu={{ notes: [] }} compact />),
    ).toBe("");
  });
});
