"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import styles from "@/components/app/molecules/menu-content-transition.module.css";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { IMenuContentTransitionProps } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MenuContentTransition({
  slug,
  children,
}: IMenuContentTransitionProps) {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const contentRef = useRef<HTMLDivElement>(null);
  // Keep the displayed menu until its exit finishes, using the latest destination.
  const [displayed, setDisplayed] = useState({ slug, children });
  const [phase, setPhase] = useState<"idle" | "out" | "in">("idle");
  const previousSlug = useRef(slug);

  useLayoutEffect(() => {
    if (previousSlug.current === displayed.slug) return;
    previousSlug.current = displayed.slug;
    const navigation = contentRef.current
      ?.closest("main")
      ?.querySelector("nav");
    if (!navigation) return;
    // A shorter menu must not leave the sticky tabs above the viewport.
    const distance =
      navigation.getBoundingClientRect().top -
      Number.parseFloat(getComputedStyle(navigation).top);
    if (distance < 0) window.scrollBy({ top: distance, behavior: "instant" });
  }, [displayed.slug]);

  useLayoutEffect(() => {
    if (reducedMotion) {
      setDisplayed({ slug, children });
      setPhase("idle");
      return;
    }
    if (displayed.slug === slug) {
      if (displayed.children !== children) setDisplayed({ slug, children });
      if (phase === "out") {
        captureMotion(contentRef.current);
        setPhase("in");
      }
      return;
    }
    if (phase !== "out") {
      captureMotion(contentRef.current);
      setPhase("out");
    }
  }, [
    slug,
    children,
    displayed.slug,
    displayed.children,
    reducedMotion,
    phase,
  ]);

  useEffect(() => {
    if (phase !== "idle" || displayed.slug !== slug || !window.location.hash)
      return;
    let target: HTMLElement | null;
    try {
      target = document.getElementById(
        decodeURIComponent(window.location.hash.slice(1)),
      );
    } catch {
      return;
    }
    target?.scrollIntoView({
      behavior: reducedMotion ? "instant" : "smooth",
      block: "start",
    });
  }, [phase, displayed.slug, slug, reducedMotion]);

  return (
    <div
      ref={contentRef}
      data-menu-content
      data-menu={displayed.slug}
      data-phase={phase}
      aria-busy={displayed.slug !== slug}
      inert={displayed.slug !== slug}
      className={cn(
        phase === "out" && styles.exit,
        phase === "in" && styles.enter,
      )}
      onAnimationEnd={(event) => {
        if (event.target !== event.currentTarget) return;
        if (phase === "out") {
          event.currentTarget.style.removeProperty("--menu-motion-opacity");
          event.currentTarget.style.removeProperty("--menu-motion-transform");
          setDisplayed({ slug, children });
          setPhase("in");
        } else if (phase === "in") {
          setPhase("idle");
        }
      }}
    >
      {displayed.children}
    </div>
  );
}

function captureMotion(element: HTMLDivElement | null) {
  if (!element) return;
  const style = getComputedStyle(element);
  element.style.setProperty("--menu-motion-opacity", style.opacity);
  element.style.setProperty("--menu-motion-transform", style.transform);
}
