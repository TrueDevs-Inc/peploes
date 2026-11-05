---
name: verification
description: Select proportionate local checks and review evidence for a code change.
---

# Verification

## Local verification

For production code, dependencies, scripts, hooks or CI, run `bun run format` then `bun run ci` on the final implementation. Use focused checks during development and repeat affected checks after a later fix. Preserve unrelated edits when formatting. Persistence changes also need the relevant integration check; critical journeys need browser coverage when cheaper checks cannot prove them. Prose needs link, consistency and diff checks, not an application build. Render visual artifacts through their owning workflow.

Persistence checks require a migrated, disposable database. Verify the exact target before running them; never use a normal or shared database. Migration commands still require explicit permission.

Read the repository scripts and fixtures before choosing a command. Do not claim a runner can reuse a build when it always rebuilds. Use a supported focused entry point. The final gate remains required for implementation changes. Existing CI remains the shared integration gate.

Use the test-quality skill to decide whether a test earns its maintenance and runtime cost. Do not weaken checks to hide failure. A suppression needs a demonstrated tool limitation, narrow scope, reason and removal condition.

## CI changes

Keep pull-request workflows read-only, with disposable services and synthetic
credentials, bounded runtime and failures propagated. Pin external Actions to
reviewed full commit SHAs and disable persisted checkout credentials when no
push is needed. Never expose secrets to untrusted PR execution. Check script
and hook behavior as well as syntax; hooks must not format, stage or rewrite
files. A local hook bypass grants no permission to publish. Keep declared tool versions and frozen installs; review upgrade behavior and configuration together. Preserve the Verify job name and checks for stacked bases, dev and main. Do not weaken strict typing, warnings, tests, builds or audits to obtain a pass.

Owners should require PRs, Verify, resolved conversations and independent approval when available, dismiss stale approvals, and block force pushes and deletions on integration/release branches. When independent approval is unavailable, require explicit maintainer review and CI; self-review is not independent approval. These are intended settings, not enforcement installed by documentation. Verify live rules before claiming them.

## Review evidence

Review standards and requested behavior separately against the actual candidate. Report actual checks, failures, exclusions and environment limits. A local pass does not prove remote CI, external receipt or deployment. Keep temporary verification in the PR or tracker. Review approval grants no publishing permission.
