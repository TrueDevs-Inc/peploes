# Dining-hour hierarchy

Issue: [#142](https://github.com/TrueDevs-Inc/peploes/issues/142).
Baseline: `783e2b6cd310f7903c647f4518852cee65a5c841`.
Verified locally on 4 November 2026.

Service labels and times previously used EB Garamond at 28px and 26px on desktop. Times now use DM Sans at 20px in the existing secondary text colour; headings retain EB Garamond at 28px. Phone labels and times retain 22px and 18px sizes with the same font distinction. All four services and their wording remain present.

## Evidence

- [Desktop before](https://raw.githubusercontent.com/TrueDevs-Inc/peploes/5817c2f2583082e716c504b4f44b28046b0256ab/docs/reports/issue-142/desktop-before.png)
- [Desktop after](https://raw.githubusercontent.com/TrueDevs-Inc/peploes/5817c2f2583082e716c504b4f44b28046b0256ab/docs/reports/issue-142/desktop-after.png)
- [Phone before](https://raw.githubusercontent.com/TrueDevs-Inc/peploes/5817c2f2583082e716c504b4f44b28046b0256ab/docs/reports/issue-142/phone-before.png)
- [Phone after](https://raw.githubusercontent.com/TrueDevs-Inc/peploes/5817c2f2583082e716c504b4f44b28046b0256ab/docs/reports/issue-142/phone-after.png)

Before captures use the baseline development build; after captures use the
production browser-test build with local synthetic CMS fixtures. Both use
Chromium, reduced motion, 1440px desktop and 390px phone viewports at device
pixel ratio 1. Captures are real rendered UI, scrolled below the sticky header
where relevant. The phone capture is 1000px tall to include section context.
Fixture event dates and content do not establish the live programme.

## Checks

- `bun run format` and `bun run ci`: passed, including 74 unit-test files,
  1,098 tests, application and Studio builds, and configured high-severity audits.
- Production build created through `bun run test:e2e`; final focused Playwright
  selection: `dining-hours-hierarchy.spec.ts` and the `Visit loads its image`
  check in `visit-contact.spec.ts`, at 1440px, 390px and 320px: 6 passed.
  A temporary config changed the port to 3120 and captured these images.
- An initial parallel browser attempt timed out waiting for offscreen service
  headings. The focused test now scrolls each service into view; lint and the
  final browser run passed. No timeout or check was weakened.
- Standards review and independent screenshot/spec review: no remaining findings.
  Screenshot dimensions, image loading, unchanged service text and horizontal
  overflow were checked. Existing Node/Vite warnings and advisories below the
  configured audit threshold remain. Database checks were not relevant or run.

These artifacts verify the local fix. The PR still awaits merge into `dev`
and deployment. Issue closure before merge is the user's explicit workflow
exception. Parent #20 remains open. No other browser engine or full-site
accessibility certification is claimed.
