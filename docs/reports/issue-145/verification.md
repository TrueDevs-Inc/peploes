# Direct desktop navigation

Issue: [#145](https://github.com/TrueDevs-Inc/peploes/issues/145).
Baseline: `783e2b6cd310f7903c647f4518852cee65a5c841`.
Verified locally on 4 November 2026.

Hovering Private Dining & Events previously displayed a shelf over the page. Menus and Private Dining & Events now render direct links without shelf content. Pointer and Enter navigation retain their existing destinations and active indicator. The phone accordion remains available and its Overview link reaches Private Dining.

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

The desktop after image shows the Private Dining link hovered without a shelf.
The phone before image shows the menu; the phone after image shows the Private
Dining destination reached through its retained accordion and Overview link.

## Checks

- `bun run format` and `bun run ci`: passed, including 74 unit-test files,
  1,098 tests, types, lint, application/Studio builds and configured audits.
- Production build through `bun run test:e2e`; final focused Playwright checks
  cover direct pointer/Enter navigation, absence of shelves, active indicators,
  phone accordion destinations and the separate seasonal menu: 13 passed across
  1440px, 390px and 320px. A temporary config used port 3122 and captured images.
- The first parallel browser attempt timed out in an unchanged menu-underline
  check and was interrupted. The next focused run exposed a mistaken selector
  in the updated seasonal journey: it opened group menus instead of seasonal
  menus. That test now follows Special menus to Set Christmas Lunch, including
  its section hash. The final run passed without weakening checks or timeouts.
- Standards and independent screenshot/spec review: no remaining findings.
  Target visibility, image dimensions and horizontal overflow were checked.
  Existing Node/Vite warnings and local advisories below the configured audit
  threshold remain. Database checks were not relevant or run.

These artifacts verify the local fix. The PR still awaits merge into `dev`
and deployment. Issue closure before merge is the user's explicit workflow
exception. Parent #20 remains open. No other browser engine or full-site
accessibility certification is claimed.
