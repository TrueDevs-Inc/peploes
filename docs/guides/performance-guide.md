# Performance

Start with the production build and real user measurements. A helper or package
without evidence adds work and can make the bundle worse.

## Existing defaults

`next.config.ts` enables typed routes, removes the powered-by header, configures
AVIF and WebP, and defines image sizes. It also asks Next to optimize imports
from several UI packages.

`next/font` loads Geist in `src/app/layout.tsx`. Tailwind and the motion styles
live in `src/app/globals.css`.

Remote images are disabled by default. Add only the exact hosts a project owns
or trusts, and keep the CSP image sources in sync.

## Server and client boundaries

Keep components on the server until they need state, effects, browser APIs,
context, or event handlers. Move the smallest interactive part to a Client
Component instead of marking a whole page as client code.

Server Components read through services. Do not call the app's own HTTP route
from a Server Component.

## Data fetching

Start independent requests together and await them together. Keep dependent
requests sequential. Avoid a generic batching layer when there is only one
call.

Use route or data caching only when the product can name the acceptable stale
window and invalidation event. Mutations should revalidate the affected path or
tag after a successful write.

## Images and fonts

Use `next/image` for application images. Supply dimensions or `fill` with a
correct `sizes` value. Mark the actual largest-content image as high priority;
do not mark every image.

Use `next/font` for project fonts. Remove unused weights and families. Do not
load the same font through CSS and `next/font`.

## Loading and code splitting

Use `Suspense` around work that can stream independently. The fallback should
reserve the final space to avoid layout shift.

Use a dynamic import for a large client-only dependency that is absent from the
initial view. Do not split a small component merely because it can be split.

Third-party scripts need an owner, a loading strategy, and a measured cost. Load
analytics according to the [GA4 guide](ga4-guide.md).

## Motion

Shared motion uses CSS and IntersectionObserver. Animate `transform` and
`opacity`. Respect `prefers-reduced-motion`. Avoid JavaScript animation
libraries until CSS cannot express a required interaction.

## Verification

```bash
bun run build
bun run test
```

Use the build output to find dynamic routes and large chunks. Use browser
performance tools on a production build with representative data. Track field
LCP, INP, and CLS after launch. A Lighthouse score from an empty local page is a
smoke check, not a performance budget.

Optimize the measured bottleneck and record the before and after result in the
pull request.
