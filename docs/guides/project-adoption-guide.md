# Project adoption

Use [CONTRIBUTING.md](../../CONTRIBUTING.md#template-adoption) for branch and
tracker setup. Keep product requirements in the derived repository and reusable
fixes in the starter. Record the source commit before adopting later fixes.

## Product setup

Keep a brief of lasting requirements linked from README. Leave task status,
unapproved proposals and temporary research in the tracker. For redesigns,
check existing URLs, user journeys, providers and conflicting public facts.

- Rename the package, align lockfile metadata and verify a frozen install.
- Replace demo copy, SEO defaults, favicon and social images with approved assets.
- Remove or replace the complete example feature, including public endpoints
  and its tests. Agree on the database plan before changing migration history.
- Choose authentication and content ownership for the actual product. Keep
  protected actions fail-closed until verified sessions exist. Public forms
  need separate validation and abuse controls.
- Confirm integration access and supported capabilities. If staff need a CMS,
  test a real editing and publishing task before choosing it.
- Define analytics events and consent behaviour. Distinguish clicks from
  confirmed outcomes.
- Verify redirects, canonical URLs, published-only discovery and structured data
  using the [SEO guide](seo-guide.md).

## Environments

Preserve an existing `.env.local`. The inherited demo reads PostgreSQL and the
environment schema requires a database URL. Use a disposable local database;
follow the permission rules in `AGENTS.md` before running database commands.

Separate local, preview and production origins and credentials. The robots
helper uses `NODE_ENV`, so a production-built preview can allow indexing.
Set an explicit preview policy and verify its deployed response. Private
content also needs access control.

Follow the [architecture](../architecture.md), [analytics](ga4-guide.md) and
[quality](quality-guide.md) guides for implementation and verification.
