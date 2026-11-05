# HTML reports

Adapt each report's hierarchy to the reader's task. Existing reports under
`docs/reports/` are historical evidence; preserve their findings when changing
presentation and choose branding for the current project.
Read the installed `readable-html-dossier` skill when available.

## Reading and navigation

Start with the report's purpose, date, scope and evidence status. Separate
historical findings from current decisions. Put the conclusion and a route to
its evidence near the top. Avoid conflicting status badges or decorative metrics.

For long reports, use a persistent desktop contents rail with an active section
and a compact, keyboard-accessible contents disclosure on small screens. Include
a skip link and meaningful section anchors. Short reports need no sidebar.

Keep prose near 65 characters per line, with 16 to 18px body text and 1.6 to 1.75
line height. Use a restrained type scale, ample section spacing and consistent
alignment. Reserve cards for related information, callouts for decisions or
caveats, and tables for comparisons. Avoid enclosing every paragraph in a card.

## Visual system

Use CSS variables for both themes, spacing and recurring surfaces. Default to a
soft dark palette with a fully designed light alternative. Use one main accent;
reserve semantic colors for labeled status. Text must meet WCAG AA contrast.
Prefer quiet borders and flat surfaces over glow, ornamental gradients and
scroll-triggered entrance effects. Use system font fallbacks so the report does
not require network access to remain readable.

Reuse consistent buttons, badges, table treatments and evidence notes within a
report. Keep controls at least 44px high, with visible keyboard focus. Theme
controls must name their next action. Storage failure must not break controls.
Honor reduced motion. Add interaction only when it helps reading or decisions.

## Standalone behavior

Keep report content, styles and essential diagrams usable offline. Prefer
semantic HTML or inline SVG for small diagrams. If a rendering library is
necessary, include a readable fallback. Do not leave raw diagram syntax as the
only offline explanation. All findings and evidence must remain available with
JavaScript disabled.

Use scoped column headers. On narrow screens, show labeled rows when readers
can assess entries individually. If side-by-side comparison needs a wide table,
use a labeled, keyboard-accessible scrolling region. The document itself must not
scroll horizontally. Do not shrink table text to fit a phone. Print must use a
light palette, omit navigation and controls, retain evidence and expose
disclosure content. Preserve the reader's disclosure state after printing.

## Verification

Before delivery, inspect rendered desktop and narrow mobile views in both themes.
Check a viewport equivalent to 200% zoom, keyboard navigation, anchor targets,
wide tables, theme switching, reduced motion, offline/no-JavaScript reading and
print output. Check console errors and document overflow. Preserve historical
content when changing presentation. Report limitations rather than claiming an
accessibility certification from automated checks.

Store the finished report in `docs/reports/` and link to it. Keep reusable rules
here; reports are evidence artifacts, not policy owners. Do not add a report
framework or shared runtime unless actual maintenance needs justify one.
