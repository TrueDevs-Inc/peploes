import type { Result } from "neverthrow";

import { HTTP_STATUS, NO_STORE_HEADERS } from "@/lib/constants";
import type { ErrorCode } from "@/lib/enums";
import { mapErrorStatus } from "@/lib/errors";
import type { IBookingError, IError, TBookingResponse } from "@/lib/types";

type TBookingOutcome<T> = Result<
  T,
  IBookingError | IError<ErrorCode.InternalError>
>;

export function bookingQuery(request: Request): Record<string, string> {
  return Object.fromEntries(new URL(request.url).searchParams);
}

export function toBookingResponse<T>(
  result: TBookingOutcome<T>,
): TBookingResponse<T> {
  if (result.isOk()) {
    return { ok: true, data: result.value };
  }
  const { code, message } = result.error;
  const fieldErrors =
    "fieldErrors" in result.error ? result.error.fieldErrors : undefined;
  return {
    ok: false,
    error: fieldErrors ? { code, message, fieldErrors } : { code, message },
  };
}

export function bookingJson<T>(result: TBookingOutcome<T>): Response {
  const body = toBookingResponse(result);
  return Response.json(body, {
    status: body.ok ? HTTP_STATUS.OK : mapErrorStatus(body.error.code),
    headers: NO_STORE_HEADERS,
  });
}
