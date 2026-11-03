import type { Route } from "next";
import { ROUTES } from "@/lib/constants";

export function getJournalArticlePath(slug: string): Route {
  return `${ROUTES.JOURNAL}/${encodeURIComponent(slug)}` as Route;
}

export function getJournalCategoryPath(slug?: string): Route {
  if (!slug) return ROUTES.JOURNAL;
  return `${ROUTES.JOURNAL}?${new URLSearchParams({ category: slug })}` as Route;
}

export function formatJournalDate(
  date: string,
  granularity: "day" | "month" = "day",
): string {
  return new Intl.DateTimeFormat("en-IE", {
    day: granularity === "day" ? "2-digit" : undefined,
    month: granularity === "day" ? "short" : "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}
