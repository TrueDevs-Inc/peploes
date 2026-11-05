# Menu pages

Menus share `/menus`, selected with the `menu` query: `lunch`, `dinner`,
`pre-theatre`, `wine`, `cocktails`, `group-set-menu` or `seasonal`.
Missing, invalid or repeated selections show Lunch. Old `/menus/<slug>` links
permanently redirect to their query URL, preserving section anchors.
The shared layout contains the hero and sticky menu navigation. Switching menus
keeps that shell mounted, moves the underline and fades the selected content out
and in on desktop and mobile. Reduced motion switches immediately. Only the
selected CMS menu loads; refresh, Back and Forward retain the URL selection.
The menu-tab underline follows the selected menu only; hovering, focusing or
opening a collection dropdown does not move it. Introductory images load eagerly
for the selected menu. If optimization fails, retry the same validated CMS image
directly without changing its crop or reserved frame.
Tabs and the displayed menu share a hydration boundary so an early selection
cannot replace an unhydrated menu with a different view.
Group Set Menu and Seasonal render one menu at a time. Each dropdown selection
opens the collection introduction below the sticky tabs and shows that menu's
courses. The first published menu is the default, including after editors reorder
entries. Cards for the other menus appear after the selected menu's courses,
before the shared notes and booking banner, and switch the selected menu.
Section anchors, refresh, Back and Forward retain the selection. Selecting the
same dropdown item again returns to the introduction after scrolling away.
Each menu supplies its closing photograph and copy. The site header
and footer remain shared with the homepage, including the footer's spacing,
gutters and mobile section order.
The Group Set Menu enquiry action opens the private-dining enquiry section.
Its closing banner heading, description and enquiry button share a left edge
on desktop and mobile; the desktop content keeps its existing position.
Book a Table actions open the [booking page](brief.md#book-a-table).
Enquiry delivery follows the [email guide](../guides/email-guide.md).

## Design and content decisions

Use the [Figma menu references](https://www.figma.com/design/0fEgisdlNBr23CuWHJOTNC/Peploe-s?node-id=3345-534)
for visual presentation; styles own spacing, type, crops and animation values.
Prices use euro. Lunch and Pre-Theatre course prices are optional; Dinner keeps
individual prices. Empty cocktail sections remain hidden until content exists.
Seasonal entries are an ordered editable collection, not a fixed Christmas list.
Confirm sample prices, vintages, duplicate bottles and old seasonal dates before
publishing. Seasonal group eligibility follows 'greater than 7' in its menu header.

## Sanity connection

All seven routes read published Sanity content on the server. Studio is the editing
screen; the website reads its saved content through the Sanity API. Draft edits do
not appear. There is no browser token and no write token in the website.

The website caches Sanity responses under one tag. A publish, change or deletion
in Studio calls the signed webhook at `/api/webhooks/sanity`. It waits three
seconds for Sanity's read API to catch up, as Sanity's own Next.js helper does,
then expires that tag, so the next page view reads the new content. Without a working webhook the
cache still expires after five minutes. A failed Sanity request is not cached.
Published content pages also reuse rendered HTML. Signed publication invalidates
the content cache; time-based revalidation can serve the previous page while
refreshing. Article and event detail pages resolve content before responding,
so missing entries return HTTP 404. Booking requests bypass the Next data cache.
Rules and closed dates are held in memory for five minutes.

Each website environment needs its own webhook in Sanity (Manage, API,
Webhooks):

- URL: `https://<site>/api/webhooks/sanity`
- Dataset: the dataset in that environment's `SANITY_DATASET`
- Trigger on: create, update and delete; leave the filter empty and drafts off
- Projection: `{_id, _type}`
- HTTP method: POST
- Secret: the same value as that environment's `SANITY_WEBHOOK_SECRET`, at least
  32 random characters

Until the secret is set the route answers 503 and editors wait up to five
minutes. A request with a missing or wrong signature gets 401 and changes nothing.

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
for their responsive cover crops. Styles own the rendered image frames.

The active project is `w789ottu` (Peploes, in the TrueDevs Sanity organization),
dataset `development`. Its `production` dataset stays empty until the restaurant
approves content. The earlier project `3ggctsor` is outside the organization and
no longer used; its published development content was copied on 2 November 2026.
Images were copied from the public CDN, which serves converted files, so WebP
originals are stored as PNG or JPEG at the same dimensions.

The development Studio is `https://peploes-dev.sanity.studio`, application ID
`jhr5xqsq76c5ddm6dryvws85`, deployed from `studio` with
`SANITY_STUDIO_PROJECT_ID=w789ottu SANITY_STUDIO_DATASET=development bunx sanity deploy --url peploes-dev`.
Deploy a production Studio under its own hostname; do not reuse this application ID.

| Studio content type | Menu URL name | Website path |
| --- | --- | --- |
| Restaurant menu | `lunch` | `/menus?menu=lunch` |
| Restaurant menu | `dinner` | `/menus?menu=dinner` |
| Restaurant menu | `pre-theatre` | `/menus?menu=pre-theatre` |
| Wine menu | `wine` | `/menus?menu=wine` |
| Drinks menu | `cocktails` | `/menus?menu=cocktails` |
| Set menu collection | `group-set-menu` | `/menus?menu=group-set-menu` |
| Set menu collection | `seasonal` | `/menus?menu=seasonal` |

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
The booking object accepts per-menu presentation overrides. Consult its schema
and component for supported fields; this guide does not duplicate their styles.

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

From the repository root, open separate terminals:

1. Website: `bun run dev` — open `http://localhost:3000/menus?menu=lunch`.
2. Studio: `bun run studio:dev` — open `http://localhost:3333`.

Keep both terminals running. If dependencies are missing, run `bun install` in
the repository and `bun install --cwd studio` once. Log into Studio with your
own Sanity account. Access is controlled by Sanity project membership.

The website uses `SANITY_PROJECT_ID`, `SANITY_DATASET` and
`SANITY_API_VERSION` in the root `.env`; copy the names from
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
5. Click **Publish**, then refresh the matching website page. If the change is
   missing, check the webhook's delivery log in Sanity; the page updates within
   five minutes either way.

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

From `studio`, `bun run seed:preview` reads and describes the import without
writing. `bun run seed:development` backs up documents in
`studio/.sanity/menu-backups/`, uploads images and fills missing fields. It never
replaces existing values or arrays; draft-only menus stay drafts. The command
refuses datasets other than `development`. Backups contain document data, not
asset copies. Verify the configured project and dataset before an authorized run.
Sample catalogs are import inputs, never live fallbacks. Restaurant approval is
required before publishing their prices, vintages and seasonal dates.

The runtime and Studio schemas retain the original image crops, positioning,
rotation, banner spacing, overlays and wine layout settings. Presentation fields
are hidden and read-only in Studio so content editing keeps the existing design.
The Group menu inclusion heading remains editable. Compact menu navigation
spacing and explicit price decimal formatting are also preserved.

For release, review the content and editor access, configure the intended
production dataset in both website and Studio environments, and publish approved
production content. Development documents do not automatically appear in
production. Client access and hosting are separate release steps.

Verify desktop and phone image crops, sticky navigation, keyboard access,
allergen expansion and narrow-screen overflow with published content. Check
Wine index targets and Group/Seasonal dropdowns after adding, hiding and
reordering entries.
