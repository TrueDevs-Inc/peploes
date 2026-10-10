import { describe, expect, it } from "vitest";

import {
  buildLlmsText,
  buildRobots,
  getOrganizationSchema,
  getWebsiteSchema,
} from "@/lib/seo";

describe("public discovery", function publicDiscoveryTests() {
  it("separates search, training, and mixed-use crawlers", function crawlerPolicyTest() {
    expect(buildRobots("https://example.com/", true)).toEqual({
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

  it("blocks every crawler outside production", function nonProductionPolicyTest() {
    expect(buildRobots("https://example.com", false)).toEqual({
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    });
  });

  it("builds a factual agent index from public site data", function llmsTextTest() {
    const content = buildLlmsText("https://example.com/");

    expect(content).toContain("# Peploe's");
    expect(content).toContain(
      "> A family-run restaurant on St Stephen's Green, Dublin, since 2002.",
    );
    expect(content).toContain("[Home](https://example.com/)");
    expect(content).toContain(
      "- [Visit & Contact](https://example.com/visit-contact): Opening hours, directions and contact details.",
    );
    expect(content).toContain("[Sitemap](https://example.com/sitemap.xml)");
    expect(content).not.toContain("production-ready");
    expect(content).not.toContain("Dynamic OG images");
    expect(content.endsWith("\n")).toBe(true);
  });
});

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
