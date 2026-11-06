---
name: adr
description: Record a human's architecture or data-flow decision as a concise numbered ADR.
---

# ADR

Use `$adr` to record a meaningful change to module boundaries, dependencies,
data ownership or data flow. Routine source, style and copy edits need no ADR.
Before recording it, check whether code or an explanatory commit already
preserves the reason. Link that source instead of duplicating it. A previous
copy of the ADR itself in Git is not independent evidence.

Ask the human to describe the decision and why it was chosen, unless they have
already supplied that description. Wait for their words before creating a record.
Keep their wording; correct grammar and add only the minimum missing context.
Ask about any gap that would require inventing a reason or tradeoff.

Read existing `docs/adr/` records before creating or updating one. Update a record
only when its architectural decision meaningfully changes. Preserve the reason
for a previous decision when replacing it. Do not backfill ADRs from code alone.

From the repository root, save the human's description to a temporary UTF-8 file,
then create the record with:

```sh
bun run adr --slug booking-provider --description-file /tmp/decision.md
```

The first record in an empty folder is `docs/adr/ADR-001-booking-provider.md`.
Later records use the next available number; existing files are never overwritten. Use a short kebab-case slug.
The body should contain the decision, its reason and any material consequence
in the human's own words. Extra sections, dates and status fields are optional.
Show the resulting record to the human; invocation does not authorize committing
or publishing it.
