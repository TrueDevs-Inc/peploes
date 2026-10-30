import "server-only";

import { NAVBAR_CONTENT, ROUTES } from "@/lib/constants";
import { seasonalPath } from "@/lib/seasonal-data";
import type { TSeasonalEntry } from "@/lib/types";
import { getSectionBreadcrumbSchema } from "./metadata";

export function getSeasonalBreadcrumb(entry: TSeasonalEntry) {
  if (entry.noIndex) return null;

  return getSectionBreadcrumbSchema(
    { name: NAVBAR_CONTENT.whatsOnLabel, url: ROUTES.WHATS_ON },
    { name: entry.title, url: seasonalPath(entry.slug) },
  );
}
