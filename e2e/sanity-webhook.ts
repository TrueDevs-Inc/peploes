import type { APIRequestContext } from "@playwright/test";
import { encodeSignatureHeader, SIGNATURE_HEADER_NAME } from "@sanity/webhook";

export const E2E_SANITY_WEBHOOK_SECRET = "e2e-only-sanity-webhook-secret-0000";

export async function announceSanityPublish(
  request: APIRequestContext,
): Promise<void> {
  const body = JSON.stringify({ _id: "e2e", _type: "seasonalEntry" });
  const response = await request.post("/api/webhooks/sanity", {
    data: body,
    headers: {
      "content-type": "application/json",
      [SIGNATURE_HEADER_NAME]: await encodeSignatureHeader(
        body,
        Date.now(),
        E2E_SANITY_WEBHOOK_SECRET,
      ),
    },
  });
  if (!response.ok()) {
    throw new Error(`Sanity webhook returned ${response.status()}`);
  }
}
