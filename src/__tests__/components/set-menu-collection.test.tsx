import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { SetMenuCollection } from "@/components/app/compounds/set-menu-collection";
import type { ISetMenuCollection } from "@/lib/types";

vi.mock("@/lib/fonts", () => ({
  dmSans: { className: "" },
  ebGaramond: { className: "" },
  ebGaramondItalic: { className: "" },
}));

const menu: ISetMenuCollection = {
  slug: "group-set-menu",
  title: "Group menus",
  seoDescription: "Sample group menus",
  inclusionsHeading: "Served with your meal",
  menus: [
    {
      _key: "group-lunch",
      title: "Group lunch",
      price: 65,
      summary: "For groups of ten",
      inclusions: ["Sourdough", "Seasonal vegetables"],
      courses: [],
    },
  ],
  notes: [],
  booking: {
    heading: "Join us",
    label: "Enquire",
    image: { src: "/table.jpg", alt: "A dining table" },
  },
};

describe("set menu inclusions", () => {
  it("renders the editable heading and preserves the inclusion list order", () => {
    const html = renderToStaticMarkup(<SetMenuCollection menu={menu} />);
    const list = html.match(/<ul\b[^>]*>(.*?)<\/ul>/)?.[1] ?? "";
    const items = Array.from(list.matchAll(/<li\b[^>]*>(.*?)<\/li>/g), (item) =>
      item[1]
        .replace(/<[^>]+>/g, "")
        .replace("•", "")
        .trim(),
    );

    expect(items).toEqual(["Sourdough", "Seasonal vegetables"]);
    expect(html.indexOf("Served with your meal")).toBeGreaterThan(-1);
    expect(html.indexOf("Served with your meal")).toBeLessThan(
      html.indexOf("Sourdough"),
    );
  });

  it("keeps the inclusions when their optional heading is absent", () => {
    const html = renderToStaticMarkup(
      <SetMenuCollection menu={{ ...menu, inclusionsHeading: undefined }} />,
    );

    expect(html).not.toContain("Served with your meal");
    expect(html).toContain("Sourdough");
    expect(html).toContain("Seasonal vegetables");
  });

  it("omits the inclusion heading and list when the menu has no inclusions", () => {
    const html = renderToStaticMarkup(
      <SetMenuCollection
        menu={{ ...menu, menus: [{ ...menu.menus[0], inclusions: [] }] }}
      />,
    );

    expect(html).toContain("Group lunch");
    expect(html).not.toContain("Served with your meal");
    expect(html).not.toContain("<ul");
    expect(html).not.toContain("Sourdough");
  });
});
