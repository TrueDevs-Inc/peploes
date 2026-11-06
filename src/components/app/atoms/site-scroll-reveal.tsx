"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import styles from "@/components/app/atoms/site-scroll-reveal.module.css";

const targets = "[data-scroll-reveal]";

export function SiteScrollReveal() {
  const pathname = usePathname();
  return <PageScrollReveal key={pathname} />;
}

function PageScrollReveal() {
  useEffect(() => {
    const elements = new Set<HTMLElement>();
    const media = window.matchMedia("(prefers-reduced-motion: no-preference)");
    let observer: IntersectionObserver | undefined;

    const reveal = (element: HTMLElement) => {
      element.dataset.scrollRevealState = "visible";
      observer?.unobserve(element);
    };
    const reset = () => {
      observer?.disconnect();
      for (const element of elements) {
        element.classList.remove(styles.target);
        delete element.dataset.scrollRevealState;
      }
      elements.clear();
    };
    const registerElement = (element: HTMLElement) => {
      if (elements.has(element) || element.parentElement?.closest(targets))
        return;
      // Streamed content is staged in hidden containers before entering the page.
      if (element.getClientRects().length === 0) return;
      elements.add(element);
      const bounds = element.getBoundingClientRect();
      element.classList.add(styles.target);
      if (bounds.top < window.innerHeight - 24) {
        reveal(element);
      } else {
        element.dataset.scrollRevealState = "pending";
        observer?.observe(element);
      }
    };
    const register = () => {
      for (const element of elements) {
        if (!element.isConnected) {
          observer?.unobserve(element);
          elements.delete(element);
        }
      }
      if (!media.matches) return;
      document.querySelectorAll<HTMLElement>(targets).forEach(registerElement);
    };
    const observe = () => {
      reset();
      if (!media.matches) return;
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (
              entry.isIntersecting &&
              (entry.intersectionRatio >= 0.15 ||
                entry.boundingClientRect.height > window.innerHeight - 24)
            )
              reveal(entry.target as HTMLElement);
          }
        },
        { threshold: [0, 0.15], rootMargin: "0px 0px -24px 0px" },
      );
      register();
    };
    const onFocus = (event: FocusEvent) => {
      if (!media.matches || !(event.target instanceof Element)) return;
      const element = event.target.closest<HTMLElement>(`.${styles.target}`);
      if (element) reveal(element);
    };

    observe();
    // Route content can arrive after the layout through a streamed boundary.
    const mutations = new MutationObserver(register);
    mutations.observe(document.body, { childList: true, subtree: true });
    media.addEventListener("change", observe);
    document.addEventListener("focusin", onFocus);
    return () => {
      reset();
      mutations.disconnect();
      media.removeEventListener("change", observe);
      document.removeEventListener("focusin", onFocus);
    };
  }, []);

  return null;
}
