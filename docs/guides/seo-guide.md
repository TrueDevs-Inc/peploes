# SEO

The starter provides Next.js metadata, factual structured data, crawler policy,
a sitemap, and `llms.txt`. Replace its public site facts before launch.

The browser favicon is `src/app/icon.svg`, which embeds the original 32×32 PNG from
`https://peploes.com/media/sqekby2f/peploes_fav.png?width=32&height=32`.
A 7px clipping radius rounds its corners. Next.js includes it through the root
app icon file convention.

## Site URL and defaults

`NEXT_PUBLIC_SITE_URL` supplies canonical and sitemap URLs.
`DEFAULT_SEO` in `src/lib/constants.ts` owns the site name, description, title
suffix, locale, and social handle.

`buildSeoMetadata()` in `src/lib/seo/metadata.ts` creates titles, descriptions,
canonical URLs, Open Graph fields, Twitter cards, and robots directives.

Use page metadata that describes the rendered page. Canonicals should resolve
to the public URL and use one trailing-slash policy.

## Structured data

`JsonLd` serializes a schema and escapes `<` before placing it in a script tag.

The root layout emits one linked graph from `getSiteGraph()`: an `Organization`
(`/#organization`) and a `WebSite` (`/#website`) whose `publisher` points at the
organization by `@id`. The organization carries only facts the site already
states: name, URL, telephone and email from `RESTAURANT_CONTACT`, and the postal
address from `RESTAURANT_ADDRESS`. It has no logo because the only logo asset is
a white wordmark. It does not claim site search, opening hours, cuisine, price
range, social profiles, ratings or coordinates. Add a fact to the graph only
after it exists in constants or CMS content.

The home page sets its own title, description and social image with
`buildSeoMetadata()`. It declares the image's real width and height.

BreadcrumbList data is emitted without visible UI on the three private dining
sub-pages (Home, Private Dining & Events, page) and on indexable What's On entries
(Home, What's On, entry) through `getSectionBreadcrumbSchema()`. Menu pages show
a visible trail (Menus, then the selected menu) through the `Breadcrumbs`
compound, which keeps the navigation and BreadcrumbList data aligned. Use it
when a page has a visible trail.

`getSeasonalBreadcrumb()` returns the What's On breadcrumb, and nothing while
the entry is `noIndex`. Event markup is not emitted: the CMS has no venue field,
so the location would be a guess.

Put product-specific schema beside the feature whose visible content it
describes.

## Robots and sitemap

Outside the live site (`isLiveSite()` false: Vercel previews and local development),
`robots.txt` allows crawling and every response carries `X-Robots-Tag: noindex`
(`next.config.ts`) while page metadata is `noindex`. `next.config.ts` cannot
import `src/lib/env.ts`, so it repeats the `isLiveSite()` rule; change both
together. A robots.txt block would
stop crawlers from seeing the noindex signal and does not reliably keep a URL out
of search; see [Block search indexing](https://developers.google.com/search/docs/crawling-indexing/block-indexing).
The route is prerendered, so `VERCEL_ENV` must be present at build time, which
Vercel guarantees per deployment. On the live site (the Vercel production
deployment, or a production build outside Vercel) the policy has three groups in `AI_CRAWLER_POLICY`:

- Search crawlers can index public pages.
- Training-only crawlers cannot crawl.
- Mixed-use crawlers remain allowed because the same token may cover model
  training, grounding, open datasets, or downstream search.

Review the mixed-use choice with the product owner. Blocking it may reduce AI
discovery; allowing it permits uses beyond search. Keep provider tokens in the
constant rather than repeating them in documentation. Robots rules are public
guidance, not authentication or authorization. When a project adds private
routes, enforce access on the server, prevent shared caching, and exclude those
routes from public discovery. Use non-indexing response headers and metadata
where appropriate; crawler directives alone do not protect private content.

`src/app/sitemap.ts` contains the home page, Our Story, What’s On, all seven
query-selected menu URLs, the four private dining pages, the policy pages and
Visit & Contact, plus the Journal hub and published (not `noIndex`) What's On
entries and Journal articles. Journal articles use their CMS update time for
`lastModified`. Add public canonical pages when they exist. Use a content update time for `lastModified`;
omit it when the application has no trustworthy value.

Entries stay `noIndex` by default in the CMS. They are excluded from the
sitemap, `llms.txt` and structured data until an editor publishes them.

## Agent discovery

`src/app/llms.txt/route.ts` serves Markdown built by `buildLlmsText()` in
`src/lib/seo/discovery.ts`. It lists the site name and description, the public
pages (home, What's On, Our Story, Journal, Visit & Contact), the seven menus and
the four private dining pages, each with the description from its own page metadata, then
published What's On entries labelled by kind with their dates, then the sitemap
and robots links. The route handler renders per request, reads the cached CMS entries, and sets a one-hour CDN `Cache-Control` header. If the CMS fails it serves the
static sections with `no-store`, so the fallback is not cached. `/book-a-table` is left out while it is `noindex`. The root layout points agents to it with `rel="describedby"`.

Add a public page to `llms.txt` only when the URL exists and its description
matches the page. Do not copy the sitemap, claim unsupported features, or treat
`llms.txt` as a ranking signal.

## Streaming metadata and AI fetchers

For dynamic pages Next streams `generateMetadata` output into `<body>` after
the first HTML. Browsers and Googlebot, which run JavaScript, handle this.
Fetchers that do not run JavaScript would miss the title, canonical and Open Graph
tags. Next's default `htmlLimitedBots` list covers Google, Bing, Apple and social
preview agents only. It omits GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot,
Claude-SearchBot, Claude-User, PerplexityBot and Perplexity-User.
`next.config.ts` extends the default with `HTML_LIMITED_AI_FETCHERS`
(`src/lib/constants/crawlers.ts`, derived from `AI_CRAWLER_POLICY` plus the
user-triggered fetchers) so they receive metadata in `<head>`. `crawlers.ts`
has no imports so that `next.config.ts` can load it. Setting the option
replaces Next's list, so the config reuses Next's default expression from a
private Next path. A test in `security-headers.test.ts` fails if an upgrade
changes it.

## Pending owner decisions

Not implemented because they need facts or choices from the owner: Restaurant
schema (confirmed hours, cuisine, price and coordinates), Event markup (needs a
confirmed venue), an Organization logo asset, Sanity SEO fields for menus and
private dining, IndexNow and Search Console, and FAQ content. The footer and
Visit opening-hours table already share `RESTAURANT_OPENING_HOURS`. Dining-service
times remain separate from building opening hours. The footer social profiles
are recorded in the project brief; crawler policy is implemented above. Menu
breadcrumbs are already visible.

## Social images

Set a real Open Graph image and alt text for public pages. If the project adds a
generated image route, test its fonts, dimensions, cache behavior, and failure
path. Add any remote image origin explicitly to both Next image configuration
and the CSP.

## Review checklist

- Titles and descriptions match visible content.
- Canonical URLs point to the public deployment.
- Preview deployments send `X-Robots-Tag: noindex` and are not blocked in robots.txt.
- JSON-LD contains real names, URLs, images, prices, and dates.
- Sitemap contains canonical public pages only.
- Search, training, and mixed-use crawler rules match product policy.
- `llms.txt` links resolve and describe current public content.
- Social previews render with the deployed image.
- Rich Results Test and schema validation report no relevant errors.

SEO does not require every page to emit every schema. Accurate, small metadata
is better than a large graph of invented facts.

## References

- [OpenAI publisher crawler controls](https://help.openai.com/en/articles/12627856-publishers-and-developers-faq)
- [Anthropic crawler controls](https://privacy.anthropic.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler)
- [Perplexity crawler controls](https://docs.perplexity.ai/docs/resources/perplexity-crawlers)
- [Google AI crawler controls](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers)
- [Common Crawl CCBot controls](https://commoncrawl.org/ccbot)
- [`llms.txt` proposal](https://llmstxt.org/)

## Release verification for #80 on 4 November 2026

Source revision: `a3b3b8d99f0660ae75c907e1ba731612983e30cd` on integrated
`dev`. This is a code and public-response audit, not owner approval or proof
that this revision is deployed.

The [current official site](https://peploes.com/) returns HTTP 200 and declares
`https://peploes.com/` as canonical. `https://www.peploes.com/` redirects there
with HTTP 301. It publishes the same street address, phone and email as the
application constants. Its footer opening and dining-service times match the
application's separate opening-hours and dining-service lists. These published
facts corroborate the implementation; the project brief still requires the
restaurant to confirm them before launch. Exact closing times for "Late",
bank-holiday exceptions, cuisine, price range and approved coordinates remain
unconfirmed for Restaurant schema. Do not convert "Late" to an invented time.
The brief records the footer Instagram and Facebook links as taken from the
official site. Approval of replacement social artwork and a logo visible on
white remains a launch check.

Public staging responses from `https://peploes-fork.vercel.app/` returned HTTP
200 and both `X-Robots-Tag: noindex` and `noindex, follow` page metadata.
Its robots file permits crawling, so crawlers can read the noindex directive.
Its sitemap returned 19 entries, excluded Book a Table, and used
`https://peploes-fork-staging-msf.vercel.app` throughout. The home canonical and
absolute social-image URL also used that older staging alias. This was consistent
with a hosted `NEXT_PUBLIC_SITE_URL` discrepancy with the intended staging URL;
it did not establish a hardcoded production-origin defect. Gina's production
project must use her approved production origin, never either staging alias.
The audit corrected only the Preview `NEXT_PUBLIC_SITE_URL` in Salman's
`msf-projects/peploes-fork` project to `https://peploes-fork.vercel.app`.
No local environment file changed. The only other hosted change was the staging
alias assignment below. The existing manual staging snapshot was rebuilt as
`dpl_8TW3hJEVBuFAEDUtUtZ4JSkH43eH`, READY in `dub1`, from
`dpl_6oAt3T8i8BbSt3d9W2uWbWq8MT4r`. The stable staging alias was then
assigned to that replacement and its mapping verified through Vercel. Public
GETs returned 200 for home, robots, sitemap and the social PNG. The canonical,
social image and all 19 sitemap entries now use `https://peploes-fork.vercel.app`;
noindex headers remain present. This is a rebuild of the same manual source
snapshot, not deployment of the integrated `dev` revision. The project Git
connection actually targets `salman-farooqi/peploes-fork` on `main`, not the
organization repository on `dev`. That connection was not changed.

The application emits linked Organization and WebSite data, not Restaurant or
Event claims. Event location has no confirmed CMS field. Keep those richer
types pending real owner facts. Search Console ownership, sitemap submission,
URL inspection, deployed Rich Results validation and actual social-platform
preview rendering were not verified. The public official site is still the
legacy application, so its markup cannot prove this Next.js release is live.

Issue #80 must stay open until the owner facts and hosted checks above are
satisfied. Code checks alone cannot supply those approvals.

Local verification on that revision passed 27 tests across
`src/__tests__/app/robots.test.ts`, `src/__tests__/lib/seo-discovery.test.ts`
and `src/__tests__/lib/seo-structured-data.test.ts`, plus 16 tests in
`src/__tests__/config/security-headers.test.ts`, using `bun run test` with those
paths. These cover crawler policy, preview metadata/header gating, discovery
route alignment, truthful linked schema and serialization. `bun run lint` and
`git diff --check` passed. No application code changed; a full build and browser
suite were not required for this documentation correction. Public-response
checks used HTTP GET for the home page, robots and sitemap and HTTP HEAD for
the www redirect. They do not prove Search Console receipt or social rendering.

Standards and spec reviews found no remaining issue in this documentation
change after adding the check results and qualifying the inferred configuration
cause. Owner and hosted acceptance gaps remain as stated above.

`bun run type-check` initially failed because this new checkout lacked Studio
dependencies. After installing both committed lockfiles, it passed for the
application and Studio. No checks were disabled.
