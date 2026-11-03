import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  journalCategory,
  publishedArticle,
  publishedJournalPage,
} from "@/__tests__/fixtures/journal";
import { Journal } from "@/components/app/compounds/journal";

vi.mock("@/components/ui/button.module.css", () => ({ default: {} }));

vi.mock("@/lib/fonts", () => ({
  dmSans: { className: "" },
  ebGaramond: { variable: "" },
}));

vi.mock("@/components/app/compounds/journal.module.css", () => ({
  default: {},
}));
vi.mock("@/components/app/compounds/journal-article-list.module.css", () => ({
  default: {},
}));
vi.mock("@/components/app/molecules/journal-story-card.module.css", () => ({
  default: {},
}));

const navigation = vi.hoisted(() => ({ search: "" }));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(navigation.search),
}));

describe("Journal hub", () => {
  beforeEach(() => {
    navigation.search = "";
  });

  it("shows six newest stories without duplicating the featured article", () => {
    const articles = [
      publishedArticle,
      ...Array.from({ length: 7 }, (_, index) => ({
        ...publishedArticle,
        _id: `story-${index + 1}`,
        slug: `story-${index + 1}`,
        title: `Story ${index + 1}`,
      })),
    ];
    const html = renderToStaticMarkup(
      <Journal
        content={publishedJournalPage}
        categories={[journalCategory]}
        articles={articles}
      />,
    );

    expect(html.match(/<h3\b/g)).toHaveLength(6);
    expect(html).toContain("Story 1");
    expect(html).toContain("Story 6");
    expect(html).not.toContain("Story 7");
    expect(html.match(/>Sample article</g)).toHaveLength(1);
    expect(html.match(/href="\/journal\/story-1"/g)).toHaveLength(3);
    expect(html).toContain("Load more");
  });

  it("filters a direct category URL while keeping the selected feature", () => {
    navigation.search = "category=wine";
    const wine = { _id: "wine", name: "Wine", slug: "wine" };
    const html = renderToStaticMarkup(
      <Journal
        content={publishedJournalPage}
        categories={[journalCategory, wine]}
        articles={[
          { ...publishedArticle, _id: "food-story", title: "Food story" },
          {
            ...publishedArticle,
            _id: "wine-story",
            title: "Wine story",
            category: wine,
          },
        ]}
      />,
    );

    expect(html).toContain('aria-current="page" href="/journal?category=wine"');
    expect(html).toContain("Wine story");
    expect(html).not.toContain("Food story");
    expect(html).toContain("Sample article");
    expect(html).not.toContain("Load more");
  });

  it("falls back to All for an unknown category", () => {
    navigation.search = "category=unknown";
    const html = renderToStaticMarkup(
      <Journal
        content={publishedJournalPage}
        categories={[journalCategory]}
        articles={[
          { ...publishedArticle, _id: "other", title: "Another story" },
        ]}
      />,
    );

    expect(html).toContain('aria-current="page" href="/journal"');
    expect(html).toContain("Another story");
  });

  it("shows the CMS empty message for a category without stories", () => {
    navigation.search = "category=food";
    const html = renderToStaticMarkup(
      <Journal
        content={publishedJournalPage}
        categories={[journalCategory]}
        articles={[publishedArticle]}
      />,
    );

    expect(html).toContain("No stories in this category yet.");
    expect(html).not.toContain("<h3");
    expect(html).not.toContain("Load more");
  });
});
