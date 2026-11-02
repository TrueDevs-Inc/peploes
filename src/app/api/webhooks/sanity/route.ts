import { revalidateTag } from "next/cache";

import { SANITY_CONTENT_CACHE_TAG } from "@/lib/constants";
import { mapErrorStatus } from "@/lib/errors";
import { verifyPublishWebhook } from "@/lib/sanity-provider";

export async function POST(request: Request) {
  const verified = await verifyPublishWebhook(request);
  if (verified.isErr()) {
    return Response.json(
      { error: verified.error.message },
      { status: mapErrorStatus(verified.error.code) },
    );
  }
  revalidateTag(SANITY_CONTENT_CACHE_TAG, { expire: 0 });
  return Response.json({ revalidated: true });
}
