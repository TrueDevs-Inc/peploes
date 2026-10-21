import { err, ok } from "neverthrow";
import { describe, expect, it, vi } from "vitest";
import { ErrorCode } from "@/lib/enums";
import { createError } from "@/lib/errors";
import {
  fetchMenu,
  fetchMenuCollections,
  fetchMenusPage,
} from "@/lib/sanity-provider";
import {
  getMenu,
  getMenuCollections,
  getMenusPage,
} from "@/services/restaurant-menus";

vi.mock("@/lib/sanity-provider", () => ({
  fetchMenu: vi.fn(),
  fetchMenusPage: vi.fn(),
  fetchMenuCollections: vi.fn(),
}));

const publishedMenu = {
  _type: "restaurantMenu",
  slug: "dinner",
  title: "Dinner",
  serviceTimes: "From 5pm",
  seoDescription: "Dinner at Peploe's",
  courses: [],
};

describe("published menu service", () => {
  it("returns the requested menu without filling empty content from local fixtures", async () => {
    vi.mocked(fetchMenu).mockResolvedValue(ok([publishedMenu]));
    const result = await getMenu("dinner");
    expect(
      result.isOk() && result.value._type === "restaurantMenu"
        ? result.value.courses
        : null,
    ).toEqual([]);
  });
  it("reports a missing or unpublished menu as not found", async () => {
    vi.mocked(fetchMenu).mockResolvedValue(ok([]));
    const result = await getMenu("dinner");
    expect(result.isErr() ? result.error.code : null).toBe(ErrorCode.NotFound);
  });
  it("rejects duplicate published URL names instead of choosing arbitrary content", async () => {
    vi.mocked(fetchMenu).mockResolvedValue(ok([publishedMenu, publishedMenu]));
    const result = await getMenu("dinner");
    expect(result.isErr() ? result.error.code : null).toBe(
      ErrorCode.InternalError,
    );
  });
  it("does not replace a network failure with a preview menu", async () => {
    vi.mocked(fetchMenu).mockResolvedValue(
      err(createError(ErrorCode.InternalError, "Network unavailable")),
    );
    const result = await getMenu("dinner");
    expect(result.isErr() ? result.error.message : null).toBe(
      "Network unavailable",
    );
  });
  it("rejects malformed menu content from the CMS", async () => {
    vi.mocked(fetchMenu).mockResolvedValue(
      ok([{ ...publishedMenu, courses: [{ heading: "Missing keys" }] }]),
    );
    expect((await getMenu("dinner")).isErr()).toBe(true);
  });
  it("rejects content for a different menu", async () => {
    vi.mocked(fetchMenu).mockResolvedValue(
      ok([{ ...publishedMenu, slug: "lunch" }]),
    );
    expect((await getMenu("dinner")).isErr()).toBe(true);
  });
});

describe("shared menu content", () => {
  it("keeps the current shared design when no settings have been published", async () => {
    vi.mocked(fetchMenusPage).mockResolvedValue(ok(null));
    const result = await getMenusPage();
    expect(
      result.isOk() ? result.value.navigation.map((link) => link.menu) : [],
    ).toEqual([
      "lunch",
      "dinner",
      "pre-theatre",
      "wine",
      "cocktails",
      "group-set-menu",
      "seasonal",
    ]);
  });
  it("does not hide a shared settings network failure behind default content", async () => {
    vi.mocked(fetchMenusPage).mockResolvedValue(
      err(createError(ErrorCode.InternalError, "Connection failed")),
    );
    const result = await getMenusPage();
    expect(result.isErr() ? result.error.message : null).toBe(
      "Connection failed",
    );
  });
  it("rejects malformed published settings instead of silently ignoring them", async () => {
    vi.mocked(fetchMenusPage).mockResolvedValue(ok({ heading: "Incomplete" }));
    expect((await getMenusPage()).isErr()).toBe(true);
  });
  it("keeps the editor's collection order for navigation", async () => {
    vi.mocked(fetchMenuCollections).mockResolvedValue(
      ok([
        {
          slug: "seasonal",
          menus: [
            { _key: "lobster", title: "Lobster Week" },
            { _key: "christmas", title: "Christmas" },
          ],
        },
      ]),
    );
    const result = await getMenuCollections();
    expect(
      result.isOk() ? result.value[0].menus.map((menu) => menu._key) : [],
    ).toEqual(["lobster", "christmas"]);
  });
  it("rejects duplicate collection documents instead of linking to an arbitrary menu", async () => {
    vi.mocked(fetchMenuCollections).mockResolvedValue(
      ok([
        { slug: "seasonal", menus: [] },
        { slug: "seasonal", menus: [] },
      ]),
    );
    expect((await getMenuCollections()).isErr()).toBe(true);
  });
});
