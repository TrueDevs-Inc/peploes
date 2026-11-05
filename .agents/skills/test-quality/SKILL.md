---
name: test-quality
description: Review tests and accompanying docs for implementation coupling, duplicate coverage, and maintenance cost. Use when adding or reviewing tests, pruning brittle suites, or investigating test and documentation churn.
---

# Test quality

For each added or changed test, name the failure it catches and the public result
that proves it. Existing coverage can be enough. A changed source file does not
by itself require a new test or document.

## Earn the test cost

Test important user actions and costly failures. A complete order or booking
journey can justify an end-to-end test; clicking a button to inspect decorative
CSS does not. Browser and integration tests must name a critical failure that
cheaper existing coverage cannot catch, and justify their CI runtime and upkeep.
Use integration tests for real database or provider-boundary failures, not to
repeat unit coverage. Consolidate overlapping journeys.

## Select checks for the change

Select local checks using the [verification skill's Local verification section](../verification/SKILL.md#local-verification).

Always flag these patterns for removal from the PR:

- Exact decorative CSS values, font metrics, transform matrices, easing curves,
  animation frames or pixel-channel comparisons in functional tests.
- Tests that pause, finish or seek animations to assert their intermediate state.
- Assertions about private component state, DOM structure, internal helpers or
  framework transport/cache details when the requirement is user behavior.
- Mock call sequences that restate the implementation without proving a required
  external effect, cost, safety property or failure policy.
- Coverage duplicated at several layers without a different failure to catch.
- Docs that copy styles, file inventories, implementation walkthroughs or dated
  validation logs into maintained product requirements.

Explain what harmless change would break each flagged test. Remove the coupled
assertion or test in an authorized implementation task. During a read-only review,
request its removal; review permission alone does not authorize edits.

Preserve any useful behavior mixed into the test. Prefer clicks, keyboard actions,
URLs, visible content, accessible state and observable external effects. Keep
validation, consent, authorization, duplicate safety, delivery failures, focus,
reduced motion, clipping and overflow checks where they protect a real failure.
An external-call count is useful when it proves duplicate safety or bounded work.

A named visual-regression or performance requirement can justify a targeted check.
Require that explicit requirement, a stable measurement method and a reason the
cheaper behavioral check is insufficient. Flag it for review even then; do not
silently retain implementation coupling as the default. Do not discard security
headers, protocol contracts or cache invalidation checks merely because they are
technical. Judge the contract being tested.

Keep setup, operations, lasting decisions and product constraints in docs. Put
review evidence and temporary investigation in the PR or tracker. Do not add
another report to explain removing reports.

Report the failure protected, coupling found, smallest removal or replacement,
and remaining coverage. Do not use assertion counts or a grep score as proof of
quality. Read each candidate and its callers before deleting it.

Keep tests independent and deterministic. Prefer real local implementations; mock nondeterministic or unsafe external boundaries. Service-policy mocks do not prove SQL behavior. Run hook regression tests in temporary Git repositories, stub package-manager processes, and observe exit status, index and working tree. Never commit, push or mutate the contributor's real repository from a test.
