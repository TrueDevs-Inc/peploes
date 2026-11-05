# Logging

`src/lib/logger.ts` writes one structured line with a timestamp, level, context,
message, and optional metadata. Use it for application logs instead of scattered
`console` calls.

```typescript
logger.error(LogContext.Database, "Example query failed", {
  operation: "listExamples",
  code: error.code,
});
```

## Levels

- `debug` records local diagnostic detail.
- `info` records normal lifecycle events.
- `warning` records a recoverable problem that needs attention.
- `error` records a failed request or operation.
- `critical` and `fatal` are reserved for service-wide failure or data risk.

`success()` is an info log with `success: true` metadata.

## Context and metadata

Choose the closest `LogContext` from `src/lib/enums.ts`. Metadata should help an
operator find the request or operation without exposing private data.

Useful fields include an internal record ID, route, operation name, error code,
duration, and retry count. Redact or omit passwords, tokens, cookies, session
IDs, authorization headers, full form bodies, and payment data.

Keep messages stable enough to search. Put changing values in metadata rather
than string interpolation.

## Errors and Sentry

The [Sentry guide](sentry-guide.md) owns exception-capture policy. A failure may
need an operational log, a Sentry event, or neither; do not record it in every
layer.

Sentry initialization files use `console` because the shared logger may not be
available during startup. Analytics modules also contain provider diagnostics.
Application code should still use the logger.

## Review checklist

- The log changes an operator's ability to diagnose a real problem.
- The level matches the impact.
- Metadata contains no secret or unnecessary personal data.
- The same failure is not logged several times.
