import { err, ok } from "neverthrow";
import { describe, expect, it, vi } from "vitest";

import {
  createAction,
  createPublicAction,
  getActionContext,
  requireAuthContext,
} from "@/actions/base";
import { ErrorCode } from "@/lib/enums";
import { createError } from "@/lib/errors";

describe("action authentication", function actionAuthenticationTests() {
  it("starts unauthenticated until a verified session resolver is installed", async function startsUnauthenticated() {
    await expect(getActionContext()).resolves.toEqual({
      userId: null,
      role: null,
    });
  });

  it("accepts a verified authenticated context", function acceptsAuthenticatedContext() {
    const result = requireAuthContext({
      userId: "user-1",
      role: "member",
    });

    expect(result).toEqual(ok({ userId: "user-1", role: "member" }));
  });

  it("stops protected actions before parsing or handling input", async function stopsProtectedActions() {
    const parse = vi.fn(function parseInput() {
      return ok("parsed");
    });
    const handler = vi.fn(function handleInput() {
      return Promise.resolve(ok("handled"));
    });
    const action = createAction<string, string, ErrorCode.ValidationError>({
      parse,
      handler,
    });

    const result = await action("input");

    expect({
      errorCode: result.isErr() ? result.error.code : null,
      parseCalls: parse.mock.calls.length,
      handlerCalls: handler.mock.calls.length,
    }).toEqual({
      errorCode: ErrorCode.Unauthorized,
      parseCalls: 0,
      handlerCalls: 0,
    });
  });
});

describe("public actions", function publicActionTests() {
  it("runs for a guest with no sign-in, handing the handler the raw input to validate", async function runsForGuest() {
    const action = createPublicAction<string, ErrorCode.ValidationError>({
      handler: function holdTable({ input }) {
        return Promise.resolve(ok(`held for ${String(input)} guests`));
      },
    });

    const result = await action("2");

    expect(result).toEqual(ok("held for 2 guests"));
  });

  it("returns the handler's own refusal unchanged", async function passesRefusal() {
    const refusal = createError(
      ErrorCode.ValidationError,
      "Choose the number of guests.",
    );
    const action = createPublicAction<string, ErrorCode.ValidationError>({
      handler: function holdTable() {
        return Promise.resolve(err(refusal));
      },
    });

    const result = await action("abc");

    expect(result).toEqual(err(refusal));
  });

  it("turns a crash into a safe error and logs the details once", async function catchesCrash() {
    const log = vi
      .spyOn(console, "error")
      .mockImplementation(function silence() {});
    const action = createPublicAction<string, ErrorCode.ValidationError>({
      handler: function holdTable() {
        throw new Error("cookie store unavailable");
      },
    });

    const result = await action("2");

    expect(result).toEqual(
      err(
        createError(ErrorCode.InternalError, "Unable to complete the request."),
      ),
    );
    expect(log).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(log.mock.calls)).toContain(
      "cookie store unavailable",
    );
  });

  it("also catches an async handler that fails later", async function catchesRejection() {
    vi.spyOn(console, "error").mockImplementation(function silence() {});
    const action = createPublicAction<string, ErrorCode.ValidationError>({
      handler: async function holdTable() {
        await Promise.resolve();
        throw new Error("ResDiary timed out");
      },
    });

    const result = await action("2");

    expect(result.isErr() && result.error.code).toBe(ErrorCode.InternalError);
  });
});
