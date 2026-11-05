---
name: performance
description: Investigate measured rendering, loading, image, data-fetching or motion performance problems.
---

# Performance

Start with a production build and a named slow user action. Measure its bottleneck before proposing a dependency, cache or abstraction. An empty local page or a warm cache is not representative evidence.

Trace related requests and callers. Start independent work together, keep dependent work sequential, and eliminate duplicate work only where the operations share meaning. Caching needs an acceptable stale window and an invalidation owner; do not invent either from framework defaults. After a successful mutation, revalidate the affected cached paths or tags so subsequent reads reflect the write.

Keep the smallest interactive boundary on the client. Reserve loading and image space so delayed content does not expose a footer or move controls unexpectedly. Load only genuinely costly optional features later; avoid splitting tiny components for its own sake.

Use platform image/font tooling and accurate responsive sizing. A cold image cache matters when checking optimizer upgrades; a warm one can hide a request-handling regression. Do not mark every image as the highest priority.

Prefer CSS transform/opacity motion and respect reduced motion. Verify the affected visible behavior without sampling private animation frames. Select checks through the verification skill, then record the measured before/after result in the PR. Never deploy a fixture-backed test build.
