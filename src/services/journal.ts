import "server-only";
import { err, ok, type Result } from "neverthrow";
import { z } from "zod";
import { JOURNAL_LIMITS } from "@/lib/constants";
import { ErrorCode } from "@/lib/enums";
import { createError } from "@/lib/errors";
import {
  journalArticleCardSchema,
  journalArticleSchema,
  journalCategorySchema,
  journalPageSchema,
  journalPublishedSlugSchema,
  journalSlugSchema,
} from "@/lib/journal-schema";
import {
  fetchJournalArticle,
  fetchJournalArticleExists,
  fetchJournalArticles,
  fetchJournalCategories,
  fetchJournalPage,
  fetchPublishedJournalSlugs,
  fetchRelatedJournalArticles,
} from "@/lib/sanity-provider";
import type {
  IError,
  TJournalArticle,
  TJournalArticleCard,
  TJournalCategory,
  TJournalPage,
  TJournalPublishedSlug,
} from "@/lib/types";

export async function getJournalArticles(): Promise<
  Result<TJournalArticleCard[], IError>
> {
  const result = await fetchJournalArticles();
  if (result.isErr()) return err(result.error);
  const parsed = z
    .array(journalArticleCardSchema)
    .max(JOURNAL_LIMITS.MAX_ARTICLES)
    .refine(
      (articles) =>
        new Set(articles.map((article) => article.slug)).size ===
        articles.length,
      "Published article URLs must be unique.",
    )
    .refine(
      (articles) =>
        new Set(articles.map((article) => article._id)).size ===
        articles.length,
      "Published article IDs must be unique.",
    )
    .safeParse(result.value);
  if (!parsed.success)
    return err(
      createError(
        ErrorCode.InternalError,
        "Unable to load Journal articles.",
        parsed.error,
      ),
    );
  return ok(
    parsed.data.sort((a, b) => {
      if (a.listingOrder !== b.listingOrder) {
        if (a.listingOrder === undefined) return 1;
        if (b.listingOrder === undefined) return -1;
        return a.listingOrder - b.listingOrder;
      }
      return b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug);
    }),
  );
}

export async function getJournalArticle(
  slug: string,
): Promise<Result<TJournalArticle, IError>> {
  if (!journalSlugSchema.safeParse(slug).success)
    return err(createError(ErrorCode.NotFound, "Article not found."));
  const result = await fetchJournalArticle(slug);
  if (result.isErr()) return err(result.error);
  const documents = z.array(z.unknown()).safeParse(result.value);
  if (!documents.success)
    return err(
      createError(ErrorCode.InternalError, "Invalid article response."),
    );
  if (documents.data.length === 0)
    return err(createError(ErrorCode.NotFound, "Article not found."));
  if (documents.data.length !== 1)
    return err(
      createError(
        ErrorCode.InternalError,
        "More than one published article uses this URL.",
      ),
    );
  const parsed = journalArticleSchema.safeParse(documents.data[0]);
  if (!parsed.success)
    return err(
      createError(
        ErrorCode.InternalError,
        "Unable to load the article content.",
        parsed.error,
      ),
    );
  if (parsed.data.slug !== slug)
    return err(
      createError(ErrorCode.InternalError, "The article URL does not match."),
    );
  return ok(parsed.data);
}

export async function getJournalCategories(): Promise<
  Result<TJournalCategory[], IError>
> {
  const result = await fetchJournalCategories();
  if (result.isErr()) return err(result.error);
  const parsed = z
    .array(journalCategorySchema)
    .max(JOURNAL_LIMITS.MAX_CATEGORIES)
    .refine(
      (categories) =>
        new Set(categories.map((category) => category.slug)).size ===
        categories.length,
      "Category URLs must be unique.",
    )
    .refine(
      (categories) =>
        new Set(categories.map((category) => category._id)).size ===
        categories.length,
      "Category IDs must be unique.",
    )
    .safeParse(result.value);
  if (!parsed.success)
    return err(
      createError(
        ErrorCode.InternalError,
        "Unable to load Journal categories.",
        parsed.error,
      ),
    );
  return ok(parsed.data);
}

export async function getJournalPage(): Promise<Result<TJournalPage, IError>> {
  const result = await fetchJournalPage();
  if (result.isErr()) return err(result.error);
  const parsed = journalPageSchema.safeParse(result.value);
  if (!parsed.success)
    return err(
      createError(
        ErrorCode.InternalError,
        "Unable to load Journal settings.",
        parsed.error,
      ),
    );
  return ok(parsed.data);
}

export async function getRelatedJournalArticles(
  categorySlug: string,
  currentSlug: string,
): Promise<Result<TJournalArticleCard[], IError>> {
  if (
    !journalSlugSchema.safeParse(categorySlug).success ||
    !journalSlugSchema.safeParse(currentSlug).success
  )
    return err(
      createError(
        ErrorCode.ValidationError,
        "Invalid related article request.",
      ),
    );
  const result = await fetchRelatedJournalArticles(categorySlug, currentSlug);
  if (result.isErr()) return err(result.error);
  const parsed = z
    .array(journalArticleCardSchema)
    .max(JOURNAL_LIMITS.RELATED_ARTICLES)
    .refine(
      (articles) =>
        new Set(articles.map((article) => article.slug)).size ===
          articles.length &&
        new Set(articles.map((article) => article._id)).size ===
          articles.length,
      "Related article IDs and URLs must be unique.",
    )
    .safeParse(result.value);
  if (!parsed.success)
    return err(
      createError(
        ErrorCode.InternalError,
        "Unable to load related articles.",
        parsed.error,
      ),
    );
  return ok(parsed.data);
}

export async function getPublishedJournalSlugs(): Promise<
  Result<TJournalPublishedSlug[], IError>
> {
  const result = await fetchPublishedJournalSlugs();
  if (result.isErr()) return err(result.error);
  const parsed = z
    .array(journalPublishedSlugSchema)
    .max(JOURNAL_LIMITS.MAX_ARTICLES)
    .refine(
      (articles) =>
        new Set(articles.map((article) => article.slug)).size ===
        articles.length,
      "Published article URLs must be unique.",
    )
    .safeParse(result.value);
  if (!parsed.success)
    return err(
      createError(
        ErrorCode.InternalError,
        "Unable to load published article URLs.",
        parsed.error,
      ),
    );
  return ok(parsed.data);
}

export async function journalArticleExists(
  slug: string,
): Promise<Result<boolean, IError>> {
  if (!journalSlugSchema.safeParse(slug).success) return ok(false);
  const result = await fetchJournalArticleExists(slug);
  if (result.isErr()) return err(result.error);
  const parsed = z.union([z.literal(0), z.literal(1)]).safeParse(result.value);
  if (!parsed.success)
    return err(
      createError(
        ErrorCode.InternalError,
        "Invalid article availability response.",
        parsed.error,
      ),
    );
  return ok(parsed.data === 1);
}
