import { isProduction } from "@/lib/public-env";

export function isAnalyticsPermitted(): boolean {
  return typeof window !== "undefined" && isProduction();
}
