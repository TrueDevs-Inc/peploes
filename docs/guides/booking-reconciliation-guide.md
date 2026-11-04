# Booking reconciliation

Use this runbook when the website cannot establish a reservation outcome or a
guest reports a payment without confirmation. ResDiary is authoritative for the
reservation. The restaurant's payment account is authoritative for the charge
or card guarantee. A successful payment does not establish a booked table.

## Access and ownership

The release owner must name a restaurant duty manager, an engineering responder
and backups before activation. The duty manager checks the diary and contacts
the guest; the engineering responder checks restricted application logs and
provider failures. Only a restaurant-authorized payment operator decides whether
to refund, cancel or take another payment. These roles are not yet assigned by
issue #83.

Use the exact deployment, environment and venue from the incident. Keep staging
and production diary, gateway, logs and Sentry destinations separate. Grant log
and diary access only to responders who need it. Keep the cross-reference to a
guest or payment in the restaurant's restricted incident system, never in GitHub,
analytics, public screenshots or Sentry context. Confirm log retention and an
export/drain with the deployment owner; ephemeral console output is not a
durable booking ledger.

## Server evidence

Search application logs for `Booking reconciliation observation` and
`Booking outcome needs reconciliation`. Collection does not depend on browser
analytics, consent, GA4 or PostHog delivery.

| Event | Meaning |
| --- | --- |
| `hold_requested` | One validated, rate-limit-admitted creation attempt, before the provider write. |
| `hold_accepted` | ResDiary returned a hold ID; joins `attemptId` to restricted `holdId`. |
| `hold_refused` | The provider returned a definite failure; its existing failure log owns diagnostic detail. |
| `hold_outcome_unknown` | Creation may have reached ResDiary, but no hold ID was received. This is not a booking or payment. |
| `hold_created`, `hold_changed` | A signed hold was created or updated. |
| `details_submitted` | Validated guest details are about to be submitted for the hold. |
| `confirmed` | The details operation or its recovery check received ResDiary confirmation. |
| `payment_required`, `card_required` | ResDiary requested a deposit or card guarantee; neither means payment was accepted. |
| `details_rejected` | The details operation returned a definite error, not an unknown outcome. |
| `outcome_unknown` | The details operation exhausted its recovery checks without establishing the result. |
| `status_confirmed`, `status_failed`, `status_cancelled` | The corresponding ResDiary status was observed. A failed reservation says nothing conclusive about payment. |
| `status_pending` | A submitted hold is still pending. |
| `status_unknown`, `status_unavailable` | An unrecognized status or failed read prevents reconciliation. |

If the first details submission has an unknown outcome, a failed retry does not
resolve it, even when the retry says the hold was not found. Keep the hold for
status recovery and emit `outcome_unknown` until an authoritative result is
available. Never invite another booking or payment based on the retry alone.

Creation attempts have a server-generated `attemptId`. Known holds have a
`correlationId`, an HMAC of the internal hold ID using `BOOKING_HOLD_SECRET`
with a separate reconciliation namespace. It is stable across requests, retries,
revisions and server instances using the same secret. Secret rotation changes
the correlation ID; investigate across the rotation using restricted `holdId`.
The raw hold ID stays in restricted application logs to join provider logs and
the diary. Reservation references, hold cookies, guest data and Stripe secrets
are not included in these observations. Sentry receives only the opaque
correlation ID, revision and event. This server ID is separate from #79's
browser `attempt_id`; never join them using guest information in analytics.

Count unique `attemptId` values for new hold attempts and unique `correlationId`
values for known holds. Hold reuse is not a new attempt. Count confirmations
once per hold across `confirmed` and `status_confirmed`; repeated polls and
duplicate responses are observations, not additional bookings. Keep revisions
and timestamps when reading the timeline, and resolve contradictory observations
by a fresh diary check rather than assuming log arrival order is authoritative.
Validated searches and invalid/rate-limited requests are not hold attempts.

## Triage

1. Open the Sentry event or guest report in the correct environment. For an
   alert, search restricted logs for its `correlationId`, then use the matching
   `holdId` to find the provider calls and diary record. A guest may instead
   supply the reservation reference directly to authorized restaurant staff.
2. Read the reservation's current status and intended Dublin date/time, party
   size and payment/deposit state in ResDiary. Check the correct restaurant
   payment account separately for a succeeded, pending, failed or absent
   PaymentIntent, or the corresponding SetupIntent for a guarantee. A saved card
   is not a deposit. Do not infer a charge from `payment_required`.
3. If ResDiary confirms the reservation, the duty manager confirms it to the
   guest after checking the actual details. An email's presence or absence does
   not override the diary; email delivery ownership remains #97.
4. If money was taken and the reservation is absent, failed, cancelled or still
   pending, retain the case as unresolved and escalate to the duty manager,
   payment operator and ResDiary support. Do not resubmit guest details, create a
   replacement booking, charge again or use read-then-cancel to resolve it.
   Agree the remedy with the restaurant after both systems are checked.
5. If either system cannot be read, keep the case open. Record the next check
   time and a named responder. An expired website cookie or missing log is not
   proof that the reservation or payment failed. A lost creation reply has no
   known hold mapping; use restricted provider request logs and the time window,
   and let an untouched hold expire rather than guessing an ID.
6. Close the restricted case only with the verified diary/payment result,
   authorized resolution, responder and timestamp. Store safe release evidence
   as environment, exact candidate, scenario, observed result and remaining
   limits; keep guest and payment identifiers out of the public ticket.

## Alerts and daily checks

`outcome_unknown`, `status_unknown` and `status_unavailable` emit a stable Sentry
message tagged `bookingReconciliation=required`. The deployment owner must
configure an issue alert for that tag in the intended project, route it to the
agreed responder and backup, and verify receipt. Use a notification interval
that groups repeated reads of the same incident; do not route by a high-cardinality
correlation tag. Sentry's deployment/DSN gates still apply; a local call to the
SDK is not evidence of hosted delivery. See the [Sentry guide](sentry-guide.md).

During service, the duty manager and engineering responder review submitted
holds without a recorded confirmation, especially `payment_required`,
`card_required`, failed/cancelled statuses and unknown outcomes. Compare them
with the diary and gateway even when no alert arrived. A guest can close the
browser before a status request, and a successful payment can finalize without
another application request. There is no background poller, payment webhook or
automatic settlement feed in this change. Logs alone cannot detect every such
outcome, prove the number of payments, or establish complete revenue totals.

## Release verification

On the exact deployed sandbox candidate, compare the logs with the test diary
and payment account for no-fee confirmation, deposit, card guarantee, decline,
lost guest/payment reply, delayed confirmation, reload and abandoned browser.
Use authorized synthetic guests and test-mode payments, and follow the existing
sandbox cleanup procedure. Verify a real alert reaches the assigned owner.
Controlled provider tests establish application behavior; they do not satisfy
this deployed sandbox comparison or production acceptance.

Before closing #83, record the candidate commit, deployment, scenarios and
actual diary/payment/alert results, confirm retention and incident ownership,
and identify unresolved cases. The connected booking UI must be integrated
before claiming complete website coverage; current `dev` still has the design
preview while PR #75 is pending.
