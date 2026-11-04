# Seasonal image-section spacing

Issue: [#147](https://github.com/TrueDevs-Inc/peploes/issues/147).
Baseline: `783e2b6cd310f7903c647f4518852cee65a5c841`.
Verified locally on 4 November 2026.

The terrace section previously touched the closing image banner with a 0px gap. A 48px warm-cream gap now separates them, matching the diary section's existing block spacing on desktop and phone.

## Evidence

- [Desktop before](desktop-before.png)
- [Desktop after](desktop-after.png)
- [Phone before](phone-before.png)
- [Phone after](phone-after.png)

Before captures use the baseline development build; after captures use the
production browser-test build with local synthetic CMS fixtures. Both use
Chromium, reduced motion, 1440px desktop and 390px phone viewports at device
pixel ratio 1. Captures are real rendered UI, scrolled below the sticky header
where relevant. The phone capture is 1000px tall to include section context.
Fixture event dates and content do not establish the live programme.

## Checks

- `bun run format` and `bun run ci`: passed, including 74 unit-test files,
  1,098 tests, types, lint, application/Studio builds and configured audits.
- Production build through `bun run test:e2e`; final focused Playwright checks
  cover terrace-to-banner spacing and photograph loading/overflow
  at 1440px, 390px and 320px: 6 passed. A temporary config used port
  3124 and captured these images; the completed build was reused.
- An initial broader route run was interrupted to reduce browser concurrency.
  Final focused checks passed without changing timeouts or weakening checks.
- Standards and independent screenshot/spec review: no remaining findings.
  Image dimensions, loading, target alignment/spacing, phone wrapping and
  horizontal overflow were checked. Existing Node/Vite warnings and local
  advisories below the configured audit threshold remain. Database checks
  were not relevant or run.

These artifacts verify the local fix. The PR still awaits merge into `dev`
and deployment. Issue closure before merge is the user's explicit workflow
exception. Parent #20 remains open. No other browser engine or full-site
accessibility certification is claimed.
