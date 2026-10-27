# SEO

The starter provides Next.js metadata, factual structured data, crawler policy,
a sitemap, and `llms.txt`. Replace its public site facts before launch.

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
(Home, What's On, entry) through `getSectionBreadcrumbSchema()`. Menu pages have
no breadcrumb because `/menus` redirects to Lunch, so the parent is not a real
page. Use the `Breadcrumbs` compound when a page has a visible trail; it keeps
the navigation and BreadcrumbList data aligned.

`getSeasonalBreadcrumb()` returns the What's On breadcrumb, and nothing while
the entry is `noIndex`. Event markup is not emitted: the CMS has no venue field,
so the location would be a guess.

Put product-specific schema beside the feature whose visible content it
describes.

## Robots and sitemap

Outside the live site (`isLiveSite()` false: Vercel previews and local builds),
`robots.txt` allows crawling and every response carries `X-Robots-Tag: noindex`
(`next.config.ts`) while page metadata is `noindex`. A robots.txt block would
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
menu pages, the four private dining pages, the policy pages and Visit & Contact,
plus published (not `noIndex`) What's On entries. Add public
canonical pages when they exist. Use a content update time for `lastModified`;
omit it when the application has no trustworthy value.

Entries stay `noIndex` by default in the CMS. They are excluded from the
sitemap, `llms.txt` and structured data until an editor publishes them.

## Agent discovery

`src/app/llms.txt/route.ts` serves Markdown built by `buildLlmsText()` in
`src/lib/seo/discovery.ts`. It lists the site name and description, the public
pages (home, What's On, Our Story, Visit & Contact), the seven menus and the four
private dining pages, each with the description from its own page metadata, then
published What's On entries labelled by kind with their dates, then the sitemap
and robots links. The CMS client fetches with no-store, so the route stays dynamic and sets a one-hour CDN `Cache-Control` header. If the CMS fails it serves the
static sections. `/book-a-table` is left out while it is `noindex`. The root layout points agents to it with `rel="describedby"`.

Add a public page to `llms.txt` only when the URL exists and its description
matches the page. Do not copy the sitemap, claim unsupported features, or treat
`llms.txt` as a ranking signal. `/book-a-table` is listed because every booking
call to action links to it, although the page is `noindex` for now.

## Streaming metadata and AI fetchers

For dynamic pages Next streams `generateMetadata` output into `<body>` after
the first HTML. Browsers and Googlebot, which run JavaScript, handle this.
Fetchers that do not run JavaScript would miss the title, canonical and Open Graph
tags. Next's default `htmlLimitedBots` list covers Google, Bing, Apple and social
preview agents only. It omits GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot,
Claude-SearchBot, Claude-User, PerplexityBot and Perplexity-User.
`next.config.ts` extends the default with `HTML_LIMITED_AI_FETCHERS`
(`src/lib/constants/crawlers.ts`, derived from `AI_CRAWLER_POLICY` plus the
user-triggered fetchers) so they receive metadata in `<head>`. Setting the option
replaces Next's list, so the config reuses Next's default expression from a
private Next path. A test in `security-headers.test.ts` fails if an upgrade
changes it.

## Pending owner decisions

Not implemented because they need facts or choices from the owner: Restaurant
schema (hours, cuisine, price, profiles, coordinates), one source of truth for
opening hours, AI training crawler policy, Event markup (needs a venue field), an
Organization logo asset, Sanity SEO fields for menus and private dining, IndexNow
and Search Console, FAQ content, and visible breadcrumbs.

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
