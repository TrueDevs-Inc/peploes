# Diary introduction alignment

Issue: [#146](https://github.com/TrueDevs-Inc/peploes/issues/146).
Baseline: `783e2b6cd310f7903c647f4518852cee65a5c841`.
Verified locally on 4 November 2026.

The desktop paragraph center was 18px above the heading center because the eyebrow participated in vertical centering. The eyebrow now occupies its own grid row and the heading and paragraph share a centered row. The paragraph retains its 530px maximum width and the phone layout remains stacked.

## Evidence

- [Desktop before](https://raw.githubusercontent.com/TrueDevs-Inc/peploes/5817c2f2583082e716c504b4f44b28046b0256ab/docs/reports/issue-146/desktop-before.png)
- [Desktop after](https://raw.githubusercontent.com/TrueDevs-Inc/peploes/5817c2f2583082e716c504b4f44b28046b0256ab/docs/reports/issue-146/desktop-after.png)
- [Phone before](https://raw.githubusercontent.com/TrueDevs-Inc/peploes/5817c2f2583082e716c504b4f44b28046b0256ab/docs/reports/issue-146/phone-before.png)
- [Phone after](https://raw.githubusercontent.com/TrueDevs-Inc/peploes/5817c2f2583082e716c504b4f44b28046b0256ab/docs/reports/issue-146/phone-after.png)

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
  cover diary heading alignment, photograph loading/overflow, and diary/booking destinations
  at 1440px, 390px and 320px: 9 passed. A temporary config used port
  3123 and captured these images; the completed build was reused.
- An initial parallel route run hit a timeout in an unchanged homepage navigation journey and was interrupted.
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
