# Quality gates and review

This guide owns verification, tooling changes and review evidence.
[Architecture](../architecture.md) owns source conventions,
[testing](testing-guide.md) owns test selection, and
[CONTRIBUTING.md](../../CONTRIBUTING.md) owns shipping and PRs.

## Before implementation

Read the ticket and its linked decisions. Identify the observable result,
affected callers, failure states and governing documents. Choose the smallest
existing service, validator, UI or command interface that can prove the result.
Use the ticket's approved test boundary. Clarify a new boundary when it changes
the agreed scope; an existing approved boundary does not need repeated approval.

Search for equivalent behavior before adding a dependency, helper or shared
definition. When changing an interface, trace every caller and explain what
complexity the interface removes. The acceptance criteria are the stopping point
for scope, not permission to ignore a security or correctness defect in touched
code. Report unrelated findings separately.

## Required checks

For production code, dependencies, scripts, hooks or CI configuration, run
`bun run format`, then `bun run ci`. Run the relevant focused check during
development. Run the full gate on the final implementation, then repeat affected
checks after a later fix. Preserve other contributors' edits if formatting
touches files outside the change.

`bun run ci` checks formatting/lint, types, unit tests, the production build and
high-severity dependency advisories. It does not run database integration or
browser tests locally. Changes to SQL or persistence also need the relevant
integration check. When a derived application adds a critical journey, add its
production-build browser check as described in the [testing guide](testing-guide.md).
The starter has no browser suite until such a journey exists.

For prose-only changes, check changed Markdown links, rule consistency and the
diff. Render HTML, PDF or other visual artifacts with their owning workflow.
A build does not validate prose, YAML or shell syntax. CI and hook changes also
need checks of their executable behavior or syntax as appropriate.

Report each check as passed, failed or not run, with its reason and material
environment limits. Identify inherited failures using the before-edit baseline
when possible. If a gate stops early, downstream checks remain not run. A local
pass does not mean remote CI passed. Never describe an unchecked change as ready.

Database commands still require the permission in `AGENTS.md`. An approved CI
workflow applying migrations to its disposable service is not permission for an
agent to run them against a local or hosted database.

## Enforcement and exceptions

Prefer the existing compiler, Biome rules, database constraints and behavioral
tests over a custom checker. Add automation when it catches a repeatable failure
with useful diagnostics and few false positives. Demonstrate that a new rule
rejects a violating example and still accepts the intended pattern, including
any documented exception. Keep a regression test for custom control flow.

Lint warnings fail the gate. Keep `strict` TypeScript checking and the current
test/build/audit requirements. Do not add broad exclusions, disabled tests,
`continue-on-error`, unsafe assertions or silent fallbacks to obtain a pass.
Biome does not prove semantic reuse, authorization or transitive dependency
direction; reviewers must inspect those explicitly.

Use the smallest necessary suppression only for a demonstrated tool limitation
or required platform contract. Name the exact rule, reason and scope beside it.
A temporary workaround also needs a removal condition and an issue reference
when one exists. Describe changed exceptions in the PR. A recurring valid case
may justify changing the owner rule and configuration together, with evidence;
failing application code alone does not justify weakening either.

Biome owns formatting for the file types it supports. Use repository settings
in the editor and read-only lint in CI. Hooks must not format, stage or rewrite
files. They are local feedback and can be bypassed, so remote checks and branch
rules supply the integration gate. The push hook checks every destination ref,
including deletions and explicit `HEAD:dev` refspecs.

Keep tool versions tied to `package.json` and install the lockfile in CI. Before
upgrading a tool, inspect the installed version and relevant upstream changes,
test its effect, and update its configuration and exceptions together. Nursery
rules require particular attention on upgrades. Add no second formatter or
lint framework just to duplicate an existing check.

## CI and repository settings

Keep PR verification read-only with respect to GitHub and use disposable test
services and synthetic credentials. Workflows must fail on required checks,
have bounded execution time, and run for stacked PR bases as well as `dev` and
`main` in the default workflow. Adapt branch names during template adoption.
Keep the `Verify` job name stable if it is required by branch rules.

Pin external Actions to reviewed full commit SHAs and retain a version comment
for updates. Use the package manager version declared in `package.json` and
disable persisted checkout credentials when the job does not push. Keep secrets
out of untrusted PR execution. Review workflow permissions, external downloads
and dependency changes as executable code. These practices follow
[GitHub's secure-use guidance](https://docs.github.com/en/actions/reference/security/secure-use).

The repository owner should configure the project's integration and release
branches, `dev` and `main` by default, to require PRs, the `Verify` check and
resolved conversations, and block force pushes and deletions.
Require an independent approval when another maintainer can provide one; do not
claim self-review is independent approval. In a solo workflow, retain explicit
maintainer review and CI. Dismiss stale approvals when new changes need review.
Grant bypass access narrowly for the explicit exceptions in `CONTRIBUTING.md`.

These are intended GitHub settings, not settings this file installs. Verify the
live rules before reporting them as enforced. Account and repository features
can affect availability. See [GitHub's branch protection reference](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches).

## Review evidence

Review the actual candidate. For a committed branch, record the base and head
commits and inspect the merge-base diff. For uncommitted work, include tracked
and untracked files and compare against the captured starting state. Report the
scope so inherited changes are not silently attributed to the current session.

Keep the review results separate:

- Standards: check every changed file against its owning rules, existing
  implementations and callers. Inspect shared definitions, dependency direction,
  sensitive-data handling, failure behavior and repeated queries. Cite the rule
  and location for a violation; label a design preference as a judgment call.
- Spec: account for each acceptance criterion with code or verification
  evidence, or identify it as incomplete or blocked. Check missing behavior,
  unintended behavior and work outside the requested scope.

Use `code-review` for both axes and the codebase-fit checks from `elhaam-review`
when available. Adapt the comparison to uncommitted work; do not commit just to
make a review skill's default diff command work. Findings must identify the
problem, consequence and smallest correction. Fix findings within scope, rerun
affected checks and review the resulting diff before handoff.

Report remaining findings and limitations even when both automated checks and
review agents pass. Passing a review is not authorization to ship.
