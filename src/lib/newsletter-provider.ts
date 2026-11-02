import "server-only";

import { createHmac } from "node:crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { err, ok } from "neverthrow";
import { HTTP_STATUS, NEWSLETTER_LIMITS } from "@/lib/constants";
import { FOOTER_CONTENT } from "@/lib/constants/footer";
import { ErrorCode, LogContext } from "@/lib/enums";
import { env } from "@/lib/env";
import { createError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { visitorNetwork } from "@/lib/visitor-network";

const klaviyoSubscriptions = {
  url: "https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/",
  revision: "2026-10-15",
} as const;

export async function requestNewsletterSubscription(
  email: string,
  forwardedFor: string | null,
) {
  const key = env.KLAVIYO_PRIVATE_KEY;
  const list = env.KLAVIYO_LIST_ID_NEWSLETTER;
  const secret = env.NEWSLETTER_RATE_LIMIT_SECRET;
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;
  const ip = forwardedFor?.split(",", 1)[0]?.trim();
  const unavailable = createError(
    ErrorCode.ServiceUnavailable,
    FOOTER_CONTENT.newsletter.unavailableError,
  );
  if (!key || !list || !secret || !url || !token || !ip)
    return err(unavailable);
  try {
    const limiter = new Ratelimit({
      redis: new Redis({ url, token, retry: { retries: 0 } }),
      limiter: Ratelimit.slidingWindow(
        NEWSLETTER_LIMITS.requestsPerWindow,
        NEWSLETTER_LIMITS.window,
      ),
      prefix: NEWSLETTER_LIMITS.redisPrefix,
      timeout: NEWSLETTER_LIMITS.rateLimitTimeoutMs,
    });
    const limit = await limiter.limit(
      createHmac("sha256", secret).update(visitorNetwork(ip)).digest("hex"),
    );
    if (limit.reason === "timeout") return err(unavailable);
    if (!limit.success)
      return err(
        createError(
          ErrorCode.TooManyRequests,
          FOOTER_CONTENT.newsletter.rateLimitError,
        ),
      );
  } catch {
    return err(unavailable);
  }
  try {
    const response = await fetch(klaviyoSubscriptions.url, {
      method: "POST",
      headers: {
        authorization: `Klaviyo-API-Key ${key}`,
        "Content-Type": "application/json",
        revision: klaviyoSubscriptions.revision,
      },
      signal: AbortSignal.timeout(NEWSLETTER_LIMITS.providerTimeoutMs),
      body: JSON.stringify({
        data: {
          type: "profile-subscription-bulk-create-job",
          attributes: {
            profiles: {
              data: [
                {
                  type: "profile",
                  attributes: {
                    email,
                    subscriptions: {
                      email: { marketing: { consent: "SUBSCRIBED" } },
                    },
                  },
                },
              ],
            },
          },
          relationships: { list: { data: { type: "list", id: list } } },
        },
      }),
    });
    if (response.status === HTTP_STATUS.ACCEPTED) return ok(undefined);
    logger.error(LogContext.Api, "Newsletter provider rejected subscription", {
      status: response.status,
    });
    return err(
      createError(
        ErrorCode.ServiceUnavailable,
        FOOTER_CONTENT.newsletter.deliveryError,
      ),
    );
  } catch {
    logger.error(LogContext.Api, "Newsletter provider outcome unknown");
    return err(
      createError(
        ErrorCode.OutcomeUnknown,
        FOOTER_CONTENT.newsletter.unknownError,
      ),
    );
  }
}
