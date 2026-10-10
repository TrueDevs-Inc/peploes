import type { MetadataRoute } from "next";
import { ROUTES } from "@/lib/constants";
import { getSiteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();

  return [
    ROUTES.HOME,
    ROUTES.LUNCH,
    ROUTES.DINNER,
    ROUTES.PRE_THEATRE,
    ROUTES.WINE,
    ROUTES.COCKTAILS,
    ROUTES.GROUP_SET_MENU,
    ROUTES.SEASONAL,
    ROUTES.PRIVATE_DINING,
    ROUTES.CELEBRATIONS,
    ROUTES.CORPORATE_EVENTS,
    ROUTES.WEDDINGS,
  ].map((route) => ({
    url: `${baseUrl}${route}`,
  }));
}
