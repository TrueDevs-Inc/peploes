# Transactional email

Issue #100 owns application email delivery. The private-dining enquiry is the
first caller. Reservation messages belong to ResDiary until #97 confirms a gap;
newsletter subscriptions belong to #88.

## Owners and configuration

The restaurant owner must approve the restaurant inbox, sender address and
display name, Reply-To address, copy, and staging test recipients before sending.
Use separate staging and production credentials and recipient lists. Store real
values in the deployment environment or ignored local settings, never in Git.
The Gmail connector used in chat is not an application credential.

`PREFER_SMTP` defaults to `true` when unset. The only accepted values are the
literal strings `true` and `false`. `true` selects Google Workspace SMTP;
`false` selects Resend. A missing selected-provider configuration is an error.
There is no automatic switch between providers. A provider change requires an
operator to change the deployment setting and verify existing delivery records.

SMTP requires `EMAIL_SMTP_HOST`, `EMAIL_SMTP_PORT`, `EMAIL_SMTP_USERNAME`,
`EMAIL_SMTP_AUTH_METHOD`, and the approved authentication credentials. For
`app-password`, set `EMAIL_SMTP_PASSWORD`; for `oauth2`, set
`EMAIL_SMTP_OAUTH_CLIENT_ID`, `EMAIL_SMTP_OAUTH_CLIENT_SECRET`, and
`EMAIL_SMTP_OAUTH_REFRESH_TOKEN`. The From address must match the authenticated
mailbox. The mailbox owner must confirm TLS port and authentication method.
Resend requires `EMAIL_RESEND_API_KEY` and a verified domain matching the same
approved From identity. Both paths require `EMAIL_FROM_ADDRESS`,
`EMAIL_FROM_NAME`, `EMAIL_REPLY_TO`, and `EMAIL_RESTAURANT_TO`.

The enquiry action requires `UPSTASH_REDIS_REST_URL`,
`UPSTASH_REDIS_REST_TOKEN`, and `EMAIL_RATE_LIMIT_SECRET`. It fails closed when
the limit cannot be checked. The current limit is three submissions per visitor
per hour. The rate key is an HMAC of the visitor address; it is not logged.

Outside `VERCEL_ENV=production`, sending requires
`EMAIL_STAGING_ALLOWLIST`, a comma-separated list of approved addresses. The
final send boundary checks To, CC, BCC, and Reply-To, and adds `[STAGING]` to
the subject. Set the staging restaurant destination and test guest address to
approved inboxes. Staging suppresses a guest Reply-To and uses the configured
Reply-To instead. `NODE_ENV=production` alone never grants live sending.

## Delivery records and recovery

The `email_deliveries` table stores an opaque ID, payload hash, template,
selected provider, status, and provider ID. It stores no recipient or message
body. The ID is stable for one notification, recipient set, and template
version. A second submission returns the accepted result or an unknown status
without sending. A definitely rejected attempt can be claimed again under its
original provider. Unknown outcomes and stale pending records require manual
provider reconciliation before any retry. Never change a row to rejected merely
because a timeout elapsed; the provider may already have accepted the message.
SMTP messages use a stable Message-ID based on the opaque delivery ID and the
approved sender domain. For an uncertain send, check the provider and approved
inbox for that ID before deciding whether it was accepted. A partial SMTP
response also stores the returned Message-ID. If receipt cannot be established,
leave the record unknown and contact the restaurant; do not replay it.
When the provider confirms a definite outcome, an operator may reconcile only
that exact delivery ID in the database: record acceptance, or mark a confirmed
non-submission rejected before retrying the unchanged notification. Review the
provider evidence and target row before the update; never infer non-submission
from elapsed time alone.
When a browser loses the action response, the form treats the outcome as unknown
and disables submission until the guest contacts the restaurant. An edited form
after a definite rejection starts a new notification ID; an unchanged retry
keeps the original ID and provider.

Acceptance by SMTP or Resend is not proof of inbox receipt. For launch, send
synthetic enquiries separately through each selected provider to approved
inboxes. Check received HTML and plain text, From and Reply-To, links, spam
placement, and SPF/DKIM/DMARC alignment. Record only pass/fail, environment,
opaque delivery ID, and provider ID in the issue. Do not put private headers,
guest messages, addresses, or credentials in tracker comments or diagnostics.

`/email-preview` renders the production templates with synthetic data outside
the live deployment. Gina signs off final copy and restaurant routing.
