import type { Result } from "neverthrow";

import { ERROR_HTTP_STATUS } from "@/lib/constants";
import type { ErrorCode } from "@/lib/enums";
import type { IAppError, IError, TResult } from "@/lib/types";

// ─── Transient Network Error Detection ────────────────────────────────────

export const TRANSIENT_NETWORK_CODES = new Set([
  "ECONNRESET",
  "ETIMEDOUT",
  "EPIPE",
  "EAI_AGAIN",
  "ECONNREFUSED",
  "ENOTFOUND",
]);

export const UNSENT_NETWORK_CODES = new Set([
  "ENOTFOUND",
  "EAI_AGAIN",
  "ECONNREFUSED",
  "UND_ERR_CONNECT_TIMEOUT",
]);

export function hasTransientNetworkCode(error: unknown): boolean {
  if (error instanceof Error) {
    const code = (error as NodeJS.ErrnoException).code;
    return code ? TRANSIENT_NETWORK_CODES.has(code) : false;
  }
  return false;
}

// ─── Result Pattern Utilities ─────────────────────────────────────────────

export async function tryCatch<T, E = unknown>(
  promise: Promise<T>,
): Promise<TResult<T, E>> {
  try {
    const data = await promise;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as E };
  }
}

export function getErrorMetadata(error: unknown): Record<string, unknown> {
  if (!(error instanceof Error)) return { error };

  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
  };
}

export function createError<TCode extends ErrorCode>(
  code: TCode,
  message: string,
  details?: unknown,
): IError<TCode> {
  return { code, message, details };
}

export function createAppError(
  code: ErrorCode,
  message: string,
  context?: Record<string, unknown>,
): IAppError {
  return { code, message, context };
}

export function mapErrorStatus(code: ErrorCode): number {
  return ERROR_HTTP_STATUS[code];
}

export function unwrapResultOrThrow<T, E>(
  result: Result<T, E>,
  message?: string,
): T {
  if (result.isOk()) {
    return result.value;
  }
  throw new Error(message ?? `Unhandled error: ${String(result.error)}`);
}
