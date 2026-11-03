import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { publishedArticle } from "@/__tests__/fixtures/journal";
import { JournalArticle } from "@/components/app/compounds/journal-article";
import { journalArticleSchema } from "@/lib/journal-schema";

vi.mock("@/components/ui/button.module.css", () => ({ default: {} }));

vi.mock("@/lib/fonts", () => ({
  dmSans: { className: "" },
  ebGaramond: { variable: "" },
}));

vi.mock("@/components/app/compounds/journal-article.module.css", () => ({
  default: {},
}));
vi.mock("@/components/app/molecules/journal-story-card.module.css", () => ({
  default: {},
}));

describe("Journal article", () => {
  it("applies authored hero framing without passing positioning fields to images", () => {
    const article = journalArticleSchema.parse({
      ...publishedArticle,
      heroImage: {
        ...publishedArticle.heroImage,
        desktopPosition: "center 95%",
        mobilePosition: "center 40%",
      },
    });
    const html = renderToStaticMarkup(
      <JournalArticle
        article={article}
        relatedArticles={[{ ...article, _id: "related", slug: "related" }]}
        articleAction="Read story"
      />,
    );

    expect(html).toContain("--menu-image-position:center 40%");
    expect(html).toContain("--menu-image-desktop-position:center 95%");
    expect(html.match(/--menu-image-desktop-position/g)).toHaveLength(1);
    expect(html).not.toMatch(/<img[^>]*(?:desktopPosition|mobilePosition)/i);
  });

  it("renders the supplied article and omits an empty related section", () => {
    const html = renderToStaticMarkup(
      <JournalArticle
        article={journalArticleSchema.parse(publishedArticle)}
        relatedArticles={[]}
        articleAction="Read story"
      />,
    );

    expect(html).toContain(
      '<h1 id="journal-article-title">Sample article</h1>',
    );
    expect(html).toContain("A short introduction to a test article.");
    expect(html).toContain("An introduction for the article banner.");
    expect(html).toContain("Test body.");
    expect(html).toContain('<time dateTime="2026-10-19">19 Oct 2026</time>');
    expect(html).toContain("4 min read");
    expect(html).toContain("Sample author");
    expect(html).toContain('alt="A test dining table"');
    expect(html).not.toContain("More from");
    expect(html).not.toContain("View all");
  });

  it("preserves heading levels, images, captions and attributed quotes in body order", () => {
    const article = journalArticleSchema.parse({
      ...publishedArticle,
      blocks: [
        {
          _key: "section",
          _type: "journalHeading",
          level: 2,
          text: "Our suppliers",
        },
        {
          _key: "opening",
          _type: "journalParagraph",
          text: "Fresh & seasonal <produce>.",
        },
        {
          _key: "detail",
          _type: "journalHeading",
          level: 3,
          text: "The harvest",
        },
        {
          _key: "photo",
          _type: "journalImage",
          image: {
            src: "https://cdn.sanity.io/images/project/development/harvest.jpg",
            alt: "Freshly harvested vegetables",
          },
          caption: "Picked this morning.",
        },
        {
          _key: "quote",
          _type: "journalQuote",
          text: "Quality starts in the field.",
          attribution: "Test grower",
        },
      ],
    });
    const html = renderToStaticMarkup(
      <JournalArticle
        article={article}
        relatedArticles={[]}
        articleAction="Read story"
      />,
    );

    expect(html).toMatch(/<h2(?: [^>]*)?>Our suppliers<\/h2>/);
    expect(html).toMatch(/<h3(?: [^>]*)?>The harvest<\/h3>/);
    expect(html).toContain("Fresh &amp; seasonal &lt;produce&gt;.");
    expect(html).toContain('alt="Freshly harvested vegetables"');
    expect(html).toContain("<figcaption>Picked this morning.</figcaption>");
    expect(html).toContain(
      "<blockquote><p>Quality starts in the field.</p></blockquote>",
    );
    expect(html).toContain("<figcaption>Test grower</figcaption>");
    expect(html.indexOf("Our suppliers")).toBeLessThan(
      html.indexOf("The harvest"),
    );
    expect(html.indexOf("The harvest")).toBeLessThan(
      html.indexOf("Picked this morning."),
    );
    expect(html.indexOf("Picked this morning.")).toBeLessThan(
      html.indexOf("Quality starts in the field."),
    );
  });

  it("links related stories and the article's category using the supplied action", () => {
    const article = journalArticleSchema.parse(publishedArticle);
    const html = renderToStaticMarkup(
      <JournalArticle
        article={article}
        relatedArticles={[
          {
            ...article,
            _id: "next-story",
            slug: "next-story",
            title: "The next story",
          },
        ]}
        articleAction="Explore story"
      />,
    );

    expect(html).toContain('aria-labelledby="journal-related-title"');
    expect(html).toContain("More from Food");
    const links = html.match(/<a\b[^>]*>.*?<\/a>/g) ?? [];
    expect(
      links.some(
        (link) =>
          link.includes('href="/journal?category=food"') &&
          link.includes("View all Food"),
      ),
    ).toBe(true);
    expect(html).toContain('href="/journal/next-story"');
    expect(html).toContain("The next story");
    expect(html).toContain("Explore story");
  });
});
