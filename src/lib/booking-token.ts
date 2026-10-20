import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { z } from "zod/v4";

import {
  BOOKING_HOLD,
  BOOKING_LOG,
  BOOKING_TOKEN_FORMAT,
} from "@/lib/constants/booking";
import { LogContext } from "@/lib/enums";
import { logger } from "@/lib/logger";
import type { THoldToken } from "@/lib/types";

export const holdTokenSchema = z.object({
  v: z.literal(BOOKING_HOLD.tokenVersion),
  holdId: z.number().int().positive(),
  reference: z.string().min(1),
  searchDate: z.string(),
  date: z.string(),
  time: z.string(),
  partySize: z.number().int().positive(),
  offer: z.object({
    kind: z.literal("standard"),
    feeCents: z.number().int(),
    mayRequireCard: z.boolean(),
    returnBy: z
      .object({
        time: z.string(),
        label: z.string(),
        nextDay: z.boolean(),
        required: z.boolean(),
      })
      .nullable(),
  }),
  issuedAt: z.number(),
  expiresAt: z.number(),
  rev: z.number().int().positive(),
  detailsSent: z.boolean(),
});

function signature(payload: string, secret: string): string {
  return createHmac(BOOKING_TOKEN_FORMAT.algorithm, secret)
    .update(payload)
    .digest(BOOKING_TOKEN_FORMAT.encoding);
}

export function signHold(hold: THoldToken, secret: string): string {
  const payload = Buffer.from(JSON.stringify(hold)).toString(
    BOOKING_TOKEN_FORMAT.encoding,
  );
  return `${payload}${BOOKING_TOKEN_FORMAT.separator}${signature(payload, secret)}`;
}

function decodePayload(payload: string): unknown {
  try {
    return JSON.parse(
      Buffer.from(payload, BOOKING_TOKEN_FORMAT.encoding).toString(
        BOOKING_TOKEN_FORMAT.payloadEncoding,
      ),
    );
  } catch {
    return undefined;
  }
}

export function readHold(token: string, secret: string): THoldToken | null {
  const [payload = "", sent = "", ...extra] = token.split(
    BOOKING_TOKEN_FORMAT.separator,
  );
  const sentBytes = Buffer.from(sent);
  const expectedBytes = Buffer.from(signature(payload, secret));
  const signed =
    extra.length === 0 &&
    sentBytes.length === expectedBytes.length &&
    timingSafeEqual(sentBytes, expectedBytes);
  const hold = signed
    ? holdTokenSchema.safeParse(decodePayload(payload))
    : null;
  if (!hold?.success) {
    logger.warn(LogContext.Api, BOOKING_LOG.badHoldToken);
    return null;
  }
  if (Date.now() > hold.data.expiresAt + BOOKING_HOLD.cookieGraceMs) {
    logger.warn(LogContext.Api, BOOKING_LOG.staleHoldToken, {
      reference: hold.data.reference,
    });
    return null;
  }
  return hold.data;
}
