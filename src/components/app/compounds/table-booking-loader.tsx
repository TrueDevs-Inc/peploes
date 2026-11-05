"use client";

import { useState } from "react";

import {
  TableBookingNotice,
  TableBookingPanel,
} from "@/components/app/compounds/table-booking-panel";
import type { IFindTableData, TBookingResponse } from "@/lib/types";

interface ITableBookingLoaderProps {
  result: TBookingResponse<IFindTableData>;
}

export function TableBookingLoader({ result }: ITableBookingLoaderProps) {
  const [retainedResult, setRetainedResult] = useState(result);

  if (result.ok && result !== retainedResult) {
    setRetainedResult(result);
  }

  const current = result.ok || !retainedResult.ok ? result : retainedResult;

  return current.ok ? (
    <TableBookingPanel findTable={current.data} />
  ) : (
    <TableBookingNotice message={current.error.message} />
  );
}
