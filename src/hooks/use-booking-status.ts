"use client";

import { useEffect, useState } from "react";

import { fetcher } from "@/helpers/api";
import { BOOKING_API, BOOKING_STATUS_CHECK } from "@/lib/constants/booking";
import { ErrorCode, HttpVerb } from "@/lib/enums";
import type {
  IHoldStatusResult,
  IHoldSummary,
  TBookingResponse,
  TBookingStatusCheck,
} from "@/lib/types";

const CHECKING: TBookingStatusCheck = { kind: "checking" };

function nextCheck(
  reply: TBookingResponse<IHoldStatusResult> | null,
  pendingFrom: number | undefined,
): TBookingStatusCheck | null {
  if (reply?.ok === false && reply.error.code === ErrorCode.NotFound) {
    return { kind: "unknown" };
  }
  const result = reply?.ok ? reply.data : null;
  if (
    pendingFrom !== undefined &&
    result?.status === "pending" &&
    Date.now() >= pendingFrom
  ) {
    return { kind: "pending" };
  }
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
  return null;
}

export function useBookingStatus(
  hold: IHoldSummary | null,
  pendingFrom?: number,
): TBookingStatusCheck {
  const [answer, setAnswer] = useState<{
    hold: IHoldSummary | null;
    check: TBookingStatusCheck;
  }>({ hold: null, check: CHECKING });

  useEffect(() => {
    if (!hold) return;
    let active = true;
    let gaveUp = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const query = new URLSearchParams({
      holdReference: hold.reference,
      holdRevision: String(hold.revision),
    });
    setAnswer({ hold, check: CHECKING });
    const deadline = setTimeout(() => {
      gaveUp = true;
      clearTimeout(timer);
      setAnswer({ hold, check: { kind: "unknown" } });
    }, BOOKING_STATUS_CHECK.giveUpMs);

    async function ask() {
      const reply = await fetcher<never, TBookingResponse<IHoldStatusResult>>({
        url: `${BOOKING_API.holdStatus}?${query}`,
        method: HttpVerb.Get,
      });
      if (!active) return;
      const next = nextCheck(reply.data, pendingFrom);
      if (next) {
        clearTimeout(deadline);
        setAnswer({ hold, check: next });
      } else if (!gaveUp) {
        timer = setTimeout(ask, BOOKING_STATUS_CHECK.everyMs);
      }
    }

    timer = setTimeout(ask, 0);
    return () => {
      active = false;
      clearTimeout(timer);
      clearTimeout(deadline);
    };
  }, [hold, pendingFrom]);

  return answer.hold === hold ? answer.check : CHECKING;
}
