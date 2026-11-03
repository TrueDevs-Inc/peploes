import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import styles from "@/components/app/molecules/journal-story-card.module.css";
import { Button } from "@/components/ui/button";
import {
  formatJournalDate,
  getJournalArticlePath,
  getJournalCategoryPath,
} from "@/lib/journal-data";
import type { IJournalStoryCardProps } from "@/lib/types";

export function JournalStoryCard({
  article,
  action,
  dateGranularity,
}: IJournalStoryCardProps) {
  const href = getJournalArticlePath(article.slug);

  return (
    <article data-image-card className={styles.card}>
      <Link
        href={href}
        prefetch={true}
        data-card-image
        aria-label={article.title}
        className={styles.image}
      >
        <Image
          src={article.heroImage.src}
          alt={article.heroImage.alt}
          fill
          sizes="(min-width: 1584px) 459px, (min-width: 1280px) calc((100vw - 208px) / 3), (min-width: 1024px) calc((100vw - 96px) / 3), (min-width: 640px) calc((100vw - 64px) / 2), calc(100vw - 32px)"
        />
      </Link>
      <div className={styles.copy}>
        <p className={styles.metadata}>
          <Link href={getJournalCategoryPath(article.category.slug)}>
            {article.category.name}
          </Link>
          <span aria-hidden="true"> / </span>
          <time dateTime={article.date}>
            {formatJournalDate(article.date, dateGranularity)}
          </time>
        </p>
        <h3 className={styles.title}>
          <Link href={href}>{article.title}</Link>
        </h3>
        <Button asChild variant="brand-text" className={styles.action}>
          <Link href={href} data-card-action>
            {action}
            <span className="sr-only">: {article.title}</span>
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </Button>
      </div>
    </article>
  );
}
