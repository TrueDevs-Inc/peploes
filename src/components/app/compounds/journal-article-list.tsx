"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import styles from "@/components/app/compounds/journal-article-list.module.css";
import { JournalStoryCard } from "@/components/app/molecules/journal-story-card";
import { Button } from "@/components/ui/button";
import { JOURNAL_UI } from "@/lib/constants/journal";
import { getJournalCategoryPath } from "@/lib/journal-data";
import type {
  IJournalArticleListProps,
  IJournalArticleResultsProps,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export function JournalArticleList({
  articles,
  categories,
  listing,
  initialCategory,
}: IJournalArticleListProps) {
  const searchParams = useSearchParams();
  const requestedCategory = searchParams
    ? (searchParams.get("category") ?? "")
    : (initialCategory ?? "");
  const activeCategory = categories.find(
    (category) => category.slug === requestedCategory,
  );
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const hasAlignedTab = useRef(false);
  const activeSlug = activeCategory?.slug ?? "";
  const previousSlug = useRef(activeSlug);
  const [hasChangedCategory, setHasChangedCategory] = useState(false);
  const invalidCategory = searchParams?.has("category") && !activeCategory;

  useLayoutEffect(() => {
    if (previousSlug.current !== activeSlug) {
      previousSlug.current = activeSlug;
      setHasChangedCategory(true);
    }
    const scroll = categoryScrollRef.current;
    const indicator = indicatorRef.current;
    if (!scroll || !indicator) return;
    const update = () => {
      const active = scroll.querySelector<HTMLElement>("[aria-current]");
      if (!active) return;
      const bounds = active.getBoundingClientRect();
      indicator.style.transform = `translateX(${bounds.left - scroll.getBoundingClientRect().left + scroll.scrollLeft}px) scaleX(${bounds.width})`;
      scroll.dataset.indicatorReady = "true";
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(scroll);
    for (const link of scroll.querySelectorAll("a")) observer.observe(link);
    return () => observer.disconnect();
  }, [activeSlug]);

  useEffect(() => {
    if (!invalidCategory) return;
    const url = new URL(window.location.href);
    url.searchParams.delete("category");
    window.history.replaceState(null, "", url);
  }, [invalidCategory]);

  useEffect(() => {
    const scroll = categoryScrollRef.current;
    const active = scroll?.querySelector<HTMLElement>("[aria-current]");
    if (!scroll || !active || active.dataset.category !== activeSlug) return;
    scroll.scrollTo({ left: scroll.scrollLeft, behavior: "instant" });
    const bounds = active.getBoundingClientRect();
    const viewport = scroll.getBoundingClientRect();
    const behavior =
      hasAlignedTab.current &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "smooth"
        : "instant";
    if (bounds.left < viewport.left) {
      scroll.scrollBy({
        left: bounds.left - viewport.left,
        behavior,
      });
    } else if (bounds.right > viewport.right) {
      scroll.scrollBy({
        left: bounds.right - viewport.right,
        behavior,
      });
    }
    hasAlignedTab.current = true;
  }, [activeSlug]);

  const filteredArticles = activeCategory
    ? articles.filter(
        (article) => article.category.slug === activeCategory.slug,
      )
    : articles;

  function selectCategory(slug?: string) {
    const url = new URL(window.location.href);
    if (slug) url.searchParams.set("category", slug);
    else url.searchParams.delete("category");
    if (url.href !== window.location.href) {
      window.history.pushState(null, "", url);
    }
  }

  return (
    <>
      <nav
        className={styles.categories}
        aria-label={JOURNAL_UI.categoriesLabel}
      >
        <div
          data-scroll-reveal
          className={cn("site-container", styles.categoriesInner)}
        >
          <p className={styles.categoriesLabel}>{JOURNAL_UI.categoriesLabel}</p>
          <div ref={categoryScrollRef} className={styles.categoryScroll}>
            <ul className={styles.categoryLinks}>
              <li>
                <Link
                  href={getJournalCategoryPath()}
                  data-category=""
                  aria-current={!activeCategory ? "page" : undefined}
                  scroll={false}
                  prefetch={false}
                  onNavigate={(event) => {
                    event.preventDefault();
                    selectCategory();
                  }}
                >
                  {listing.allLabel}
                </Link>
              </li>
              {categories.map((category) => (
                <li key={category._id}>
                  <Link
                    href={getJournalCategoryPath(category.slug)}
                    data-category={category.slug}
                    aria-current={
                      activeCategory?.slug === category.slug
                        ? "page"
                        : undefined
                    }
                    scroll={false}
                    prefetch={false}
                    onNavigate={(event) => {
                      event.preventDefault();
                      selectCategory(category.slug);
                    }}
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
            <span
              ref={indicatorRef}
              aria-hidden="true"
              data-journal-indicator
              className={styles.indicator}
            />
          </div>
        </div>
      </nav>
      <section className={styles.stream} aria-labelledby="journal-stories">
        <div className="site-container">
          <div data-scroll-reveal className={styles.introduction}>
            <p className={styles.eyebrow}>{JOURNAL_UI.latestLabel}</p>
            <h2 id="journal-stories">{listing.heading}</h2>
            {listing.description && <p>{listing.description}</p>}
          </div>
          <JournalArticleResults
            key={activeSlug}
            articles={filteredArticles}
            listing={listing}
            animate={hasChangedCategory}
          />
        </div>
      </section>
    </>
  );
}

function JournalArticleResults({
  articles,
  listing,
  animate = false,
}: IJournalArticleResultsProps) {
  const [visibleCount, setVisibleCount] = useState<number>(JOURNAL_UI.pageSize);
  const resultsRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const firstNewIndex = useRef<number | null>(null);
  const previousHeight = useRef<number | null>(null);
  const visibleArticles = articles.slice(0, visibleCount);

  useLayoutEffect(() => {
    if (firstNewIndex.current === null || visibleCount <= firstNewIndex.current)
      return;
    const results = resultsRef.current;
    const height = previousHeight.current;
    previousHeight.current = null;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!results || height === null || reducedMotion.matches) return;

    const animation = results.animate(
      [
        { height: `${height}px`, overflow: "clip" },
        {
          height: `${results.getBoundingClientRect().height}px`,
          overflow: "clip",
        },
      ],
      {
        duration: 500,
        easing: getComputedStyle(results)
          .getPropertyValue("--ease-organic")
          .trim(),
      },
    );
    const stop = () => {
      animation.removeEventListener("finish", stop);
      animation.cancel();
      reducedMotion.removeEventListener("change", stop);
      window.removeEventListener("resize", stop);
    };
    animation.addEventListener("finish", stop);
    reducedMotion.addEventListener("change", stop);
    window.addEventListener("resize", stop);
    return stop;
  }, [visibleCount]);

  useEffect(() => {
    if (firstNewIndex.current === null || visibleCount <= firstNewIndex.current)
      return;
    const firstNewCard = listRef.current?.children[firstNewIndex.current];
    firstNewCard?.querySelector<HTMLAnchorElement>("a")?.focus({
      preventScroll: true,
    });
    firstNewIndex.current = null;
  }, [visibleCount]);

  return (
    <div
      ref={resultsRef}
      data-journal-results
      className={animate ? styles.resultsEnter : undefined}
    >
      {articles.length ? (
        <ul ref={listRef} id="journal-story-list" className={styles.cards}>
          {visibleArticles.map((article, index) => (
            <li
              data-scroll-reveal
              key={article._id}
              className={
                index >= JOURNAL_UI.pageSize ? styles.appended : undefined
              }
            >
              <JournalStoryCard
                article={article}
                action={listing.articleAction}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p data-scroll-reveal className={styles.empty}>
          {listing.emptyMessage}
        </p>
      )}
      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {visibleArticles.length} of {articles.length} stories shown.
      </p>
      {visibleCount < articles.length && (
        <div data-scroll-reveal className={styles.loadMore}>
          <Button
            type="button"
            variant="brand-contact"
            size="cta"
            className={styles.loadMoreButton}
            aria-controls="journal-story-list"
            onClick={() => {
              previousHeight.current =
                resultsRef.current?.getBoundingClientRect().height ?? null;
              firstNewIndex.current = visibleCount;
              setVisibleCount((count) => count + JOURNAL_UI.pageSize);
            }}
          >
            {listing.loadMoreAction}
          </Button>
        </div>
      )}
    </div>
  );
}
