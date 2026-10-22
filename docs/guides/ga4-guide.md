# GA4 and analytics

The analytics modules provide event dispatch, UTM persistence, duplicate
suppression, server-side Measurement Protocol calls, and Web Vitals events.
They are building blocks. The root application does not load the GA script or
call the Web Vitals hook yet.

## Files

- `src/lib/analytics/client.ts` sends browser events through `window.gtag`.
- `src/lib/analytics/server.ts` sends Measurement Protocol events.
- `src/lib/analytics/utm.ts` stores UTM parameters in `sessionStorage`.
- `src/lib/analytics/deduplication.ts` suppresses repeated client events.
- `src/lib/analytics/web-vitals.ts` maps Web Vitals to GA4 events.
- `src/lib/analytics/debug.ts` prints development diagnostics.
- `src/lib/cookie-consent.ts` decides whether browser tracking is allowed.
- `src/components/app/atoms/track-event.tsx` tracks an event after mount.

## Configuration

```dotenv
NEXT_PUBLIC_GA_MEASUREMENT_ID=
NEXT_PUBLIC_GTM_ID=
NEXT_PUBLIC_GA_ENDPOINT=https://www.google-analytics.com/mp/collect
GA_API_SECRET=
```

Client tracking needs a measurement ID and a loaded `gtag` function. Server
tracking also needs `GA_API_SECRET`. Keep the secret on the server.

The CSP permits Google Tag Manager and Analytics browser origins only when a
public GA or GTM ID is configured. It does not load either provider script.

## Consent comes first

`hasAnalyticsConsent()` reads the visitor's Analytics choice from the footer's
Cookie Preferences modal. Missing, malformed or inaccessible browser storage
denies tracking. Changing a switch saves that category immediately; Accept All
and Reject non-essential save all categories and close the modal. No analytics
or marketing provider scripts are loaded by the preferences UI.
If saving fails, a necessary denial cookie blocks older permissions across
reloads and tabs. A successful save clears it. If the browser blocks both
storage mechanisms, only the current page can retain the failed withdrawal.

Consent requirements depend on the product, region, and data collected. Record
that policy outside the analytics helper instead of hardcoding legal assumptions
into event functions.

## Client events

Use the named functions for page views and purchases. Use `trackCustomEvent`
for a stable product event that has an owner and a reporting use.

```typescript
trackCustomEvent("contact_submitted", {
  form: "sales",
});
```

Event names use lowercase snake case. Keep parameters small and avoid email
addresses, names, free text, and other personal data.

The client enriches events with stored UTM values and suppresses the same event
and parameters within the configured deduplication window.

## Server events

Use server events when the server is the source of truth, such as a confirmed
purchase. Pass a durable client ID when attribution across client and server
matters. The helper returns `false` when it is unconfigured or GA rejects the
request.

Do not send both client and server versions of the same conversion without a
documented deduplication key.

## Web Vitals

`useWebVitals()` loads `web-vitals` after the configured delay and reports CLS,
INP, LCP, FCP, and TTFB. Mount it once in a Client Component after consent. The
current root layout does not mount it.

## Verification

- Verify consent denial before checking event delivery.
- Use GA4 DebugView for browser events.
- Use the Measurement Protocol validation endpoint while developing payloads.
- Test UTM expiry and deduplication with controlled time.
- Confirm that no personal or secret value appears in network payloads.
