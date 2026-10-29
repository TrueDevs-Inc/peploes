import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";

import { JsonLd } from "@/components/app/atoms/json-ld";
import { RouteScrollReset } from "@/components/app/atoms/route-scroll-reset";
import { SiteScrollReveal } from "@/components/app/atoms/site-scroll-reveal";
import { VisitAnchorInitializer } from "@/components/app/atoms/visit-anchor-initializer";
import { Footer } from "@/components/app/compounds/footer";
import { Navbar } from "@/components/app/compounds/navbar";
import { DEFAULT_SEO, HTTP_CONTENT_TYPE, ROUTES } from "@/lib/constants";
import { buildSeoMetadata, getSiteUrl, getWebsiteSchema } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  ...buildSeoMetadata({
    title: DEFAULT_SEO.siteName,
    description: DEFAULT_SEO.description,
    url: ROUTES.HOME,
  }),
  metadataBase: new URL(siteUrl),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href={ROUTES.LLMS}
          rel="describedby"
          type={HTTP_CONTENT_TYPE.MARKDOWN}
        />
        <JsonLd
          data={getWebsiteSchema({
            name: DEFAULT_SEO.siteName,
            description: DEFAULT_SEO.description,
            url: siteUrl,
          })}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <RouteScrollReset />
        <SiteScrollReveal />
        <Navbar />
        <VisitAnchorInitializer />
        {children}
        <Footer />
      </body>
    </html>
  );
}
