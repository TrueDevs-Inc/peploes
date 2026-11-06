# GA4 and booking analytics

The root `Analytics` component starts configured GA4 and PostHog and owns one
page view per navigation. Both providers receive the same allowlisted events.

## Collection policy

For Release v1.0 Salman explicitly requires required and optional analytics
regardless of the consent placeholder. Cookie Preferences saves selections but
does not enable, disable or reset analytics. Public cookie and policy wording
was restored to the branch baseline; changes to client-facing policy copy need
separate approval. Published CMS policy text still needs client verification
under #81. Do not reintroduce preference gating in an
individual event function.

Browser and server collection require `NODE_ENV=production` and configured
provider credentials. There is no separate enable flag. Deployment labels do
not select accounts or control collection. `next dev` does not report;
optimized builds in both Vercel projects do.
No configured provider means no provider traffic. Keep separate staging and
production GA4 properties and PostHog projects. Public settings are compiled
into the browser bundle and require a rebuild.

```dotenv
NEXT_PUBLIC_GA_MEASUREMENT_ID=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
```

Use the approved project's actual region host. Use the approved staging property from the ignored environment settings; do not
substitute the production measurement ID.
`GA_API_SECRET` is only for the separate server Measurement Protocol helper;
the browser funnel does not need it.

## Event ownership

`src/lib/analytics/client.ts` sanitises and dispatches. `lifecycle.ts` owns page
views. `ga4.ts` loads gtag.js, grants analytics storage and keeps advertising
storage denied. `posthog.ts` owns its SDK. `utm.ts` stores safe campaign values.
`constants.ts` owns the event/property catalog and `sanitize.ts` rejects unknown
names, unsafe identifiers and unapproved fields.

| Event | Owner/result |
| --- | --- |
| `page_view` | Lifecycle; PostHog receives `$pageview` |
| `booking_click` | Tracked links, closed placement |
| `menu_view` | Menu selection, closed menu slug |
| `contact_click` | Tracked contact links, closed placement/destination |
| `directions_click` | Tracked directions links, closed placement |
| `booking_search` | User submits Find a Table |
| `booking_availability` | Current times request yields available, empty or failed |
| `booking_hold` | Hold succeeds, fails, is uncertain or expires |
| `booking_details` | Details submitted, accepted, failed or uncertain |
| `booking_payment` | Stripe starts, accepts, declines, is uncertain or fails to load |
| `booking_recovery` | Status recovery starts and reaches confirmed, pending, failed or unknown |
| `booking_confirmed` | The page receives a ResDiary-confirmed reservation |

Payment acceptance is not a reservation conversion. Neither a redirect status
nor a successful Stripe reply can produce `booking_confirmed` by itself.

`src/lib/analytics/booking.ts` assigns a random UUID per search and associates
holds locally with that attempt. It sends only `attempt_id`, closed `result`
and `error_code` values, plus `payment_kind` on payment events. Booking
references stay in local correlation storage and never enter provider payloads.
A bounded local hold map supports reload and bank-return recovery. Each provider
records confirmation deduplication only after its browser
transport accepts the event. This means a gtag call or a non-empty PostHog
capture result, not a network acknowledgement.
Browser Web Locks serialise that acceptance across tabs where supported.
A confirmation waiting for a lock can still be lost if its page closes.
Durable deduplication prioritizes suppressing repeated conversions after reload;
it does not provide exactly-once delivery.
In-memory correlation keeps collection working when storage is blocked.

Deduplication is best effort when storage or Web Locks are unavailable. Client
analytics cannot prove delivery after a blocked network or closed browser.
Operational reconciliation of uncertain outcomes remains #83. No additional
server booking conversion is emitted, avoiding two conversion owners.

## Payload restrictions

Locations contain origin and path, referrers origin only. Never send raw guest
fields, booking references, card data, API tokens, error messages or bank-return
URLs. UTM values must pass the existing short campaign-value sanitizer. PostHog
also scrubs SDK properties. Missing or malformed attempt IDs drop funnel events.

Analytics must not delay or prevent a reservation. Missing providers, blocked
scripts and inaccessible browser storage leave the booking journey usable.

## Provider setup and verification

Disable GA4 Enhanced Measurement history-based page changes because the app owns
page views. Review other automatic measurements so raw query strings and
fragments do not bypass the application sanitizer. Configure event-scoped custom
dimensions for `attempt_id`, `result`, `error_code` and `payment_kind` as needed;
inspect individual attempts rather than using the high-cardinality attempt ID
as a headline aggregate. Mark only `booking_confirmed` as the reservation key
event. Build the main funnel from search, availability, hold, details and
confirmation, then segment payment/recovery branches by their result.

`bun run test:e2e:reporting` tests analytics, SEO, the booking funnel and Sentry
in one production build with synthetic provider settings and intercepted transports.
The real PostHog SDK is used;
gtag.js is replaced by a recording stub. These prove application behavior, not
receipt in a real property. Record observed PostHog events, GA4 DebugView,
deployed CSP and actual account settings for the deployed candidate in #79.

Web Vitals are not mounted and their event names remain outside the allowlist.
No enquiry or newsletter success event is emitted before those backends exist.

## Staging destinations recorded on 2026-11-02

The approved PostHog destination is [EU project 229786](https://eu.posthog.com/project/229786/home).
A separate [Peploes staging GA4 property 561886658](https://analytics.google.com/analytics/web/#/a399443706p561886658/admin)
was created under the existing development account. Its web stream 16251959830
uses the known staging preview URL as metadata; update that URL if #82 selects a
new deployment. Enhanced Measurement is off so the application owns measurement.
`booking_confirmed` is registered as a key event, once per event, with no default
monetary value. No reservation purchase or fabricated revenue is emitted.

The original checkout's supplied GA4 ID belongs to `samsu-td` and its Sentry DSN
to `prs-td`. Those projects were left unchanged. Peploe's ignored `.env`
contains the separate staging ingestion values. Its server GA API secret is
blank because the browser funnel does not need it and the previous secret belongs
to another stream. Never copy that old secret into this property's configuration.

On the final uncommitted candidate based on `227359bc428dc5860bbf9c1996732a1b77ec7748`,
a local production build ran with `VERCEL_ENV=preview` and real staging ingestion
settings. ResDiary and Stripe were simulated; no restaurant reservation or charge
was created. GA4 Realtime showed booking availability, hold, details, payment,
recovery and one confirmed key event. The second synthetic attempt was
`88496466-5fc1-43f3-b439-8238a03f8435`. PostHog ingestion returned HTTP 200.
Event-scoped GA4 dimensions `result`, `error_code` and `payment_kind` are registered.
This is local provider verification. The later hosted candidate
`dpl_3CJfahiCdq8Ehwaq1vfaqWVYXGoC` also delivered the no-deposit reservation
journey to this property. Realtime showed availability, details and
`booking_confirmed`, including one confirmed key event. The matching PostHog
receipt and provider cleanup are documented in the
[hosted handoff](testing-guide.md#hosted-staging-handoff-on-2026-11-02).
Payment and recovery receipts above used simulated local provider flows;
hosted payment completion and production destinations remain release checks.
