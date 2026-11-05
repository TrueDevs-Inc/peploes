# Sentry

Sentry is optional. The app runs without a DSN. Initialization lives in the
framework entry points required by the Next.js SDK.

## Files

- `sentry.server.config.ts` configures the Node.js runtime.
- `sentry.edge.config.ts` configures the Edge runtime.
- `src/instrumentation-client.ts` configures the browser SDK.
- `src/instrumentation.ts` loads the runtime config and exports
  `captureRequestError`.
- `src/lib/error-handler.ts` adds server-side context and tags.
- `src/lib/client-errors.ts` reports browser exceptions.
- `src/components/app/atoms/sentry-error-boundary.tsx` captures React rendering
  failures.

## Configuration

```dotenv
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=
SENTRY_ORG=
SENTRY_PROJECT=
```

The DSN enables event delivery. The auth token, organization, and project enable
the build-time Sentry wrapper and source-map upload. Store the auth token only in
CI or the deployment platform.

The CSP permits Sentry browser ingestion only when `NEXT_PUBLIC_SENTRY_DSN` is
configured.

Current traces sampling is `1.0` outside production and `0.15` in production.
Set a rate based on traffic and cost before launch. Profiles are disabled.

## What to capture

Capture unexpected exceptions at the outer boundary that owns the request or
render. Expected failures remain typed results as described in the
[error-handling guide](error-handling-guide.md); do not turn them into exception
noise.

Add operation, module, and stage tags that help group an event. Include record
IDs only when policy allows it. Sanitize request bodies, headers, cookies,
tokens, email addresses, and user-entered text before adding context.

Avoid capturing the same error in a service, action, route, and global handler.
One event with useful context is easier to investigate than four copies.

## Source maps

The Next config enables the Sentry build wrapper only when all upload variables
exist. Production builds hide source maps after upload. Verify this in the
deployment environment because a local build without credentials cannot prove
upload success.

## Verification

- Trigger one controlled server error and one client rendering error.
- Confirm release, environment, tags, and readable stack frames.
- Inspect the event for secrets and personal data.
- Confirm that an expected `Result` failure creates no Sentry exception.
- Remove test events after verification.
