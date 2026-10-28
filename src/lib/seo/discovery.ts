import "server-only";

import type { MetadataRoute } from "next";

import { AI_CRAWLER_POLICY, DEFAULT_SEO, ROUTES } from "@/lib/constants";
import { COCKTAILS_MENU } from "@/lib/constants/cocktails-menu";
import { DINNER_MENU } from "@/lib/constants/dinner-menu";
import { GROUP_SET_MENU } from "@/lib/constants/group-set-menu";
import { LUNCH_MENU } from "@/lib/constants/lunch-menu";
import { OUR_STORY_CONTENT } from "@/lib/constants/our-story";
import { PRE_THEATRE_MENU } from "@/lib/constants/pre-theatre-menu";
import { PRIVATE_DINING } from "@/lib/constants/private-dining";
import { CELEBRATIONS } from "@/lib/constants/private-dining-celebrations";
import { CORPORATE_EVENTS } from "@/lib/constants/private-dining-corporate";
import { WEDDINGS } from "@/lib/constants/private-dining-weddings";
import { SEASONAL_CONTENT } from "@/lib/constants/seasonal";
import { SEASONAL_MENU } from "@/lib/constants/seasonal-menu";
import { VISIT_CONTACT_CONTENT } from "@/lib/constants/visit-contact";
import { WINE_MENU } from "@/lib/constants/wine-menu";
import { seasonalPath } from "@/lib/seasonal-data";
import type { ILlmsEntry } from "@/lib/types";

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
  isLive: boolean,
): MetadataRoute.Robots {
  if (!isLive) {
    return {
      rules: {
        userAgent: "*",
        allow: ROUTES.HOME,
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

export interface ILlmsPage {
  name: string;
  path: string;
  description: string;
}

export const LLMS_SECTIONS: { heading: string; pages: ILlmsPage[] }[] = [
  {
    heading: "Public pages",
    pages: [
      {
        name: "Home",
        path: ROUTES.HOME,
        description: DEFAULT_SEO.description,
      },
      {
        name: "What’s On",
        path: ROUTES.WHATS_ON,
        description: SEASONAL_CONTENT.seoDescription,
      },
      {
        name: "Our Story",
        path: ROUTES.OUR_STORY,
        description: OUR_STORY_CONTENT.seoDescription,
      },
      {
        name: "Visit & Contact",
        path: ROUTES.VISIT_CONTACT,
        description: VISIT_CONTACT_CONTENT.seoDescription,
      },
    ],
  },
  {
    heading: "Menus",
    pages: [
      {
        name: LUNCH_MENU.title,
        path: ROUTES.LUNCH,
        description: LUNCH_MENU.seoDescription,
      },
      {
        name: DINNER_MENU.title,
        path: ROUTES.DINNER,
        description: DINNER_MENU.seoDescription,
      },
      {
        name: PRE_THEATRE_MENU.title,
        path: ROUTES.PRE_THEATRE,
        description: PRE_THEATRE_MENU.seoDescription,
      },
      {
        name: "Wine List",
        path: ROUTES.WINE,
        description: WINE_MENU.seoDescription,
      },
      {
        name: COCKTAILS_MENU.title,
        path: ROUTES.COCKTAILS,
        description: COCKTAILS_MENU.seoDescription,
      },
      {
        name: GROUP_SET_MENU.title,
        path: ROUTES.GROUP_SET_MENU,
        description: GROUP_SET_MENU.seoDescription,
      },
      {
        name: SEASONAL_MENU.title,
        path: ROUTES.SEASONAL,
        description: SEASONAL_MENU.seoDescription,
      },
    ],
  },
  {
    heading: "Private dining and events",
    pages: [
      {
        name: PRIVATE_DINING.title,
        path: ROUTES.PRIVATE_DINING,
        description: PRIVATE_DINING.seoDescription,
      },
      {
        name: CELEBRATIONS.title,
        path: ROUTES.CELEBRATIONS,
        description: CELEBRATIONS.seoDescription,
      },
      {
        name: CORPORATE_EVENTS.title,
        path: ROUTES.CORPORATE_EVENTS,
        description: CORPORATE_EVENTS.seoDescription,
      },
      {
        name: WEDDINGS.title,
        path: ROUTES.WEDDINGS,
        description: WEDDINGS.seoDescription,
      },
    ],
  },
];

const LLMS_ENTRY_KIND_LABELS = {
  event: "Event",
  campaign: "Campaign",
  menuMoment: "Menu moment",
} as const;

function formatEntryDetail(entry: ILlmsEntry): string {
  const dates =
    entry.endDate && entry.endDate !== entry.date
      ? `${entry.date} to ${entry.endDate}`
      : entry.date;
  return `${LLMS_ENTRY_KIND_LABELS[entry.kind]}, ${dates}.`;
}

export function buildLlmsText(
  siteUrl: string,
  entries: readonly ILlmsEntry[] = [],
): string {
  const sitemapUrl = getAbsolutePublicUrl(siteUrl, ROUTES.SITEMAP);
  const robotsUrl = getAbsolutePublicUrl(siteUrl, ROUTES.ROBOTS);
  const sections = LLMS_SECTIONS.map(({ heading, pages }) => [
    `## ${heading}`,
    "",
    ...pages.map(
      (page) =>
        `- [${page.name}](${getAbsolutePublicUrl(siteUrl, page.path)}): ${page.description}`,
    ),
    "",
  ]);
  const entrySection = entries.length
    ? [
        "## What’s On entries",
        "",
        ...entries.map(
          (entry) =>
            `- [${entry.title}](${getAbsolutePublicUrl(siteUrl, seasonalPath(entry.slug))}): ${entry.summary} ${formatEntryDetail(entry)}`,
        ),
        "",
      ]
    : [];

  const content = [
    `# ${DEFAULT_SEO.siteName}`,
    "",
    `> ${DEFAULT_SEO.description}`,
    "",
    ...sections.flat(),
    ...entrySection,
    "## Discovery",
    "",
    `- [Sitemap](${sitemapUrl}): Canonical public URL inventory.`,
    `- [Robots](${robotsUrl}): Crawler access policy.`,
  ].join("\n");

  return `${content}\n`;
}
