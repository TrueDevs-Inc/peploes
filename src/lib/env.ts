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

    DATABASE_URL: z.string().url(),
    DATABASE_POOL_SIZE: z.coerce.number().default(10),
    NODE_ENV: z
      .enum(["production", "development", "test"])
      .default("development"),
    PORT: z.coerce.number().default(3000),

    SENTRY_DSN: z.string().url().optional(),
    SENTRY_AUTH_TOKEN: z.string().optional(),
    SENTRY_ORG: z.string().optional(),
    SENTRY_PROJECT: z.string().optional(),

    GA_API_SECRET: z.string().optional(),
    ADMIN_EMAIL: z.string().email().optional(),
    ALLOWED_ORIGINS: z.string().optional(),
  },

  clientPrefix: "NEXT_PUBLIC_",

  client: {
    NEXT_PUBLIC_SITE_URL: z.string().url(),
    NEXT_PUBLIC_API_BASE_URL: z.string().url().default("http://localhost:3000"),
    NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
    NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
    NEXT_PUBLIC_GTM_ID: z.string().optional(),
    NEXT_PUBLIC_GA_ENDPOINT: z
      .string()
      .url()
      .default("https://www.google-analytics.com/mp/collect"),
  },

  runtimeEnv: process.env,

  emptyStringAsUndefined: true,
});

export function isProduction(): boolean {
  const nodeEnv = env.NODE_ENV ?? process.env.NODE_ENV ?? "development";
  return nodeEnv === "production";
}
