# Contributing

Keep a change narrow enough that a reviewer can state its purpose in one
sentence.

## Workflow

1. Follow the local setup in [`README.md`](README.md).
2. Read [`AGENTS.md`](AGENTS.md) for agent authorization, then
   [`docs/architecture.md`](docs/architecture.md) for every production code change.
3. Read the ticket's acceptance criteria, linked decisions and matching guide.
   Identify the behavior, affected callers and failure paths before editing.
4. Add only tests that protect the changed behavior, following the
   [testing guide](docs/guides/testing-guide.md).
5. Follow the [quality gate](docs/guides/quality-guide.md), inspect the final
   diff and report any incomplete acceptance criteria before requesting review.

Use a disposable local database. Never commit credentials. Review generated SQL
before applying it.

## Template adoption

The default workflow uses `dev` for integration and `main` for releases. When a
project uses only `main`, use it as the integration and PR target; there is no
separate promotion PR. Update the workflow triggers and protected destinations
in `.husky/pre-push` if the project adopts different branch names.

Keep the starter's fail-closed authentication until the project implements its
chosen session and authorization policy. Choose real site metadata, origins,
languages, data handling and deployment settings before launch. Follow the
[issue-tracker adapter](docs/agents/issue-tracker.md) for the project's tracker.
The template does not create live tracker configuration or enable GitHub rules.

## Ticket isolation and shipping

Give each active ticket its own branch and checkout. Use a Git worktree for
parallel sessions, with a separate database, port and origin where needed.
Inspect the branch, base commit and existing changes before editing. Keep a
before-edit comparison when continuing uncommitted work.

Start from integrated `dev` after dependencies merge. A stacked branch needs a
declared parent and merge order. Preserve uncommitted work when moving between
checkouts; never copy another session's partial work as an integrated baseline.
Ask for unknown contributor initials before creating a branch.

Implement, verify and review, then leave changes uncommitted for user review.

After review, execute only the shipping operations the user names. For example,
"commit and push" authorizes those operations, not a merge or issue closure.
"Looks good" approves the code but does not authorize Git or tracker writes.
Authorization already given for a named operation remains valid within its
stated scope; do not ask for it again at every step.
Report pushed work as awaiting integration. Close a ticket only after its work
is integrated and acceptance is verified, with an explicit closure request;
report any request to close earlier as a workflow exception before acting.

## Branches

Use `<type>/<initials>/<issue-number>-<kebab-case-description>` for tickets:

```text
feat/ab/123-contact-form
fix/cd/124-session-expiry
refactor/ef/125-data-boundary
perf/ef/126-image-loading
```

Use the contributor's own lowercase initials. Common types are `feat`, `fix`,
`refactor`, `perf`, `docs`, `test`, `ci`, `build`, and `chore`. A small maintenance
change without a ticket may use `<type>/<initials>/<description>`; name the
problem in its PR rather than inventing an issue number.

## Commits

Write `<type>: <imperative description>`, with an optional scope when it helps
identify the affected area, such as:

```text
fix: reject unauthenticated mutations
ci(hooks): preserve partially staged changes
```

One commit contains one logical change and the tests that prove it. Split work
when one specific message cannot describe the whole diff. Do not add automation
attribution or co-author tags.

Before an authorized commit, stage only the intended hunks and inspect
`git diff --cached`. Hooks check work without formatting or staging it. Format
before staging; if formatting touches unrelated work, preserve that work and
select the intended hunks again. A green working-tree check does not prove a
partially staged commit is correct.

## Pull requests

Use a PR for features, fixes, refactors, documentation and maintenance. Ticket
branches normally target `dev`; a release PR promotes integrated work from
`dev` to `main`. A stacked PR targets its declared parent until that parent
merges. Inspect the child's merge-base diff against `dev` before retargeting.
If the parent was squashed or rebased, replay only the child commits onto `dev`
so the PR does not repeat its parent's changes. Follow the published-rewrite
authorization below, then retarget and rerun checks. Confirm the actual base
and head before opening the PR.

Keep one independently reviewable outcome per PR, including its tests and
necessary documentation. Split unrelated cleanup or independent outcomes.
Keep a migration and the code that depends on it together when separating them
would leave a broken intermediate state. Explain an unusually large diff by
its dependency, not by an arbitrary line-count allowance.

Use draft status when publishing work for early feedback with known gaps. State
those gaps and the feedback needed. Mark ready only after the quality gate and
self-review pass. Creating a draft is still an externally visible operation
covered by the authorization rules.

### Title and description

Use the commit title format for PR titles. Name the resulting behavior, such as
`fix(auth): reject expired sessions`, rather than `fix review issues`.

Start from the [PR template](.github/pull_request_template.md). A small change
usually needs a few sentences and verification evidence. Include:

- The concrete problem and resulting behavior. Give a before/after example
  when it makes the change easier to assess.
- A plain issue reference such as `Refs #123`, the relevant acceptance criteria,
  and any dependency or deliberately deferred requirement. Link the governing
  decision instead of copying the whole spec.
- The approach or tradeoff a reviewer needs to judge. Mention affected callers
  or a review entry point only when the diff needs that guidance.
- Verification actually performed, with commands and outcomes. Distinguish
  local checks, remote CI, manual observations and checks not run.
- Material compatibility, security, schema, configuration, rollout or rollback
  effects. For visible changes, include relevant screenshots and the keyboard,
  language/direction and responsive states checked. Use synthetic data.

Remove unused sections and checkboxes. Omit file inventories, session history
and unrelated plans. Rewrite the title and body when scope changes.

### Issue links and completion

Use `Refs #123` by default. Closing keywords such as `Closes #123` authorize a
later automatic state change, so add them only when the user has requested
closure and merge will satisfy the ticket. Apply the same rule to commit and
squash messages. Never auto-close a parent spec from one completed slice.

GitHub processes closing keywords against the repository's default branch.
Check that setting before relying on automatic closure; a PR to `dev` may not
close anything. After authorized integration, verify the acceptance criteria
and then perform any separately authorized closure. Keep implementation,
integration and permission for real-world activation distinct.

### Review and merge

Review standards and acceptance criteria separately using the
[quality guide](docs/guides/quality-guide.md#review-evidence). Address correctness,
security, data-loss and missing-test findings before merge. Explain a disputed
finding with evidence from the relevant code or decision; an agent's confident
answer or a green CI run is not evidence of compliance by itself.

Before an authorized merge, verify the current head, intended base, latest CI
result, required approvals and unresolved conversations. Repeat affected checks
after a fix or conflict resolution. A previous approval does not cover new code
that changes the reviewed behavior.

Prefer squash merge for a ticket PR with working commits; keep a deliberately
structured commit series only when its history helps later investigation. Use
a merge commit for `dev` to `main` promotion so shared branch ancestry survives.
Inspect the final merge message for unrelated content, attribution and accidental
issue-closing keywords. Do not rewrite another contributor's published branch;
rewriting your own published branch requires explicit authorization and a lease
against the last observed remote head.

A direct merge or push to `dev` or `main` is an exception the user must request
explicitly. State the target and reason, run the same checks, and retain review
evidence. `ALLOW_PROTECTED_PUSH=true` bypasses the local destination guard for
that named push; it does not bypass checks, grant permission or override GitHub
rules. After merging, report integration separately from deployment. Delete a
branch or worktree only when requested and after checking for remaining work.

## Documentation

Update the document that owns the changed subject. Link to that document from
other places only when a reader needs a route to it; do not copy its rules or
inventories.

Code and configuration remain the source of truth for dependencies, scripts,
environment keys, and file inventories.

Write rules as a trigger, a concrete action and a checkable completion condition.
Use `must` for requirements and `prefer` for defaults with legitimate tradeoffs.
Give a non-obvious rule its reason. Add a new guide only when it has a distinct
owner and a route from an existing document. Remove stale rules when changing
the workflow. See the [quality guide](docs/guides/quality-guide.md) for enforcement
and exceptions.

## Review checklist

- The change has one clear purpose and runs in its own checkout.
- Existing helpers, controls and shared definitions were searched before adding equivalents.
- Shared policy has one owner; literals and private helpers stay local when they have one meaning and one consumer.
- Every changed file follows the relevant owner document, or has a documented reason to change that rule.
- Repeatable structural mistakes are covered by existing lint/type checks where practical.
- Public behavior and failure paths are tested at the lowest useful layer.
- The diff contains no secret, accidental generated output, or unrelated edit.
- Any migration or deployment effect is called out for the reviewer.

## References

- [GitHub: helping others review your changes](https://docs.github.com/en/pull-requests/concepts/helping-others-review-your-changes)
- [GitHub: linking pull requests and issues](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/linking-a-pull-request-to-an-issue)
