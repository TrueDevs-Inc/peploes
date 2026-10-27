# GA4 and analytics

The analytics modules provide event dispatch, UTM persistence, duplicate
suppression, server-side Measurement Protocol calls, and Web Vitals events.
The root layout mounts `Analytics`, which owns page views, loads GA4 and
PostHog after consent and reacts to consent changes. The Web Vitals hook is not
mounted.

## Files

- `src/lib/analytics/client.ts` sanitises events and routes them to each provider.
- `src/lib/analytics/server.ts` sends Measurement Protocol events.
- `src/lib/analytics/utm.ts` stores safe UTM parameters in `sessionStorage`.
- `src/lib/analytics/sanitize.ts` applies the event and property allowlist.
- `src/lib/analytics/permission.ts` combines consent with the live-site check.
- `src/lib/analytics/deduplication.ts` suppresses a repeated dedupe key.
- `src/lib/analytics/lifecycle.ts` is the single page_view owner and aligns
  both providers with consent.
- `src/lib/analytics/ga4.ts` queues and dispatches to `window.gtag`, loads
  `gtag.js` (Consent Mode defaults denied, `send_page_view: false`), rechecks consent after load and clears `_ga*`
  cookies on withdrawal.
- `src/lib/analytics/posthog.ts` imports `posthog-js` after consent, rechecks
  consent after the import, scrubs events in `before_send`, and opts out,
  resets and clears `ph_*` storage on withdrawal. posthog-js cannot discard its
  batch or retry queues, so each instance gets an abort signal through
  `fetch_options` (beacons disabled) that withdrawal fires; the next grant
  starts a new instance. `before_send` is an allowlist, not a filter.
- `src/components/app/atoms/analytics.tsx` mounts the lifecycle;
  `tracked-link.tsx` reports booking, contact and directions clicks.
- `src/lib/analytics/web-vitals.ts` maps Web Vitals to GA4 events.
- `src/lib/analytics/debug.ts` prints development diagnostics.
- `src/lib/cookie-consent.ts` decides whether browser tracking is allowed.
- `src/components/app/atoms/track-event.tsx` tracks an event after mount.

## Configuration

```dotenv
NEXT_PUBLIC_GA_MEASUREMENT_ID=
NEXT_PUBLIC_GTM_ID=
NEXT_PUBLIC_VERCEL_ENV=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
NEXT_PUBLIC_GA_ENDPOINT=https://www.google-analytics.com/mp/collect
GA_API_SECRET=
```

Client tracking needs a measurement ID, analytics consent and a live-site
deployment: `NEXT_PUBLIC_VERCEL_ENV` must equal `production`. Unset or any
other value means no collection, even in a production build, so previews and
local `next start` stay off. Vercel provides the variable; set it explicitly
for QA builds or another host. Events wait in a bounded in-memory queue until `gtag` exists; the
GA4 loader flushes the queue once loaded. Server
tracking also needs `GA_API_SECRET`. Keep the secret on the server.

PostHog starts only when both its key and region host are set. The CSP permits
Google and PostHog browser origins only for configured providers; PostHog uses
`https://*.posthog.com` (its recommendation) or the exact origin of a non-PostHog
host. GA4 needs Enhanced Measurement "Page changes based on browser history
events" turned off in the property; code cannot verify that setting.

## Consent comes first

`hasAnalyticsConsent()` reads the visitor's Analytics choice from the footer's
Cookie Preferences modal. Missing, malformed or inaccessible browser storage
denies tracking. Changing a switch saves that category immediately; Accept All
and Reject non-essential save all categories and close the modal. No analytics
or marketing provider scripts are loaded by the preferences UI.
`subscribeToConsent()` reports every save in this tab, including failed ones,
and `storage` events from other tabs. Withdrawal clears the pending queue,
dedupe history and stored UTM values; denied events are dropped, never queued
or replayed. A failed save that only sets the denial cookie is not visible to
other tabs as an event, but each dispatch re-reads consent first.
If saving fails, a necessary denial cookie blocks older permissions across
reloads and tabs. A successful save clears it. If the browser blocks both
storage mechanisms, only the current page can retain the failed withdrawal.

Consent requirements depend on the product, region, and data collected. Record
that policy outside the analytics helper instead of hardcoding legal assumptions
into event functions.

## Client events

`sanitizeAnalyticsEvent()` drops any event or property that is not in
`ANALYTICS_EVENT_PARAMS`. Identifiers (placement, menu, destination) must come
from a closed list. Locations are origin plus path, referrers origin only, and
UTM values must be short alphanumeric text with no email or phone-like content.

| Event | PostHog name | Properties |
| --- | --- | --- |
| `page_view` | `$pageview` | `page_location`, `page_path`, `page_referrer` |
| `booking_click` | same | `placement` |
| `menu_view` | same | `menu` (a menu slug) |
| `contact_click` | same | `placement`, `destination` (`phone` or `email`) |
| `directions_click` | same | `placement` |

Never send `tel:`, `mailto:` or map URLs. No enquiry, subscription or booking
completion event exists: the enquiry and newsletter controls are inert and the
booking page is a design preview, so none of them may report success.

`trackPageView` accepts a `dedupeKey` naming one navigation. Keys are recorded
only after `gtag` accepts the event, and there is no time window, so quick
revisits with new keys are all sent.

## Server events

Use server events when the server is the source of truth, such as a confirmed
purchase. Pass a durable client ID when attribution across client and server
matters. The helper returns `false` when it is unconfigured or GA rejects the
request.

Do not send both client and server versions of the same conversion without a
documented deduplication key.

## Web Vitals

`useWebVitals()` is not supported by the current event allowlist: its
`web_vitals` events are not in `ANALYTICS_EVENT_PARAMS`, so
`sanitizeAnalyticsEvent()` drops them. Do not mount it until the events are
added to the allowlist with their properties.

## Property settings

Turn off Enhanced Measurement "Page changes based on browser history events":
the app sends every `page_view` itself and a second owner would double count.
Also review the other Enhanced Measurement events (scrolls, outbound clicks,
file downloads): gtag.js reads the browser URL for them, so a visit with a query
string or fragment can reach GA on those events even though our own events are
sanitised. Disable the ones you do not need. Code cannot verify property
settings.

One page view per navigation, and no query string or fragment in production
GA4 data, therefore depend on these property settings (history-based page
changes off, other Enhanced Measurement events reviewed). The browser suite uses
a `gtag.js` stub, so real gtag traffic is unverified.

## Verification

Run `bun run test:e2e:analytics` for browser delivery (see
[PostHog guide](posthog-guide.md) for the shared harness). It builds with
`NEXT_PUBLIC_VERCEL_ENV=production` and a synthetic `G-TEST000000`, replaces
`gtag.js` with a stub that consumes `dataLayer` like the real script and sends
`g/collect` hits, and records those hits. It covers no traffic or storage before
a choice and after rejection, one `page_view` per navigation (history moves and
revisits included), withdrawal before, during and after load, re-consent, reload,
a second tab, blocked storage, a blocked script, query/hash/email stripping,
interaction payloads and the booking preview never reporting a booking.

That proves our calls and consent handling, not receipt. Still to do by hand:

- GA4 DebugView with a real test property (live receipt is otherwise unverified).
- The Enhanced Measurement settings above.
- Use the Measurement Protocol validation endpoint while developing server payloads.
- Confirm that no personal or secret value appears in network payloads.
