import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

function getConfiguredOrigin(value: string | undefined): string | undefined {
  if (!value || !URL.canParse(value)) return undefined;

  return new URL(value).origin;
}

const nextConfig: NextConfig = {
  typedRoutes: true,
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-select",
      "@radix-ui/react-tabs",
      "@radix-ui/react-popover",
    ],
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        pathname: `/images/${process.env.SANITY_PROJECT_ID}/${process.env.SANITY_DATASET}/**`,
        search: "",
      },
    ],
    minimumCacheTTL: 2_592_000, // 30 days
    deviceSizes: [640, 768, 1024, 1280, 1536],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  headers() {
    const isDevelopment = process.env.NODE_ENV === "development";
    const sentryOrigin = getConfiguredOrigin(
      process.env.NEXT_PUBLIC_SENTRY_DSN,
    );
    const hasClientAnalytics = Boolean(
      process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ||
        process.env.NEXT_PUBLIC_GTM_ID,
    );
    const scriptSources = [
      "script-src",
      "'self'",
      "'unsafe-inline'",
      ...(isDevelopment ? ["'unsafe-eval'"] : []),
      ...(hasClientAnalytics ? ["https://www.googletagmanager.com"] : []),
    ].join(" ");
    const connectionSources = [
      "connect-src",
      "'self'",
      ...(sentryOrigin ? [sentryOrigin] : []),
      ...(hasClientAnalytics
        ? ["https://*.google-analytics.com", "https://analytics.google.com"]
        : []),
    ].join(" ");
    const imageSources = [
      "img-src",
      "'self'",
      "data:",
      "blob:",
      ...(hasClientAnalytics ? ["https://*.google-analytics.com"] : []),
      "https://cdn.sanity.io",
    ].join(" ");

    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: [
              "camera=()",
              "display-capture=()",
              "geolocation=()",
              "microphone=()",
            ].join(", "),
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              scriptSources,
              "style-src 'self' 'unsafe-inline'",
              imageSources,
              "font-src 'self' data:",
              connectionSources,
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
      {
        source: "/:path*",
        has: [
          {
            type: "header",
            key: "x-presentation",
            value: "admin",
          },
        ],
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex",
          },
        ],
      },
      // HSTS only in production
      ...(process.env.NODE_ENV === "production"
        ? [
            {
              source: "/(.*)",
              headers: [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=31536000",
                },
              ],
            },
          ]
        : []),
    ];
  },
  redirects() {
    return [
      {
        source: "/home",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

const shouldEnableSentry = Boolean(
  process.env.SENTRY_AUTH_TOKEN &&
    process.env.SENTRY_ORG &&
    process.env.SENTRY_PROJECT,
);

const isProductionDeployment =
  process.env.VERCEL_ENV === "production" ||
  process.env.NODE_ENV === "production";

const sentryConfig = {
  disableLogger: true,
  silent: !process.env.CI,
  hideSourceMaps: isProductionDeployment,
};

const exportConfig = shouldEnableSentry
  ? withSentryConfig(nextConfig, sentryConfig)
  : nextConfig;

export default exportConfig;
