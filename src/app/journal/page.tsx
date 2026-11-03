import { Suspense } from "react";
import { Journal } from "@/components/app/compounds/journal";
import { ROUTES } from "@/lib/constants";
import {
  loadJournalArticles,
  loadJournalCategories,
  loadJournalPage,
} from "@/lib/journal-content";
import { buildSeoMetadata } from "@/lib/seo";

export async function generateMetadata() {
  const content = await loadJournalPage();
  return buildSeoMetadata({
    title: content.title,
    description: content.seoDescription,
    url: ROUTES.JOURNAL,
    image: content.hero.image?.src,
    imageAlt: content.hero.image?.alt,
  });
}

export default function JournalPage() {
  return (
    <Suspense
      fallback={
        <main aria-busy="true" className="min-h-screen bg-warm-cream">
          <div className="h-[520px] bg-ink lg:h-[389px]" />
          <p role="status" className="site-container py-12 text-ink">
            Loading the Journal…
          </p>
        </main>
      }
    >
      <PublishedJournalPage />
    </Suspense>
  );
}

async function PublishedJournalPage() {
  const [content, categories, articles] = await Promise.all([
    loadJournalPage(),
    loadJournalCategories(),
    loadJournalArticles(),
  ]);
  return (
    <Journal content={content} categories={categories} articles={articles} />
  );
}
