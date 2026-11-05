"use client";

import { addMonths, format } from "date-fns";
import { useCallback, useRef, useState } from "react";

import { fetcher } from "@/helpers/api";
import { BOOKING_API } from "@/lib/constants/booking";
import { monthGrid } from "@/lib/dates";
import { HttpVerb } from "@/lib/enums";
import type {
  ICalendarDays,
  IOpenDates,
  TBookingResponse,
  TOpenDates,
} from "@/lib/types";

const DAY = "yyyy-MM-dd";
const MONTH = "yyyy-MM";
const MONTH_FRESHNESS_MS = 120_000;

export function useOpenDates(
  partySize: string,
  lastDate: string | null,
): IOpenDates {
  const [months, setMonths] = useState<Record<string, TOpenDates>>({});
  const requested = useRef(new Set<string>());
  const loadedAt = useRef(new Map<string, number>());

  const load = useCallback(
    (month: Date) => {
      for (const shown of [month, addMonths(month, 1)]) {
        const days = monthGrid(shown);
        const from = format(days[0] ?? shown, DAY);
        const to = format(days.at(-1) ?? shown, DAY);
        const key = `${partySize}:${format(shown, MONTH)}`;
        const receivedAt = loadedAt.current.get(key);
        if (
          (lastDate !== null && from > lastDate) ||
          requested.current.has(key) ||
          (receivedAt !== undefined &&
            performance.now() - receivedAt < MONTH_FRESHNESS_MS)
        ) {
          continue;
        }
        requested.current.add(key);
        setMonths((all) =>
          Array.isArray(all[key]) ? all : { ...all, [key]: "loading" },
        );
        fetcher<never, TBookingResponse<ICalendarDays>>({
          url: `${BOOKING_API.calendar}?${new URLSearchParams({ from, to, partySize })}`,
          method: HttpVerb.Get,
        }).then((reply) => {
          const dates = reply.data?.ok ? reply.data.data.openDates : "failed";
          requested.current.delete(key);
          if (Array.isArray(dates)) {
            loadedAt.current.set(key, performance.now());
          } else {
            loadedAt.current.delete(key);
          }
          setMonths((all) => ({
            ...all,
            [key]:
              dates === "failed" && Array.isArray(all[key]) ? all[key] : dates,
          }));
        });
      }
    },
    [partySize, lastDate],
  );

  const datesFor = useCallback(
    (month: Date) => months[`${partySize}:${format(month, MONTH)}`],
    [months, partySize],
  );

  return { load, datesFor };
}
