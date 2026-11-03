import "server-only";

import { createHmac } from "node:crypto";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { AppModule, Stage } from "@/lib/enums";
import { env } from "@/lib/env";
import { logToSentry } from "@/lib/error-handler";
import { visitorNetwork } from "@/lib/visitor-network";

const ENQUIRY_RATE_LIMIT = {
  requests: 3,
  window: "1 h",
  prefix: "private-dining-enquiry",
  timeoutMs: 2_000,
} as const;

function reportUnavailable(): false {
  logToSentry(new Error("Enquiry rate limit unavailable"), {
    module: AppModule.Api,
    stage: Stage.ServiceCall,
    tags: { operation: "allowEnquiry" },
  });
  return false;
}

export async function allowEnquiry(
  forwardedFor: string | null,
): Promise<boolean> {
  const ip = forwardedFor?.split(",", 1)[0]?.trim();
  const secret = env.EMAIL_RATE_LIMIT_SECRET;
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;
  if (!ip || !secret || !url || !token) return reportUnavailable();

  const visitor = createHmac("sha256", secret)
    .update(visitorNetwork(ip))
    .digest("hex");
  try {
    const limiter = new Ratelimit({
      redis: new Redis({ url, token, retry: { retries: 0 } }),
      limiter: Ratelimit.slidingWindow(
        ENQUIRY_RATE_LIMIT.requests,
        ENQUIRY_RATE_LIMIT.window,
      ),
      prefix: ENQUIRY_RATE_LIMIT.prefix,
      timeout: ENQUIRY_RATE_LIMIT.timeoutMs,
    });
    const result = await limiter.limit(visitor);
    if (result.reason === "timeout") return reportUnavailable();
    return result.success;
  } catch {
    return reportUnavailable();
  }
}
