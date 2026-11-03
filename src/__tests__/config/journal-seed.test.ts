import { createRequire } from "node:module";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as content from "../../../studio/journal-content";

const cms = vi.hoisted(() => ({
  config: vi.fn(() => ({ projectId: "w789ottu", dataset: "development" })),
  fetch: vi.fn(),
  upload: vi.fn(),
  transaction: vi.fn(),
}));
const cliPath = createRequire(resolve("studio/package.json")).resolve(
  "sanity/cli",
);
const documents = new Map<string, Record<string, unknown>>();
const commit = vi.fn();
const withConfig = vi.fn();
let source: Record<string, unknown>;

describe("Journal importer", () => {
  let output: string;
  beforeEach(() => {
    vi.resetModules();
    vi.doMock(cliPath, () => ({ getCliClient: () => ({ withConfig }) }));
    withConfig.mockReturnValue({ ...cms, assets: { upload: cms.upload } });
    source = { ...content };
    vi.doMock("../../../studio/journal-content", () => source);
    documents.clear();
    cms.config.mockReturnValue({
      projectId: "w789ottu",
      dataset: "development",
    });
    cms.fetch.mockImplementation(() =>
      Promise.resolve(
        [...documents.values()].map((doc) => ({ runtime: null, ...doc })),
      ),
    );
    cms.upload.mockImplementation((_kind, _bytes, options) =>
      Promise.resolve({
        _id: `image-${options.filename}`,
        url: `https://cdn.sanity.io/images/w789ottu/development/${options.filename}`,
      }),
    );
    cms.transaction.mockImplementation(() => {
      const pending: (Record<string, unknown> & { _id: string })[] = [];
      commit.mockImplementation(() => {
        for (const doc of pending)
          if (!documents.has(doc._id)) documents.set(doc._id, doc);
        return Promise.resolve({});
      });
      return {
        createIfNotExists: (doc: Record<string, unknown> & { _id: string }) =>
          pending.push(doc),
        commit,
      };
    });
    output = "";
    vi.spyOn(process.stdout, "write").mockImplementation((value) => {
      output += String(value);
      return true;
    });
    vi.spyOn(process.stderr, "write").mockImplementation((value) => {
      output += String(value);
      return true;
    });
    vi.stubEnv("PEPLOES_SEED_APPLY", "0");
    process.exitCode = 0;
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    process.exitCode = 0;
  });

  it("previews exact intended IDs without uploading or mutating", async () => {
    await (await import("../../../studio/seed-journal")).journalSeed;
    expect(process.exitCode, output).toBe(0);
    expect(output).toContain("Target: w789ottu/development");
    expect(output).toContain("create journal-page");
    expect(output).toContain("create journal-category-from-gina");
    expect(output).toContain("create journal-article-some-things-have-changed");
    expect(output).toContain("18 create, 0 preserved, 0 draft blockers");
    expect(withConfig).toHaveBeenCalledWith({
      perspective: "raw",
      useCdn: false,
    });
    expect(cms.fetch.mock.calls[0][1].ids).toContain("drafts.journal-page");
    expect(cms.fetch.mock.calls[0][1].slugs).toContain(
      "some-things-have-changed",
    );
    expect(cms.upload).not.toHaveBeenCalled();
    expect(cms.transaction).not.toHaveBeenCalled();
  });

  it.each([
    { projectId: "other", dataset: "development" },
    { projectId: "w789ottu", dataset: "production" },
    { projectId: "3ggctsor", dataset: "development" },
  ])(
    "refuses an unauthorized target before reading or writing %j",
    async (config) => {
      cms.config.mockReturnValue(config);
      vi.stubEnv("PEPLOES_SEED_APPLY", "1");
      await (await import("../../../studio/seed-journal")).journalSeed;
      expect(process.exitCode).toBe(1);
      expect(cms.fetch).not.toHaveBeenCalled();
      expect(cms.upload).not.toHaveBeenCalled();
      expect(cms.transaction).not.toHaveBeenCalled();
    },
  );

  it.each([
    { title: " " },
    { noIndex: false },
    { blocks: [] },
    { category: { _id: "missing", name: "Missing", slug: "missing" } },
    { heroImage: { src: "/../package.json", alt: "Outside public" } },
    {
      heroImage: {
        src: "/journal-image-that-does-not-exist.webp",
        alt: "Missing",
      },
    },
  ])(
    "rejects invalid content and local assets before any upload %j",
    async (invalid) => {
      source = {
        ...content,
        JOURNAL_ARTICLES: [
          ...content.JOURNAL_ARTICLES.slice(0, -1),
          { ...content.JOURNAL_ARTICLES.at(-1), ...invalid },
        ],
      };
      vi.stubEnv("PEPLOES_SEED_APPLY", "1");
      await (await import("../../../studio/seed-journal")).journalSeed;
      expect(process.exitCode, output).toBe(1);
      if (invalid.heroImage) expect(output).toContain(invalid.heroImage.src);
      expect(cms.upload).not.toHaveBeenCalled();
      expect(cms.transaction).not.toHaveBeenCalled();
    },
  );

  it.each([
    {
      _id: "journal-article-some-things-have-changed",
      _type: "seasonalEntry",
      slug: { current: "some-things-have-changed" },
    },
    {
      _id: "journal-article-some-things-have-changed",
      _type: "journalArticle",
      slug: { current: "editor-url" },
    },
    {
      _id: "editor-document",
      _type: "journalArticle",
      slug: { current: "some-things-have-changed" },
    },
    {
      _id: "drafts.editor-document",
      _type: "journalArticle",
      slug: { current: "some-things-have-changed" },
    },
  ])(
    "refuses ID, type or slug conflicts without mutations %j",
    async (existing) => {
      documents.set(existing._id, existing);
      vi.stubEnv("PEPLOES_SEED_APPLY", "1");
      await (await import("../../../studio/seed-journal")).journalSeed;
      expect(process.exitCode, output).toBe(1);
      expect(output).toContain("Conflicting");
      expect(cms.upload).not.toHaveBeenCalled();
      expect(cms.transaction).not.toHaveBeenCalled();
    },
  );

  it("reports draft blockers and refuses to publish twins or dangling references", async () => {
    documents.set("drafts.journal-category-from-gina", {
      _id: "drafts.journal-category-from-gina",
      _type: "journalCategory",
      slug: { current: "from-gina" },
    });
    vi.stubEnv("PEPLOES_SEED_APPLY", "1");
    await (await import("../../../studio/seed-journal")).journalSeed;
    expect(process.exitCode).toBe(1);
    expect(output).toContain("blocked journal-category-from-gina");
    expect(output).toContain("17 create, 0 preserved, 1 draft blockers");
    expect(cms.upload).not.toHaveBeenCalled();
    expect(cms.transaction).not.toHaveBeenCalled();
  });

  it("validates existing category references before uploading missing articles", async () => {
    documents.set("journal-category-from-gina", {
      _id: "journal-category-from-gina",
      _type: "journalCategory",
      slug: { current: "from-gina" },
      runtime: {
        _id: "journal-category-from-gina",
        name: "",
        slug: "from-gina",
      },
    });
    vi.stubEnv("PEPLOES_SEED_APPLY", "1");
    await (await import("../../../studio/seed-journal")).journalSeed;
    expect(process.exitCode).toBe(1);
    expect(cms.upload).not.toHaveBeenCalled();
    expect(cms.transaction).not.toHaveBeenCalled();
    expect(documents.size).toBe(1);
  });

  it("creates a missing hub using the website defaults for an existing featured article", async () => {
    const article = content.JOURNAL_ARTICLES[0];
    const existing = {
      _id: article._id,
      _type: "journalArticle",
      slug: { current: article.slug },
      noIndex: null,
      runtime: {
        ...article,
        _updatedAt: "2026-10-29T00:00:00.000Z",
        noIndex: true,
        heroImage: {
          alt: "Editor photo",
          src: "https://cdn.sanity.io/images/w789ottu/development/editor.jpg",
        },
      },
    };
    documents.set(article._id, existing);
    vi.stubEnv("PEPLOES_SEED_APPLY", "1");
    await (await import("../../../studio/seed-journal")).journalSeed;
    expect(process.exitCode, output).toBe(0);
    expect(cms.fetch.mock.calls[0][0]).toContain(
      '"noIndex":coalesce(noIndex,true)',
    );
    expect(documents.get(article._id)).toEqual(existing);
    expect(documents.has("journal-page")).toBe(true);
    expect(output).toContain("17 create, 1 preserved, 0 draft blockers");
  });

  it.each([
    { _id: "image-missing-url" },
    { _id: "image-invalid-url", url: "https://example.com/image.jpg" },
  ])(
    "refuses invalid uploaded asset shapes before committing %j",
    async (asset) => {
      cms.upload.mockResolvedValue(asset);
      vi.stubEnv("PEPLOES_SEED_APPLY", "1");
      await (await import("../../../studio/seed-journal")).journalSeed;
      expect(process.exitCode).toBe(1);
      expect(cms.transaction).not.toHaveBeenCalled();
      expect(documents.size).toBe(0);
      expect(output).toContain("Uploaded assets may remain");
    },
  );

  it("commits no documents when a later upload fails", async () => {
    cms.upload
      .mockResolvedValueOnce({
        _id: "image-first",
        url: "https://cdn.sanity.io/images/w789ottu/development/first.jpg",
      })
      .mockRejectedValueOnce(
        Object.assign(new Error("private SDK details"), { statusCode: 503 }),
      );
    vi.stubEnv("PEPLOES_SEED_APPLY", "1");
    await (await import("../../../studio/seed-journal")).journalSeed;
    expect(process.exitCode).toBe(1);
    expect(cms.upload).toHaveBeenCalledTimes(2);
    expect(cms.transaction).not.toHaveBeenCalled();
    expect(documents.size).toBe(0);
    expect(output).toContain("Uploaded assets may remain");
    expect(output).toContain("upload local image /");
    expect(output).toContain("HTTP 503");
    expect(output).not.toContain("private SDK details");
  });

  it("persists hero image positions with the uploaded asset and no local source", async () => {
    const article = content.JOURNAL_ARTICLES[0];
    source = {
      ...content,
      JOURNAL_ARTICLES: [
        {
          ...article,
          heroImage: {
            ...article.heroImage,
            desktopPosition: "center 95%",
            mobilePosition: "60% center",
          },
        },
        ...content.JOURNAL_ARTICLES.slice(1),
      ],
    };
    vi.stubEnv("PEPLOES_SEED_APPLY", "1");

    await (await import("../../../studio/seed-journal")).journalSeed;

    expect(process.exitCode, output).toBe(0);
    const saved = documents.get("journal-article-some-things-have-changed");
    expect(saved?.heroImage).toEqual({
      _type: "menuImage",
      alt: article.heroImage.alt,
      desktopPosition: "center 95%",
      mobilePosition: "60% center",
      asset: {
        _type: "reference",
        _ref: "image-peploes-private-dining-service.webp",
      },
    });
    expect(saved).not.toHaveProperty("heroImage.src");
  });

  it("creates missing documents atomically with references, then preserves all editor changes on repeat", async () => {
    vi.stubEnv("PEPLOES_SEED_APPLY", "1");
    await (await import("../../../studio/seed-journal")).journalSeed;
    expect(process.exitCode, output).toBe(0);
    expect(documents.size).toBe(18);
    expect(commit).toHaveBeenCalledOnce();
    expect(documents.get("journal-category-from-gina")).toMatchObject({
      _type: "journalCategory",
      sortOrder: 1,
      slug: { _type: "slug", current: "from-gina" },
    });
    const article = documents.get("journal-article-some-things-have-changed");
    expect(article).toMatchObject({
      _type: "journalArticle",
      enabled: true,
      noIndex: true,
      category: { _type: "reference", _ref: "journal-category-from-gina" },
      heroImage: {
        _type: "menuImage",
        asset: { _type: "reference", _ref: expect.any(String) },
      },
    });
    expect(article).not.toHaveProperty("_updatedAt");
    expect(article).not.toHaveProperty("heroImage.src");
    expect(documents.get("journal-page")).toMatchObject({
      featuredArticle: {
        _type: "reference",
        _ref: "journal-article-some-things-have-changed",
      },
    });
    const uploads = cms.upload.mock.calls.length;
    expect(uploads).toBeGreaterThan(0);
    expect(
      new Set(cms.upload.mock.calls.map((call) => call[2].filename)).size,
    ).toBe(uploads);
    documents.set("journal-article-some-things-have-changed", {
      ...article,
      title: "Editor title",
      enabled: false,
      noIndex: false,
    });
    documents.set("drafts.journal-article-some-things-have-changed", {
      ...article,
      _id: "drafts.journal-article-some-things-have-changed",
      title: "Unpublished editor title",
    });
    const before = structuredClone([...documents]);
    vi.resetModules();
    await (await import("../../../studio/seed-journal")).journalSeed;
    expect(process.exitCode, output).toBe(0);
    expect([...documents]).toEqual(before);
    expect(output).toContain("0 create, 18 preserved, 0 draft blockers");
    expect(cms.upload).toHaveBeenCalledTimes(uploads);
    expect(commit).toHaveBeenCalledOnce();
  });
});
