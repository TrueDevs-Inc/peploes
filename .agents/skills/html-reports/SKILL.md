---
name: html-reports
description: Create or review accessible standalone HTML reports with readable offline evidence.
---

# HTML reports

Read the installed readable-html-dossier skill when available. Start with purpose, date, scope, evidence status and conclusion. Separate historical findings from current decisions. Preserve findings when changing presentation; existing reports are evidence, not policy owners.

Use semantic headings, meaningful anchors and a skip link. Long reports need a persistent desktop contents rail and a keyboard-accessible mobile disclosure; short reports need neither. Keep prose near 65 characters per line, body text 16–18px and line height 1.6–1.75. Use cards only for related information and tables for comparisons.

Use CSS variables, one main accent, system font fallbacks and WCAG AA text contrast. Default to soft dark with a complete light alternative. Controls need visible keyboard focus, at least 44px height and labels naming their next action. Storage failure must not break controls. Honor reduced motion and avoid ornamental entrance effects.

Keep content, essential diagrams and evidence usable offline and without JavaScript. Inline SVG or semantic HTML is enough for small diagrams; libraries need readable fallbacks. Use scoped table headers. On narrow screens, display labels for individually assessable rows so their context survives the layout change. Wide comparisons need labeled keyboard-accessible scrolling regions; the page must not overflow or shrink table text to fit.

Print in a light palette without navigation or controls, expose disclosures and preserve the reader's disclosure state afterward. Before delivery inspect desktop, narrow mobile, both themes, 200% zoom, keyboard navigation, anchors, wide tables, theme switching, reduced motion, offline/no-JavaScript reading and print. Check console errors and document overflow. Report limits, not an accessibility certification.

Store finished reports in docs/reports/ and link them. Do not add a shared report runtime without demonstrated maintenance need.
