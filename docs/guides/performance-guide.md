# Performance

Start with the production build and real user measurements. A helper or package
without evidence adds work and can make the bundle worse.

## Existing defaults

`next.config.ts` enables typed routes, removes the powered-by header, configures
AVIF and WebP, and defines image sizes. It also asks Next to optimize imports
from several UI packages.

`next/font` loads Geist in `src/app/layout.tsx`. Tailwind and the motion styles
live in `src/app/globals.css`.

Remote images are disabled by default. Add only the exact hosts a project owns
or trusts, and keep the CSP image sources in sync.

## Server and client boundaries

Keep components on the server until they need state, effects, browser APIs,
context, or event handlers. Move the smallest interactive part to a Client
Component instead of marking a whole page as client code.

Server Components read through services. Do not call the app's own HTTP route
from a Server Component.

## Data fetching

Start independent requests together and await them together. Keep dependent
requests sequential. Avoid a generic batching layer when there is only one
call.

Use route or data caching only when the product can name the acceptable stale
window and invalidation event. Mutations should revalidate the affected path or
tag after a successful write.

Published Sanity content has a five-minute cache invalidated by the signed
publish webhook. Time-based revalidation can serve the previous page while it
refreshes. What's On also refreshes its rendered page so Dublin dates advance
without an editorial publish. Booking requests bypass the Next data cache;
provider rules and closed dates are held in memory for five minutes.
Article and event detail pages must return HTTP 404 for missing content.

Browser-test builds use isolated CMS fixtures, including during prerendering.
Never deploy a browser-test build. Normal production builds require the
configured published content.

## Images and fonts

Use `next/image` for application images. Supply dimensions or `fill` with a
correct `sizes` value. Mark the actual largest-content image as high priority;
do not mark every image.

The Next.js 16.4.2 pin includes the fix for
[interrupted image requests hanging later requests](https://github.com/vercel/next.js/issues/98402)
in `next start`. Verify dependency upgrades with a cold image cache and the full
browser suite; a warm cache can conceal this failure.

Use `next/font` for project fonts. Remove unused weights and families. Do not
load the same font through CSS and `next/font`.

## Loading and code splitting

Use `Suspense` around work that can stream independently. The fallback should
reserve the final space to avoid layout shift.

Use a dynamic import for a large client-only dependency that is absent from the
initial view. Do not split a small component merely because it can be split.

Third-party scripts need an owner, a loading strategy, and a measured cost. Load
analytics according to the [GA4 guide](ga4-guide.md).

## Motion

Shared motion uses CSS and IntersectionObserver. Animate `transform` and
`opacity`. Respect `prefers-reduced-motion`. Avoid JavaScript animation
libraries until CSS cannot express a required interaction.

Shared text buttons keep their underline transparent at rest and transition its color on hover, including on exit, using the same `--duration-base` and `--ease-organic` tokens as the arrow transition. Active navigation keeps a visible underline. Reduced motion disables the transition.

The Visit map address popup fades in and out with the shared base duration and organic easing. Its top pointer is anchored to the marker tip; the popup stays mounted until its closing animation ends. Reduced motion opens and closes it immediately.

Section links use native smooth scrolling when the visitor has no reduced-motion
preference. Reduced motion keeps instant scrolling. The root layout declares
`data-scroll-behavior="smooth"` so Next.js can keep route navigation instant.

## Verification

```bash
bun run build
bun run test
```

Use the build output to find dynamic routes and large chunks. Use browser
performance tools on a production build with representative data. Track field
LCP, INP, and CLS after launch. A Lighthouse score from an empty local page is a
smoke check, not a performance budget.

Optimize the measured bottleneck and record the before and after result in the
pull request.

## Repeated Lighthouse collection

`bun run perf` uses the locked development-only LHCI 0.16.0 and Lighthouse
13.6.0 packages. Run audits with Node 22.23.4, Bun 1.4.0 and the Chromium
installed by the locked Playwright release:

```bash
bun ci
bunx playwright install --with-deps chromium
export AUDIT_NODE_PATH=/absolute/path/to/node-22.23.4/bin/node
bun run build
bun run start --port 3118
```

In another terminal, with the same representative public CMS and integration
configuration:

```bash
bun run perf --origin http://127.0.0.1:3118 --phase baseline \
  --evidence .omo/evidence/issue-181-performance/baseline-001 \
  --manifest performance/manifest.json
```

The evidence parent directory must exist; the attempt directory must be new.
Do not replace missing content with fixtures. A ready manifest
contains all 22 approved static paths and one published, image-bearing
detail of each type. Representative baseline, candidate and deployment phases
require indexable published details from the sitemap. Published noindex
development pages are allowed only with `--phase diagnostic`; diagnostic scores
cannot establish representative acceptance. Indexing state is frozen and
checked without changing CMS content. Select eligible details by descending body-image count, then lexical
pathname. Freeze headings, representative body text, menu selection, hero
expectations and CMS document IDs, revisions, timestamps and hashes. Visit's map
expectation must match the environment's normal interactive or static mode;
never remove a configured token for an audit. The
`performance/manifest.ts` schema defines the machine-readable contract; ignored
task-1 evidence records the current content-selection result.

The command keeps three independent fresh-browser runs per URL on standard
mobile and desktop profiles, preserving query strings. Each URL receives one
ordinary unscored navigation before its three measured runs. Consent is never
preaccepted; the measured document must retain the normal Cookie Settings
trigger with no saved preferences. The preferences dialog stays closed during
scored runs, matching the ordinary first visit.
The readiness audit has a separate category and does not contribute to the
Performance score. It checks the measured document rather than a second fetch.
The built-in desktop settings come from Lighthouse's desktop preset.

Collection invokes the bundled Lighthouse CLI once per run because LHCI's
collector automatically retries failed runs. Native LHCI assertions enforce
the raw three-run median of at least 0.90. Any invalid or missing report stops
the attempt; a score failure retains the complete population. Retain failed
attempts and rerun the whole matrix under a new attempt ID. A machine-wide
temporary lock prevents concurrent collection; an existing lock is a failure,
including after an interrupted process, until its owner is checked.

Reports retain JSON, HTML, traces, network logs, screenshots, exact device
settings and metric summaries. Population metadata binds them to the source
digest, uncommitted diff digest, production build ID, CMS identity, origin and
tool/browser versions. Token query parameters and configured secret values are
redacted from collected text artifacts without changing scores or menu query
identity. No environment dump is saved. LHCI makes no remote
upload. The development-only `basic-ftp` override fixes
[GHSA-c475-qrg2-pj4r](https://github.com/advisories/GHSA-c475-qrg2-pj4r)
in LHCI's proxy dependency chain while preserving the approved LHCI pin.

Run `bun run test performance/validate.test.ts performance/process.test.ts performance/content.test.ts` for
tooling failure and cleanup checks. Synthetic populations prove tooling behavior
only. A local score population does not establish full acceptance: cold runtime
cache diagnostics, returning-consent traces, visitor-flow and visual checks are
separate requirements. Representative scoring requires the real manifest and
normally configured integrations. Deployment mode fails
explicitly until trusted deployment resolution and its environment/origin
allowlist are implemented. Do not use an unrelated live revision as
candidate evidence or deploy solely to bypass that blocker.

The **Performance tooling** CI job installs locked dependencies, checks the
pinned audit runtime and CLI, tests synthetic report populations, and proves
that the public command rejects an unavailable server. It uses only synthetic
configuration and read-only repository access. Its failure evidence is retained
as a workflow artifact for 14 days; missing artifact files fail the upload.
This check proves tooling behavior and does not establish representative scores.

The browser Sentry DSN compiles to an explicit empty value when unconfigured,
allowing unused SDK imports to leave the browser bundle. Configured browser
reporting initializes synchronously before hydration with the existing privacy
and sampling settings. The private server DSN never supplies a missing browser
DSN.
