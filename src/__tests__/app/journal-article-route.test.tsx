import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { publishedArticle } from "@/__tests__/fixtures/journal";
import JournalArticlePage from "@/app/journal/[slug]/page";
import { loadJournalPage } from "@/lib/journal-content";
import type { IJournalArticleProps } from "@/lib/types";

vi.mock("@/lib/journal-content", () => ({
  loadJournalArticle: vi.fn(async () => publishedArticle),
  loadRelatedJournalArticles: vi.fn(async () => []),
  loadJournalPage: vi.fn(() =>
    Promise.reject(new Error("The selected featured article is disabled.")),
  ),
}));
vi.mock("@/lib/seo", () => ({ buildSeoMetadata: vi.fn() }));
vi.mock("@/components/app/compounds/journal-article", () => ({
  JournalArticle: ({ article }: IJournalArticleProps) => (
    <main>
      <h1>{article.title}</h1>
    </main>
  ),
}));

it("keeps a published article readable when the hub's featured story is disabled", async () => {
  const page = await JournalArticlePage({
    params: Promise.resolve({ slug: "sample" }),
  });
  expect(renderToStaticMarkup(page)).toContain("<h1>Sample article</h1>");
  expect(loadJournalPage).not.toHaveBeenCalled();
});
