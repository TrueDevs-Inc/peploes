import "server-only";

import { createHmac } from "node:crypto";
import { isIPv4, isIPv6 } from "node:net";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { IP_ADDRESS } from "@/lib/constants";
import { BOOKING_HOLD_LIMITS, BOOKING_LOG } from "@/lib/constants/booking";
import { LogContext } from "@/lib/enums";
import { env } from "@/lib/env";
import { getErrorMetadata } from "@/lib/errors";
import { logger } from "@/lib/logger";
import type { IHoldLimiterDeps } from "@/lib/types";

function ipv4AsGroups(ipv4: string): string {
  const [a = 0, b = 0, c = 0, d = 0] = ipv4.split(".").map(Number);
  const { byteValues } = IP_ADDRESS;
  return `${(a * byteValues + b).toString(16)}:${(c * byteValues + d).toString(16)}`;
}

function ipv6Groups(ip: string): number[] {
  const [address = ""] = ip.split("%", 1);
  const lastColon = address.lastIndexOf(":");
  const ipv4Tail = address.slice(lastColon + 1);
  const hex = isIPv4(ipv4Tail)
    ? `${address.slice(0, lastColon + 1)}${ipv4AsGroups(ipv4Tail)}`
    : address;
  const [head = "", tail] = hex.split("::");
  const left = head.split(":").filter(Boolean);
  const right = tail?.split(":").filter(Boolean) ?? [];
  const zeros = Array.from(
    { length: IP_ADDRESS.ipv6Groups - left.length - right.length },
    () => "0",
  );
  return [...left, ...zeros, ...right].map((group) =>
    Number.parseInt(group, 16),
  );
}

function visitorNetwork(ip: string): string {
  if (!isIPv6(ip)) {
    return ip;
  }
  const groups = ipv6Groups(ip);
  const { mappedIpv4Marker, mappedIpv4MarkerIndex, byteValues } = IP_ADDRESS;
  const isIpv4 =
    groups.slice(0, mappedIpv4MarkerIndex).every((group) => group === 0) &&
    groups[mappedIpv4MarkerIndex] === mappedIpv4Marker;
  if (isIpv4) {
    return groups
      .slice(mappedIpv4MarkerIndex + 1)
      .flatMap((group) => [Math.trunc(group / byteValues), group % byteValues])
      .join(".");
  }
  return groups
    .slice(0, IP_ADDRESS.ipv6NetworkGroups)
    .map((group) => group.toString(16))
    .join(":");
}

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
