# PostHog

PostHog receives the same sanitized page, interaction and booking-funnel events
as GA4. The Release v1.0 collection policy and event catalog live in the
[GA4 guide](ga4-guide.md). Cookie preference changes do not control collection.

## Configuration

```dotenv
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
```

Both provider values and `NODE_ENV=production` are required. Deployment labels do not select accounts or payment mode.
Values are public build-time configuration. Rebuild after changing them.
The approved staging destination is EU project 229786. Production must use a
separate approved project. A project token permits ingestion, not account reads.
Never replace it with a personal or project secret API key.

## SDK ownership

`src/lib/analytics/posthog.ts` imports and initializes the SDK once when reporting
is enabled, rechecks enablement after import, queues a bounded set of events and
scrubs every capture with `before_send`. `lifecycle.ts` owns page views.
Preference changes do not start another instance, opt out, clear attribution or
replay events.

Every capture uses `send_instantly` with keepalive fetch so a navigation does not
wait for the SDK batch timer. Beacons are disabled. Explicit provider teardown
can abort an instance's fetch/retry requests, reset it and remove its storage;
this is not tied to the placeholder preference controls. The real-SDK tests
retain coverage for resource teardown and request timeouts.

Only catalog events pass. SDK properties are limited to the existing named set;
URL queries/fragments, raw click IDs and person-property updates are dropped.
`identify` is never called. Autocapture, pageleave, dead clicks, performance,
exceptions, replay, heatmaps, surveys, conversations, experiments and feature
flags remain disabled. Sentry owns exception reporting.

## CSP and verification

`next.config.ts` allows the configured PostHog ingestion host when its key and
host are set. Stripe origins remain available on all pages for client navigation.
The shared browser test records and decodes real SDK payloads; its fixtures mask
webdriver because PostHog drops bot events. Synthetic CMS images are rewritten
to local fixtures in every analytics tab so tests do not depend on a live CDN.

After configuring the approved staging project, verify actual events and result
properties in Activity, build the reservation funnel described in the GA4 guide,
and record its saved URL and observed candidate. A local test using intercepted
requests does not establish ingestion, account ownership or deployed CSP.

## Staging receipt on 2026-11-02

The real SDK delivered a synthetic local booking attempt to approved project
229786. The saved [Peploes staging reservation funnel](https://eu.posthog.com/project/229786/insights/r9xocEe2)
shows one attempt reaching all five steps. Activity also shows all seven booking
event names; the confirmation carries opaque attempt
`88496466-5fc1-43f3-b439-8238a03f8435` and `result=confirmed`. It aggregates by
`properties.attempt_id`, with availability `available`, hold `succeeded` and
details `succeeded` filters. The first and last events are search submission and
ResDiary-confirmed reservation. Payment and recovery remain separate branches.
The synthetic run used simulated ResDiary and Stripe; its conversion is not a
real restaurant booking. This local receipt does not verify a hosted deployment.

The later hosted candidate `dpl_3CJfahiCdq8Ehwaq1vfaqWVYXGoC` delivered search,
availability, hold, details and confirmed events from its real ResDiary sandbox
journey. Activity shows the preview URL and confirmation with
`attempt_id=47dd4dee-ba58-4439-890b-3c75e6bc2d17`, `result=confirmed` and
`error_code=NONE`. The synthetic reservation was verified as Booked through
ResDiary, then cancelled and verified as Cancelled. Payment and recovery
receipts above remain local simulated flows. See the
[hosted handoff](testing-guide.md#hosted-staging-handoff-on-2026-11-02).
