import "server-only";

import { createHmac } from "node:crypto";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { env } from "@/lib/env";

export async function allowEnquiry(
  forwardedFor: string | null,
): Promise<boolean> {
  const ip = forwardedFor?.split(",", 1)[0]?.trim();
  const secret = env.EMAIL_RATE_LIMIT_SECRET;
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;
  if (!ip || !secret || !url || !token) return false;

  const visitor = createHmac("sha256", secret).update(ip).digest("hex");
  const limiter = new Ratelimit({
    redis: new Redis({ url, token, retry: { retries: 0 } }),
    limiter: Ratelimit.slidingWindow(3, "1 h"),
    prefix: "private-dining-enquiry",
    timeout: 2_000,
  });
  try {
    const result = await limiter.limit(visitor);
    return result.success && result.reason !== "timeout";
  } catch {
    return false;
  }
}
