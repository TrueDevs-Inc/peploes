# Error handling

Application failures use `neverthrow`. The goal is a visible return type at the
boundaries where failure is expected.

## Core definitions

- `ErrorCode` in `src/lib/enums.ts` identifies stable failure categories.
- `IError` in `src/lib/types.ts` carries a code, safe message, and optional
  internal details.
- `createError()` builds an `IError`.
- `mapErrorStatus()` translates error codes to HTTP status codes.
- `hasTransientNetworkCode()` identifies network failures eligible for retry.

Use a specific code when the caller must react differently. Do not create a new
code to reword the same failure.

## Layer behavior

DAL functions wrap Drizzle calls with `ResultAsync.fromThrowable`. Keep the raw
exception in `details` for server-side diagnostics and return a safe message.

```typescript
return ResultAsync.fromThrowable(
  () => getDb().select({ id: examples.id }).from(examples),
  (cause) => createError(ErrorCode.DbListFailed, "Failed to list examples.", cause),
)();
```

Services return the DAL error or map it to a domain error.

Actions return UI-safe state. Route handlers return a status and a safe body.
Neither sends `details`, stack traces, SQL, or credentials to the client.

## Unexpected exceptions

Some framework and third-party APIs throw. Catch them once at the nearest
boundary. `src/actions/base.ts` is the boundary for protected actions.

Use `unwrapResultOrThrow()` only when a framework requires an exception. Avoid
it in ordinary application flow because it removes the error from the function
signature.

## Retries

Retry transient network and service-availability failures. Validation,
authorization, conflicts, and missing records should fail immediately.

`src/lib/retry.ts` implements exponential backoff for typed application errors.
Set a small attempt limit and make the operation idempotent before retrying it.
Never retry a database write unless duplicate execution is safe.

## Review checklist

- The failure code is useful to a caller.
- The public message contains no internal detail.
- The failure is handled once.
- A test covers mapping or recovery logic that could regress.

Logging and exception capture have separate policies in the
[logging](logging-guide.md) and [Sentry](sentry-guide.md) guides.
