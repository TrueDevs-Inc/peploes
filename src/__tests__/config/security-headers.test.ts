import { afterEach, describe, expect, it, vi } from "vitest";

import nextConfig from "../../../next.config";

const HTML_LIMITED_BOTS = [
  "Google-InspectionTool",
  "Google-Extended",
  "Bingbot",
  "Applebot",
  "facebookexternalhit",
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "CCBot",
];

async function getGlobalHeaders(): Promise<Map<string, string>> {
  const headerRules = await nextConfig.headers?.();
  const headers =
    headerRules
      ?.filter((rule) => rule.source === "/(.*)")
      .flatMap((rule) => rule.headers) ?? [];

  return new Map(headers.map((header) => [header.key, header.value]));
}

async function getBookingPagePolicy(): Promise<string | undefined> {
  const headerRules = (await nextConfig.headers?.()) ?? [];
  const policies = headerRules
    .filter(
      (rule) => rule.source === "/(.*)" || rule.source === "/book-a-table",
    )
    .flatMap((rule) => rule.headers)
    .filter((header) => header.key === "Content-Security-Policy");
  return policies.at(-1)?.value;
}

describe("security headers", function securityHeaderTests() {
  afterEach(function restoreEnvironment() {
    vi.unstubAllEnvs();
  });

  it.each(["production", "preview", "development", ""])(
    "does not add an indexing override for deployment %s",
    async (deployment) => {
      vi.stubEnv("VERCEL_ENV", deployment);
      expect((await getGlobalHeaders()).has("X-Robots-Tag")).toBe(false);
    },
  );

  it.each([
    ["https://deploy-preview-12--peploes.netlify.app", "noindex"],
    ["https://peploes-git-dev-truedevs.vercel.app", "noindex"],
    ["https://peploes.netlify.app", undefined],
    ["https://peploes.com", undefined],
  ])("sets the indexing header for site %s", async (siteUrl, expected) => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", siteUrl);
    expect((await getGlobalHeaders()).get("X-Robots-Tag")).toBe(expected);
  });

  it("allows configured Mapbox across documents for client navigation", async function mapboxPolicyTest() {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN", "pk.test-only");
    const globalPolicy = (await getGlobalHeaders()).get(
      "Content-Security-Policy",
    );
    const bookingPolicy = await getBookingPagePolicy();
    for (const policy of [globalPolicy, bookingPolicy]) {
      expect(policy).toContain("https://api.mapbox.com");
      expect(policy).toContain("https://events.mapbox.com");
      expect(policy).toContain("worker-src 'self' blob:");
      expect(policy).not.toContain("'unsafe-eval'");
      expect(policy).toContain("frame-ancestors 'none'");
    }
  });

  it("omits Mapbox permissions when no public token is configured", async function unconfiguredMapboxTest() {
    vi.stubEnv("NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN", "");
    const policy = (await getGlobalHeaders()).get("Content-Security-Policy");
    expect(policy).not.toContain("mapbox.com");
    expect(policy).not.toContain("worker-src");
  });

  it("omits eval permission from the production CSP", async function productionCspTest() {
    vi.stubEnv("NODE_ENV", "production");

    const headers = await getGlobalHeaders();
    const contentSecurityPolicy = headers.get("Content-Security-Policy");

    expect(contentSecurityPolicy).toBeTypeOf("string");
    expect(contentSecurityPolicy).not.toContain("'unsafe-eval'");
  });

  it("restricts plugins, base URLs, and form targets", async function strictDocumentPolicyTest() {
    vi.stubEnv("NODE_ENV", "production");

    const headers = await getGlobalHeaders();
    const contentSecurityPolicy = headers.get("Content-Security-Policy");

    expect(contentSecurityPolicy).toContain("object-src 'none'");
    expect(contentSecurityPolicy).toContain("base-uri 'self'");
    expect(contentSecurityPolicy).toContain("form-action 'self'");
  });

  it("does not preload derived project domains", async function hstsPreloadTest() {
    vi.stubEnv("NODE_ENV", "production");

    const headers = await getGlobalHeaders();

    expect(headers.get("Strict-Transport-Security")).toBe("max-age=31536000");
  });

  it("does not allow unconfigured monitoring or analytics providers", async function optionalProviderTest() {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "");
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "");
    vi.stubEnv("NEXT_PUBLIC_GTM_ID", "");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "");

    const headers = await getGlobalHeaders();
    const contentSecurityPolicy = headers.get("Content-Security-Policy");

    expect(contentSecurityPolicy).not.toContain("posthog.com");
    expect(contentSecurityPolicy).not.toContain("sentry.io");
    expect(contentSecurityPolicy).not.toContain("google-analytics.com");
    expect(contentSecurityPolicy).not.toContain("analytics.google.com");
  });

  it("does not allow arbitrary remote images", async function remoteImageTest() {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "");
    vi.stubEnv("NEXT_PUBLIC_GTM_ID", "");

    const headers = await getGlobalHeaders();
    const contentSecurityPolicy = headers.get("Content-Security-Policy");

    const imageDirective = contentSecurityPolicy
      ?.split("; ")
      .find((directive) => directive.startsWith("img-src "));
    expect(imageDirective?.split(" ")).toEqual([
      "img-src",
      "'self'",
      "data:",
      "blob:",
      "https://cdn.sanity.io",
    ]);
  });

  it("allows explicitly configured monitoring and analytics providers", async function configuredProviderTest() {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv(
      "NEXT_PUBLIC_SENTRY_DSN",
      "https://public@example.ingest.sentry.io/1",
    );
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-TEST");

    const headers = await getGlobalHeaders();
    const contentSecurityPolicy = headers.get("Content-Security-Policy");

    expect(contentSecurityPolicy).toContain("https://example.ingest.sentry.io");
    expect(contentSecurityPolicy).not.toContain("https://*.sentry.io");
    expect(contentSecurityPolicy).toContain("https://www.googletagmanager.com");
    expect(contentSecurityPolicy).toContain("https://*.google-analytics.com");
    expect(contentSecurityPolicy).toContain("https://analytics.google.com");
    expect(contentSecurityPolicy).toContain(
      "img-src 'self' data: blob: https://*.google-analytics.com",
    );
  });

  it("allows PostHog only when both its key and host are configured", async function postHogTest() {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://eu.i.posthog.com");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");
    expect(
      (await getGlobalHeaders()).get("Content-Security-Policy"),
    ).not.toContain("posthog.com");

    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test");
    const policy = (await getGlobalHeaders()).get("Content-Security-Policy");
    const directive = (name: string) =>
      policy?.split("; ").find((part) => part.startsWith(`${name} `));
    expect(directive("script-src")).toContain("https://*.posthog.com");
    expect(directive("connect-src")).toContain("https://*.posthog.com");
    expect(directive("img-src")).not.toContain("posthog");
    expect(directive("default-src")).toBe("default-src 'self'");
  });

  it("allows a PostHog proxy host by its exact origin", async function postHogProxyTest() {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://ph.example.com/ingest");

    const policy = (await getGlobalHeaders()).get("Content-Security-Policy");

    expect(policy).toContain("https://ph.example.com");
    expect(policy).not.toContain("posthog.com");
  });

  it("keeps Stripe and PostHog together across documents", async function stripeWithPostHogTest() {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://us.i.posthog.com");

    const globalPolicy = (await getGlobalHeaders()).get(
      "Content-Security-Policy",
    );
    const bookingPolicy = await getBookingPagePolicy();
    for (const policy of [globalPolicy, bookingPolicy]) {
      expect(policy).toContain("https://js.stripe.com");
      expect(policy).toContain("https://api.stripe.com");
      expect(policy).toContain("https://*.posthog.com");
    }
  });

  it("uses development-only script and transport settings", async function developmentPolicyTest() {
    vi.stubEnv("NODE_ENV", "development");

    const headers = await getGlobalHeaders();

    expect(headers.get("Content-Security-Policy")).toContain("'unsafe-eval'");
    expect(headers.has("Strict-Transport-Security")).toBe(false);
  });

  it("allows Stripe.js across documents for client navigation, with 3-D Secure frames", async function stripePolicyTest() {
    vi.stubEnv("NODE_ENV", "production");

    const globalPolicy = (await getGlobalHeaders()).get(
      "Content-Security-Policy",
    );
    const bookingPolicy = await getBookingPagePolicy();

    expect(bookingPolicy).toBe(globalPolicy);
    for (const policy of [globalPolicy, bookingPolicy]) {
      expect(policy).toContain(
        "script-src 'self' 'unsafe-inline' https://js.stripe.com https://*.js.stripe.com",
      );
      expect(policy).toContain(
        "frame-src https://js.stripe.com https://*.js.stripe.com https://hooks.stripe.com",
      );
      expect(policy).toContain("connect-src 'self' https://api.stripe.com");
      expect(policy).toContain("frame-ancestors 'none'");
      expect(policy).toContain("object-src 'none'");
    }
  });

  it("keeps Next's default HTML-limited bots and adds AI fetchers", function htmlLimitedBotsTest() {
    const pattern = nextConfig.htmlLimitedBots;

    expect(pattern).toBeInstanceOf(RegExp);
    for (const bot of HTML_LIMITED_BOTS) {
      expect(pattern?.test(`Mozilla/5.0 (compatible; ${bot}/1.0)`), bot).toBe(
        true,
      );
    }
    expect(pattern?.test("Mozilla/5.0 Chrome/130 Safari/537.36")).toBe(false);
  });
});
