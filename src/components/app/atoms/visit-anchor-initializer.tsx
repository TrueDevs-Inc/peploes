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

    // Recover missed cold-load scrolling once; client navigation remains owned by the router.
    function restoreInitialAnchor() {
      if (window.location.href === initialUrl.href && window.scrollY === 0) {
        document.getElementById(targetId)?.scrollIntoView();
      }
    }

    if (document.readyState === "complete") {
      restoreInitialAnchor();
      return;
    }

    window.addEventListener("load", restoreInitialAnchor, { once: true });
    return () => window.removeEventListener("load", restoreInitialAnchor);
  }, []);

  return null;
}
