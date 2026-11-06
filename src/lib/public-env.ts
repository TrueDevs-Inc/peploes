import type { env } from "@/lib/env";

type TPublicAnalyticsEnv = Pick<
  typeof env,
  | "NEXT_PUBLIC_GA_MEASUREMENT_ID"
  | "NEXT_PUBLIC_POSTHOG_KEY"
  | "NEXT_PUBLIC_POSTHOG_HOST"
>;

export const publicEnv: TPublicAnalyticsEnv = {
  NEXT_PUBLIC_GA_MEASUREMENT_ID:
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || undefined,
  NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY || undefined,
  NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST || undefined,
};

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}
