# Sentry

Sentry is optional. The app runs without a DSN. Reporting requires a configured
DSN and an environment label of exactly `production`. Node and Edge read
`VERCEL_ENV`; the browser uses the label derived from it at build time. This
checks an environment variable, not whether the application is hosted on
Vercel. Local builds normally leave `VERCEL_ENV` unset and previews use
`preview`, so neither sends events, even when `NODE_ENV=production`. Setting
`VERCEL_ENV=production` deliberately enables reporting on any host.
Initialization lives in the framework entry points required by the Next.js SDK.

## Files

- `sentry.server.config.ts` configures the Node.js runtime.
- `sentry.edge.config.ts` configures the Edge runtime.
- `src/instrumentation-client.ts` configures the browser SDK.
- `src/instrumentation.ts` loads the runtime config and exports
  `captureRequestError`.
- `src/lib/error-handler.ts` adds server-side context and tags.
- `src/lib/sentry-scrub.ts` removes request bodies, headers, cookies, user data,
  and request URL queries/fragments before errors or transactions leave any
  runtime. It also scrubs HTTP and navigation breadcrumb URLs and span URLs,
  because these can carry a ResDiary guest token. Console breadcrumbs are
  discarded; browser DOM breadcrumbs are disabled to avoid collecting guest text.
  ResDiary `TableHoldBookingStatus` URLs also redact the hold ID in requests,
  breadcrumbs and spans, keeping reconciliation signals opaque outside restricted logs.
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

Use a Next.js project in the `truedevs-rn` organization for the initial setup.
Configure the same project's DSN in `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN`.
The browser reads only the public DSN. Keep these values in the deployment
platform so a later move to TrueDevs requires no source change.

`next.config.ts` derives `NEXT_PUBLIC_SENTRY_ENVIRONMENT` from `VERCEL_ENV` at
build time. Do not set the public environment manually. All runtimes report
only when their environment label is exactly `production`; missing or
unrecognized environments stay silent. Rebuild after changing any public value.
Review this gate before changing hosting platforms.

The auth token, organization, and project enable the build-time Sentry wrapper
and source-map upload when `VERCEL_ENV=production`. Keep the auth token in the
deployment build environment or ignored local settings. No auth token belongs
in a public variable.

The CSP permits Sentry browser ingestion only when `NEXT_PUBLIC_SENTRY_DSN` is
configured.

Existing production traces sampling remains `0.15`. Profiles, Replay and logs
are not enabled. Error sampling uses the SDK default (all eligible errors).
The lockfile resolves `@sentry/nextjs` 10.76.2 with Next.js 16.4.2; SDK 11's
`dataCollection` options must not be copied into this version.

## What to capture

Capture unexpected exceptions at the outer boundary that owns the request or
render. Expected failures remain typed results as described in the
[error-handling guide](error-handling-guide.md); do not turn them into exception
noise.

Add operation, module, and stage tags that help group an event. Include record
IDs only when policy allows it. Sanitize request bodies, headers, cookies,
tokens, email addresses, and user-entered text before adding context.
The hooks remove the structured fields listed above; they cannot guarantee that
an arbitrary exception message, tag, or manually attached context is safe. Keep
those diagnostic values free of guest details and credentials. `sendDefaultPii`
is explicitly false, and Node local-variable collection is disabled.

The ResDiary provider is the outer boundary for exceptions thrown inside it:
its `run` turns each one into a typed result, so no caller ever sees the
exception. `run` therefore captures it once, with the provider and operation as
context. The booking services' wrapper captures only exceptions thrown in the
services themselves.

Avoid capturing the same error in a service, action, route, and global handler.
One event with useful context is easier to investigate than four copies.

An unresolved booking outcome also needs an operational signal even when the
provider returned a typed failure. Booking reconciliation emits a stable
message with an opaque correlation ID and safe state only. Its
[runbook](booking-reconciliation-guide.md) owns alert routing and manual
diary/payment checks; provider exceptions and raw references are not copied
into that signal.

## Source maps

The Next config enables the Sentry build wrapper when `VERCEL_ENV=production`
and all upload variables exist, regardless of hosting provider. It passes
organization, project and auth token explicitly and requests source-map deletion
after upload with the installed SDK's `sourcemaps.deleteSourcemapsAfterUpload`
option.

Verify successful upload and removal of public maps in the deployment
environment. A local build without credentials proves neither upload nor
production symbolication. Check lazy chunks and map references as well as map
files, then inspect a matching deployed event's readable stack frames. Keep the
runtime release and uploaded artifact association consistent; the Next.js SDK's
build wrapper supplies its release/debug-ID integration.

## Verification

- Run the scrubber tests, which inspect an SDK envelope through a recording
  transport and await flush without making a network request.
- Verify the deployment gate for local production builds, previews and live
  deployments, including missing DSNs.
- With an authorized project, trigger a controlled local verification error
  through the application initialization, then confirm its issue in Sentry.
  Keep any temporary test enablement out of the final production-only setup.
- Verify browser capture separately; a Node transport test does not prove that
  browser initialization, CSP or client rendering capture works.
- Confirm release, environment, tags, and readable stack frames.
- Inspect the event for secrets and personal data.
- Confirm that an expected `Result` failure creates no Sentry exception.
- Do not inject a deliberate error into the live site. Delete test events only
  when that operation is explicitly requested.

### Verified on 2026-10-27

The `javascript-nextjs` project `truedevs-rn/peploes` was created in Sentry's US
region under the existing `truedevs` team. Local ignored environment settings
contain its server/public DSNs and upload organization/project; no upload token
was configured during this initial run.

An isolated local Next.js server threw `Peploes Sentry setup verification
2026-10-27` through a temporary route and the real `onRequestError` hook. Sentry
confirmed one occurrence in [PEPLOES-1](https://truedevs-rn.sentry.io/issues/PEPLOES-1),
with release `peploes-sentry-setup-2026-10-27`. The isolated process temporarily
used the `production` environment tag; no deployed production error was created.
The server was stopped and the test route is absent from the repository.

The event showed a named compiled `GET` frame and readable Next.js dependency
frames. Original application source mapping and authenticated map upload were
not verified in this initial run. The Sentry rendering showed only
request method/URL and no credential values, but did expose geolocation metadata;
that rendering is not a raw-payload privacy audit.

Format, lint, types, all 781 tests and both application/Studio builds passed.
The initial gate failed its dependency audit; the follow-up CI repair upgraded
Zod to `4.6.7`, Undici to `7.30.1` and Studio's DOMPurify to `3.4.17`.
The complete `bun run ci` gate now passes, including both high-severity audits.
The production-gate mutation
check failed for local and preview delivery when the gate was removed, then the
restored gate passed. Edge settings were tested under Bun's Node resolution;
actual Edge execution and browser delivery were verified separately below.

### Local release verification on 2026-10-27

A disposable copy ran the application's production build and Sentry upload
wrapper using the locally configured organization token. Its reporting gate
was enabled only in that process; its events used `local-verification` and
release `peploes-local-verification-2026-10-27`. The repository retains its
production-only reporting policy. No production deployment was made.

- An actual Chromium click raised an unhandled browser error, stored as
  [PEPLOES-2](https://truedevs-rn.sentry.io/issues/PEPLOES-2). Sentry resolved
  the minified frame to the temporary `page.tsx` handler, line 3, with original
  source context. Browser ingestion passed the application's CSP.
- The Node route error arrived as
  [PEPLOES-4](https://truedevs-rn.sentry.io/issues/PEPLOES-4), with the original
  `route.ts` line 5 and source context. These new events establish that the
  upload token and matching browser/Node artifacts work for this local build.
- A route probe returned `NEXT_RUNTIME=edge`; its thrown error arrived through
  `onRequestError` as
  [PEPLOES-3](https://truedevs-rn.sentry.io/issues/PEPLOES-3). Its Edge frames
  remained compiled, so Edge source-map resolution is not established. Next.js
  warns that this Edge runtime is deprecated. This verifies Next's local Edge
  execution, not a hosted Edge deployment.
- After upload, `.next/static` contained no `.map` files or line-based
  `sourceMappingURL` references. No temporary verification route was added to
  the repository.
- The final `bun run format` and `bun run ci` passed: 781 tests, both builds and
  both high-severity dependency audits. Standards and spec review found no
  blocking code defects.

The token stays in ignored `.env.local`; it is not a public variable or a PR
artifact. Sentry's event rendering still showed geolocation metadata, so these
checks do not establish a complete stored-payload privacy audit. Authenticated
upload and symbolication must still be checked against the build that is
eventually deployed.

Before deployment, configure `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`,
`SENTRY_ORG=truedevs-rn`, `SENTRY_PROJECT=peploes` and the private build-time
`SENTRY_AUTH_TOKEN` in the production deployment environment. Verify upload and
readable deployed frames as part of the normal release flow.

## TrueDevs reference check

Reviewed [skills PR #2](https://github.com/TrueDevs-Inc/skills/pull/2) at
`08bfd679e704294089148e3d665354f4255ece97` on 2026-10-27. It is still unmerged.
Its [workflow](https://github.com/TrueDevs-Inc/skills/blob/08bfd679e704294089148e3d665354f4255ece97/skills/truedevs-sentry/SKILL.md)
separates SDK upgrades, environment policy, privacy, local payload checks and
external verification.

[Samsu](https://github.com/TrueDevs-Inc/samsu/blob/a4e0288ee1317cc3829e23b07280a9a5fbfb9dc6/src/instrumentation-client.ts)
protects multiple outbound hooks, but its Replay settings and noise filters are
not Peploes policy.
[TrueDevs](https://github.com/TrueDevs-Inc/TrueDevs/blob/64a1ebfea06f8af2ba9a21dbec122d64d2e54f79/src/lib/analytics/sentry-lazy.ts)
uses deliberate lazy loading and manual listeners; Peploes retains its framework
initialization and existing capture owners.
[prs-td](https://github.com/TrueDevs-Inc/prs-td/blob/1753129b9819eb2d5acc90efa312aadf0cce571b/next.config.ts)
and Samsu differ on source maps, so their configuration is not a shared template.
The [official Next.js setup](https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/)
and installed SDK types govern compatibility.
