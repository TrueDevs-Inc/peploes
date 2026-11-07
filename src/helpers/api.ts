import { clientSentry as Sentry } from "@/lib/client-sentry";

import { HTTP_CONTENT_TYPE } from "@/lib/constants";
import type { IFetchOptions, IFetchResponse } from "@/lib/types";

export async function fetcher<TRequest = unknown, TResponse = unknown>({
  url,
  method,
  body,
  token,
  headers = {},
}: IFetchOptions<TRequest>): Promise<IFetchResponse<TResponse>> {
  try {
    const configHeaders: HeadersInit = {
      ...(body !== undefined && { "Content-Type": HTTP_CONTENT_TYPE.JSON }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    };

    const response = await fetch(url, {
      method,
      headers: configHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    let data: TResponse | null = null;

    const contentType = response.headers.get("content-type");
    if (contentType?.includes(HTTP_CONTENT_TYPE.JSON)) {
      data = await response.json();
    }

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        data,
        error:
          (data !== null &&
          typeof data === "object" &&
          "error" in data &&
          typeof data.error === "string"
            ? data.error
            : null) ?? response.statusText,
      };
    }

    return {
      ok: true,
      status: response.status,
      data,
      error: null,
    };
  } catch (error) {
    Sentry?.captureException(error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      status: 0,
      data: null,
      error: errorMessage || "An unexpected error occurred",
    };
  }
}
