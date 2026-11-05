# Hero action sizing verification

Verified on 4 November 2026 for [issue #129](https://github.com/TrueDevs-Inc/peploes/issues/129).

The desktop hero actions previously measured 156 by 44 pixels and 136 by 44
pixels. Both now measure 156 by 44 pixels. Phone actions retain equal full widths
and 44-pixel heights. The existing browser sizing test failed on the unequal
widths before the fix and passes with the fix.

Screenshots were captured from the production browser-test build with local CMS
fixtures. The phone capture uses a 390-pixel viewport, mobile touch emulation and
device pixel ratio 3. Captures use reduced motion. Independent visual review also
checked 320, 1280, 1366, 1440 and 1920-pixel widths in light and dark schemes.

- [Desktop hero actions](https://raw.githubusercontent.com/TrueDevs-Inc/peploes/5817c2f2583082e716c504b4f44b28046b0256ab/docs/reports/issue-129/hero-buttons-desktop.png)
- [Phone hero](https://raw.githubusercontent.com/TrueDevs-Inc/peploes/5817c2f2583082e716c504b4f44b28046b0256ab/docs/reports/issue-129/hero-phone.png)
- [Existing cellar wording](https://raw.githubusercontent.com/TrueDevs-Inc/peploes/5817c2f2583082e716c504b4f44b28046b0256ab/docs/reports/issue-129/cellar-wording.png)

The last image records the decision for [issue #131](https://github.com/TrueDevs-Inc/peploes/issues/131):
"cellar" is the correct word for wine storage, so the existing wording and its
Food & Wine journal destination are retained. No spelling change was necessary.

These are local verification artifacts. They do not establish deployment or
coverage of browser engines other than Chromium.
