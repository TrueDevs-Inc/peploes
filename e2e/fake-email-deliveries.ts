import { ResultAsync } from "neverthrow";

import type {
  IEmailDelivery,
  TEmailDeliveryStatus,
  TEmailProvider,
} from "@/lib/types";

const records = new Map<string, IEmailDelivery>();

export function claimEmailDelivery(input: {
  readonly id: string;
  readonly payloadHash: string;
  readonly template: string;
  readonly provider: TEmailProvider;
}) {
  const existing = records.get(input.id);
  if (existing) {
    if (
      existing.status === "rejected" &&
      existing.payloadHash === input.payloadHash
    ) {
      const retry = { ...existing, status: "pending" as const };
      records.set(input.id, retry);
      return ResultAsync.fromSafePromise(
        Promise.resolve({ claimed: true as const, record: retry }),
      );
    }
    return ResultAsync.fromSafePromise(
      Promise.resolve({ claimed: false as const, record: existing }),
    );
  }
  const record: IEmailDelivery = {
    ...input,
    status: "pending",
    providerId: null,
  };
  records.set(input.id, record);
  return ResultAsync.fromSafePromise(
    Promise.resolve({ claimed: true as const, record }),
  );
}

export function finishEmailDelivery(input: {
  readonly id: string;
  readonly status: Exclude<TEmailDeliveryStatus, "pending">;
  readonly providerId?: string;
}) {
  const current = records.get(input.id);
  if (current)
    records.set(input.id, {
      ...current,
      status: input.status,
      providerId: input.providerId ?? null,
    });
  return ResultAsync.fromSafePromise(Promise.resolve(Boolean(current)));
}
