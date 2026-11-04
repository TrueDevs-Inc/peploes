# Occasion divider verification

Verified on 4 November 2026 for [issue #133](https://github.com/TrueDevs-Inc/peploes/issues/133).

Fractional card positions produced different painted divider colors at common
display densities. Desktop card tracks now round down to four-pixel intervals
with the existing 28-pixel gaps. Homepage and seasonal related cards share the
track width, preserving their matching layout.

The browser regression test reads actual screenshot pixels. All six cases at
1280, 1440 and 1920 pixels, with pixel ratios 1.25 and 1.5, failed before the fix
and pass afterward. Additional PNG inspection confirmed matching divider pixel
patterns at ratios 1, 1.25, 1.5 and 2 for all three widths. Thirteen seasonal
browser checks also pass, including shared card sizing and navigation.

- [Desktop occasion cards](occasion-cards-desktop.png)
- [Phone occasion cards](occasion-cards-phone.png)
- [Magnified divider comparison](divider-comparison.png): before on the left,
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
