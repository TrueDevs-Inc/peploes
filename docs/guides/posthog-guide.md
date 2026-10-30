# PostHog

PostHog receives the same sanitised page and interaction events as GA4, only
after the visitor accepts analytics. It never receives error reports (Sentry owns
those) or session replays.

## Files

- `src/lib/analytics/posthog.ts` imports `posthog-js` after consent, initialises
  it, forwards events and tears it down on withdrawal.
- `src/lib/analytics/lifecycle.ts` aligns it with consent and owns `$pageview`.
- `src/lib/analytics/client.ts` sanitises once, then calls GA4 and PostHog.
- Event contract and property allowlist: [GA4 guide](ga4-guide.md).

## Configuration

```dotenv
NEXT_PUBLIC_VERCEL_ENV=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
```

Both PostHog variables are required; with either missing nothing loads. Collection
also needs `NEXT_PUBLIC_VERCEL_ENV=production` (see the GA4 guide) and analytics
consent. These are public values compiled into the browser bundle, so change them
at build time. The key is a project token, not a secret.

Region and host are not decided. Use the host of the real project (EU
`https://eu.i.posthog.com`, US `https://us.i.posthog.com`, or a reverse proxy);
do not assume one. Production and local/preview data must use different projects.

## Consent lifecycle

- Before a grant, or for any denied, unreadable or failed consent state, the SDK
  is not imported and PostHog storage is not written.
- A grant imports the SDK, rechecks consent after the import, initialises a named
  instance and opts it in. A withdrawal that lands during the import means no init.
- Withdrawal aborts every request of the instance (an `AbortController` supplied
  as `fetch_options.signal`; beacons are disabled so none bypass it), calls
  `reset()`, clears `ph_*` cookies and storage, opts out and drops the instance.
  posthog-js cannot discard its batch or retry queues, so the abort is what stops
  them. The `__ph_opt_in_out_*` flag stays so a reload does not resume capture.
- Every event is captured with `send_instantly`, so it goes out as a keepalive
  fetch instead of waiting in the 3 second batch. With beacons off, a batched
  event would be lost when the page unloads first (a reload or the same-tab
  directions link).
- A later grant starts a fresh instance; denied events are never replayed.
- `fetch_options.signal` is outside the SDK's typed config and relies on it being
  spread last into each request. Recheck on SDK upgrades (the Vitest suite
  `analytics-posthog-sdk.test.ts` runs the real SDK for this).

## What is sent

`before_send` is an allowlist. Only catalog events pass (`$pageview`,
`booking_click`, `menu_view`, `contact_click`, `directions_click`). Custom
properties go through the same sanitiser as GA4; SDK properties are limited to a
named set (device, browser, ids, timezone) and URL fields are reduced to origin
plus path, referrers to origin. `$set`, `$set_once`, `$unset`, raw PostHog
keyword and click-identifier fields are dropped. Allowlisted UTM values
(`utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`) still
pass once the campaign sanitiser accepts them. `identify` is never called.

## Disabled surfaces

Autocapture, pageleave, dead clicks, performance, exceptions, session replay,
heatmaps, surveys, conversations, web experiments, feature flags and saved
campaign parameters are off. Do not enable one without a new privacy decision.

## Limits

- Beacons are off, so events queued in the last 3 seconds before a hard page
  navigation (such as leaving through an external link) are lost. Client-side
  navigation is unaffected.
- posthog-js drops events from bots (webdriver, `HeadlessChrome`). The browser
  test masks these; real automated visitors are not measured.

## CSP

`next.config.ts` adds the PostHog origin to `script-src` and `connect-src` only
when key and host are both set: `https://*.posthog.com` for PostHog hosts, the
exact origin for a proxy. Booking-page Stripe origins are preserved.

## Verification

- `bun run test:e2e:analytics` (production build with synthetic key, host and
  `G-TEST000000`) intercepts the PostHog host and decodes the real SDK's gzip or
  base64 payloads. It checks the scenarios listed in the GA4 guide for both
  providers, including a queued event not being sent after withdrawal.
- `src/__tests__/lib/analytics-posthog-sdk.test.ts` runs the real SDK in Vitest.
- Not verified without a test project: events appearing in PostHog Live events,
  the chosen region host, and production CSP headers.
