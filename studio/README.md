# Sanity Clean Content Studio

Congratulations, you have now installed the Sanity Content Studio, an open-source real-time content editing environment connected to the Sanity backend.

Now you can do the following things:

- [Read “getting started” in the docs](https://www.sanity.io/docs/introduction/getting-started?utm_source=readme)
- [Join the Sanity community](https://www.sanity.io/community/join?utm_source=readme)
- [Extend and build plugins](https://www.sanity.io/docs/content-studio/extending?utm_source=readme)

## Code generation dependency patch

PR [#14](https://github.com/TrueDevs-Inc/peploes/pull/14) removes the unpatched
`braces` dependency flagged by
[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
The version-scoped codegen overrides replace its Globby dependency with the
`tinyglobby` npm alias and its Chokidar 3 dependency with Chokidar 5. The Bun patch
adapts query discovery and watch mode to those APIs. `picomatch` is declared here
because the patched watcher uses it to match glob patterns, including deleted
and newly created files.

Keep the overrides and patch together. Install with the repository's declared
Bun version using `bun install --cwd studio --frozen-lockfile`. The codegen
compatibility tests run with the root `bun run test` command; the unchanged
Studio audit remains part of the quality gate.

Remove the patch, its overrides, and the direct `picomatch` dependency together
when an upstream codegen release removes both vulnerable dependency paths.
Before removing them, run the codegen tests, `bun run ci`, and a Studio dev-server
smoke test. No schema migration or content update is required for this patch.
