"use client";

import { useCallback, useTransition } from "react";

import { releaseHold } from "@/actions/bookings";
import { tryCatch } from "@/lib/errors";
import type { IHoldSummary, IReleaseHold, TReleasedHold } from "@/lib/types";

export function useReleaseHold(): IReleaseHold {
  const [releasing, startTransition] = useTransition();

  const release = useCallback(
    (hold: IHoldSummary, onReply: (reply: TReleasedHold | null) => void) => {
      startTransition(async () => {
        const { data: reply } = await tryCatch(
          releaseHold({
            holdReference: hold.reference,
            holdRevision: hold.revision,
          }),
        );
        onReply(reply?.ok ? reply.data : null);
      });
    },
    [],
  );

  return { releasing, release };
}
