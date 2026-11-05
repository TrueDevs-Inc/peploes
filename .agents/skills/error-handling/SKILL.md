---
name: error-handling
description: Handle expected failures, exception boundaries and retries without exposing internal details.
---

# Error handling

Find the existing error types, result helpers and boundary owners before changing error handling. Reuse them; avoid another error framework.

Expected validation, authorization and provider failures should reach the caller as typed results. Catch throwing dependencies where they enter the application. Return a safe message. Redact causes and stack diagnostics before server-side storage, logging or exception capture; server-only data is not automatically safe. A framework-required throw is an explicit boundary, not ordinary domain flow.

Authenticate before protected work. Check authority over the requested resource, not just the existence of a session. Preserve distinctions callers need, such as denied, absent, conflicting and temporarily unavailable.

Capture an unexpected exception once at the boundary that owns it. Do not repeat the same event in the provider, service, action and route. Custom messages and attached context must not contain guest fields, credentials, tokens or payment data.

Retry only a transient failure whose repeated operation is safe. Never infer non-submission from a timeout, and never retry a write without defining its duplicate behavior. Check recovery and the next allowed user action, using the smallest relevant existing test.
