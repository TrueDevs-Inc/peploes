import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const BOOKING_PAGE = "/book-a-table";

const STRIPE_SOURCES = {
  script: ["https://js.stripe.com", "https://*.js.stripe.com"],
  frame: [
    "https://js.stripe.com",
    "https://*.js.stripe.com",
    "https://hooks.stripe.com",
  ],
  connect: ["https://api.stripe.com"],
} as const;

const NO_EXTRA_SOURCES = { script: [], frame: [], connect: [] } as const;

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
    // Next Link retains the original document CSP when navigating to Visit.
    const hasMapbox = Boolean(process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN);
    const scriptSources = [
      "script-src",
      "'self'",
      "'unsafe-inline'",
      ...(isDevelopment ? ["'unsafe-eval'"] : []),
      ...(hasClientAnalytics ? ["https://www.googletagmanager.com"] : []),
    ];
    const connectionSources = [
      "connect-src",
      "'self'",
      ...(sentryOrigin ? [sentryOrigin] : []),
      ...(hasClientAnalytics
        ? ["https://*.google-analytics.com", "https://analytics.google.com"]
        : []),
    ];
    const imageSources = [
      "img-src",
      "'self'",
      "data:",
      "blob:",
      ...(hasClientAnalytics ? ["https://*.google-analytics.com"] : []),
      "https://cdn.sanity.io",
    ].join(" ");

    function contentSecurityPolicy(stripe: boolean): string {
      const extra = stripe ? STRIPE_SOURCES : NO_EXTRA_SOURCES;
      return [
        "default-src 'self'",
        [...scriptSources, ...extra.script].join(" "),
        "style-src 'self' 'unsafe-inline'",
        imageSources,
        "font-src 'self' data:",
        [
          ...connectionSources,
          ...extra.connect,
          ...(hasMapbox
            ? ["https://api.mapbox.com", "https://events.mapbox.com"]
            : []),
        ].join(" "),
        ...(hasMapbox ? ["worker-src 'self' blob:"] : []),
        ...(extra.frame.length > 0
          ? [["frame-src", ...extra.frame].join(" ")]
          : []),
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
      ].join("; ");
    }

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
            value: contentSecurityPolicy(false),
          },
        ],
      },
      {
        source: BOOKING_PAGE,
        headers: [
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy(true),
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
  rewrites() {
    return [{ source: "/privacy-policy", destination: "/privacy-cookies" }];
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
