import "server-only";

import { err, ok, type Result } from "neverthrow";

import { ACTION_MESSAGES } from "@/lib/constants";
import { ErrorCode, LogContext } from "@/lib/enums";
import { createError, getErrorMetadata } from "@/lib/errors";
import { logger } from "@/lib/logger";
import type {
  IActionContext,
  IActionDefinition,
  IAuthenticatedContext,
  IError,
  IPublicActionDefinition,
  TAuthErrorCodes,
} from "@/lib/types";

function unexpectedFailure(error: unknown): IError<ErrorCode.InternalError> {
  logger.error(
    LogContext.ErrorHandler,
    ACTION_MESSAGES.UNEXPECTED_FAILURE_LOG,
    getErrorMetadata(error),
  );
  return createError(
    ErrorCode.InternalError,
    ACTION_MESSAGES.UNEXPECTED_FAILURE_PUBLIC,
  );
}

export function getActionContext(): Promise<IActionContext> {
  // Authentication is intentionally fail-closed. Replace this implementation
  // with a verified server-side session before enabling authenticated actions.
  return Promise.resolve({
    userId: null,
    role: null,
  });
}

export function requireAuthContext(
  context: IActionContext,
): Result<IAuthenticatedContext, IError<TAuthErrorCodes>> {
  if (!context.userId) {
    return err(createError(ErrorCode.Unauthorized, "Login required."));
  }

  return ok({ userId: context.userId, role: context.role });
}

export function createAction<TInput, TOutput, TCode extends ErrorCode>(
  definition: IActionDefinition<TInput, TOutput, TCode>,
): (
  rawInput: unknown,
) => Promise<
  Result<TOutput, IError<TCode | TAuthErrorCodes | ErrorCode.InternalError>>
> {
  return async (
    rawInput: unknown,
  ): Promise<
    Result<TOutput, IError<TCode | TAuthErrorCodes | ErrorCode.InternalError>>
  > => {
    try {
      const context = await getActionContext();

      const authResult = requireAuthContext(context);
      if (authResult.isErr()) {
        return err(authResult.error);
      }

      const inputResult = definition.parse(rawInput);
      if (inputResult.isErr()) {
        return err(inputResult.error);
      }

      return await definition.handler({
        input: inputResult.value,
        context: authResult.value,
      });
    } catch (error) {
      return err(unexpectedFailure(error));
    }
  };
}

export function createPublicAction<TOutput, TCode extends ErrorCode>(
  definition: IPublicActionDefinition<TOutput, TCode>,
): (
  rawInput: unknown,
) => Promise<Result<TOutput, IError<TCode | ErrorCode.InternalError>>> {
  return async (rawInput: unknown) => {
    try {
      return await definition.handler({ input: rawInput });
    } catch (error) {
      return err(unexpectedFailure(error));
    }
  };
}
