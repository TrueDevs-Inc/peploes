"use client";

import { useEffect, useState } from "react";

import { fetcher } from "@/helpers/api";
import { BOOKING_API, BOOKING_STATUS_CHECK } from "@/lib/constants/booking";
import { HttpVerb } from "@/lib/enums";
import type {
  IHoldStatusResult,
  IHoldSummary,
  TBookingResponse,
  TBookingStatusCheck,
} from "@/lib/types";

function nextCheck(
  result: IHoldStatusResult | null,
  startedAt: number,
): TBookingStatusCheck | null {
  if (result?.status === "confirmed") {
    return {
      kind: "confirmed",
      reference: result.reference,
      summary: result.summary,
    };
  }
  if (result?.status === "failed" || result?.status === "expired") {
    return { kind: "failed" };
  }
  if (performance.now() - startedAt >= BOOKING_STATUS_CHECK.giveUpMs) {
    return { kind: "unknown" };
  }
  return null;
}

export function useBookingStatus(
  hold: IHoldSummary | null,
): TBookingStatusCheck {
  const [check, setCheck] = useState<TBookingStatusCheck>({
    kind: "checking",
  });

  useEffect(() => {
    if (!hold) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const startedAt = performance.now();
    const query = new URLSearchParams({
      holdReference: hold.reference,
      holdRevision: String(hold.revision),
    });
    setCheck({ kind: "checking" });

    async function ask() {
      const reply = await fetcher<never, TBookingResponse<IHoldStatusResult>>({
        url: `${BOOKING_API.holdStatus}?${query}`,
        method: HttpVerb.Get,
      });
      if (!active) return;
      const next = nextCheck(
        reply.data?.ok ? reply.data.data : null,
        startedAt,
      );
      if (next) {
        setCheck(next);
      } else {
        timer = setTimeout(ask, BOOKING_STATUS_CHECK.everyMs);
      }
    }

    timer = setTimeout(ask, 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [hold]);

  return check;
}
