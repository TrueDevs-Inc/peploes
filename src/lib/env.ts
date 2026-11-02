import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  onValidationError: (issues) => {
    const messages = issues.map(
      (i) => `${i.path?.join(".") ?? "(root)"}: ${i.message}`,
    );
    throw new Error(`Invalid environment variables:\n${messages.join("\n")}`);
  },

  server: {
    SANITY_PROJECT_ID: z.string().regex(/^[a-z0-9]+$/),
    SANITY_DATASET: z.string().regex(/^[a-z0-9][a-z0-9_-]*$/),
    SANITY_API_VERSION: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    SANITY_WEBHOOK_SECRET: z.string().min(32).optional(),

    DATABASE_URL: z.url(),
    DATABASE_POOL_SIZE: z.coerce.number().default(10),
    NODE_ENV: z
      .enum(["production", "development", "test"])
      .default("development"),
    PORT: z.coerce.number().default(3000),

    SENTRY_DSN: z.url().optional(),
    SENTRY_AUTH_TOKEN: z.string().optional(),
    SENTRY_ORG: z.string().optional(),
    SENTRY_PROJECT: z.string().optional(),

    GA_API_SECRET: z.string().optional(),
    ADMIN_EMAIL: z.email().optional(),
    ALLOWED_ORIGINS: z.string().optional(),

    RESDIARY_API_URL: z
      .url()
      .refine((value) => value.startsWith("https://"), "Must use https")
      .optional(),
    RESDIARY_MICROSITE_NAME: z.string().min(1).optional(),
    RESDIARY_CHANNEL_CODE: z.string().min(1).optional(),
    RESDIARY_USERNAME: z.string().min(1).optional(),
    RESDIARY_PASSWORD: z.string().min(1).optional(),
    BOOKING_HOLD_SECRET: z.string().min(32).optional(),
    UPSTASH_REDIS_REST_URL: z
      .url()
      .refine((value) => value.startsWith("https://"), "Must use https")
      .optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
    VERCEL_ENV: z.enum(["production", "preview", "development"]).optional(),

    PREFER_SMTP: z.string().optional(),
    EMAIL_SMTP_HOST: z.string().min(1).optional(),
    EMAIL_SMTP_PORT: z.coerce.number().int().min(1).max(65535).optional(),
    EMAIL_SMTP_AUTH_METHOD: z.enum(["app-password", "oauth2"]).optional(),
    EMAIL_SMTP_USERNAME: z.email().optional(),
    EMAIL_SMTP_PASSWORD: z.string().min(1).optional(),
    EMAIL_SMTP_OAUTH_CLIENT_ID: z.string().min(1).optional(),
    EMAIL_SMTP_OAUTH_CLIENT_SECRET: z.string().min(1).optional(),
    EMAIL_SMTP_OAUTH_REFRESH_TOKEN: z.string().min(1).optional(),
    EMAIL_RESEND_API_KEY: z.string().min(1).optional(),
    EMAIL_FROM_ADDRESS: z.email().optional(),
    EMAIL_FROM_NAME: z.string().min(1).optional(),
    EMAIL_REPLY_TO: z.email().optional(),
    EMAIL_RESTAURANT_TO: z.email().optional(),
    EMAIL_STAGING_ALLOWLIST: z.string().optional(),
    EMAIL_RATE_LIMIT_SECRET: z.string().min(32).optional(),
  },

  clientPrefix: "NEXT_PUBLIC_",

  client: {
    NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: z.string().startsWith("pk.").optional(),
    NEXT_PUBLIC_MAPBOX_STYLE_URL: z
      .string()
      .regex(/^mapbox:\/\/styles\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/)
      .default("mapbox://styles/mapbox/light-v11"),
    NEXT_PUBLIC_SITE_URL: z.url(),
    NEXT_PUBLIC_API_BASE_URL: z.url().default("http://localhost:3000"),
    NEXT_PUBLIC_SENTRY_DSN: z.url().optional(),
    NEXT_PUBLIC_SENTRY_ENVIRONMENT: z
      .enum(["production", "preview", "development"])
      .default("development"),
    NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
    NEXT_PUBLIC_GTM_ID: z.string().optional(),
    NEXT_PUBLIC_VERCEL_ENV: z
      .enum(["production", "preview", "development"])
      .optional(),
    NEXT_PUBLIC_GA_ENDPOINT: z
      .url()
      .default("https://www.google-analytics.com/mp/collect"),
    NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1).optional(),
    NEXT_PUBLIC_POSTHOG_HOST: z
      .url()
      .refine((value) => value.startsWith("https://"), "Must use https")
      .optional(),
  },

  runtimeEnv: {
    ...process.env,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_SENTRY_ENVIRONMENT: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
    NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    NEXT_PUBLIC_GTM_ID: process.env.NEXT_PUBLIC_GTM_ID,
    NEXT_PUBLIC_VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV,
    NEXT_PUBLIC_GA_ENDPOINT: process.env.NEXT_PUBLIC_GA_ENDPOINT,
    NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN:
      process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,
    NEXT_PUBLIC_MAPBOX_STYLE_URL: process.env.NEXT_PUBLIC_MAPBOX_STYLE_URL,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  },

  emptyStringAsUndefined: true,
});

export function isProduction(): boolean {
  const nodeEnv = env.NODE_ENV ?? process.env.NODE_ENV ?? "development";
  return nodeEnv === "production";
}

export function isLiveSite(): boolean {
  return env.VERCEL_ENV ? env.VERCEL_ENV === "production" : isProduction();
}

// Browser-safe twin of isLiveSite. It fails closed: a production build with no
// explicit signal (a preview, `next start`) must not collect, so collection
// needs NEXT_PUBLIC_VERCEL_ENV=production. next.config.ts fills it from
// Vercel's build-time VERCEL_ENV unless the variable is set explicitly.
export function isLiveSiteClient(): boolean {
  return env.NEXT_PUBLIC_VERCEL_ENV === "production";
}
