import "server-only";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { ErrorCode } from "@/lib/enums";
import { unwrapResultOrThrow } from "@/lib/errors";
import {
  getJournalArticle,
  getJournalArticles,
  getJournalCategories,
  getJournalPage,
  getPublishedJournalSlugs,
  getRelatedJournalArticles,
} from "@/services/journal";

const cachedArticles = cache(getJournalArticles);
const cachedArticle = cache(getJournalArticle);
const cachedCategories = cache(getJournalCategories);
const cachedPage = cache(getJournalPage);
const cachedRelatedArticles = cache(getRelatedJournalArticles);
const cachedPublishedSlugs = cache(getPublishedJournalSlugs);

export async function loadPublishedJournalSlugs() {
  await connection();
  return unwrapResultOrThrow(
    await cachedPublishedSlugs(),
    "Unable to load Journal URLs.",
  );
}

export async function loadJournalArticles() {
  await connection();
  return unwrapResultOrThrow(
    await cachedArticles(),
    "Unable to load Journal articles.",
  );
}

export async function loadJournalArticle(slug: string) {
  await connection();
  const result = await cachedArticle(slug);
  if (result.isErr() && result.error.code === ErrorCode.NotFound) notFound();
  return unwrapResultOrThrow(result, "Unable to load the article.");
}

export async function loadJournalCategories() {
  await connection();
  return unwrapResultOrThrow(
    await cachedCategories(),
    "Unable to load Journal categories.",
  );
}

export async function loadJournalPage() {
  await connection();
  return unwrapResultOrThrow(
    await cachedPage(),
    "Unable to load Journal settings.",
  );
}

export async function loadRelatedJournalArticles(
  categorySlug: string,
  currentSlug: string,
) {
  await connection();
  return unwrapResultOrThrow(
    await cachedRelatedArticles(categorySlug, currentSlug),
    "Unable to load related articles.",
  );
}
