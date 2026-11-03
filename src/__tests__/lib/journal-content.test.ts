import { err, ok } from "neverthrow";
import { expect, it, vi } from "vitest";
import { ErrorCode } from "@/lib/enums";
import { createError } from "@/lib/errors";
import {
  loadJournalArticle,
  loadJournalArticles,
  loadJournalPage,
} from "@/lib/journal-content";
import {
  getJournalArticle,
  getJournalArticles,
  getJournalPage,
} from "@/services/journal";

vi.mock("next/server", () => ({ connection: vi.fn() }));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_HTTP_ERROR_FALLBACK;404");
  },
}));
vi.mock("@/services/journal", () => ({
  getJournalArticle: vi.fn(),
  getJournalArticles: vi.fn(),
  getJournalCategories: vi.fn(),
  getJournalPage: vi.fn(),
  getPublishedJournalSlugs: vi.fn(),
  getRelatedJournalArticles: vi.fn(),
}));

it("renders the 404 boundary for an unknown article", async () => {
  vi.mocked(getJournalArticle).mockResolvedValue(
    err(createError(ErrorCode.NotFound, "Article not found.")),
  );
  await expect(loadJournalArticle("missing")).rejects.toThrow(
    "NEXT_HTTP_ERROR_FALLBACK;404",
  );
});

it("sends CMS failures to the error boundary instead of a 404", async () => {
  vi.mocked(getJournalArticle).mockResolvedValue(
    err(createError(ErrorCode.InternalError, "CMS unavailable")),
  );
  await expect(loadJournalArticle("sample")).rejects.toThrow(
    "Unable to load the article.",
  );
});

it("preserves an empty published article list", async () => {
  vi.mocked(getJournalArticles).mockResolvedValue(ok([]));
  await expect(loadJournalArticles()).resolves.toEqual([]);
});

it("does not mask missing Journal settings with design content", async () => {
  vi.mocked(getJournalPage).mockResolvedValue(
    err(createError(ErrorCode.InternalError, "Missing settings")),
  );
  await expect(loadJournalPage()).rejects.toThrow(
    "Unable to load Journal settings.",
  );
});
