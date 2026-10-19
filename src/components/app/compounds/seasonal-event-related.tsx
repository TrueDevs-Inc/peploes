"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import styles from "@/components/app/compounds/seasonal-event.module.css";
import { SeasonalEventAction } from "@/components/app/molecules/seasonal-event-action";
import type { ISeasonalEventRelatedProps } from "@/lib/types";

export function SeasonalEventRelated({ content }: ISeasonalEventRelatedProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    function updateControls() {
      if (!list) return;
      setCanGoBack(list.scrollLeft > 1);
      setCanGoForward(
        list.scrollLeft + list.clientWidth < list.scrollWidth - 1,
      );
    }

    const observer = new ResizeObserver(updateControls);
    observer.observe(list);
    list.addEventListener("scroll", updateControls, { passive: true });
    updateControls();

    return () => {
      observer.disconnect();
      list.removeEventListener("scroll", updateControls);
    };
  }, []);

  function scrollCards(direction: number) {
    const list = listRef.current;
    const firstCard = list?.firstElementChild;
    if (!list || !firstCard) return;

    const distance =
      firstCard.getBoundingClientRect().width +
      Number.parseFloat(getComputedStyle(list).columnGap);
    list.scrollBy({
      left: direction * distance,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }

  return (
    <section className={styles.related} aria-labelledby="event-related">
      <div className="site-container">
        <div className={styles.relatedHeader}>
          <h2 id="event-related" className={styles.eyebrow}>
            {content.eyebrow}
          </h2>
          <div className={styles.carouselControls}>
            <button
              type="button"
              aria-label="Previous related items"
              aria-controls="event-related-items"
              disabled={!canGoBack}
              onClick={() => scrollCards(-1)}
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Next related items"
              aria-controls="event-related-items"
              disabled={!canGoForward}
              onClick={() => scrollCards(1)}
            >
              <ArrowRight aria-hidden="true" className="size-4" />
            </button>
          </div>
        </div>
        <ul
          ref={listRef}
          id="event-related-items"
          className={styles.relatedCards}
        >
          {content.cards.map((card) => (
            <li key={card.id ?? card.title} className={styles.relatedCard}>
              <div className={styles.relatedImage}>
                <Image
                  {...card.image}
                  fill
                  sizes="(min-width: 1024px) 174px, (min-width: 640px) 140px, calc(100vw - 48px)"
                  className={styles.cover}
                />
              </div>
              <div className={styles.relatedCopy}>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
                <SeasonalEventAction label={card.action} href={card.href} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
