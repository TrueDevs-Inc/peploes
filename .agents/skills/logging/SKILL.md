---
name: logging
description: Review or change application logging, levels, diagnostic context and redaction.
---

# Logging

Find the existing logger and context vocabulary. Reuse them instead of adding another logging abstraction or scattered console calls.

A log must help an operator diagnose an actual problem. Keep messages stable and put changing values in structured metadata. Choose the level by impact: diagnostics, normal operation, recoverable problem, failed operation or service-wide risk.

Log a failure once at its owning boundary. A caller mapping the same failure to a guest message does not need another log. Distinguish operational logging from exception capture; neither is required for every expected refusal.

Never attach passwords, tokens, cookies, session IDs, authorization headers, full form bodies, guest text, payment data or other private values. Review arbitrary error messages as well as metadata; a typed wrapper does not make its contents safe.

Use only identifiers permitted by the product's privacy policy. Bootstrap exceptions to the logger must remain narrow and have a concrete initialization reason. Verify that changed logs retain useful context without exposing sensitive values.
