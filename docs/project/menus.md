# Menu pages

The menu routes are `/menus/lunch`, `/menus/dinner`, `/menus/pre-theatre`,
`/menus/wine`, `/menus/cocktails`, `/menus/group-set-menu` and `/menus/seasonal`.
`/menus` redirects to Lunch. The shared layout contains the hero and sticky menu
navigation. Each page supplies its closing photograph and copy. The site header
and footer remain shared with the homepage. The footer's menu variant follows
the menu frames' spacing and mobile section order; homepage styling is unchanged.
The Group Set Menu enquiry action opens the private-dining enquiry section.
Book a Table actions open the [booking design preview](brief.md#book-a-table-design-preview).
Enquiry submission remains inactive until its integration exists.

## Design and approved comments

Reference: [Peploe’s Figma, Lunch desktop](https://www.figma.com/design/0fEgisdlNBr23CuWHJOTNC/Peploe-s?node-id=3345-534)
and [Lunch mobile](https://www.figma.com/design/0fEgisdlNBr23CuWHJOTNC/Peploe-s?node-id=3384-11229).

Dinner follows [desktop](https://www.figma.com/design/0fEgisdlNBr23CuWHJOTNC/Peploe-s?node-id=3347-3831)
and [mobile](https://www.figma.com/design/0fEgisdlNBr23CuWHJOTNC/Peploe-s?node-id=3387-12594).
It retains individual dish prices, the 5pm service time, its own food photograph,
eight sides and the group-size note. The Lunch and Pre-Theatre comments about
removing prices do not apply to Dinner. Dinner has no set-menu offer.

- The Menu navigation note (`3347:3824`) keeps the hero consistent between menus
  and the navigation accessible while scrolling. Phones scroll the links horizontally.
  Below the desktop breakpoint, size tabs to show a whole number plus half of
  the next tab: 2.5 below 360px, 3.5 from 360px, 4.5 from 480px, 5.5 from 640px
  and 6.5 from 900px. Native scroll snapping preserves this visual cue after
  swiping. Align the active tab to the start where possible; near the end,
  show the final tabs fully with a partial tab on the left. Labels stay on one
  line; longer labels widen their tab to fit the text and chevron, so their
  visible fraction can differ from half.
  Dropdown tabs retain 22px horizontal padding and an 8px text-to-chevron gap
  so their labels do not crowd the separators.
  Desktop retains its existing row layout.
- The CMS note calls for editable headings, dishes, descriptions, prices, service
  times and notes. The allergen note calls for optional, editable expanding content.
- Comment #17 removes individual starter and main-course prices from Lunch.
  Small bites and sides retain prices. The offer is two courses for €42 or three
  for €48. Optional prices allow future individual pricing without changing the UI.
- Comment #22 removes the introductory prose for each course. Dish descriptions
  remain part of the menu.
- Comment #15 approves the food photograph with an option to remove it later.
  The introductory image is optional and its removal leaves no empty image panel.

### Remaining menu references and decisions

| Menu | Desktop node | Mobile node |
| --- | --- | --- |
| Pre-Theatre | `3367:6480` | `3387:12944` |
| Wine | `3356:7861` | `3388:14050` |
| Cocktails | `3380:9952` | `3392:16854` |
| Group Set Menu | `3399:18287` | `3407:21690` |
| Seasonal | `3402:20164` | `3407:22064` |

- Comment #24 originally requested no individual prices for Pre-Theatre starters,
  mains and desserts. The current editing requirement allows optional prices for
  every dish, including these courses. Leave prices empty to retain the Figma
  presentation. The rib-eye supplement remains part of its description.
- The final reply to #26 keeps “Start Here” in the wine index. Comment #27 requires
  editable categories, subcategories and their contents, including new countries.
- The wine navigation note specifies scrolling to sections on the same page,
  without filtering the list or loading another page. The index and tables use
  the same available content so hidden bottles cannot leave empty jump targets.
  The desktop close control collapses the index and returns focus to its Browse
  summary; the summary can reopen it with the pointer, Enter or Space.
  Mobile uses a plus/minus summary and compact rows whose chevrons link to the
  corresponding sections; category links jump directly to their wine tables.
- The wine CMS note requires editable names, vintages, regions, glass/bottle
  prices and availability. The current Figma list demonstrates layout only.
- Comment #34 requests Classic and Peploe’s Signature Cocktail sections between
  Aperitifs and Spirits. Their ordered entries are prepared but empty because the
  promised cocktail list is not present in the comments. Empty sections are hidden.
- Comment #43 requested included bread and main-course sides for the group and
  Christmas menus. The contributor's later placement instruction keeps the visible
  inclusion strip only where it appears in Figma: Group Set Lunch on desktop.
  Seasonal tea/coffee appears once in its own course, removing the frame’s
  duplicated entry under Dessert.
- Comment #44 asks about future lobster-week and wine-pairing menus. Seasonal
  entries are an ordered collection, with navigation generated from that same
  collection; they are not a fixed Christmas enum.
- Comment #23 proposes a restaurant illustration but has no approved replacement
  attached. The current frame illustration is retained and remains editable.

The Figma aperitif pound symbols are treated as placeholder errors: all prices
use euro, consistent with the Dublin restaurant and the rest of its menus.
The duplicate Grey Goose entries, wine prices/vintages and the Christmas 2025
service date are retained as local design preview copy. Confirm these with the
restaurant before publishing current menus. Seasonal group eligibility follows
the menu headers (“greater than 7”) rather than the contradictory “7 or more” footer.

The October 8 desktop frames supply the shared preview wording when desktop and
mobile differ, as selected by the contributor. This includes drink spellings,
apostrophes and the Seasonal salmon accompaniment. Approved comments take
precedence over the frame copy. Shared navigation now reads “Private Dining &
Events”. The latest Group desktop frame adds an “Included with your menu” strip
to Group Set Lunch only. Group Set Dinner and both Seasonal previews have empty
inclusion lists, and the strip is hidden on mobile to match those frames. Its
heading and entries remain editable content in the rendering contract.

## Sanity connection

All seven routes read published Sanity content on the server. Studio is the editing
screen; the website reads its saved content through the Sanity API. Publishing in
Studio and refreshing the website shows the change. Draft edits do not appear.
There is no browser token and no write token in the website.

The following preview content remains pending restaurant approval:

- House White and House Red bottle prices differ between By the Glass and House Wines.
- Two Grey Goose entries have the same label but different prices.
- Lunch service ends at 4:30pm while last orders are shown as 4:45pm.
- The three-course lunch offer has no dessert options or third-course explanation.

Keep these as content questions until the restaurant supplies confirmed details;
do not invent prices, service times or dishes.

`src/lib/constants/menu-page.ts` and the `*-menu.ts` catalogs in the same
directory hold design previews used by the optional development import.
`IMenuContent` in `src/lib/types.ts` is the rendering contract. The UI receives
this content as a server-rendered prop and has no dependency on Sanity transport
objects. Course and dish arrays use stable `_key` values and preserve editor order.
An empty course is omitted. Missing prices, descriptions, images, offers or allergen
information do not create placeholders. Lunch and Pre-Theatre offers appear
once in the notes panel, following the reviewer’s lower-panel screenshots.
A course's optional `firstColumnCount` sets the first desktop column; remaining
dishes are distributed across the later columns.
A one-column course always includes every dish. Food intro `desktopCrop` stores
width and left position as percentages, aspect ratio, top offset in pixels and
rotation in degrees. Food images retain their uncropped layout on mobile.
Editorial photographs accept `desktopPosition` and `mobilePosition` focal points
for their responsive cover crops. Cocktails uses the same asset in a 258 × 240px
desktop frame and a full-content-width, 214px-high mobile frame; both focal points
are preview image data. New presentation fields from `dev` are not all exposed
by the current Studio schemas and projections; default rendering still applies.

The active development project is `3ggctsor`, dataset `development`. Production
is separate and is not used by this setup.

| Studio content type | Menu URL name | Website path |
| --- | --- | --- |
| Restaurant menu | `lunch` | `/menus/lunch` |
| Restaurant menu | `dinner` | `/menus/dinner` |
| Restaurant menu | `pre-theatre` | `/menus/pre-theatre` |
| Wine menu | `wine` | `/menus/wine` |
| Drinks menu | `cocktails` | `/menus/cocktails` |
| Set menu collection | `group-set-menu` | `/menus/group-set-menu` |
| Set menu collection | `seasonal` | `/menus/seasonal` |

| Content | Sanity content shape |
| --- | --- |
| Shared hero, navigation and booking banner | A singleton `menusPage` document |
| Menu title and SEO description | Required strings on a `restaurantMenu` document |
| Menu identifier | Required unique `slug`, projected as `slug.current` |
| Service times and set-menu offer | String fields; offer optional |
| Introductory image | Optional `image` with alt text, desktop crop and rotation |
| Courses | Ordered object array: heading, one/two/three-column layout and dishes |
| Dishes | Ordered object array: name, optional description and optional price |
| Price | Optional non-negative number in euro, at most two decimal places |
| Price display | Optional `priceDecimalPlaces`: 0 or 2; spirits default to 2, other dishes to 0 |
| Notes | Ordered string array |
| Allergens | Optional object with heading and description |

Wine uses `IWineMenuContent`, with ordered sections, columns, categories and wine
entries. Columns control desktop grouping; categories read across rows on phones
and in the index. An unavailable wine is omitted; absent availability means shown.
Vintage, glass and bottle fields are independent, and category flags determine
which price columns appear. An optional `shortHeading` supplies the compact index
label and `emphasized` selects the larger desktop category heading. Categories
with origins use a second mobile row; categories without origins keep the wine
name and prices together. Cellar categories use `compactVintageHeading` for
their narrow mobile vintage column. Optional section padding and category
heading gaps preserve the desktop and mobile reference spacing as presentation
metadata; menu height follows the content. No country names are embedded in
components.

Cocktails uses `IDrinksMenuContent`: ordered cocktail sections and spirit
categories, each with optional descriptions and prices. On mobile, a soft-stone
divider separates the Spirits introduction from its first available category.
Group and Seasonal use
`ISetMenuCollection`: ordered menus with stable keys, titles, prices per person,
inclusions and courses. Each `ISetMenu` carries optional `serviceTimes` text,
a required `summary`, and an optional `cardDescription`. The preview catalogs
put service dates in `serviceTimes` and group eligibility in descriptive text;
there are no separate structured date or eligibility fields. These collections
generate the navigation dropdowns and section cards. Store inclusions as editable
text; do not infer them from prices or share one menu’s dishes with another document.

For Sanity, model these as separate document shapes with reusable dish, course,
image, notes and booking-banner objects. Validate unique, URL-safe section keys
for anchors, optional non-negative prices and required
image alt text. Preserve editor ordering when projecting content into these types.
The local catalogs are optional seed inputs; the configured website reads Sanity.
The compact editorial introduction with descriptive copy caps its desktop paragraph
at 600px with 14px text and 20px line height. The heading remains 46px; mobile
retains its full content width and 21px paragraph line height.
The booking object also accepts `tallOnMobile` for the Wine and Cocktails banners,
optional desktop image positioning, content width and text alignment. Mobile
padding, mobile/desktop overlays and full-width mobile actions preserve each
banner’s reference treatment. These presentation fields preserve the shared
banner component while matching each photograph and caption. The shared menu
navigation uses the same 8px top padding on all desktop routes; its mobile
height remains consistent across routes. A 1px soft-stone divider spans
the menu navigation below the tabs on desktop and mobile; the active tab keeps
its burgundy underline.

The Group and Seasonal desktop frames contain an older, shorter footer with
different opening hours. These pages use the shared production footer and its
confirmed hours. The current Figma-derived content leaves Lunch starter and main
prices and Pre-Theatre starter, main and dessert prices empty. Editors may add
prices later. Euro pricing and the single notes-panel offer follow the decisions
above even where an older frame still differs.

Keep exactly one published document per URL name. Changing a title is safe;
changing the URL name can make that page unavailable. An unpublished or missing
menu shows the site's not-found page. Invalid content and network failures show
an error; they never display a local preview menu instead.

### Run locally

Open two terminals in `D:\JavaScript\peploes-sanity`:

1. Website: `bun run dev` — open `http://localhost:3000/menus/lunch`.
2. Studio: `bun run studio:dev` — open `http://localhost:3333`.

Keep both terminals running. If dependencies are missing, run `bun install` in
the repository and `bun install --cwd studio` once. Log into Studio with your
own Sanity account. Access is controlled by Sanity project membership.

The website uses `SANITY_PROJECT_ID`, `SANITY_DATASET` and
`SANITY_API_VERSION` in the root `.env.local`; copy the names from
`.env.example`. Studio uses `SANITY_STUDIO_PROJECT_ID` and
`SANITY_STUDIO_DATASET`; its defaults point to the development project above.
Keep the API version pinned to `2026-10-06`. Studio auto-updates are disabled so
the installed version is the version tested and built.

### Edit a menu

1. Open **Menus** in Studio and choose **Food menus**, **Wine menu**,
   **Cocktails and spirits**, or **Group and seasonal menus**. Open the menu
   document. For a new
   menu, create a document and use the exact URL name in the table.
2. Enter a title and search description. Restaurant menus also require serving
   times. Add sections and dishes, or the specialist fields described below.
3. Enter prices as numbers in euro, with at most two decimal places. Leave an
   optional price empty when it should not appear. Zero means an actual zero price.
4. Drag entries to change their order. Empty dish sections are hidden. Notes and
   allergen information are optional. Uploaded images require a useful description.
5. Click **Publish**, then refresh the matching website page.

Image fit, image scale, desktop photo scale and image ordering are hidden and
read-only in Studio. Their saved values remain in the schema to preserve the
published layout; image uploads and descriptions remain editable. Introduction
and Side introduction appear only for layouts that render them. Standard food
menu introductions hide both fields; the editorial layout keeps them available.

For Lunch, Dinner and Pre-Theatre, every dish has an optional **Price in euros**.
Enter a price to display it beside the dish, or leave it empty to hide it. This
applies to every section type, including starters, mains and desserts. Supplements
can remain in the dish description. Set-menu collections use a price per person.

For Wine, add sections, up to two desktop columns, categories and wines.
Categories can represent any country or grouping. Glass price, bottle price and
vintage are independent fields. Category switches control the vintage and glass
columns. Switch off a wine's availability to hide it; empty categories disappear
from both the page and its jump index.

For Cocktails, arrange cocktail sections and spirit categories independently.
Classic and Signature sections can remain empty until the restaurant supplies
their lists. Empty sections are hidden.

For Group Set Menu and Seasonal, add ordered menu entries. Each entry has a title,
price per person, eligibility/summary, service dates or times, inclusions and
courses. Their names also form the navigation dropdown. Add a future Lobster Week
as another Seasonal entry; no new page or code change is needed.

### Shared menu settings

**Shared menu settings** is one document for the hero, navigation labels/order,
and default closing banner. It needs all seven different menu links. A menu can
override its own closing banner.

Until shared settings are published, the existing shared website design is used.
This default applies only when the settings document is absent. A failed request
or invalid published settings is reported as an error. Menu content itself never
falls back to preview fixtures.

### Development sample content

On 17 October 2026, the development import was applied at Ali's request to
`3ggctsor/development`. All seven menus and shared menu settings are published.
Lunch, Dinner and Pre-Theatre kept their existing content; only missing fields
were added. Wine, Cocktails, Group Set Menu and Seasonal were created from the
repository's design preview content. Production was not changed.

The pre-import document backup is
`studio/.sanity/menu-backups/before-1792234841549.json`. Comparing the original
content with the imported documents confirmed no existing values were replaced.

From the `studio` directory, `bun run seed:preview` reads the current content and
prints what would happen. It does not upload images or write documents.
`bun run seed:development` applies the import: it backs up documents under
`studio/.sanity/menu-backups/`, uploads local images, creates missing documents,
and adds missing top-level fields to existing documents. It never replaces an
existing value or fills an existing array. A draft-only menu stays a draft.
The command refuses any dataset other than `development`. Backups contain
document data, not separate copies of assets.

The catalogs under `src/lib/constants/*-menu.ts` are sample import inputs. Their
prices, vintages, duplicate entries and old seasonal dates must be checked with
the restaurant before real use. They are not live website menu fallbacks.

All seven published menus and shared settings passed the application's content
validation after import. All seven local menu routes rendered menu content
without a not-found or content-load error. Wine was also checked in the browser.

On 19 October 2026, a development-only repair restored 59 missing presentation
fields across eight documents. The repair used revision checks and only filled
missing values; verification confirmed that every existing value was preserved
and all eight published documents passed the content schemas. Its backup is
`studio/.sanity/menu-backups/before-presentation-repair-1792394216063.json`.
Production was not changed.

The runtime and Studio schemas retain the original image crops, positioning,
rotation, banner spacing, overlays and wine layout settings. Presentation fields
are hidden and read-only in Studio so content editing keeps the existing design.
The Group menu inclusion heading remains editable. Compact menu navigation
spacing and explicit price decimal formatting are also preserved.

### Code and checks

- `src/lib/sanity-provider.ts` reads the published perspective with `no-store`.
- `src/services/restaurant-menus.ts` validates external data and returns typed
  results. Duplicate URL names and invalid content are rejected.
- `src/lib/menu-content.ts` shares each request between page, metadata and layout.
- `CmsMenuPage` passes the validated data into the existing menu components.
- Studio schemas are in `studio/schemaTypes/`. Stable array keys supply anchors;
  editor order is preserved. Sanity image hosts are configured in Next and CSP.
- `bun run validate` checks lint, website/Studio types and unit tests.
- `bun run build` builds the website; `bun run --cwd studio build` builds Studio.
  Neither command deploys.

For release, review the content and editor access, configure the intended
production dataset in both website and Studio environments, and publish approved
production content. Development documents do not automatically appear in
production. Client access and hosting are separate release steps.

Verify desktop and phone image crops, sticky navigation, keyboard access,
allergen expansion and narrow-screen overflow with published content. Check
Wine index targets and Group/Seasonal dropdowns after adding, hiding and
reordering entries.

### Current verification limit

On 19 October 2026, after syncing with `dev` at `064be2b`, formatting/lint,
website and Studio types, all 119 unit tests, both production builds and the
website high-severity audit passed. The 21 focused menu browser checks passed
at desktop, phone and narrow-phone widths, including image loading, navigation,
Group banner alignment and horizontal overflow.

The full browser run passed 161 of 165 checks. One Our Story navigation timed
out, and three event-page image-loading checks timed out. All four passed on an
immediate isolated rerun against the same build, without changing the tests or
application. The full run therefore was not clean on its first attempt.
Browser menu fixtures use an isolated fake Sanity project; the live development
repair was separately checked for content preservation and schema validity.

Studio's high-severity audit still fails on `braces@3.0.3` in the Sanity CLI
tooling. The advisory lists no patched release, and the latest published Sanity
code-generation package still pulls the affected dependency:
[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
The check remains enabled; the full CI gate is not green.

Studio overrides pin patched `js-yaml` and `smol-toml` versions while its CLI
still pulls vulnerable older versions. Remove those overrides only when the
normal dependency tree resolves safe versions and the audit remains clear.

The [original implementation review](../reports/menu-cms-review.html) records
17 October evidence and content/release steps. The verification above supersedes
its older test counts and build status.
