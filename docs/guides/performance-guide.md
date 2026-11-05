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

Published Sanity content uses a five-minute data cache invalidated by the signed
publish webhook. Content loaders must allow prerendering rather than forcing a
request with `connection()`. Journal category selection stays in its existing
client list so the hub can be cached independently of query parameters. Journal
categories and the filtered story grid hydrate inside a local Suspense boundary;
the Journal hero and featured story are prerendered. Article
and event detail pages enter the route cache on their first visit. What's On
also revalidates its rendered page every five minutes so Dublin's current date
is refreshed even when no content is published. Time-based revalidation can
serve the previous page while it refreshes in the background.

Browser-test builds preload the isolated Sanity fixtures through `build:e2e`,
including during prerendering. Normal production builds require the configured
published CMS content. Never deploy a browser-test build.

Homepage menu links, navigation shelves, footer navigation and visible article
and event cards prefetch their full destination. Static pages keep Next's
default full prefetching. Journal category tabs keep prefetching disabled because
they update the existing client filter without a server navigation. Booking
availability requests retain their no-store policy.

Only Menus has a route loading boundary. Article and event detail pages resolve
their content before sending a response, so missing pages return HTTP 404
without an uncached CMS availability query in Proxy. Existing content stays
visible during an unprepared detail navigation; visible cards prefetch the full
destination before activation.

## Images and fonts

Use `next/image` for application images. Supply dimensions or `fill` with a
correct `sizes` value. Mark the actual largest-content image as high priority;
do not mark every image.

The Next.js 16.4.2 pin includes the fix for
[interrupted image requests hanging later requests](https://github.com/vercel/next.js/issues/98402)
in `next start`. Verify dependency upgrades with a cold image cache and the full
browser suite; a warm cache can conceal this failure.

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

Shared text buttons keep their underline transparent at rest and transition its color on hover, including on exit, using the same `--duration-base` and `--ease-organic` tokens as the arrow transition. Active navigation keeps a visible underline. Reduced motion disables the transition.

The Visit map address popup fades in and out with the shared base duration and organic easing. Its top pointer is anchored to the marker tip; the popup stays mounted until its closing animation ends. Reduced motion opens and closes it immediately.

Section links use native smooth scrolling when the visitor has no reduced-motion
preference. Reduced motion keeps instant scrolling. The root layout declares
`data-scroll-behavior="smooth"` so Next.js can keep route navigation instant.

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
