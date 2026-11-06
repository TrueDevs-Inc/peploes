# Testing

Tests protect behavior that could break. Test count and coverage percentage are
poor targets because generated tests can raise both without finding a bug.

## Current setup

Vitest runs in Node with the `@/` alias. `vitest.config.ts` replaces the
`server-only` poison-pill package with an empty test module.

```bash
bun run test
bun run test:integration
bun run test:watch
bun run test:coverage
```

The integration command requires a PostgreSQL database with the repository
migrations already applied. Unit tests do not require a running database.

The test files describe current coverage. The
[quality guide](quality-guide.md#required-checks) defines when to run each gate
and how to report checks that could not run.

## Test selection

Use the lowest layer that catches an important failure. End-to-end and
integration tests must justify their runtime with a critical user outcome or a
boundary failure that cheaper coverage cannot prove. A complete booking journey
can earn a browser test; a click followed by decorative CSS checks cannot.
Run only the checks affected by the change, following the quality guide.
Ordinary CSS edits do not warrant a suite run.

| Check | Use it for |
| --- | --- |
| Type and lint | invalid imports, unsafe types, framework rules |
| Unit test | pure validation, mapping, policy, and state transitions |
| Integration test | SQL, constraints, serialization, and layer boundaries |
| Browser test | critical journeys through a production build |
| Contract test | independently deployed consumers and providers |

Do not repeat a unit test through every higher layer. One regression belongs at
the lowest layer that still observes the failure.

Use the approved interface named by the ticket. For a bug, first reproduce it
with a focused failing check, then make the smallest fix and rerun that check.
For a feature, work one behavior at a time. Include denied access, invalid input,
empty results, dependency failure or competing writes when those cases affect
the changed contract. A happy-path test alone does not prove a protected write.

Hook regression tests invoke the shell hook in a temporary Git repository and
observe its exit status, index and working tree. Stub package-manager commands
at the process boundary; run the actual quality tools separately. Tests must
not commit, push or change the contributor's real repository state.
On Windows, use the shell bundled with Git for Windows and the platform's PATH
separator. Hook files must retain the LF line endings required by `.gitattributes`.

## A useful test

Before writing a test, name the bug it should catch. The test should fail when
that bug is introduced, assert a public result or side effect, run independently,
and survive an internal refactor.

Avoid tests that only:

- confirm a constant equals its definition;
- assert that a mock was called with implementation details;
- snapshot a large component tree without a specific contract;
- mirror branches line by line for coverage;
- test behavior owned by React, Next.js, Drizzle, or Zod.

## Review test maintenance

Apply the [test-quality skill](../../.agents/skills/test-quality/SKILL.md) to new
and changed tests and accompanying docs. Always flag decorative CSS measurements,
animation internals, private framework mechanics and implementation-mirroring
assertions for removal when the requirement is user behavior. Preserve security
headers, protocol contracts, cache invalidation and useful behavior in mixed tests.
Existing coverage can satisfy a change; no test or doc is required per source edit.
Explicit visual or performance requirements need a stable measurement and a
reason a cheaper behavior check is insufficient. Accessibility and safety
contracts still need checks. Review evidence belongs in the PR or tracker.

## Mocks

Use real values and real local implementations when they are deterministic and
cheap. Mock time, randomness, third-party networks, and failures that cannot be
created safely.

Mocking the DAL in a service test can verify service policy. It does not verify
SQL. A database integration test should use disposable PostgreSQL and the real
Drizzle schema.

## Database tests

Pull-request CI starts a disposable PostgreSQL service, applies the migration
history, and runs `bun run test:integration`. The baseline test performs one raw
SQL round trip through the migrated `examples` table. Raw SQL keeps this check
independent from the Drizzle schema that generated the migration.

Add database tests for constraints and query behavior that can fail in
PostgreSQL but not in a unit test. Keep their data isolated and avoid duplicating
service-policy tests at the SQL layer.

## Browser tests

Playwright covers public-page journeys in headless Chromium at desktop and phone
widths, including a narrow 320px screen. The suite checks navigation and active
states, Visit & Contact anchors and contact destinations, placeholder actions,
image loading and horizontal overflow. Phone, email and map destinations are
checked without opening external services.

```bash
bunx playwright install chromium
bun run test:e2e
bun run test:e2e:email
```

The command builds the production application, then starts and stops two
servers from that build: `http://127.0.0.1:3107` for most journeys and
`http://127.0.0.1:3108` for the `resdiary-down` project. Keep these ports free;
the suite refuses to reuse an existing server. Pull-request CI installs Chromium
and its system dependencies before running the same command. Failure traces stay
in ignored `test-results/`.

The email browser command builds a separate production-mode test artifact with
an in-memory delivery-record adapter, an allowed rate-limit response, and an
intercepted Resend endpoint. It uses synthetic `.test` addresses and exercises
the private-dining form, server
action, enquiry service, and mail service. Visit coverage checks the shared
gathering enquiry and direct contact links, without a separate general message
form, even when email is configured. The database integration test owns durable
claim behavior; the browser fixture does not prove PostgreSQL or inbox receipt.

Set `E2E_BOOKING_DATE=YYYY-MM-DD` to keep the fake provider and booking browser
fixtures on one Dublin date, including when the host crosses midnight.

Browser suites use synthetic reporting settings or blank provider credentials
to avoid sending test events to configured accounts. Payment key acceptance
and page indexing do not depend on deployment labels. SEO checks run alongside
the analytics suite.

The build and test server use a fake Sanity project. The test-only
`e2e/mock-sanity.ts` preload supplies menu documents from the local design
catalogs; it rejects unexpected CMS queries and never reads a live dataset.
The test server has a synthetic webhook secret; specs that change published
fixture state call `announceSanityPublish` from `e2e/sanity-webhook.ts` to expire
the cached CMS content.
Menu journeys import `test` from `e2e/menu-test.ts` so their synthetic CMS image
URLs reach local photographs through the real Next image optimizer. These
fixtures are not imported by the application or used as production fallbacks.

Booking journeys run the real page, services and ResDiary provider against a
fake ResDiary. The `e2e/mock-resdiary.ts` preload answers sign-in, Setup,
ClosedDates, AvailabilityForDateRangeV2 and AvailabilitySearch for `https://resdiary.e2e.test` from
`e2e/booking-fixtures.ts`, with dates counted from today in Dublin, and fails on
any other ResDiary request. Its availability depends on the party size: some
sizes have full days, one answers slowly and one fails, so the tests can cover
loading, failure and replies that arrive out of order. Holds, hold status and
guest details are faked too: some times fail or answer slowly, a hold whose
details were accepted reads back as Confirmed, and the email address in
`FAKE_RESDIARY.lostReplyEmail` gets a 500, so the server sees an unclear reply.
To cover a reply lost on the way to the browser, a test aborts the page's own
request with `page.route`. When the server should still act first, the test
calls `route.fetch()` and then puts the cookies back, because `route.fetch()`
applies the server's cookie changes, which a lost reply never would. The second server points at `https://resdiary-down.e2e.test`, which
waits two seconds and answers 503, so `e2e/booking-unavailable.spec.ts` covers a
slow, failing ResDiary. It needs its own server because the provider caches
settings for five minutes. Playwright sets every `RESDIARY_*` value and a
test-only `BOOKING_HOLD_SECRET`, so a contributor's `.env` never reaches
the real sandbox. These tests prove the page against replies shaped like
ResDiary's.

Booking behaviour is tested against ResDiary's sandbox first, with real data
and real speed. `bun run test:e2e:sandbox` loads `.env`, refuses any host
other than `api.rdbranch.com`, starts the production build on port 3109 with a
throwaway hold secret, and compares the page with ResDiary's own replies,
requested directly by the test. It reports how long the page took and never
runs in CI. Test payment mode comes from the connected sandbox account.
Sandbox traces use `sandbox-test-results/`, separate from the normal suite's
`test-results/`, so starting a sandbox run cannot delete an in-flight normal trace.

Set `BOOKING_SANDBOX_TEST_EMAIL` to an authorised test inbox when checking email
receipt. Without it, sandbox bookings use `booking-test@example.com`, not a staff
inbox. Payment tests check that
every Stripe key starts with `pk_test_` and use only Stripe's published test
cards (4242 4242 4242 4242, 4000 0027 6000 3184 for 3-D Secure, 4000 0000 0000
0002 for a decline). Every booking a test makes goes to the test inbox and is
cancelled at the end, and the test checks that ResDiary reads it back as
cancelled. Write the sandbox test first for each booking change, then add fake
tests only for what the sandbox cannot do on demand: failures, slow or
out-of-order replies and states it does not have. Report which evidence came
from the sandbox and which from the fake.

General browser journeys start with a remembered newsletter-popup dismissal so
an automatic prompt does not interrupt unrelated assertions. Both newsletter
popup specs override that preference with fresh storage and verify the prompt.

Test the production build, locate controls by accessible role or label, and give
each test isolated data. Add coverage for critical journeys such as sign-in,
checkout, permission enforcement or a destructive workflow as they are built.

Use `bun run test:e2e:reporting` for analytics, the booking funnel, Sentry and
SEO. It builds once with synthetic provider credentials and runs the combined
suite through `playwright.reporting.config.ts`. Provider hosts are intercepted;
these checks do not prove receipt in a real account. The suite checks navigation
counts, payload privacy, payment versus confirmation outcomes, expiry, recovery
across tabs and scrubbed browser errors.

The three entry points use `e2e/run.ts` to build and run Playwright with the
same environment for both processes. `e2e/environment.ts` owns shared fixture
settings and synthetic reporting credentials. `test:e2e` blanks reporting
credentials, `test:e2e:reporting` uses synthetic reporting destinations, and
`test:e2e:sandbox` keeps real ResDiary sandbox credentials while using the fake
CMS and no reporting credentials. Real sandbox tests stay outside CI.

Arguments are forwarded to Playwright. For example, run
`bun run test:e2e:reporting e2e/sentry.spec.ts` for one reporting spec, or
`bun run test:e2e:sandbox --list` to inspect the real-provider cases without
creating a reservation. Each command rebuilds `.next`; do not run them
concurrently against the same checkout. Sandbox and normal trace outputs are
separate so one cannot delete another's active traces.

Unit tests protect the production reporting requirement, allowlists, opaque attempt IDs and
transport acceptance before persistent conversion deduplication. The real-SDK
Node test verifies PostHog payloads, timeouts and explicit resource teardown.
Browser checks verify assembled behavior, including continued collection after
placeholder choices, navigation counts and storage failures. Real receipt,
source-map symbolication and hosted configuration are separate release checks
in #78 and #79.

The consolidated commands passed full CI with 1,012 unit tests, all 30 combined
reporting browser tests, and seven focused default-suite browser tests. The
sandbox command discovered all 19 cases with `--list`; no real reservations were
created for this tooling change. Runner smoke checks verified that an unknown
suite fails before building and a failed build preserves its exit code without
starting Playwright. The CI workflow YAML also parses successfully.

## Staging deployment workflow

Staging means the `dev` branch deployed to `msf-projects/peploes-fork`, with
`https://peploes-fork.vercel.app/` as the testing URL. Manual source snapshots,
temporary aliases and expiring access links below record earlier verification;
they are not the intended release workflow. The fixes remain uncommitted, so
the current hosted snapshot does not establish a working automatic Git deployment.

Configure `dev` as the fork project's Vercel Production Branch and supply its
sandbox ResDiary, Stripe and test reporting accounts. Gina's separate Vercel
project uses the approved live credentials and production reporting accounts.
No staging/live mode variable is required. Local development uses
`NODE_ENV=development`, with reporting off. Do not set `NODE_ENV=staging`;
Next.js supports only `development`, `production` and `test`. The configured provider determines
payment mode; analytics and Sentry run when configured and `NODE_ENV=production`. Deployment labels do
not override page indexing. Keep `NODE_ENV=production` for both builds.

Set `SENTRY_ENVIRONMENT=staging` and the staging ingestion credentials in the
fork. Reporting uses only `NODE_ENV=production` and configured credentials;
there are no enable flags. Use the production accounts and Sentry label in Gina's project. Keep
credentials in each project's hosting settings. Leave `SENTRY_RELEASE` unset
for Git deployments so uploads and runtime use the deployed commit SHA.
The old hosting transfer file was archived outside the checkout; `.env` is
the only local settings file. No manual snapshot or alias assignment is needed for normal Git
deployments. Build each project with its own public values; do not reuse the
same compiled artifact between accounts.

Removal of deployment-based switches passed `bun run ci` with 1,007 unit tests,
types, lint, both builds and high-severity audits. Eleven focused reporting
browser tests passed for default collection, placeholder rejection, booking
funnel recovery and Sentry delivery. Another 22 browser tests passed for Stripe
stalls, rejected confirmations, card guarantees, details recovery and disabled
cancellation across desktop and phone sizes. These browser checks use simulated
providers. Both review axes found no remaining issues. Changes remain local and
uncommitted; no new hosted deployment was made.

The later `NODE_ENV` reporting correction removed the redundant enable flags.
It passed full CI with 1,012 unit tests, 11 reporting browser tests and three
unconfigured-provider browser tests. Development and test mode suppress browser
and server analytics and Sentry despite configured credentials; production
mode reports to the supplied accounts. Production browser checks use synthetic
destinations. The normal checkout's `.env` already uses `NODE_ENV=development`
and was left unchanged. No hosted settings or deployment changed.

## Hosted staging handoff on 2026-11-02

This section records historical manual verification. The main fork URL was
subsequently assigned to the final tested deployment; the original access links
below are not the intended staging workflow. The later cookie-policy wording
correction is local only and has not been redeployed.

The uncommitted candidate on `feat/msf/78-staging-booking-observability`, based
on `227359bc428dc5860bbf9c1996732a1b77ec7748`, was deployed manually to the
authorized `msf-projects/peploes-fork` preview environment. Deployment
`dpl_3CJfahiCdq8Ehwaq1vfaqWVYXGoC` is READY at
`https://peploes-fork-staging-msf.vercel.app`. Vercel protection remains enabled;
the private client access link expires on 2026-11-09. Do not put that link or
environment values in issues or source. No commit or push was made, and the
existing production alias still points to `dpl_2avvZjwz7PjAmWo2xGpGLRjyDFoH`.

Vercel rejected a Git-associated upload because it could not match the existing
commit author's email. The successful manual upload used an exact source
snapshot, without rewriting Git authorship. The 555 uploaded files have aggregate
SHA-256 `b62f349d930aa150ddcc8009af2781e76a932c0e0e06898d16bf16ce69eadb62`.
`.vercelignore` excludes environment files, dependencies, build outputs and local
reports. Later documentation edits are not part of that deployed snapshot.

Three existing browser tests passed against hosted functions and the approved
`api.rdbranch.com` sandbox: calendar dates, available times and a no-deposit
reservation. A further no-deposit test passed with the real analytics SDKs
enabled for browser automation. Both synthetic reservations were verified as
Booked directly with ResDiary, cancelled, then verified as Cancelled. GA4
Realtime received the confirmed key event. PostHog received all five applicable
funnel stages with opaque attempt `47dd4dee-ba58-4439-890b-3c75e6bc2d17`.
The booking page has no design-preview disclaimer and declares `noindex,follow`.
See the [Sentry evidence](sentry-guide.md#staging-implementation-verification-on-2026-11-02)
for hosted browser receipt, source-map uploads and owner alert delivery.

Configuration locations are distinct:

- The normal checkout's `.env` was not changed.
- This review worktree's ignored `.env` contains local staging reporting
  settings and the private build token. Its database value came from the normal
  checkout; no database command or mutation was run.
- A historical hosting transfer file, now archived outside this checkout,
  recorded the values applied to `peploes-fork` Preview only. It uses the public Sanity development dataset,
  separate staging reporting projects, ResDiary sandbox credentials and a separate
  booking hold secret.
- Hosted SQL is deliberately an unused loopback placeholder. Public booking uses
  ResDiary; database-backed features are not configured by this preview setup.
  No unverified normal-checkout database was copied to hosting.
- `peploes.vercel.app` belongs to another organization and was not changed.
  Before copying settings there, use its actual preview URLs, approved isolated
  database if required, and a separate hold secret. Rebuild after changing browser
  reporting variables, then repeat hosted receipt checks.

This establishes the sandbox no-deposit client-test path. Provider-backed card
guarantees, hosted payment completion, actual reservation email receipt, live
venue/channel mapping and production cutover remain Release v1.0 checks.
Browser transport can be blocked by visitors' network or browser settings;
analytics receipt alone cannot prove reservation delivery.

The latest payment candidate is `dpl_6oAt3T8i8BbSt3d9W2uWbWq8MT4r`, in
Dublin, release `peploes-staging-preview-2026-11-02-227359b-r4`, on the same
protected alias and private access link. Its 553-file snapshot digest is
`e40eca1c3a93eba1869eddd8a2cab5efc1e91bcf9534862df9660b74207c37e8`.
Environment files, generated TypeScript build information and reports are
excluded. All production application files match the final review worktree;
verification documentation was updated after the upload. Deploying another
preview must preserve `--regions dub1` or explicitly configure the equivalent
function region in that hosting project. At upload time, the project's default
region and primary alias were unchanged. The primary alias was subsequently
assigned to this tested build at the user's request; automatic deployment from
`dev` is the intended workflow described above.

See [hosted payment verification](../project/booking-page.md#hosted-payment-verification-on-2-november-2026)
for provider-backed deposits and guarantees, the isolated test-diary rule,
rollback and Gina's test instructions. Live account mapping and email delivery
remain separate release checks.
