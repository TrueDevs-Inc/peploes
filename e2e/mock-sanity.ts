import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { basename } from "node:path";
import { COCKTAILS_MENU } from "@/lib/constants/cocktails-menu";
import { DINNER_MENU } from "@/lib/constants/dinner-menu";
import { GROUP_SET_MENU } from "@/lib/constants/group-set-menu";
import { LUNCH_MENU } from "@/lib/constants/lunch-menu";
import { MENU_PAGE_CONTENT } from "@/lib/constants/menu-page";
import { PRE_THEATRE_MENU } from "@/lib/constants/pre-theatre-menu";
import { SEASONAL_MENU } from "@/lib/constants/seasonal-menu";
import { WINE_MENU } from "@/lib/constants/wine-menu";
import {
  journalArticleFixtures,
  journalArticles,
  journalCategories,
  journalGrowersRelatedFixtures,
  journalPageFixture,
} from "./journal-fixtures";
import { seasonalFixtures, seasonalPageFixture } from "./seasonal-fixtures";

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
    label: ["/menus?menu=group-set-menu", "/menus?menu=seasonal"].includes(
      item.href,
    )
      ? "Special menus"
      : item.label,
    menu: new URL(item.href, "https://example.com").searchParams.get("menu"),
  })),
});
const collections = [GROUP_SET_MENU, SEASONAL_MENU].map((menu) => ({
  slug: menu.slug,
  menus: menu.menus.map((item) => ({ _key: item._key, title: item.title })),
}));
function relatedJournalQueryResult(params: URLSearchParams): unknown {
  const categorySlug = JSON.parse(params.get("$categorySlug") ?? "null");
  const currentSlug = JSON.parse(params.get("$currentSlug") ?? "null");
  // The Growers frame has its own related-story content scenario.
  const articles =
    currentSlug === "growers-we-work-with"
      ? journalGrowersRelatedFixtures
      : journalArticles;
  return project(
    articles
      .filter(
        (article) =>
          article.category.slug === categorySlug &&
          article.slug !== currentSlug,
      )
      .sort(
        (a, b) =>
          b.date.localeCompare(a.date) ||
          a.slug.localeCompare(b.slug) ||
          a._id.localeCompare(b._id),
      )
      .slice(0, 3),
  );
}

function journalQueryResult(
  query: string,
  slug: string | null,
  params: URLSearchParams,
): unknown {
  if (query.includes('_type == "journalPage"'))
    return project(journalPageFixture);
  if (query.includes('_type == "journalCategory"')) return journalCategories;
  if (query.includes('_type == "journalArticle"')) {
    if (query.includes("$categorySlug"))
      return relatedJournalQueryResult(params);
    const articles = slug
      ? journalArticleFixtures.filter(
          (article) => article.slug === JSON.parse(slug),
        )
      : journalArticles;
    if (query.startsWith("count(")) return articles.length;
    if (!slug && !query.includes("heroImage"))
      return articles.map(({ slug, _updatedAt, noIndex }) => ({
        slug,
        _updatedAt,
        noIndex,
      }));
    return project(articles);
  }
  throw new Error(`No browser fixture for Sanity query: ${query}`);
}

function queryResult(url: URL): unknown {
  const query = url.searchParams.get("query") ?? "";
  const slug = url.searchParams.get("$slug");
  if (query.includes('_type == "journal'))
    return journalQueryResult(query, slug, url.searchParams);
  if (query.includes('_type == "whatsOnPage"'))
    return project(seasonalPageFixture);
  if (query.includes('_type == "seasonalEntry"')) {
    const statePath = ".next/e2e/published-seasonal-slugs.json";
    const publishedSlugs: string[] = existsSync(statePath)
      ? JSON.parse(readFileSync(statePath, "utf8"))
      : seasonalFixtures.map((entry) => entry.slug);
    const published = seasonalFixtures.filter((entry) =>
      publishedSlugs.includes(entry.slug),
    );
    const events = slug
      ? published.filter((entry) => entry.slug === JSON.parse(slug))
      : published;
    if (query.startsWith("defined(")) return events.length > 0;
    return project(events);
  }
  if (slug) {
    const menu = menus.get(JSON.parse(slug));
    return menu ? [menu] : [];
  }
  if (query.includes('_id == "menus-page"')) return settings;
  if (query.includes('_type == "setMenuCollection"')) return collections;
  throw new Error(`No browser fixture for Sanity query: ${query}`);
}

const fetchNetwork = globalThis.fetch;
const emailAttempts = new Map<string, number>();
function emailReply(url: URL, init: RequestInit | undefined): Response {
  if (url.pathname !== "/emails" || init?.method !== "POST") {
    throw new Error("Unexpected Resend browser-test request.");
  }
  const key = new Headers(init.headers).get("Idempotency-Key");
  if (!key) throw new Error("Missing browser-test idempotency key.");
  const body: unknown = JSON.parse(String(init.body));
  if (
    typeof body !== "object" ||
    body === null ||
    !("text" in body) ||
    typeof body.text !== "string"
  ) {
    throw new Error("Invalid browser-test email payload.");
  }
  const attempt = (emailAttempts.get(key) ?? 0) + 1;
  emailAttempts.set(key, attempt);
  const rejected = body.text.includes("REJECT_ONCE") && attempt === 1;
  appendFileSync(
    ".next/e2e/email-sends.ndjson",
    `${JSON.stringify({ key, status: rejected ? "rejected" : "accepted" })}\n`,
  );
  return Response.json(
    rejected ? { name: "validation_error" } : { id: `resend-${key}` },
    { status: rejected ? 422 : 200 },
  );
}

globalThis.fetch = async (input, init) => {
  const url = new URL(input instanceof Request ? input.url : input);
  if (
    process.env.EMAIL_E2E_BUILD === "1" &&
    url.origin === "https://api.resend.com"
  ) {
    return emailReply(url, init);
  }
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
  const delayPath = ".next/e2e/content-delay.json";
  if (existsSync(delayPath)) {
    const delay: number = JSON.parse(readFileSync(delayPath, "utf8"));
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  return Response.json({ result: queryResult(url) });
};
