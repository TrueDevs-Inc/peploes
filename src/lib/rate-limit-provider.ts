import "server-only";

import { createHmac } from "node:crypto";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { BOOKING_HOLD_LIMITS, BOOKING_LOG } from "@/lib/constants/booking";
import { LogContext } from "@/lib/enums";
import { env } from "@/lib/env";
import { getErrorMetadata } from "@/lib/errors";
import { logger } from "@/lib/logger";
import type { IHoldLimiterDeps } from "@/lib/types";
import { visitorNetwork } from "@/lib/visitor-network";

async function withinWindows(
  windows: IHoldLimiterDeps["windows"],
  visitor: string,
): Promise<boolean> {
  for (const window of windows) {
    const answer = await window.limit(visitor);
    if (answer.reason === BOOKING_HOLD_LIMITS.upstashTimedOut) {
      logger.error(LogContext.Api, BOOKING_LOG.holdLimitUnchecked, {
        reason: BOOKING_HOLD_LIMITS.upstashTimedOut,
      });
    }
    if (!answer.success) {
      logger.warn(LogContext.Api, BOOKING_LOG.holdLimited);
      return false;
    }
  }
  return true;
}

export function createHoldLimiter(deps: IHoldLimiterDeps | null) {
  let warnedOff = false;
  return async function allowHold(
    forwardedFor: string | null,
  ): Promise<boolean> {
    if (!deps) {
      if (!warnedOff) {
        warnedOff = true;
        logger.warn(LogContext.Api, BOOKING_LOG.holdLimitOff);
      }
      return true;
    }
    const ip = forwardedFor?.split(",", 1)[0]?.trim();
    if (!ip) {
      logger.error(LogContext.Api, BOOKING_LOG.holdLimitUnchecked, {
        reason: BOOKING_HOLD_LIMITS.noVisitorIp,
      });
      return true;
    }
    const visitor = createHmac("sha256", deps.secret)
      .update(`${BOOKING_HOLD_LIMITS.keyPrefix}:${visitorNetwork(ip)}`)
      .digest("base64url");
    try {
      return await withinWindows(deps.windows, visitor);
    } catch (error) {
      logger.error(
        LogContext.Api,
        BOOKING_LOG.holdLimitUnchecked,
        getErrorMetadata(error),
      );
      return true;
    }
  };
}

function upstashHoldLimits(): IHoldLimiterDeps | null {
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;
  const secret = env.BOOKING_HOLD_SECRET;
  if (!url || !token || !secret) {
    return null;
  }
  const redis = new Redis({
    url,
    token,
    retry: { retries: BOOKING_HOLD_LIMITS.redisRetries },
  });
  return {
    secret: createHmac("sha256", secret)
      .update(BOOKING_HOLD_LIMITS.visitorKeyLabel)
      .digest("base64url"),
    windows: BOOKING_HOLD_LIMITS.windows.map(
      ({ name, holds, window }) =>
        new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(holds, window),
          prefix: `${BOOKING_HOLD_LIMITS.keyPrefix}:${name}`,
          timeout: BOOKING_HOLD_LIMITS.timeoutMs,
        }),
    ),
  };
}

export const allowHold = createHoldLimiter(upstashHoldLimits());
