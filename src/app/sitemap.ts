import type { MetadataRoute } from "next";
import { SITEMAP_STATIC_ROUTES } from "@/lib/constants";
import { loadSeasonalEntries } from "@/lib/seasonal-content";
import { seasonalPath } from "@/lib/seasonal-data";
import { getSiteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();

  const staticPages = SITEMAP_STATIC_ROUTES.map((route) => ({
    url: `${baseUrl}${route}`,
  }));
  const entries = await loadSeasonalEntries();
  return [
    ...staticPages,
    ...entries
      .filter((entry) => !entry.noIndex)
      .map((entry) => ({
        url: `${baseUrl}${seasonalPath(entry.slug)}`,
        lastModified: entry._updatedAt,
      })),
  ];
}
