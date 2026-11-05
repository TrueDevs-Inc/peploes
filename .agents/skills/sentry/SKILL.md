---
name: sentry
description: Configure or review exception reporting, privacy, source maps and external Sentry verification.
---

# Sentry

Use the installed SDK's configuration contract; inspect its types before copying options from another version. Read the product's approved environment and account policy rather than inheriting another product's DSN.

Capture unexpected exceptions once at the boundary that owns the request or render. Keep expected failures as controlled results. A provider that converts an exception into a result must capture it at that conversion boundary if callers cannot observe it.

Keep guest details, credentials, tokens and user-entered text out of custom exception messages, tags, contexts and extras. `sendDefaultPii: false` and URL scrubbing do not sanitize arbitrary values forwarded by callers. Review breadcrumbs, span URLs and manually attached diagnostics as well as structured request fields. Do not assume a rendering boundary makes error text safe.

Keep upload tokens private. Runtime release identity and uploaded artifacts must match. Verify source-map upload, public-map removal and readable frames on the actual deployed candidate; a local build without credentials establishes none of these.

Use synthetic errors and isolated accounts for authorized receipt checks. Never
introduce deliberate faults into the live production site. Local envelopes and intercepted browser requests prove payload handling, not external ingestion, owner alerts or deployed symbolication. Record evidence in the tracker without private event payloads or credentials.
