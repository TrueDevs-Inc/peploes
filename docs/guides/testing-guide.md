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

Use the lowest layer that catches the real failure.

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
```

The command builds the production application, then starts and stops two
servers from that build: `http://127.0.0.1:3107` for most journeys and
`http://127.0.0.1:3108` for the `resdiary-down` project. Keep both ports free;
the suite refuses to reuse an existing server. Pull-request CI installs Chromium
and its system dependencies before running the same command. Failure traces stay
in ignored `test-results/`.

The build and test server use a fake Sanity project. The test-only
`e2e/mock-sanity.ts` preload supplies menu documents from the local design
catalogs; it rejects unexpected CMS queries and never reads a live dataset.
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
test-only `BOOKING_HOLD_SECRET`, so a contributor's `.env.local` never reaches
the real sandbox. These tests prove the page against replies shaped like
ResDiary's.

Booking behaviour is tested against ResDiary's sandbox first, with real data
and real speed. `bun run test:e2e:sandbox` loads `.env.local`, refuses any host
other than `api.rdbranch.com`, starts the production build on port 3109 with a
throwaway hold secret, and compares the page with ResDiary's own replies,
requested directly by the test. It reports how long the page took and never
runs in CI. The server runs with `VERCEL_ENV=preview`, so the app accepts the
sandbox's Stripe test key the way a preview would. Payment tests check that
every Stripe key starts with `pk_test_` and use only Stripe's published test
cards (4242 4242 4242 4242, 4000 0027 6000 3184 for 3-D Secure, 4000 0000 0000
0002 for a decline). Every booking a test makes goes to the test inbox and is
cancelled at the end, and the test checks that ResDiary reads it back as
cancelled. Write the sandbox test first for each booking change, then add fake
tests only for what the sandbox cannot do on demand: failures, slow or
out-of-order replies and states it does not have. Report which evidence came
from the sandbox and which from the fake.

Analytics delivery has its own spec, `e2e/analytics.spec.ts`, because provider
settings are compiled into the browser bundle. `bun run test:e2e:analytics`
builds with synthetic provider variables, serves on port 3108 through
`playwright.analytics.config.ts` and runs only the desktop project. It inherits
the main server's fake Sanity and ResDiary settings. Its booking
privacy test completes a simulated reservation on a future available date and
checks that neither personal details nor booking/purchase events reach analytics.
The normal configuration ignores that spec; it overwrites `.next`, so rerun `bun run
test:e2e` afterwards to rebuild without providers. That normal build is a
live-site build (`NEXT_PUBLIC_VERCEL_ENV=production`) with empty provider IDs,
so `analytics-unconfigured.spec.ts` exercises the missing-ID gate rather than
the deployment gate. Provider hosts are intercepted
with `context.route`, so no request leaves the machine. CI runs it after the
normal browser tests, reusing the installed Chromium. See the
[PostHog guide](posthog-guide.md).

Each analytics test layer verifies a different boundary. Unit tests verify the
rules in isolation: sanitising, allowlists and consent logic. The real-SDK node
test (`src/__tests__/lib/analytics-posthog-sdk.test.ts`) verifies what posthog-js
puts in a payload and how it sends it. Playwright verifies the assembled page:
consent reaching the network, navigation counts, unload delivery and browser
storage. A rule may appear in more than one layer when each checks its own
boundary; do not repeat the same assertion at the same boundary.

Test the production build, locate controls by accessible role or label, and give
each test isolated data. Add coverage for critical journeys such as sign-in,
checkout, permission enforcement or a destructive workflow as they are built.

Start with a few Chromium tests in pull requests. Add browsers when the support
policy requires them. A homepage heading assertion alone does not justify a
browser suite.

## Coverage and mutation testing

Coverage is a map of executed code. Review changed-file coverage to find
untested risk, but do not enforce a repository-wide percentage.

Mutation testing can challenge important pure business rules after they exist.
Run it on selected modules or on a schedule. A full Stryker run on every pull
request is unnecessary for the current sample domain.

## Review checklist

- The test names the behavior and failure.
- The assertion observes the public contract.
- Data and time are deterministic.
- The test does not depend on execution order.
- A cheaper test does not already catch the same bug.
- The production code was not distorted to satisfy the test.

## References

- [Next.js testing guides](https://nextjs.org/docs/app/guides/testing)
- [Vitest testing in practice](https://vitest.dev/guide/learn/testing-in-practice)
- [Playwright best practices](https://playwright.dev/docs/best-practices)
- [Google: do not overuse mocks](https://testing.googleblog.com/2013/05/testing-on-toilet-dont-overuse-mocks.html)
- [The practical test pyramid](https://martinfowler.com/articles/practical-test-pyramid.html)
- [GitHub Actions PostgreSQL service containers](https://docs.github.com/en/actions/tutorials/use-containerized-services/create-postgresql-service-containers)
- [Drizzle migration generation](https://orm.drizzle.team/docs/drizzle-kit-generate)
