---
name: analytics
description: Implement or review analytics event ownership, privacy, consent and conversion tracking.
---

# Analytics

Keep the starter's analytics consent fail-closed until a real consent decision is implemented. Load provider scripts and send events only after that decision permits them. Read the product's approved collection policy before changing it. Placeholder preference controls do not establish consent behavior or permission to change it. Keep account selection and owner mandates in the product's context, not reusable defaults.

Give page views and each conversion one owner. A redirect, button click or accepted payment does not prove a completed reservation or order. Emit success only from the authoritative outcome. Define duplicate behavior across retries, reloads and tabs, and record deduplication only after transport acceptance.

Use an explicit event/property allowlist and sanitize before every provider boundary. Exclude guest fields, booking references, card data, secrets, raw click IDs, query strings and bank-return URLs. Review SDK-added properties and automatic features too. A custom event sanitizer alone does not control the SDK's own collection.

Disable SDK page views, replay, autocapture or other features the product has not approved. Avoid duplicate page views from provider-side history measurement. Keep analytics failure from blocking the user journey; inaccessible storage and blocked scripts must be safe.

Treat provider keys exposed to the browser as ingestion settings, never account-read credentials. Isolate approved staging and live destinations. Intercepted payload tests prove application behavior; verify external receipt and account configuration separately when authorized.
