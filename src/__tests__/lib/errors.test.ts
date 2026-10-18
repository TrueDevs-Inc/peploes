import { describe, expect, it } from "vitest";

import { HTTP_STATUS } from "@/lib/constants";
import { ErrorCode } from "@/lib/enums";
import { hasTransientNetworkCode, mapErrorStatus } from "@/lib/errors";

describe("mapErrorStatus", function mapErrorStatusTests() {
  it.each([
    [ErrorCode.Unauthorized, HTTP_STATUS.UNAUTHORIZED],
    [ErrorCode.Forbidden, HTTP_STATUS.FORBIDDEN],
    [ErrorCode.NotFound, HTTP_STATUS.NOT_FOUND],
    [ErrorCode.Conflict, HTTP_STATUS.CONFLICT],
    [ErrorCode.HoldExpired, HTTP_STATUS.GONE],
    [ErrorCode.ValidationError, HTTP_STATUS.UNPROCESSABLE],
    [ErrorCode.TooManyRequests, HTTP_STATUS.TOO_MANY_REQUESTS],
    [ErrorCode.ServiceUnavailable, HTTP_STATUS.SERVICE_UNAVAILABLE],
    [ErrorCode.OutcomeUnknown, HTTP_STATUS.BAD_GATEWAY],
    [ErrorCode.DatabaseError, HTTP_STATUS.INTERNAL_ERROR],
  ])("maps %s to %i", function mapsErrorCode(code, expectedStatus) {
    expect(mapErrorStatus(code)).toBe(expectedStatus);
  });
});

describe("hasTransientNetworkCode", function transientNetworkCodeTests() {
  it("recognizes retryable network failures", function recognizesRetryableFailures() {
    const error = Object.assign(new Error("connection reset"), {
      code: "ECONNRESET",
    });

    expect(hasTransientNetworkCode(error)).toBe(true);
  });

  it("rejects unrelated errors", function rejectsUnrelatedErrors() {
    expect(hasTransientNetworkCode(new Error("invalid input"))).toBe(false);
  });
});
