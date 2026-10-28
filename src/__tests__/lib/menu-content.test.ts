import { ok } from "neverthrow";
import { describe, expect, it, vi } from "vitest";
import { MENU_SLUGS } from "@/lib/constants";
import { MENU_PAGE_CONTENT } from "@/lib/constants/menu-page";
import { getMenuBooking, loadMenuNavigation } from "@/lib/menu-content";
import type { IMenuBooking } from "@/lib/types";
import { getMenuCollections, getMenusPage } from "@/services/restaurant-menus";

const booking: IMenuBooking = {
  heading: "Book your visit",
  label: "Book a table",
  image: { src: "/table.jpg", alt: "A dining table" },
};

describe("CMS menu booking destinations", () => {
  it.each(["lunch", "dinner", "pre-theatre", "wine", "cocktails"] as const)(
    "keeps the %s booking action linked when CMS content has no destination",
    (slug) => {
      expect(getMenuBooking(slug, booking).href).toBe("/book-a-table");
    },
  );

  it("sends group menu visitors to the private dining enquiry", () => {
    expect(getMenuBooking("group-set-menu", booking).href).toBe(
      "/private-dining#enquire",
    );
  });

  it("keeps the seasonal action inactive even with shared booking defaults", () => {
    expect(
      getMenuBooking("seasonal", { ...booking, href: "/book-a-table" }).href,
    ).toBeUndefined();
  });
});

vi.mock("next/server", () => ({ connection: vi.fn() }));
vi.mock("@/services/restaurant-menus", () => ({
  getMenu: vi.fn(),
  getMenusPage: vi.fn(),
  getMenuCollections: vi.fn(),
}));

it("preserves the published menu order and destinations in CMS navigation", async () => {
  vi.mocked(getMenusPage).mockResolvedValue(
    ok({
      ...MENU_PAGE_CONTENT,
      navigation: MENU_SLUGS.map((menu) => ({ menu, label: menu })),
    }),
  );
  vi.mocked(getMenuCollections).mockResolvedValue(ok([]));
  const navigation = await loadMenuNavigation();
  expect(navigation.map((item) => item.href)).toEqual([
    "/menus?menu=lunch",
    "/menus?menu=dinner",
    "/menus?menu=pre-theatre",
    "/menus?menu=wine",
    "/menus?menu=cocktails",
    "/menus?menu=group-set-menu",
    "/menus?menu=seasonal",
  ]);
});
