import { createHash } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { verifyContent } from "./content";
import type { TManifest } from "./manifest";

const document = {
  slug: { current: "article" },
  _type: "journalArticle",
  _id: "article-1",
  _rev: "revision-1",
  _updatedAt: "2026-11-06T00:00:00.000Z",
  noIndex: false,
  title: "Published article",
};
const hash = createHash("sha256")
  .update(JSON.stringify(document))
  .digest("hex");
const manifest: TManifest = {
  version: 1,
  status: "ready",
  cms: { projectId: "testproject", dataset: "test", apiVersion: "2026-11-06" },
  routes: [
    {
      path: "/journal/article",
      heading: "Published article",
      requiredText: ["Published"],
      hero: true,
      content: {
        id: "article-1",
        revision: "revision-1",
        updatedAt: "2026-11-06T00:00:00.000Z",
        hash,
        imageHash: "b".repeat(64),
        noIndex: false,
        bodyImages: 0,
      },
    },
  ],
};

afterEach(() => vi.unstubAllGlobals());

describe("published content identity", () => {
  it("accepts published noIndex content when that exact state is frozen", async () => {
    const published = { ...document, noIndex: true };
    const expectedHash = createHash("sha256")
      .update(JSON.stringify(published))
      .digest("hex");
    const frozen = {
      ...manifest,
      routes: manifest.routes.map((route) => ({
        ...route,
        content: {
          ...manifest.routes[0].content,
          id: "article-1",
          revision: "revision-1",
          updatedAt: "2026-11-06T00:00:00.000Z",
          hash: expectedHash,
          imageHash: "b".repeat(64),
          bodyImages: 0,
          noIndex: true,
        },
      })),
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ result: [published] })),
    );
    await expect(
      verifyContent(frozen, new AbortController().signal),
    ).resolves.toEqual([
      { id: "article-1", revision: "revision-1", hash: expectedHash },
    ]);
  });
  it("accepts the frozen revision without changing raw content hash ordering", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ result: [document] })),
    );
    await expect(
      verifyContent(manifest, new AbortController().signal),
    ).resolves.toEqual([{ id: "article-1", revision: "revision-1", hash }]);
  });
  it.each([
    ["unpublished", []],
    ["noIndex", [{ ...document, noIndex: true }]],
    ["revision drift", [{ ...document, _rev: "revision-2" }]],
    [
      "changed content with stale revision",
      [{ ...document, title: "Changed content" }],
    ],
  ])("rejects %s details", async (_failure, result) => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ result })),
    );
    await expect(
      verifyContent(manifest, new AbortController().signal),
    ).rejects.toThrow(/identity changed or unavailable/);
  });
});
