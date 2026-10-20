# Architecture

The application keeps domain rules in services and persistence in the DAL.
Change a boundary only when a concrete caller or failure demonstrates the need.

## Dependency direction

```text
src/db/schema.ts
        ↓
src/dal/*.ts
        ↓
src/services/*.ts
        ↓
src/actions/*.ts       src/app/api/*/route.ts
        ↓                         ↓
Server and Client Components
```

The arrows show data flowing toward callers. Imports point toward the lower
layers of responsibility: entry points import services, services import the DAL,
and the DAL imports the schema. A DAL module never imports a service. A service
never imports an action or route handler.

## Module boundaries and names

The directory states the technical role; the filename states the domain. Use
`src/services/bookings/`, not `src/services/booking-service/`, and apply the
same rule to the DAL and actions. Component and hook filenames use kebab-case.

Use `index.ts` only as a deliberate public entry point with consumers outside
its directory. Do not create empty barrels or barrels that only duplicate
direct imports.

Import source modules through `@/` and use type-only imports where appropriate.
Bootstrap configuration and modules it loads may use relative imports before
framework alias resolution is available.
Shared interfaces and type aliases live in `src/lib/types.ts`, enums in
`src/lib/enums.ts`, and values that must agree across boundaries in
`src/lib/constants.ts`. Keep a private value beside its only consumer.
Homepage content blocks shorter than 15 formatted lines live in
`src/lib/constants.ts`; larger section catalogs live under `src/lib/constants/`.
Keep static data and reusable style constants outside component files, and define
component prop types in `src/lib/types.ts`. Runtime state, refs, event handlers
and values derived from props stay with their component or owning hook.

## Reuse and shared definitions

Search the owning module and shared libraries before adding code. Reuse a helper
when callers share meaning and must change together. Similar-looking code alone
does not justify an abstraction. Prefer standard-library and platform features,
then installed dependencies. A new package needs a concrete unmet requirement;
check its maintenance, security, licence and bundle cost.

Keep shared policy in the existing constants and enum registries. Name numeric
policy with its unit. Keep literals and types local when only one module uses
them. HTML attributes, Tailwind utilities and provider configuration keys do not
need constants merely because they are strings.

Infer inputs from their validator. Use existing enums for shared closed sets,
and literal unions for local shapes that need no runtime enum. Validate external
strings before treating them as domain values. Use exhaustive mappings with
`satisfies`; a cast must not hide a missing case. Persisted enum values are a
compatibility contract, so a member rename does not migrate stored data.

Distinguish absent values from valid zero, false or empty strings. Keep shared
runtime values free of server-only imports. Use typed locale catalogs beside
the feature, separate from machine error codes and audit events.

Keep test inputs and expected results independent of the implementation.
Framework route files may repeat declarations that the framework reads statically.

## Comments

Use comments for reasons the code cannot express: security constraints, library
limitations, concurrency or deliberate tradeoffs. Place the reason beside the
operation. Remove statement narration, redundant banners and implementation
history. Preserve licence notices and tool directives.

## External libraries

When an external integration brings SDK configuration, transport objects or
exception conventions into domain code, put those details in a concrete
server-only `<domain>-provider.ts` in `src/lib/`. It may wire the library's
database adapter and use the owning DAL for integration hooks. It does not
import services. Services consume its narrow result-returning operations and
own application authorization and DTOs. Route handlers may call its protocol
handler when the library requires an HTTP endpoint.

Pure validation and formatting helpers can use installed libraries directly.
Existing framework integrations keep the boundaries in their owning guides.

Add an interface or backend registry only when a second implementation needs it. Add concrete SDK import restrictions when adopting a provider.
Keep imports at the top of the file. Catch external exceptions at this boundary,
preserve safe server diagnostics and return typed failures.
Never let library defaults bypass application authorization, auditing or
credential-redaction requirements.

## App Router

`src/app/` owns URLs and framework entry points.

- Server Components read data by calling a service directly.
- Client Components use GET route handlers when they need an HTTP read.
- Server Actions handle application mutations.
- Route handlers also accept webhooks and proxy external APIs when the project
  needs a public HTTP boundary.

Keep route files small. They translate framework input and output. Business
rules stay in services.

## Database and DAL

`src/db/schema.ts` is the Drizzle schema used by Drizzle Kit. `src/db/index.ts`
creates the shared Postgres client from validated environment values.
`src/db/migrations/` contains the reviewed migration history applied by CI and
deployments.

DAL modules live in `src/dal/` and are server-only. Name them for the domain,
such as `bookings.ts`. Every query should:

- select the columns its caller needs;
- convert thrown database failures to an `IError`;
- return a `Result` or `ResultAsync`;
- avoid leaking a raw database record beyond the service layer.

Do not run migration commands against an unknown database. Review generated SQL
before applying it.

Scope each protected read and write to the verified actor's current authority
and the requested resource. A valid session alone does not prove ownership.
Client-supplied IDs and hidden UI controls are not authorization. Return explicit
not-found or denied results without disclosing private record existence.

Keep related writes atomic when partial success would break a domain invariant.
Enforce uniqueness and relationships with database constraints, and protect
state transitions with transactions or conditional writes rather than a racy
read-then-write check. Define duplicate-request behavior for retryable writes
and webhooks. Test the losing or repeated operation where it can cause harm.

Bound list queries and use stable ordering. Inspect loops and sibling callers
for repeated queries or network calls; use a shared query or batch only when
the operations share semantics. Call out the expected request/query count for
a flow whose cost grows with its records. Review migration compatibility with
old and new application versions and recovery before deployment. Preserve
applied migration history; schema rollback may require a forward repair.

## Services

Services own application rules. They validate inputs, combine DAL calls, and
map records to serializable DTOs. They have no React, cache, request, response or
SDK configuration concerns.
A service may accept an opaque session reference from a framework entry point;
the chosen authentication integration decodes that transport. Never accept a
caller-supplied user ID as proof of authentication.

Load one page's related account data through one authorized service operation.
Avoid repeating the same session and permission queries in sibling components. A
fresh request or mutation must verify authority again. This is request-local
work reduction, not cross-request session caching.

The bookings service (`src/services/bookings/`) checks input with the shared
booking schema, applies Peploe's rules on top of the ResDiary provider, and
maps its replies to screen-ready DTOs. That is enough work to justify the
layer. A service that only forwards one call should be questioned.

## Server Actions

`src/actions/base.ts` wraps protected mutations. Its current context resolver
returns no user, so protected actions reject requests with `Unauthorized`.
Replace that resolver with a verified server-side session before enabling
protected mutations in a derived application. Choose the authentication provider,
roles and account lifecycle for that application; the starter supplies none.

The wrapper authenticates first, parses input, calls the handler, and converts
unexpected failures to a safe internal error. Feature actions translate that
result to the shape needed by `useActionState` and revalidate affected routes.

`createPublicAction` is the one exception: the same catch without the sign-in
check or a parse step, for guest flows such as booking a table. Its handler
passes the raw input to a service, which validates it. Use it only when the
flow limits its writes per visitor (booking rate-limits holds by IP) and never
for data that belongs to an account. Next.js already refuses Server
Actions posted from another origin.

The booking hold limit fails open on purpose, so an Upstash outage does not
stop guests booking. `allowHold` lets the hold through when Upstash is not
configured (one warning per server instance), and when the request has no
visitor IP or Redis errors or times out (an error log each time). While the
limit cannot check, nothing caps how many holds one visitor makes; each hold
without guest details still ends at its ResDiary expiry. The booking checks
still run on every request: party size, dates, the signed hold token, guest
details and the live-site Stripe key check. Do not reuse `createPublicAction`
for a flow that is unsafe without a working limit.

The hold limit keys on the first `x-forwarded-for` address. That is safe only
on Vercel, which overwrites the header with the connecting client's address and
does not forward addresses from a proxy in front of it. On another host a
visitor could set the header and get a fresh limit with every request, and a
proxy such as Cloudflare in front of Vercel would put every visitor behind the
proxy's address and one shared limit. Review `allowHold` before changing host
or adding a proxy.

The booking actions (`src/actions/bookings.ts`) are called from a client
transition, not a form, so they return plain `{ ok, data | error }` data
through `toBookingResponse`, the same body as the booking routes. They do not
revalidate: setting the hold cookie already re-renders the current page.

Each hold has its own httpOnly cookie, named by its ResDiary reference. The
server reads or deletes only the cookie named by the `holdReference` in the
request, so a late reply about one tab's hold cannot delete another tab's hold.
The booking page must send the `holdReference` it is working on with every
hold, guest details and hold-status request. It keeps `holdReference` and
`holdRevision` per tab in `sessionStorage`, so a reload or a return from
Stripe still moves or completes the same hold instead of making a new one. The
server treats a hold token as missing once its hold has ended plus the
15-minute payment grace, the cookie's own lifetime, so a cookie kept beyond
that never reaches ResDiary.

## Errors

`src/lib/errors.ts` creates and maps typed errors.

Expected failures use `neverthrow`. Catch a throwing dependency where it enters
the application, add useful context for logs, and return a message safe for the
caller. `unwrapResultOrThrow` is an escape hatch for framework boundaries. It
does not belong in DAL, service, or action code.

## Components

`src/components/ui/` contains shadcn/ui components. `src/components/app/`
groups project components by size:

- atoms are small reusable controls or wrappers;
- molecules combine a few atoms;
- compounds own a feature-level UI concern.

The size labels are a navigation aid. Move a component when its responsibility
changes. Do not create an empty folder or barrel to complete the taxonomy.

Server Components are the default. A component needs `"use client"` when it
uses state, effects, browser APIs, context, or event handlers. Data passed from
server to client must be serializable.

Use semantic controls, accessible labels and keyboard behavior. Include the
loading, empty, denied, error and success states relevant to the interaction.
Prevent accidental duplicate submissions in the UI and enforce duplicate safety
on the server where it affects data. Keep focus and error messages usable for
assistive technology. Implement the journey's approved locales and text
direction, including validation messages, without exposing internal error detail.

## Environment and configuration

`src/lib/env.ts` validates environment values. `.env.example` documents the
same contract. `next.config.ts`, Drizzle config, Sentry config, and
instrumentation files may read `process.env` because they run before app aliases
and validation are available.

The default CSP supports static rendering, so scripts and styles still allow
inline content. It allows `unsafe-eval` only in development and adds monitoring
or analytics origins only when their public configuration exists. The booking
page (`/book-a-table`) gets the same policy plus Stripe.js and its 3-D Secure
frames, from a later header rule that replaces the site-wide one on that path. Projects that
need nonce-based CSP must accept dynamic rendering as described in the
[Next.js CSP guide](https://nextjs.org/docs/app/guides/content-security-policy).

Production sends one year of HSTS without `includeSubDomains` or `preload`.
Enable those directives only after every subdomain is HTTPS-only and the domain
owner accepts the preload removal delay. Optimized images and the default CSP
allow local assets only. Add each required remote image origin to both
`next.config.ts` and the CSP after the project chooses its media providers.

## Enforcement

Biome rejects framework and direct database imports in services,
upward imports in the DAL, and direct persistence imports in application entry
points. The directory patterns cover alias and relative imports in those layers.
Provider adapters cannot import services or application entry points. Biome
also rejects direct environment access and console calls in application entry
points, services, DAL, components, hooks and operational scripts. Bootstrap and
observability owners retain their documented exceptions. It checks import
placement. Run the full configured lint gate;
individual-file review is not a substitute. These rules cover named import
paths, not every possible transitive dependency. Review the actual dependency
chain as well.

Verification, suppression rules and CI ownership live in the
[quality guide](guides/quality-guide.md).

Types enforce shared DTOs and exhaustive locale/event mappings. Review still
owns semantic duplication, unnecessary abstractions and repeated queries.
Generated library types, framework prop composition and test-only fixture types
need not become application-domain types in the shared registry.

## Cross-cutting modules

Logging, Sentry, analytics, SEO, testing, and performance each have one owner in
`docs/guides/`. Those guides describe their current implementation and
project-specific replacement points. Do not restate their policies here.
