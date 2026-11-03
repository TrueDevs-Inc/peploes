import { err, ok } from "neverthrow";
import { expect, it, vi } from "vitest";
import {
  journalCategory,
  publishedArticle,
  publishedJournalPage,
} from "@/__tests__/fixtures/journal";
import { ErrorCode } from "@/lib/enums";
import { createError } from "@/lib/errors";
import {
  fetchJournalArticle,
  fetchJournalArticleExists,
  fetchJournalArticles,
  fetchJournalCategories,
  fetchJournalPage,
  fetchPublishedJournalSlugs,
  fetchRelatedJournalArticles,
} from "@/lib/sanity-provider";
import {
  getJournalArticle,
  getJournalArticles,
  getJournalCategories,
  getJournalPage,
  getPublishedJournalSlugs,
  getRelatedJournalArticles,
  journalArticleExists,
} from "@/services/journal";

vi.mock("@/lib/sanity-provider", () => ({
  fetchJournalArticles: vi.fn(),
  fetchJournalArticle: vi.fn(),
  fetchJournalCategories: vi.fn(),
  fetchJournalPage: vi.fn(),
  fetchJournalArticleExists: vi.fn(),
  fetchPublishedJournalSlugs: vi.fn(),
  fetchRelatedJournalArticles: vi.fn(),
}));

it("keeps an empty Journal empty instead of inventing articles", async () => {
  vi.mocked(fetchJournalArticles).mockResolvedValue(ok([]));
  const result = await getJournalArticles();
  expect(result.isOk() ? result.value : null).toEqual([]);
});

it("orders newest articles first with a stable URL tie break", async () => {
  vi.mocked(fetchJournalArticles).mockResolvedValue(
    ok([
      { ...publishedArticle, _id: "old", slug: "old", date: "2026-01-01" },
      { ...publishedArticle, _id: "z", slug: "z" },
      { ...publishedArticle, _id: "a", slug: "a" },
    ]),
  );
  const result = await getJournalArticles();
  expect(
    result.isOk() ? result.value.map((article) => article.slug) : null,
  ).toEqual(["a", "z", "old"]);
});

it("keeps the CMS listing order ahead of newer stories without changing dates", async () => {
  const articles = [
    { slug: "new", date: "2026-04-12", listingOrder: null },
    { slug: "last", date: "2026-02-09", listingOrder: 6 },
    { slug: "first", date: "2026-03-20", listingOrder: 0 },
    { slug: "tie-z", date: "2026-03-14", listingOrder: 2 },
    { slug: "tie-old", date: "2026-01-01", listingOrder: 2 },
    { slug: "tie-a", date: "2026-03-14", listingOrder: 2 },
    { slug: "older", date: "2026-03-01" },
  ].map((article) => ({ ...publishedArticle, _id: article.slug, ...article }));
  vi.mocked(fetchJournalArticles).mockResolvedValue(ok(articles));

  const result = await getJournalArticles();

  expect(
    result.isOk()
      ? result.value.map(({ slug, date }) => ({ slug, date }))
      : null,
  ).toEqual([
    { slug: "first", date: "2026-03-20" },
    { slug: "tie-a", date: "2026-03-14" },
    { slug: "tie-z", date: "2026-03-14" },
    { slug: "tie-old", date: "2026-01-01" },
    { slug: "last", date: "2026-02-09" },
    { slug: "new", date: "2026-04-12" },
    { slug: "older", date: "2026-03-01" },
  ]);
});

it.each([
  { heroImage: { src: "https://other.example/image.jpg", alt: "Image" } },
  { category: { _id: "food", name: "Food", slug: "../food" } },
  { category: null },
  { readTimeMinutes: 0 },
  { date: "2026-02-30" },
  { title: "  " },
  { listingOrder: -1 },
  { listingOrder: 1.5 },
  { listingOrder: "1" },
])(
  "rejects malformed article cards instead of filling from design content: %j",
  async (change) => {
    vi.mocked(fetchJournalArticles).mockResolvedValue(
      ok([{ ...publishedArticle, ...change }]),
    );
    expect((await getJournalArticles()).isErr()).toBe(true);
  },
);

it("rejects duplicate article URLs", async () => {
  vi.mocked(fetchJournalArticles).mockResolvedValue(
    ok([publishedArticle, { ...publishedArticle, _id: "second" }]),
  );
  expect((await getJournalArticles()).isErr()).toBe(true);
});

it("reports an oversized catalogue rather than silently dropping older articles", async () => {
  vi.mocked(fetchJournalArticles).mockResolvedValue(
    ok(
      Array.from({ length: 501 }, (_, index) => ({
        ...publishedArticle,
        _id: `article-${index}`,
        slug: `article-${index}`,
      })),
    ),
  );
  expect((await getJournalArticles()).isErr()).toBe(true);
});

it("preserves CMS failures instead of treating them as an empty Journal", async () => {
  vi.mocked(fetchJournalArticles).mockResolvedValue(
    err(createError(ErrorCode.InternalError, "CMS unavailable")),
  );
  const result = await getJournalArticles();
  expect(result.isErr() ? result.error.message : null).toBe("CMS unavailable");
});

it("returns the published article and its separate intro banner", async () => {
  vi.mocked(fetchJournalArticle).mockResolvedValue(ok([publishedArticle]));
  const result = await getJournalArticle("sample");
  expect(result.isOk() ? result.value.intro : null).toBe(
    "An introduction for the article banner.",
  );
});

it("preserves the supplied desktop and mobile hero image positions", async () => {
  vi.mocked(fetchJournalArticle).mockResolvedValue(
    ok([
      {
        ...publishedArticle,
        heroImage: {
          ...publishedArticle.heroImage,
          desktopPosition: "center 95%",
          mobilePosition: "60% center",
        },
      },
    ]),
  );

  const result = await getJournalArticle("sample");

  expect(result.isOk() ? result.value.heroImage : null).toEqual({
    src: "https://cdn.sanity.io/images/project/development/test.jpg",
    alt: "A test dining table",
    desktopPosition: "center 95%",
    mobilePosition: "60% center",
  });
});

it("preserves ordered structured content, captions and optional quotations", async () => {
  const blocks = [
    { _key: "heading", _type: "journalHeading", level: 2, text: "A section" },
    publishedArticle.blocks[0],
    {
      _key: "photo",
      _type: "journalImage",
      image: publishedArticle.heroImage,
      caption: "A caption",
    },
    {
      _key: "quote",
      _type: "journalQuote",
      text: "A quotation",
      attribution: "The chef",
    },
  ];
  vi.mocked(fetchJournalArticle).mockResolvedValue(
    ok([{ ...publishedArticle, blocks }]),
  );
  const result = await getJournalArticle("sample");
  expect(result.isOk() ? result.value.blocks : null).toEqual(blocks);
});

it("preserves an article read failure instead of providing a replacement article", async () => {
  vi.mocked(fetchJournalArticle).mockResolvedValue(
    err(createError(ErrorCode.InternalError, "CMS unavailable")),
  );
  const result = await getJournalArticle("sample");
  expect(result.isErr() ? result.error.message : null).toBe("CMS unavailable");
});

it("returns not found for an unknown article", async () => {
  vi.mocked(fetchJournalArticle).mockResolvedValue(ok([]));
  const result = await getJournalArticle("missing");
  expect(result.isErr() ? result.error.code : null).toBe(ErrorCode.NotFound);
});

it("rejects invalid article URLs before querying the CMS", async () => {
  const result = await getJournalArticle("../sample");
  expect(result.isErr() ? result.error.code : null).toBe(ErrorCode.NotFound);
  expect(fetchJournalArticle).not.toHaveBeenCalled();
});

it.each([
  { name: "duplicate URLs", documents: [publishedArticle, publishedArticle] },
  {
    name: "mismatched URL",
    documents: [{ ...publishedArticle, slug: "another" }],
  },
  { name: "empty body", documents: [{ ...publishedArticle, blocks: [] }] },
  {
    name: "missing intro banner",
    documents: [{ ...publishedArticle, intro: null }],
  },
  {
    name: "unsupported block",
    documents: [
      {
        ...publishedArticle,
        blocks: [{ _key: "a", _type: "unsupported", text: "Test" }],
      },
    ],
  },
  {
    name: "duplicate block keys",
    documents: [
      {
        ...publishedArticle,
        blocks: [publishedArticle.blocks[0], publishedArticle.blocks[0]],
      },
    ],
  },
  {
    name: "oversized body",
    documents: [
      {
        ...publishedArticle,
        blocks: Array.from({ length: 201 }, (_, index) => ({
          ...publishedArticle.blocks[0],
          _key: `paragraph-${index}`,
        })),
      },
    ],
  },
])("rejects article content with $name", async ({ documents }) => {
  vi.mocked(fetchJournalArticle).mockResolvedValue(ok(documents));
  expect((await getJournalArticle("sample")).isErr()).toBe(true);
});

it("loads related cards even when an unrelated article is malformed", async () => {
  vi.mocked(fetchJournalArticles).mockResolvedValue(
    ok([{ ...publishedArticle, title: null }]),
  );
  vi.mocked(fetchRelatedJournalArticles).mockResolvedValue(
    ok([{ ...publishedArticle, _id: "related", slug: "related" }]),
  );
  const result = await getRelatedJournalArticles("food", "sample");
  expect(
    result.isOk() ? result.value.map((article) => article.slug) : null,
  ).toEqual(["related"]);
  expect(fetchJournalArticles).not.toHaveBeenCalled();
});

it("loads related cards independently of the catalogue size ceiling", async () => {
  vi.mocked(fetchJournalArticles).mockResolvedValue(
    ok(
      Array.from({ length: 501 }, (_, index) => ({
        ...publishedArticle,
        _id: `article-${index}`,
        slug: `article-${index}`,
      })),
    ),
  );
  vi.mocked(fetchRelatedJournalArticles).mockResolvedValue(
    ok([{ ...publishedArticle, _id: "related", slug: "related" }]),
  );
  const result = await getRelatedJournalArticles("food", "sample");
  expect(
    result.isOk() ? result.value.map((article) => article.slug) : null,
  ).toEqual(["related"]);
  expect(fetchJournalArticles).not.toHaveBeenCalled();
});

it("returns the selected related cards in provider order", async () => {
  vi.mocked(fetchRelatedJournalArticles).mockResolvedValue(
    ok(
      ["2026-04-01", "2026-03-01", "2026-02-01"].map((date, index) => ({
        ...publishedArticle,
        _id: `related-${index}`,
        slug: `related-${index}`,
        date,
      })),
    ),
  );
  const result = await getRelatedJournalArticles("food", "sample");
  expect(
    result.isOk() ? result.value.map((article) => article.slug) : null,
  ).toEqual(["related-0", "related-1", "related-2"]);
});

it("returns no unrelated articles when a category has no other stories", async () => {
  vi.mocked(fetchRelatedJournalArticles).mockResolvedValue(ok([]));
  const result = await getRelatedJournalArticles("food", "sample");
  expect(result.isOk() ? result.value : null).toEqual([]);
});

it.each([
  ["../food", "sample"],
  ["food", "../sample"],
])(
  "rejects malformed related request URLs before querying: %s %s",
  async (categorySlug, currentSlug) => {
    const result = await getRelatedJournalArticles(categorySlug, currentSlug);
    expect(result.isErr() ? result.error.code : null).toBe(
      ErrorCode.ValidationError,
    );
    expect(fetchRelatedJournalArticles).not.toHaveBeenCalled();
    expect(fetchJournalArticles).not.toHaveBeenCalled();
  },
);

it.each([
  { name: "invalid response", documents: null },
  {
    name: "malformed selected card",
    documents: [{ ...publishedArticle, slug: "related", title: null }],
  },
  {
    name: "duplicate selected URLs",
    documents: [
      { ...publishedArticle, _id: "one", slug: "related" },
      { ...publishedArticle, _id: "two", slug: "related" },
    ],
  },
  {
    name: "duplicate selected IDs",
    documents: [
      { ...publishedArticle, slug: "one" },
      { ...publishedArticle, slug: "two" },
    ],
  },
  {
    name: "more than three cards",
    documents: Array.from({ length: 4 }, (_, index) => ({
      ...publishedArticle,
      _id: `related-${index}`,
      slug: `related-${index}`,
    })),
  },
])("rejects related articles with $name", async ({ documents }) => {
  vi.mocked(fetchRelatedJournalArticles).mockResolvedValue(ok(documents));
  const result = await getRelatedJournalArticles("food", "sample");
  expect(result.isErr() ? result.error.code : null).toBe(
    ErrorCode.InternalError,
  );
});

it("preserves related read failures instead of returning replacement cards", async () => {
  vi.mocked(fetchRelatedJournalArticles).mockResolvedValue(
    err(createError(ErrorCode.InternalError, "CMS unavailable")),
  );
  const result = await getRelatedJournalArticles("food", "sample");
  expect(result.isErr() ? result.error.message : null).toBe("CMS unavailable");
});

it("retains editable category names and slugs", async () => {
  vi.mocked(fetchJournalCategories).mockResolvedValue(ok([journalCategory]));
  const result = await getJournalCategories();
  expect(result.isOk() ? result.value : null).toEqual([
    { _id: "category-food", name: "Food", slug: "food" },
  ]);
});

it("rejects duplicate category URLs", async () => {
  vi.mocked(fetchJournalCategories).mockResolvedValue(
    ok([journalCategory, { ...journalCategory, _id: "other" }]),
  );
  expect((await getJournalCategories()).isErr()).toBe(true);
});

it("uses only the article selected in page settings as featured", async () => {
  vi.mocked(fetchJournalPage).mockResolvedValue(ok(publishedJournalPage));
  const result = await getJournalPage();
  expect(result.isOk() ? result.value.featuredArticle.slug : null).toBe(
    "sample",
  );
  expect(fetchJournalArticles).not.toHaveBeenCalled();
});

it.each([
  { name: "missing page", page: null },
  {
    name: "missing featured article",
    page: { ...publishedJournalPage, featuredArticle: null },
  },
  {
    name: "missing closing banner",
    page: { ...publishedJournalPage, closing: null },
  },
  {
    name: "missing hero standfirst",
    page: {
      ...publishedJournalPage,
      hero: { ...publishedJournalPage.hero, standfirst: null },
    },
  },
])("reports $name without placeholder content", async ({ page }) => {
  vi.mocked(fetchJournalPage).mockResolvedValue(ok(page));
  expect((await getJournalPage()).isErr()).toBe(true);
});

it("returns published URL metadata for sitemap integration", async () => {
  vi.mocked(fetchPublishedJournalSlugs).mockResolvedValue(
    ok([
      { slug: "sample", _updatedAt: "2026-10-19T12:00:00Z", noIndex: false },
    ]),
  );
  const result = await getPublishedJournalSlugs();
  expect(result.isOk() ? result.value : null).toEqual([
    { slug: "sample", _updatedAt: "2026-10-19T12:00:00Z", noIndex: false },
  ]);
});

it("keeps a failed availability check distinct from a missing article", async () => {
  vi.mocked(fetchJournalArticleExists).mockResolvedValue(
    err(createError(ErrorCode.InternalError, "CMS unavailable")),
  );
  expect((await journalArticleExists("sample")).isErr()).toBe(true);
});

it("reports an unpublished article as unavailable", async () => {
  vi.mocked(fetchJournalArticleExists).mockResolvedValue(ok(0));
  const result = await journalArticleExists("sample");
  expect(result.isOk() ? result.value : null).toBe(false);
});

it("fails availability checks for duplicate published URLs", async () => {
  vi.mocked(fetchJournalArticleExists).mockResolvedValue(ok(2));
  expect((await journalArticleExists("sample")).isErr()).toBe(true);
});
