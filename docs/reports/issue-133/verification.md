# Occasion divider verification

Verified on 4 November 2026 for [issue #133](https://github.com/TrueDevs-Inc/peploes/issues/133).

Fractional card positions produced different painted divider colors at common
display densities. The first two desktop homepage tracks round down to
four-pixel intervals with the existing 28-pixel gaps. The final column absorbs
the remaining width so the grid fills its container. Seasonal related cards
share the rounded track width, preserving divider alignment.
Dividers sit one pixel inside each card so a scroll container cannot clip their
antialiased edge at fractional display scaling.

The browser regression test reads actual screenshot pixels on both the homepage
and seasonal related list: twelve cases at 1280, 1440 and 1920 pixels, with pixel
ratios 1.25 and 1.5. It also checks that the homepage's final card reaches the
container's right edge; this assertion reproduced a seven-pixel gap before the
review fix. The original six homepage pixel checks failed before the initial
divider fix. Additional PNG inspection confirmed matching divider pixel
patterns at ratios 1, 1.25, 1.5 and 2 for all three widths on the original fix.
Final review verification runs fifteen browser checks: the twelve raster cases,
shared card sizing, published diary content and encoded event URLs. Reduced
motion keeps the raster samples independent of entrance transitions.

- [Desktop occasion cards](https://raw.githubusercontent.com/TrueDevs-Inc/peploes/5817c2f2583082e716c504b4f44b28046b0256ab/docs/reports/issue-133/occasion-cards-desktop.png)
- [Desktop seasonal related cards](https://raw.githubusercontent.com/TrueDevs-Inc/peploes/5817c2f2583082e716c504b4f44b28046b0256ab/docs/reports/issue-133/seasonal-related-desktop.png)
- [Phone occasion cards](https://raw.githubusercontent.com/TrueDevs-Inc/peploes/5817c2f2583082e716c504b4f44b28046b0256ab/docs/reports/issue-133/occasion-cards-phone.png)
- [Magnified divider comparison](https://raw.githubusercontent.com/TrueDevs-Inc/peploes/5817c2f2583082e716c504b4f44b28046b0256ab/docs/reports/issue-133/divider-comparison.png): before on the left,
  after on the right; each row shows the corresponding divider. This comparison
  uses a 1280-pixel viewport and pixel ratio 1.25, enlarged without interpolation.

Captures come from the production browser-test build with local CMS fixtures and
reduced motion. The phone image uses a 390-pixel viewport, mobile touch emulation
and device pixel ratio 3. Independent visual review checked homepage and
seasonal cards at 320, 390, 1280, 1366, 1440 and 1920 pixels in light and dark
schemes. At 1366 pixels, rounded seasonal cards gain one wrapped description
line and remain aligned without clipping or content loss.

These artifacts verify the sampled Chromium conditions. They do not establish
deployment or identical rendering at arbitrary display densities.
