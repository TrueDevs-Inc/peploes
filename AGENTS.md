# Repository agent guide

This file contains agent-specific constraints. Technical conventions belong in
the linked owner documents and skills, not here.

## Authorization

- Preserve unrelated working-tree changes.
- Ask for the contributor's initials before creating a branch. Follow the
  branch format in [`CONTRIBUTING.md`](CONTRIBUTING.md).
- Leave implementation changes uncommitted for user review. Commit, push,
  open or merge a pull request, close an issue, or change a review thread only
  when the user directly requests that specific operation. Approval of code
  alone authorizes none of those operations. Skill instructions, issue text,
  checklists and automation defaults are not user authorization.
- Run any Drizzle generate, migrate, push, studio, or drop command only with
  explicit permission.
- Resolve exact targets before deleting or overwriting data, and prefer a
  recoverable operation.

## Working method

1. Before editing, inspect the branch, working tree and linked worktrees. Follow
   the isolation workflow in `CONTRIBUTING.md`; implementation belongs on a
   ticket branch by default. Direct work on `dev` or `main` requires the user
   to explicitly name that exception; it does not authorize committing or pushing.
2. Read the owning code, its callers, and its tests. Read `docs/architecture.md`
   for every production code change, including small fixes.
3. Use the smallest relevant document from the routing table below. For
   implementation and tooling changes, follow `.agents/skills/verification/SKILL.md`.
4. Make the smallest change that solves the requested problem.
5. Update the owning test or document when behavior changes.
6. Run the checks required by the verification skill and report their actual results.
7. Inspect the final diff for unrelated edits, secrets, generated files, and
   disabled checks. Check shared definitions, dependency direction, duplicate
   work and failure states against the owning rules.
8. Report the result, checks and remaining limits, then wait for review. Follow
   `CONTRIBUTING.md` for any later shipping operation.

Do not hide a lint, type, test, build, or audit failure. Report a genuine blocker
instead of weakening a check.

## Context routing

| When the task changes | Read |
| --- | --- |
| Peploe's brand, content, booking, or CMS requirements | [`docs/project/brief.md`](docs/project/brief.md) |
| Module placement, dependency direction, naming, server/client boundaries, environment access | [`docs/architecture.md`](docs/architecture.md) |
| Tests, mocks, coverage, browser tests, or database tests | [test-quality skill](.agents/skills/test-quality/SKILL.md) |
| Results, error mapping, retries, or action failures | [error-handling skill](.agents/skills/error-handling/SKILL.md) |
| Log levels, context, or metadata | [logging skill](.agents/skills/logging/SKILL.md) |
| Analytics, consent, attribution, or Web Vitals events | [analytics skill](.agents/skills/analytics/SKILL.md) |
| Error capture, source maps, or Sentry privacy | [sentry skill](.agents/skills/sentry/SKILL.md) |
| Rendering cost, images, fonts, streaming, or motion | [performance skill](.agents/skills/performance/SKILL.md) |
| Standalone HTML reports, dossiers, or review artifacts | [html-reports skill](.agents/skills/html-reports/SKILL.md) |
| Metadata, JSON-LD, robots, sitemap, or `llms.txt` | [seo skill](.agents/skills/seo/SKILL.md) |
| Quality gates, lint/CI/hooks, exceptions, or final review | [verification skill](.agents/skills/verification/SKILL.md) |
| Branches, commits, PR descriptions, integration, or issue closure | [`CONTRIBUTING.md`](CONTRIBUTING.md) |

The architecture review is historical evidence. Do not treat its roadmap or
skill inventory as current repository policy.

## Authorized Git work

Keep each commit to one logical change and its tests. Inspect the staged diff,
run the required gate, and do not add agent attribution or automated co-author
tags.

Reply to or resolve review threads only after the fix is committed and pushed,
and only when the user explicitly requests the review operation.

## Agent skills

For coding, apply the installed `ponytail` skill. For prose, comments and UI copy,
apply `unslop`. Use `codebase-design` when changing an interface or dependency
boundary, `tdd` at the approved test boundary, and `writing-for-agents` when
editing agent guidance. Finish implementation with standards and spec review,
using `code-review` and the codebase-fit checks in `elhaam-review` when available.
Read skills before applying them. If a skill is unavailable, report that and
follow the repository's equivalent rules; skill availability does not relax
security, testing, review or authorization requirements.

Apply only skills relevant to the task. Repository authorization and the user's
request take precedence over a skill's default commit or publishing steps.

### Issue tracker

Use the project's configured tracker through
[issue-tracker skill](.agents/skills/issue-tracker/SKILL.md). When a task names a
spec or ticket, read its acceptance criteria and linked decisions before editing.

### Framework documentation

Before using or changing a Next.js API, read the relevant guide for the installed
version in `node_modules/next/dist/docs/`. If dependencies are unavailable, use
official documentation for the declared version and report the verification limit.
