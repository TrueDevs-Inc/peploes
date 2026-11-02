import { isProduction } from "@/lib/env";

export function isAnalyticsPermitted(): boolean {
  return typeof window !== "undefined" && isProduction();
}
