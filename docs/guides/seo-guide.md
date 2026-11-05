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
The root layout emits `WebSite` data from `DEFAULT_SEO` and the public site URL.
It does not claim that site search exists.

The website and organization builders require their facts as input. The root
does not emit organization data because the starter has no organization, logo,
or social profiles to claim.

Use the `Breadcrumbs` compound when a page has a visible breadcrumb trail. It
keeps the navigation and BreadcrumbList data aligned.

Put product-specific schema beside the feature whose visible content it
describes. A blog can add Article data; a store can add Product data. The
generic starter does not carry those builders before the corresponding feature
exists.

## Robots and sitemap

`src/app/robots.ts` blocks every crawler outside production. Production policy
has three groups in `AI_CRAWLER_POLICY`:

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

`src/app/sitemap.ts` contains only the home page. Add public canonical pages when
they exist. Use a content update time for `lastModified`; omit it when the
application has no trustworthy value.

## Agent discovery

`src/app/llms.txt/route.ts` serves Markdown built by
`src/lib/seo/discovery.ts`. It contains the configured site name and
description, then links to the home page, sitemap, and crawler policy. The root
layout points agents to it with `rel="describedby"`.

Add a public page to `llms.txt` only when the URL exists and its description
matches the page. Prefer links to clean Markdown versions for long technical
documentation. Do not copy the sitemap, claim unsupported features, or treat
`llms.txt` as a ranking signal.

## Social images

Set a real Open Graph image and alt text for public pages. If the project adds a
generated image route, test its fonts, dimensions, cache behavior, and failure
path. Add any remote image origin explicitly to both Next image configuration
and the CSP.

## Review checklist

- Titles and descriptions match visible content.
- Canonical URLs point to the public deployment.
- Preview deployments remain non-indexable.
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
