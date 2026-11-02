import { randomBytes } from "node:crypto";

import postgres from "postgres";
import { afterAll, describe, expect, it } from "vitest";

import {
  claimEmailDelivery,
  finishEmailDelivery,
} from "@/dal/email-deliveries";
import { env } from "@/lib/env";

const sql = postgres(env.DATABASE_URL, { max: 1 });

afterAll(async () => {
  await sql.end();
});

describe("email delivery records", () => {
  it("claims once under concurrent submissions and never reclaims acceptance", async () => {
    const id = randomBytes(32).toString("hex");
    const input = {
      id,
      payloadHash: randomBytes(32).toString("hex"),
      template: "enquiry-admin",
      provider: "smtp" as const,
    };
    try {
      const [first, second] = await Promise.all([
        claimEmailDelivery(input),
        claimEmailDelivery(input),
      ]);
      expect(first.isOk()).toBe(true);
      expect(second.isOk()).toBe(true);
      expect(
        [first._unsafeUnwrap().claimed, second._unsafeUnwrap().claimed].sort(),
      ).toEqual([false, true]);

      expect(
        (
          await finishEmailDelivery({
            id,
            status: "accepted",
            providerId: "smtp-id",
          })
        )._unsafeUnwrap(),
      ).toBe(true);
      const retry = (await claimEmailDelivery(input))._unsafeUnwrap();
      expect(retry.claimed).toBe(false);
      expect(retry.record).toMatchObject({
        status: "accepted",
        providerId: "smtp-id",
        provider: "smtp",
      });
    } finally {
      await sql`DELETE FROM email_deliveries WHERE id = ${id}`;
    }
  });

  it("reclaims a definite rejection under the original provider", async () => {
    const id = randomBytes(32).toString("hex");
    const input = {
      id,
      payloadHash: randomBytes(32).toString("hex"),
      template: "enquiry-guest",
      provider: "smtp" as const,
    };
    try {
      expect((await claimEmailDelivery(input))._unsafeUnwrap().claimed).toBe(
        true,
      );
      expect(
        (await finishEmailDelivery({ id, status: "rejected" }))._unsafeUnwrap(),
      ).toBe(true);
      const retry = (
        await claimEmailDelivery({ ...input, provider: "resend" })
      )._unsafeUnwrap();
      expect(retry.claimed).toBe(true);
      expect(retry.record.provider).toBe("smtp");
      expect(retry.record.status).toBe("pending");
    } finally {
      await sql`DELETE FROM email_deliveries WHERE id = ${id}`;
    }
  });
});
