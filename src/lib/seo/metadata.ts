import "server-only";

import type { Metadata } from "next";
import { env } from "@/lib/config";
import {
  DEFAULT_SEO,
  RESTAURANT_ADDRESS,
  RESTAURANT_CONTACT,
  ROUTES,
} from "@/lib/constants";
import type {
  IOrganizationSchemaConfig,
  ISeoConfig,
  IWebsiteSchemaConfig,
} from "@/lib/types";
import { isSearchIndexableSite } from "./indexing";

export function getSiteUrl(): string {
  const url = env.NEXT_PUBLIC_SITE_URL;
  return url.replace(/\/$/u, "");
}

export function buildSeoMetadata(config: ISeoConfig): Metadata {
  const {
    title,
    description,
    url,
    image,
    imageAlt,
    imageWidth,
    imageHeight,
    type = "website",
    noIndex,
    noFollow,
    publishedTime,
    modifiedTime,
    author,
  } = config;
  const fullTitle = title.includes(DEFAULT_SEO.siteName)
    ? title
    : `${title}${DEFAULT_SEO.titleSuffix}`;
  const canonical = url.startsWith("http") ? url : `${getSiteUrl()}${url}`;
  const fallbackImage = image ? undefined : DEFAULT_SEO.socialImage;
  const socialImage = image ?? DEFAULT_SEO.socialImage.src;
  const socialImageAlt = imageAlt ?? fallbackImage?.alt;
  const socialImageWidth = imageWidth ?? fallbackImage?.width;
  const socialImageHeight = imageHeight ?? fallbackImage?.height;
  const metadata: Metadata = {
    title: fullTitle,
    description,
    alternates: { canonical },
    openGraph: {
      title: fullTitle,
      description,
      url: canonical,
      type,
      siteName: DEFAULT_SEO.siteName,
      locale: DEFAULT_SEO.locale,
      images: [
        {
          url: socialImage,
          alt: socialImageAlt,
          ...(socialImageWidth ? { width: socialImageWidth } : {}),
          ...(socialImageHeight ? { height: socialImageHeight } : {}),
        },
      ],
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
      ...(author ? { authors: [author] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      ...(DEFAULT_SEO.twitterHandle
        ? { creator: DEFAULT_SEO.twitterHandle }
        : {}),
      images: [socialImage],
    },
    robots: {
      index: !noIndex && isSearchIndexableSite(getSiteUrl()),
      follow: !noFollow,
    },
  };
  return metadata;
}

export function getBreadcrumbSchema(
  items: Array<{ name: string; url: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${getSiteUrl()}${item.url}`,
    })),
  };
}

export function getWebsiteSchema(config: IWebsiteSchemaConfig) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: config.name,
    description: config.description,
    url: config.url,
    ...(config.alternateName ? { alternateName: config.alternateName } : {}),
  };
}

export function getOrganizationSchema(config: IOrganizationSchemaConfig) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: config.name,
    url: config.url,
    ...(config.logoUrl ? { logo: config.logoUrl } : {}),
    ...(config.sameAs?.length ? { sameAs: config.sameAs } : {}),
  };
}

export function getSectionBreadcrumbSchema(
  parent: { name: string; url: string },
  page: { name: string; url: string },
) {
  return getBreadcrumbSchema([
    { name: DEFAULT_SEO.siteName, url: ROUTES.HOME },
    parent,
    page,
  ]);
}

export function getSiteGraph() {
  const siteUrl = getSiteUrl();
  const organizationId = `${siteUrl}/#organization`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: DEFAULT_SEO.siteName,
        url: siteUrl,
        telephone: RESTAURANT_CONTACT.phone,
        email: RESTAURANT_CONTACT.email,
        address: {
          "@type": "PostalAddress",
          streetAddress: RESTAURANT_ADDRESS.streetAddress,
          addressLocality: RESTAURANT_ADDRESS.locality,
          addressCountry: RESTAURANT_ADDRESS.countryCode,
        },
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        name: DEFAULT_SEO.siteName,
        description: DEFAULT_SEO.description,
        url: siteUrl,
        publisher: { "@id": organizationId },
      },
    ],
  } as const;
}
