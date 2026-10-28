"use client";

import { useLayoutEffect, useRef } from "react";
import styles from "@/components/app/compounds/stories.module.css";
import type { IStoryCardProps } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StoryCard({ children, className }: IStoryCardProps) {
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const card = ref.current;
    const copy = card?.querySelector<HTMLElement>("[data-story-copy]");
    const heading = copy?.querySelector("h3");
    const details = copy?.querySelector<HTMLElement>("[data-story-details]");
    if (!card || !copy || !heading || !details) return;

    const positionCopy = () => {
      const headingBottom = heading.offsetTop + heading.offsetHeight;
      const detailsBottom = details.offsetTop + details.offsetHeight;
      const offset = Math.max(0, detailsBottom - headingBottom);
      card.style.setProperty("--story-hidden-offset", `${offset}px`);
    };
    // Establish the measured offset before paint without an initial transition.
    copy.style.transition = "none";
    positionCopy();
    copy.getBoundingClientRect();
    copy.style.removeProperty("transition");
    const resizeObserver = new ResizeObserver(positionCopy);
    for (const element of [card, copy, details])
      resizeObserver.observe(element);

    const touch = window.matchMedia("(hover: none), (pointer: coarse)");
    let observer: IntersectionObserver | undefined;
    let revealed = false;
    const observeCopy = () => {
      observer?.disconnect();
      if (!touch.matches || revealed) return;
      card.dataset.copyReveal = "pending";
      observer = new IntersectionObserver(
        (entries) => {
          if (
            !entries.some(
              (entry) =>
                entry.isIntersecting && entry.intersectionRatio >= 0.15,
            )
          )
            return;
          revealed = true;
          card.dataset.copyReveal = "visible";
          observer?.disconnect();
        },
        { threshold: 0.15, rootMargin: "0px 0px -24px 0px" },
      );
      observer.observe(copy);
    };
    observeCopy();
    touch.addEventListener("change", observeCopy);

    return () => {
      resizeObserver.disconnect();
      observer?.disconnect();
      touch.removeEventListener("change", observeCopy);
    };
  }, []);

  return (
    <article ref={ref} className={cn(styles.card, className)}>
      {children}
    </article>
  );
}
