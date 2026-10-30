import { hasAnalyticsConsent } from "@/lib/cookie-consent";
import { isLiveSiteClient } from "@/lib/env";

/** Gate for every analytics read, write and dispatch in the browser. */
export function isAnalyticsPermitted(): boolean {
  return (
    typeof window !== "undefined" && isLiveSiteClient() && hasAnalyticsConsent()
  );
}
