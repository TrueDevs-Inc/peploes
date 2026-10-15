import "server-only";

import type { MetadataRoute } from "next";

import { AI_CRAWLER_POLICY, DEFAULT_SEO, ROUTES } from "@/lib/constants";

function getAbsolutePublicUrl(siteUrl: string, path: string): string {
  const baseUrl = siteUrl.replace(/\/+$/u, "");
  return path === ROUTES.HOME ? `${baseUrl}/` : `${baseUrl}${path}`;
}

function getCrawlerAccess(allow: boolean) {
  if (!allow) return { disallow: ROUTES.HOME };

  return { allow: ROUTES.HOME };
}

export function buildRobots(
  siteUrl: string,
  isProduction: boolean,
): MetadataRoute.Robots {
  if (!isProduction) {
    return {
      rules: {
        userAgent: "*",
        disallow: ROUTES.HOME,
      },
    };
  }

  return {
    rules: [
      {
        userAgent: [...AI_CRAWLER_POLICY.SEARCH.USER_AGENTS],
        ...getCrawlerAccess(AI_CRAWLER_POLICY.SEARCH.ALLOW),
      },
      {
        userAgent: [...AI_CRAWLER_POLICY.TRAINING.USER_AGENTS],
        ...getCrawlerAccess(AI_CRAWLER_POLICY.TRAINING.ALLOW),
      },
      {
        userAgent: [...AI_CRAWLER_POLICY.MIXED_USE.USER_AGENTS],
        ...getCrawlerAccess(AI_CRAWLER_POLICY.MIXED_USE.ALLOW),
      },
      {
        userAgent: "*",
        allow: ROUTES.HOME,
      },
    ],
    sitemap: getAbsolutePublicUrl(siteUrl, ROUTES.SITEMAP),
  };
}

export function buildLlmsText(siteUrl: string): string {
  const homeUrl = getAbsolutePublicUrl(siteUrl, ROUTES.HOME);
  const storyUrl = getAbsolutePublicUrl(siteUrl, ROUTES.OUR_STORY);
  const visitUrl = getAbsolutePublicUrl(siteUrl, ROUTES.VISIT_CONTACT);
  const sitemapUrl = getAbsolutePublicUrl(siteUrl, ROUTES.SITEMAP);
  const robotsUrl = getAbsolutePublicUrl(siteUrl, ROUTES.ROBOTS);

  const content = [
    `# ${DEFAULT_SEO.siteName}`,
    "",
    `> ${DEFAULT_SEO.description}`,
    "",
    "## Public pages",
    "",
    `- [Home](${homeUrl}): Application home page.`,
    `- [Our Story](${storyUrl}): The Canny family, the restaurant’s founding and the people behind Peploe’s.`,
    `- [Visit & Contact](${visitUrl}): Opening hours, directions and contact details.`,
    "",
    "## Discovery",
    "",
    `- [Sitemap](${sitemapUrl}): Canonical public URL inventory.`,
    `- [Robots](${robotsUrl}): Crawler access policy.`,
  ].join("\n");

  return `${content}\n`;
}
