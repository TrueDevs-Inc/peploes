import { describe, expect, it } from "vitest";

import { ROUTES, SITEMAP_STATIC_ROUTES } from "@/lib/constants";
import {
  buildLlmsText,
  buildRobots,
  getOrganizationSchema,
  getWebsiteSchema,
  LLMS_SECTIONS,
} from "@/lib/seo";

describe("public discovery", function publicDiscoveryTests() {
  it("separates search, training, and mixed-use crawlers", function crawlerPolicyTest() {
    expect(buildRobots("https://example.com/")).toEqual({
      rules: [
        {
          userAgent: ["OAI-SearchBot", "PerplexityBot", "Claude-SearchBot"],
          allow: "/",
        },
        {
          userAgent: ["GPTBot", "ClaudeBot"],
          disallow: "/",
        },
        {
          userAgent: ["Google-Extended", "CCBot"],
          allow: "/",
        },
        {
          userAgent: "*",
          allow: "/",
        },
      ],
      sitemap: "https://example.com/sitemap.xml",
    });
  });

  it("links every listed page with an absolute URL and a description", function llmsStructureTest() {
    const content = buildLlmsText("https://example.com/");

    for (const section of LLMS_SECTIONS) {
      expect(content).toContain(`## ${section.heading}`);
      for (const page of section.pages) {
        const url =
          page.path === "/"
            ? "https://example.com/"
            : `https://example.com${page.path}`;
        expect(content).toMatch(
          new RegExp(
            `^- \\[${escapeRegExp(page.name)}\\]\\(${escapeRegExp(url)}\\): \\S.+$`,
            "mu",
          ),
        );
      }
    }
  });

  it("states the restaurant and a couple of known pages", function llmsLiteralTest() {
    const content = buildLlmsText("https://example.com");

    expect(content).toContain("# Peploe's");
    expect(content).toContain(
      "- [Home](https://example.com/): A family-run restaurant on St Stephen's Green, Dublin, since 2003.",
    );
    expect(content).toContain(
      "- [The Journal](https://example.com/journal): Food, wine, people, produce, art and the life of the restaurant.",
    );
    expect(content).toContain(
      "- [Wine List](https://example.com/menus?menu=wine): ",
    );
    expect(content.endsWith("\n")).toBe(true);
  });

  it("builds the same URLs for a site URL with or without a trailing slash", function llmsSlashTest() {
    expect(buildLlmsText("https://example.com/")).toBe(
      buildLlmsText("https://example.com"),
    );
  });

  it("omits the noindex booking preview and placeholder text", function llmsPlaceholderTest() {
    const content = buildLlmsText("https://example.com/");

    expect(content).not.toContain("/book-a-table");
    expect(content).not.toContain("Application home page");
    expect(content).not.toContain("production-ready");
    expect(content).not.toContain("Campaign/Event Title");
  });

  it("labels What’s On entries by kind and omits the section when there are none", function llmsEntriesTest() {
    expect(buildLlmsText("https://example.com")).not.toContain(
      "What’s On entries",
    );

    const content = buildLlmsText("https://example.com", [
      {
        slug: "wine-dinner",
        title: "Wine dinner",
        summary: "A seasonal wine dinner.",
        kind: "event",
        date: "2026-12-01",
        endDate: "2026-12-03",
      },
      {
        slug: "christmas",
        title: "Christmas",
        summary: "Festive menus.",
        kind: "campaign",
        date: "2026-11-10",
      },
      {
        slug: "oysters",
        title: "Oysters",
        summary: "Oysters are in.",
        kind: "menuMoment",
        date: "2026-10-01",
      },
    ]);

    expect(content).toContain("## What’s On entries");
    expect(content).toContain(
      "- [Wine dinner](https://example.com/seasonal/wine-dinner): A seasonal wine dinner. Event, 2026-12-01 to 2026-12-03.",
    );
    expect(content).toContain(
      "- [Christmas](https://example.com/seasonal/christmas): Festive menus. Campaign, 2026-11-10.",
    );
    expect(content).toContain(
      "- [Oysters](https://example.com/seasonal/oysters): Oysters are in. Menu moment, 2026-10-01.",
    );
  });

  it("keeps CMS text from breaking an entry's link or line", function llmsEscapeTest() {
    const content = buildLlmsText("https://example.com", [
      {
        slug: "brunch",
        title: "Chef`s [new](https://evil.example)",
        summary: "Eggs.\n\n## Fake heading",
        kind: "event",
        date: "2026-12-01",
      },
    ]);

    expect(content).toContain(
      "- [Chef\\`s \\[new\\](https://evil.example)](https://example.com/seasonal/brunch): Eggs. ## Fake heading Event, 2026-12-01.",
    );
    expect(content).not.toContain("\n## Fake heading");
  });

  it("keeps the sitemap and llms.txt page lists in step", function llmsDriftTest() {
    const policyPages: string[] = [
      ROUTES.PRIVACY_COOKIES,
      ROUTES.ACCESSIBILITY_POLICY,
      ROUTES.TERMS_CONDITIONS,
      ROUTES.BOOKING_CANCELLATION_TERMS,
    ];
    const listed = LLMS_SECTIONS.flatMap((section) =>
      section.pages.map((page) => page.path),
    );
    const sitemapOnly = SITEMAP_STATIC_ROUTES.filter(
      (route) => !listed.includes(route),
    );

    expect(sitemapOnly.sort()).toEqual(policyPages.sort());
    expect(
      listed.filter((path) => !SITEMAP_STATIC_ROUTES.includes(path as never)),
    ).toEqual([]);
  });
});

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

describe("site-level structured data", function structuredDataTests() {
  it("does not invent a site search action", function websiteSchemaTest() {
    expect(
      getWebsiteSchema({
        name: "Example",
        description: "Public example site.",
        url: "https://example.com",
      }),
    ).toEqual({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Example",
      description: "Public example site.",
      url: "https://example.com",
    });
  });

  it("publishes only supplied organization facts", function organizationSchemaTest() {
    expect(
      getOrganizationSchema({
        name: "Example Ltd",
        url: "https://example.com",
        logoUrl: "https://example.com/logo.png",
      }),
    ).toEqual({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Example Ltd",
      url: "https://example.com",
      logo: "https://example.com/logo.png",
    });
  });
});
