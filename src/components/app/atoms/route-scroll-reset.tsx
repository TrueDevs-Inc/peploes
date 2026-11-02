"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef } from "react";

export function RouteScrollReset() {
  const pathname = usePathname();
  const previousPath = useRef(pathname);

  useLayoutEffect(() => {
    if (previousPath.current !== pathname && !window.location.hash) {
      // Reset before a streamed loading layout can paint at the old scroll position.
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
    previousPath.current = pathname;

    function preserveHistoryScroll() {
      previousPath.current = window.location.pathname;
    }
    window.addEventListener("popstate", preserveHistoryScroll);
    return () => window.removeEventListener("popstate", preserveHistoryScroll);
  }, [pathname]);

  return null;
}
