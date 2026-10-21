"use client";

import { useEffect } from "react";

import { ROUTES } from "@/lib/constants";

export function VisitAnchorInitializer() {
  useEffect(() => {
    const initialUrl = new URL(window.location.href);
    const targetId = initialUrl.hash.slice(1);
    if (
      initialUrl.pathname !== ROUTES.VISIT_CONTACT ||
      (targetId !== "opening-hours" && targetId !== "find-us")
    ) {
      return;
    }

    const navigation = performance.getEntriesByType("navigation")[0];
    if (
      navigation &&
      "type" in navigation &&
      navigation.type === "back_forward"
    ) {
      return;
    }

    let observer: ResizeObserver | undefined;

    // Streamed content can still be hidden when load fires.
    function restoreInitialAnchor() {
      const target = document.getElementById(targetId);
      if (!target) return;
      observer = new ResizeObserver(() => {
        if (window.location.href !== initialUrl.href || window.scrollY !== 0) {
          observer?.disconnect();
          return;
        }
        if (target.getClientRects().length === 0) return;
        observer?.disconnect();
        target.scrollIntoView();
      });
      observer.observe(target);
    }

    if (document.readyState === "complete") {
      restoreInitialAnchor();
    } else {
      window.addEventListener("load", restoreInitialAnchor, { once: true });
    }

    return () => {
      window.removeEventListener("load", restoreInitialAnchor);
      observer?.disconnect();
    };
  }, []);

  return null;
}
