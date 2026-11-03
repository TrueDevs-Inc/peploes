import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import styles from "@/components/app/compounds/journal.module.css";
import { JournalArticleList } from "@/components/app/compounds/journal-article-list";
import { Button } from "@/components/ui/button";
import { JOURNAL_UI } from "@/lib/constants/journal";
import { dmSans, ebGaramond } from "@/lib/fonts";
import {
  formatJournalDate,
  getJournalArticlePath,
  getJournalCategoryPath,
} from "@/lib/journal-data";
import type { IJournalHubProps, TJournalPage } from "@/lib/types";
import { cn } from "@/lib/utils";

export function Journal({
  content,
  categories,
  articles,
  initialCategory,
}: IJournalHubProps) {
  const featured = content.featuredArticle;
  const featuredHref = getJournalArticlePath(featured.slug);

  return (
    <main className={cn(dmSans.className, ebGaramond.variable, styles.page)}>
      <JournalHero {...content.hero} />
      <section className={styles.featured} aria-labelledby="journal-featured">
        <div className="site-container">
          <p data-scroll-reveal className={styles.featuredLabel}>
            {JOURNAL_UI.featuredLabel}
          </p>
          <article data-image-card className={styles.featuredStory}>
            <Link
              data-scroll-reveal
              data-card-image
              href={featuredHref}
              prefetch={true}
              aria-label={featured.title}
              className={styles.featuredImage}
            >
              <Image
                src={featured.heroImage.src}
                alt={featured.heroImage.alt}
                fill
                sizes="(min-width: 1584px) 688px, (min-width: 1280px) calc((100vw - 208px) / 2), (min-width: 1024px) calc((100vw - 96px) / 2), calc(100vw - 32px)"
                className={styles.cover}
              />
            </Link>
            <div data-scroll-reveal className={styles.featuredCopy}>
              <p className={styles.metadata}>
                <Link href={getJournalCategoryPath(featured.category.slug)}>
                  {featured.category.name}
                </Link>
                <span aria-hidden="true"> · </span>
                <span>{featured.readTimeMinutes} min read</span>
                <span aria-hidden="true"> · </span>
                <time dateTime={featured.date}>
                  {formatJournalDate(featured.date)}
                </time>
              </p>
              <h2 id="journal-featured">
                <Link href={featuredHref}>{featured.title}</Link>
              </h2>
              <p className={styles.featuredDescription}>
                {featured.standfirst}
              </p>
              <Button asChild variant="brand-text" className={styles.action}>
                <Link href={featuredHref} data-card-action>
                  {content.listing.articleAction}
                  <span className="sr-only">: {featured.title}</span>
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </Button>
            </div>
          </article>
        </div>
      </section>
      <Suspense fallback={<div aria-busy="true" className="min-h-screen" />}>
        <JournalArticleList
          listing={content.listing}
          categories={categories}
          articles={articles.filter((article) => article._id !== featured._id)}
          initialCategory={initialCategory}
        />
      </Suspense>
      <JournalClosing {...content.closing} />
    </main>
  );
}

function JournalHero(hero: TJournalPage["hero"]) {
  return (
    <section className={styles.hero} aria-labelledby="journal-title">
      {hero.image && (
        <div className={styles.heroImage}>
          <Image
            {...hero.image}
            fill
            preload
            sizes="(min-width: 1024px) 73vw, 100vw"
            className={styles.cover}
          />
        </div>
      )}
      <div className="site-container">
        <div data-scroll-reveal className={styles.heroCopy}>
          <p className={styles.heroEyebrow}>{hero.eyebrow}</p>
          <h1 id="journal-title">{hero.heading}</h1>
          <p className={styles.standfirst}>{hero.standfirst}</p>
          <p className={styles.description}>{hero.description}</p>
        </div>
      </div>
    </section>
  );
}

function JournalClosing(closing: TJournalPage["closing"]) {
  return (
    <section className={styles.closing} aria-labelledby="journal-closing">
      <div className={styles.closingImage}>
        <Image {...closing.image} fill sizes="100vw" className={styles.cover} />
      </div>
      <div className="site-container">
        <h2
          data-scroll-reveal
          id="journal-closing"
          className={styles.closingCopy}
        >
          {closing.heading}
        </h2>
      </div>
    </section>
  );
}
