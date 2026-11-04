import { JournalArticle } from "@/components/app/compounds/journal-article";
import { JOURNAL_UI } from "@/lib/constants/journal";
import {
  loadJournalArticle,
  loadRelatedJournalArticles,
} from "@/lib/journal-content";
import { getJournalArticlePath } from "@/lib/journal-data";
import { buildSeoMetadata } from "@/lib/seo";
import type { IJournalRouteProps } from "@/lib/types";

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: IJournalRouteProps) {
  const { slug } = await params;
  const article = await loadJournalArticle(slug);
  return buildSeoMetadata({
    title: article.title,
    description: article.seoDescription,
    url: getJournalArticlePath(article.slug),
    image: article.heroImage.src,
    imageAlt: article.heroImage.alt,
    type: "article",
    publishedTime: article.date,
    modifiedTime: article._updatedAt,
    author: article.author,
    noIndex: article.noIndex,
  });
}

export default async function JournalArticlePage({
  params,
}: IJournalRouteProps) {
  const { slug } = await params;
  const article = await loadJournalArticle(slug);
  const relatedArticles = await loadRelatedJournalArticles(
    article.category.slug,
    article.slug,
  );
  return (
    <JournalArticle
      article={article}
      relatedArticles={relatedArticles}
      articleAction={JOURNAL_UI.articleAction}
    />
  );
}
