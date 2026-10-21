import { basename } from "node:path";
import { COCKTAILS_MENU } from "@/lib/constants/cocktails-menu";
import { DINNER_MENU } from "@/lib/constants/dinner-menu";
import { GROUP_SET_MENU } from "@/lib/constants/group-set-menu";
import { LUNCH_MENU } from "@/lib/constants/lunch-menu";
import { MENU_PAGE_CONTENT } from "@/lib/constants/menu-page";
import { PRE_THEATRE_MENU } from "@/lib/constants/pre-theatre-menu";
import { SEASONAL_MENU } from "@/lib/constants/seasonal-menu";
import { WINE_MENU } from "@/lib/constants/wine-menu";

// Preloaded only by Playwright's server command, never by the application.
if (
  process.env.SANITY_PROJECT_ID !== "testproject" ||
  process.env.SANITY_DATASET !== "development"
) {
  throw new Error(
    "Menu browser fixtures require the isolated testproject/development target.",
  );
}

function project(content: unknown): unknown {
  return JSON.parse(
    JSON.stringify(content, (key, value) => {
      if (key !== "src" || typeof value !== "string") return value;
      const file = basename(value);
      const pathname = `/images/testproject/development/${file}`;
      return `https://cdn.sanity.io${pathname}`;
    }),
  );
}

const menus = new Map([
  [LUNCH_MENU.slug, project({ ...LUNCH_MENU, _type: "restaurantMenu" })],
  [DINNER_MENU.slug, project({ ...DINNER_MENU, _type: "restaurantMenu" })],
  [
    PRE_THEATRE_MENU.slug,
    project({ ...PRE_THEATRE_MENU, _type: "restaurantMenu" }),
  ],
  [WINE_MENU.slug, project({ ...WINE_MENU, _type: "wineMenu" })],
  [COCKTAILS_MENU.slug, project({ ...COCKTAILS_MENU, _type: "drinksMenu" })],
  [
    GROUP_SET_MENU.slug,
    project({ ...GROUP_SET_MENU, _type: "setMenuCollection" }),
  ],
  [
    SEASONAL_MENU.slug,
    project({ ...SEASONAL_MENU, _type: "setMenuCollection" }),
  ],
]);
const settings = project({
  ...MENU_PAGE_CONTENT,
  navigation: MENU_PAGE_CONTENT.navigation.map((item) => ({
    label: ["/menus/group-set-menu", "/menus/seasonal"].includes(item.href)
      ? "Special menus"
      : item.label,
    menu: item.href.split("/").at(-1),
  })),
});
const collections = [GROUP_SET_MENU, SEASONAL_MENU].map((menu) => ({
  slug: menu.slug,
  menus: menu.menus.map((item) => ({ _key: item._key, title: item.title })),
}));
function queryResult(url: URL): unknown {
  const query = url.searchParams.get("query") ?? "";
  const slug = url.searchParams.get("$slug");
  if (slug) {
    const menu = menus.get(JSON.parse(slug));
    return menu ? [menu] : [];
  }
  if (query.includes('_id == "menus-page"')) return settings;
  if (query.includes('_type == "setMenuCollection"')) return collections;
  throw new Error(`No browser fixture for Sanity query: ${query}`);
}

const fetchNetwork = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = new URL(input instanceof Request ? input.url : input);
  if (!url.hostname.endsWith(".api.sanity.io"))
    return await fetchNetwork(input, init);
  if (
    url.hostname !== "testproject.api.sanity.io" ||
    url.pathname !== "/v2026-10-06/data/query/development" ||
    (init?.method ?? "GET") !== "GET"
  ) {
    throw new Error(
      `Unexpected Sanity request in browser tests: ${url.origin}${url.pathname}`,
    );
  }
  return Response.json({ result: queryResult(url) });
};
