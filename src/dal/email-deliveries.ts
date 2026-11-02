import "server-only";

import { and, eq } from "drizzle-orm";
import { ResultAsync } from "neverthrow";

import { getDb } from "@/db";
import { emailDeliveries } from "@/db/schema";
import { ErrorCode } from "@/lib/enums";
import { createError } from "@/lib/errors";
import type {
  IEmailDelivery,
  TEmailDeliveryStatus,
  TEmailProvider,
} from "@/lib/types";

interface IEmailClaimInput {
  readonly id: string;
  readonly payloadHash: string;
  readonly template: string;
  readonly provider: TEmailProvider;
}

type TEmailClaim =
  | { readonly claimed: true; readonly record: IEmailDelivery }
  | { readonly claimed: false; readonly record: IEmailDelivery };

function toDelivery(
  record: typeof emailDeliveries.$inferSelect,
): IEmailDelivery {
  return {
    id: record.id,
    payloadHash: record.payloadHash,
    template: record.template,
    provider: record.provider,
    status: record.status,
    providerId: record.providerId,
  };
}

export function claimEmailDelivery(input: IEmailClaimInput) {
  return ResultAsync.fromThrowable(
    async (): Promise<TEmailClaim> => {
      const db = getDb();
      const inserted = await db
        .insert(emailDeliveries)
        .values({
          ...input,
          status: "pending",
        })
        .onConflictDoNothing()
        .returning();
      const first = inserted[0];
      if (first) return { claimed: true, record: toDelivery(first) };

      const existing = await db
        .select()
        .from(emailDeliveries)
        .where(eq(emailDeliveries.id, input.id))
        .limit(1);
      const record = existing[0];
      if (!record) throw new Error("Email delivery disappeared after conflict");
      if (record.payloadHash !== input.payloadHash) {
        return { claimed: false, record: toDelivery(record) };
      }
      if (record.status === "rejected") {
        const retried = await db
          .update(emailDeliveries)
          .set({ status: "pending", updatedAt: new Date() })
          .where(
            and(
              eq(emailDeliveries.id, input.id),
              eq(emailDeliveries.status, "rejected"),
            ),
          )
          .returning();
        const retry = retried[0];
        if (retry) return { claimed: true, record: toDelivery(retry) };
      }
      return { claimed: false, record: toDelivery(record) };
    },
    (cause) =>
      createError(
        ErrorCode.DatabaseError,
        "Email delivery record unavailable.",
        cause,
      ),
  )();
}

export function finishEmailDelivery(input: {
  readonly id: string;
  readonly status: Exclude<TEmailDeliveryStatus, "pending">;
  readonly providerId?: string;
}) {
  return ResultAsync.fromThrowable(
    async (): Promise<boolean> => {
      const rows = await getDb()
        .update(emailDeliveries)
        .set({
          status: input.status,
          providerId: input.providerId ?? null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(emailDeliveries.id, input.id),
            eq(emailDeliveries.status, "pending"),
          ),
        )
        .returning({ id: emailDeliveries.id });
      return rows.length === 1;
    },
    (cause) =>
      createError(
        ErrorCode.DatabaseError,
        "Email delivery record unavailable.",
        cause,
      ),
  )();
}
