"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import cardStyles from "@/components/app/compounds/groups-occasions.module.css";
import styles from "@/components/app/compounds/seasonal-event.module.css";
import { SeasonalEventAction } from "@/components/app/molecules/seasonal-event-action";
import { FOCUS_RING } from "@/lib/constants";
import type { ISeasonalEventRelatedProps } from "@/lib/types";
import { cn } from "@/lib/utils";

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
            <li
              data-image-card
              key={card.id ?? card.title}
              className={cn(styles.relatedCard, cardStyles.card)}
            >
              <Link
                data-card-image
                href={card.href as Route}
                aria-label={card.title}
                className={cn(FOCUS_RING, cardStyles.image, "group")}
              >
                {/* Landscape photos need enough pixels for the full portrait crop. */}
                <Image
                  {...card.image}
                  fill
                  sizes="(min-width: 1280px) 400px, (min-width: 640px) 360px, 280px"
                  className="object-cover transition-transform duration-(--duration-base) ease-out motion-safe:group-hover:scale-105 motion-safe:group-focus-visible:scale-105 motion-reduce:transition-none"
                />
              </Link>
              <div className={cardStyles.copy}>
                <div className={cardStyles.introduction}>
                  <h3 className={cardStyles.title}>{card.title}</h3>
                  <p className={cardStyles.description}>{card.description}</p>
                </div>
                <SeasonalEventAction
                  label={card.action}
                  href={card.href}
                  className={cardStyles.action}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
