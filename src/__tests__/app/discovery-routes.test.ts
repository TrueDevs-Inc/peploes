import { describe, expect, it, vi } from "vitest";

import { publishedEvent } from "@/__tests__/fixtures/seasonal";

const edges = vi.hoisted(() => ({
  entries: [] as unknown[],
  cards: [] as unknown[] | null,
}));

vi.mock("@/lib/seasonal-content", () => ({
  loadSeasonalEntries: () => Promise.resolve(edges.entries),
}));

vi.mock("@/services/seasonal", async () => {
  const { err, ok } = await import("neverthrow");
  return {
    getSeasonalEntries: () =>
      Promise.resolve(edges.cards ? ok(edges.cards) : err(new Error("down"))),
  };
});

const published = {
  ...publishedEvent,
  slug: "wine-dinner",
  title: "Wine dinner",
  summary: "A seasonal wine dinner.",
  noIndex: false,
};
const hidden = { ...publishedEvent, slug: "draft-event", noIndex: true };

describe("sitemap", function sitemapTests() {
  it("includes published events and excludes noindex entries", async function sitemapTest() {
    edges.entries = [published, hidden];
    const { default: sitemap } = await import("@/app/sitemap");
    const urls = (await sitemap()).map((entry) => entry.url);

    expect(urls).toContain("http://localhost:3000/seasonal/wine-dinner");
    expect(urls).not.toContain("http://localhost:3000/seasonal/draft-event");
    expect(urls).toContain("http://localhost:3000/our-story");
  });
});

describe("llms.txt route", function llmsRouteTests() {
  it("lists only published entries as markdown", async function llmsRouteTest() {
    edges.cards = [published, hidden];
    const { GET } = await import("@/app/llms.txt/route");
    const response = await GET();
    const body = await response.text();

    expect(response.headers.get("Content-Type")).toBe(
      "text/markdown; charset=utf-8",
    );
    expect(response.headers.get("Cache-Control")).toContain("s-maxage=3600");
    expect(body).toContain(
      "- [Wine dinner](http://localhost:3000/seasonal/wine-dinner): A seasonal wine dinner. Event, 2026-12-01.",
    );
    expect(body).not.toContain("draft-event");
  });

  it("falls back to the static sections when the CMS fails", async function llmsFailureTest() {
    edges.cards = null;
    const { GET } = await import("@/app/llms.txt/route");
    const response = await GET();
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain("## Menus");
    expect(body).not.toContain("What’s On entries");
  });
});
