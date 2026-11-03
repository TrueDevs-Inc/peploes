import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import styles from "@/components/app/compounds/journal-article.module.css";
import { JournalStoryCard } from "@/components/app/molecules/journal-story-card";
import { Button } from "@/components/ui/button";
import { JOURNAL_UI } from "@/lib/constants/journal";
import { dmSans, ebGaramond } from "@/lib/fonts";
import { formatJournalDate, getJournalCategoryPath } from "@/lib/journal-data";
import type {
  IJournalArticleProps,
  IMenuImageStyle,
  TJournalBlock,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export function JournalArticle({
  article,
  relatedArticles,
  articleAction,
}: IJournalArticleProps) {
  const heroImageStyle: Omit<IMenuImageStyle, "--menu-image-scale"> = {
    "--menu-image-position": article.heroImage.mobilePosition,
    "--menu-image-desktop-position": article.heroImage.desktopPosition,
  };

  return (
    <main className={cn(dmSans.className, ebGaramond.variable, styles.page)}>
      <article aria-labelledby="journal-article-title">
        <header className={styles.hero}>
          <div data-scroll-reveal className={styles.heroCopy}>
            <p className={styles.eyebrow}>
              <Link href={getJournalCategoryPath(article.category.slug)}>
                {article.category.name}
              </Link>
            </p>
            <h1 id="journal-article-title">{article.title}</h1>
            <p className={styles.standfirst}>{article.standfirst}</p>
            <p className={styles.metadata}>
              <time dateTime={article.date}>
                {formatJournalDate(article.date)}
              </time>
              <span aria-hidden="true">·</span>
              <span>{article.readTimeMinutes} min read</span>
              <span aria-hidden="true">·</span>
              <span>{article.author}</span>
            </p>
          </div>
          <div
            data-scroll-reveal
            className={styles.heroImage}
            style={heroImageStyle}
          >
            <Image
              src={article.heroImage.src}
              alt={article.heroImage.alt}
              fill
              preload
              sizes="(min-width: 1584px) calc(50vw + 192px), (min-width: 1280px) calc(100vw - 600px), 100vw"
              className={styles.cover}
            />
          </div>
        </header>
        <div className={styles.intro}>
          <p data-scroll-reveal className="site-container">
            {article.intro}
          </p>
        </div>
        <div className={cn("site-container", styles.body)}>
          {article.blocks.map(renderBlock)}
        </div>
      </article>
      {relatedArticles.length > 0 && (
        <section
          className={styles.related}
          aria-labelledby="journal-related-title"
        >
          <div className="site-container">
            <div data-scroll-reveal className={styles.relatedHeader}>
              <div>
                <p className={styles.relatedEyebrow}>
                  {JOURNAL_UI.relatedLabel}
                </p>
                <h2 id="journal-related-title">
                  More from {article.category.name}
                </h2>
              </div>
              <Button asChild variant="brand-text" className={styles.action}>
                <Link href={getJournalCategoryPath(article.category.slug)}>
                  View all {article.category.name}
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </Button>
            </div>
            <div className={styles.relatedCards}>
              {relatedArticles.map((related) => (
                <div data-scroll-reveal key={related._id}>
                  <JournalStoryCard
                    article={related}
                    action={articleAction}
                    dateGranularity="month"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

function renderBlock(block: TJournalBlock) {
  switch (block._type) {
    case "journalParagraph":
      return (
        <p data-scroll-reveal key={block._key}>
          {block.text}
        </p>
      );
    case "journalHeading": {
      const Heading = block.level === 2 ? "h2" : "h3";
      return (
        <Heading data-scroll-reveal key={block._key}>
          {block.text}
        </Heading>
      );
    }
    case "journalImage":
      return (
        <figure data-scroll-reveal key={block._key} className={styles.figure}>
          <div className={styles.bodyImage}>
            <Image
              {...block.image}
              fill
              sizes="(min-width: 1584px) 1440px, (min-width: 1280px) calc(100vw - 144px), calc(100vw - 32px)"
            />
          </div>
          {block.caption && <figcaption>{block.caption}</figcaption>}
        </figure>
      );
    case "journalQuote":
      return (
        <figure data-scroll-reveal key={block._key} className={styles.quote}>
          <blockquote>
            <p>{block.text}</p>
          </blockquote>
          {block.attribution && <figcaption>{block.attribution}</figcaption>}
        </figure>
      );
  }
  const unreachable: never = block;
  return unreachable;
}
