import { afterEach, describe, expect, it, vi } from "vitest";

import { publishedEvent } from "@/__tests__/fixtures/seasonal";
import { JsonLd } from "@/components/app/atoms/json-ld";
import {
  buildSeoMetadata,
  getBreadcrumbSchema,
  getSeasonalBreadcrumb,
  getSectionBreadcrumbSchema,
  getSiteGraph,
} from "@/lib/seo";

const ORGANIZATION_ID = "http://localhost:3000/#organization";
const WEBSITE_ID = "http://localhost:3000/#website";

describe("site graph", function siteGraphTests() {
  const graph = getSiteGraph();
  const organization = graph["@graph"][0];
  const website = graph["@graph"][1];

  it("links the website to the organization by stable @id", function linkTest() {
    expect(graph["@context"]).toBe("https://schema.org");
    expect(organization["@id"]).toBe(ORGANIZATION_ID);
    expect(website["@id"]).toBe(WEBSITE_ID);
    expect(website.publisher).toEqual({ "@id": ORGANIZATION_ID });
  });

  it("publishes only facts the site already states", function factsTest() {
    expect(organization).toEqual({
      "@type": "Organization",
      "@id": ORGANIZATION_ID,
      name: "Peploe's",
      url: "http://localhost:3000",
      telephone: "+35316763144",
      email: "reception@peploes.com",
      address: {
        "@type": "PostalAddress",
        streetAddress: "16 St Stephen's Green",
        addressLocality: "Dublin 2",
        addressCountry: "IE",
      },
    });
    expect(website["@type"]).toBe("WebSite");
    expect(JSON.stringify(graph)).not.toMatch(
      /logo|openingHours|servesCuisine|priceRange|sameAs|aggregateRating|geo/u,
    );
  });
});

describe("JsonLd", function jsonLdTests() {
  it("escapes < so page text cannot close the script tag", function escapeTest() {
    const element = JsonLd({ data: { name: "</script><b>x" } });
    const html = element.props.dangerouslySetInnerHTML.__html as string;

    expect(html).not.toContain("<");
    expect(JSON.parse(html)).toEqual({ name: "</script><b>x" });
  });
});

describe("breadcrumb schema", function breadcrumbTests() {
  it("numbers items and resolves absolute URLs", function breadcrumbTest() {
    expect(
      getBreadcrumbSchema([
        { name: "Peploe's", url: "/" },
        { name: "Private Dining & Events", url: "/private-dining" },
        { name: "Weddings", url: "/private-dining/weddings" },
      ]).itemListElement,
    ).toEqual([
      {
        "@type": "ListItem",
        position: 1,
        name: "Peploe's",
        item: "http://localhost:3000/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Private Dining & Events",
        item: "http://localhost:3000/private-dining",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Weddings",
        item: "http://localhost:3000/private-dining/weddings",
      },
    ]);
  });
});

describe("section breadcrumb schema", function sectionBreadcrumbTests() {
  it("starts at the home page and ends at the current page", function sectionTest() {
    const names = getSectionBreadcrumbSchema(
      { name: "What’s On", url: "/seasonal" },
      { name: "Wine dinner", url: "/seasonal/wine-dinner" },
    ).itemListElement.map((item) => [item.position, item.name, item.item]);

    expect(names).toEqual([
      [1, "Peploe's", "http://localhost:3000/"],
      [2, "What’s On", "http://localhost:3000/seasonal"],
      [3, "Wine dinner", "http://localhost:3000/seasonal/wine-dinner"],
    ]);
  });
});

describe("seasonal breadcrumb", function seasonalBreadcrumbTests() {
  const entry = {
    ...publishedEvent,
    noIndex: false,
    details: [],
  } as unknown as Parameters<typeof getSeasonalBreadcrumb>[0];

  it("links an indexable entry back to What’s On and home", function indexableTest() {
    const names = getSeasonalBreadcrumb(entry)?.itemListElement.map(
      (item) => item.name,
    );

    expect(names).toEqual(["Peploe's", "What’s On", "Sample event"]);
  });

  it("emits nothing while the entry is noindex", function noIndexTest() {
    expect(getSeasonalBreadcrumb({ ...entry, noIndex: true })).toBeNull();
  });
});

describe("page indexing metadata", () => {
  afterEach(() => vi.unstubAllEnvs());
  const config = { title: "Page", description: "Page.", url: "/page" };

  it.each(["production", "preview", "development", ""])(
    "uses the page setting regardless of deployment %s",
    async (deployment) => {
      vi.resetModules();
      vi.stubEnv("VERCEL_ENV", deployment);
      const { buildSeoMetadata: metadata } = await import("@/lib/seo");
      expect(metadata(config).robots).toEqual({ index: true, follow: true });
      expect(metadata({ ...config, noIndex: true }).robots).toEqual({
        index: false,
        follow: true,
      });
    },
  );

  it("declares the real size of a social image", function imageSizeTest() {
    expect(
      buildSeoMetadata({
        ...config,
        image: "/a.png",
        imageAlt: "Alt",
        imageWidth: 10,
        imageHeight: 20,
      }).openGraph?.images,
    ).toEqual([{ url: "/a.png", alt: "Alt", width: 10, height: 20 }]);
  });
});
