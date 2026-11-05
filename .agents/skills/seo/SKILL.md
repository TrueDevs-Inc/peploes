---
name: seo
description: Implement or review metadata, structured data, indexing, crawlers and public discovery.
---

# Seo

Start from approved public facts and actual canonical URLs. Metadata must describe visible content. Do not invent venue details, prices, hours, ratings, capabilities or ownership to complete a schema.

Keep structured data beside the feature it describes and use the existing metadata helpers. Escape serialized content at the script boundary. Emit a small accurate graph rather than every available schema type.

Treat indexing as a product decision. Check page-specific noindex settings, CMS publication rules and the intended deployment origin. Keep preview deployments non-indexable. Define preview indexing independently of NODE_ENV and verify the deployed robots and metadata responses. Private content needs server authorization; robots rules and noindex do not protect it.

Search-only, training-only and mixed-use crawlers involve different owner choices. Blocking a mixed-use token can affect discovery as well as training. Do not infer the owner's choice from an existing constant.

Discovery endpoints should list only real public destinations with accurate descriptions. A content-provider failure must not create a durable cached fallback or false claim of missing content. Use trustworthy content-update dates or omit them.

Inspect the installed framework's metadata behavior for non-JavaScript fetchers before changing crawler handling. Verify affected URLs, schema and previews with the smallest relevant check. Record external search-console setup separately from application behavior.
