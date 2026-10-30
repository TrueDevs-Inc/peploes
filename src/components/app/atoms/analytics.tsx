"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { recordNavigation, startAnalytics } from "@/lib/analytics/lifecycle";

export function Analytics() {
  const pathname = usePathname();

  useEffect(() => startAnalytics(), []);
  useEffect(() => {
    recordNavigation(pathname);
  }, [pathname]);

  return null;
}
