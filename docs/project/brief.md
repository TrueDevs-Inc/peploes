# Peploe's website brief

Figma owns visual references. Styles own dimensions, typography, crops and motion.
This brief records restaurant requirements, owner decisions and editorial
operations that code cannot explain. Update only when those facts change.
See [menus](menus.md), [private dining](private-dining.md), and the
[booking contract](booking-page.md) for their own requirements.

## Identity and audience

Peploe's is an independent, family-run restaurant at 16 St Stephen's Green,
Dublin. Founded by Barry Canny in 2003, it continues under the next generation
of the Canny family. Its basement dining room, food, wine, service and people
should give the website its character.

Keep the existing brand, logo and colours. The experience should feel warm,
confident, contemporary and quietly luxurious. Gina explicitly rejects
fine-dining positioning, corporate styling, excessive gold, marble effects and
script-font luxury cues. Preserve recognition for loyal guests while welcoming
more diners aged 35 to 55. Show everyday dinners and lunches alongside
celebrations, rather than making the restaurant feel reserved for occasions.

## Required visitor journeys

| Area | Requirement from the brief |
| --- | --- |
| Homepage and mobile | Make Book a Table the primary action and easy to reach throughout the site. Menus, location, opening hours and contact details must be easy to find on a phone. |
| Reservations | Use ResDiary. Unavailable online dates must not imply the restaurant is fully booked. Some dates and tables are managed by the team. Offer telephone and email help; direct groups of more than seven guests to the team. |
| Menus and CMS | Authorised staff must be able to edit dishes, prices, regular and seasonal menus without developer help. Prefer structured web menus, with optional PDF downloads. |
| What's On | Staff can create, edit, publish and remove seasonal/event landing pages for campaigns, including Christmas, rugby, lobster season, wine dinners and Sunday dining. These examples are not confirmation of current events. |
| Our Story | Cover the founding, Barry Canny, the family and the next generation. The artist behind the name may appear but should not dominate. |
| Groups and celebrations | Provide relevant content, imagery and a dedicated enquiry journey. |
| Corporate events and exclusive hire | Give this audience its own information and enquiry journey. |
| Weddings | Present intimate city weddings through atmosphere, exclusivity, food and wine, with an easy enquiry route. Avoid generic package-led presentation. |
| A Letter from Gina | Offer a personal email subscription and connect it to existing customer/email systems where appropriate. |
| Search discovery | Create useful pages for real dining and event intents, with natural copy. |
| Analytics | Measure acquisition, page and menu interest, booking clicks, contact clicks, enquiries, subscriptions and event engagement. Track booking outcomes only where the integration supports them. Configure reporting for launch. |

Suppliers and provenance are an opportunity to develop over time. Gina suggests
showing real relationships, such as Higgins Family Butcher, through a possible
People & Produce section or stories within other pages. A standalone section is
not yet a launch commitment.

## Creative direction

Build around approved photography of the restaurant in service, food arriving
and being prepared, wine and cocktails, staff and family. Empty-room images and
isolated dishes alone will not communicate the intended experience.

Explore the descent from St Stephen's Green into the restaurant through image
sequence, colour and storytelling. Gina presents this as a possible direction,
not a requirement for an animation. Keep movement restrained and navigation
usable. Obtain the original logo, colour values and image files before settling
visual tokens or selecting final crops.

## Book a Table

The noindex `/book-a-table` flow uses ResDiary availability, holds and guest
details. Start on its first open date; reject past Dublin dates and recheck
before searching. The date refreshes on focus or visibility, keeping future
choices. Date or party-size changes clear the selected time. Preserve guest
details on Back and require return-time acknowledgement when ResDiary marks it
as required. Names with spaces stay intact across responsive layouts.

Some reservations require a Stripe deposit or card guarantee. Only a ResDiary
confirmation and reference mean the booking is confirmed. Reloads restore the
tab's held-table or payment state. Add to Calendar remains disabled. See the
[booking contract](booking-page.md) for hold expiry, payment recovery, uncertain
outcomes and confirmation-email limits.

## Booking newsletter opt-in

Issue #120 adds an optional newsletter checkbox beneath the booking terms on
the guest-details step. It starts unchecked, remains independent of the required
terms, keeps its choice when going back to times, and resets on Start again.
Both choices allow the connected booking to proceed. After ResDiary accepts the
guest details (confirmation, deposit or card guarantee), an explicit opt-in
requests a subscription through the existing newsletter service after the booking
response. Subscription failure never changes the booking result or retries the
booking. Consent and email are not stored for recovery. If the booking outcome
remains unclear and is only resolved later by status polling, no newsletter
request is made; guests can use the footer signup instead. Newsletter delivery
still needs the configured Klaviyo list, credentials and rate limiter. No
subscription success is promised by the booking confirmation.

## Visit & Contact

The general contact form sends one restaurant notification through the selected
transactional email provider. It shows success only after provider acceptance,
keeps the visitor's entries on definite failure, and directs uncertain outcomes
to the published phone or email contact. The private-dining form remains a
separate enquiry flow.

Phone, email, directions and booking links must work on phones and desktops.
Mapbox loads automatically and keeps a local preview and directions when
unconfigured or unavailable. Set `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` to the
client's URL-restricted public token before launch. An optional
`NEXT_PUBLIC_MAPBOX_STYLE_URL` selects a custom style. Keep attribution visible,
scroll-wheel zoom disabled, and zoom, fullscreen and recenter controls usable.
Opening-hours and location links support `#opening-hours` and `#find-us`.

## Navigation and policies

Menus, private dining, Our Story, What's On, Journal and Visit must be reachable.
Book a Table is the primary action. Hide vouchers until a destination exists.
Keyboard users can open and dismiss menus, reach destinations, and recover
focus. Mobile menus contain focus, prevent background scrolling and close
on navigation or a desktop resize. Reduced motion must leave controls usable.

Footer legal links reach Privacy, Terms, Accessibility and Booking & Cancellation.
Cookie Settings opens the consent dialog. Necessary cookies stay enabled;
optional choices are separate. Failed storage must report a failed save and
keep optional tracking denied. See the analytics guides for delivery policy.
Unknown policy URLs return 404. Restaurant approval of legal copy, opening
hours, contact details and production editorial content remains a launch task.

## What's On

`/seasonal` is the events hub, distinct from `/menus?menu=seasonal`.
Published entries support Campaign, Event and Menu Moment. Start/end dates
control the upcoming diary in Europe/Dublin time. Past detail pages remain
available until unpublished or disabled. Unknown, unpublished and disabled
entries return HTTP 404. Provider failures reach an error state, not a false 404.
No local event fixtures replace missing CMS content.

Optional empty sections are omitted. Galleries accept three to five photos.
Menu and related cards need valid destination URLs; publish their destinations
before linking. Related descriptions have a 12-word limit. Booking links open
the booking page without reserving or preselecting an event. Development demos
stay noindex until approved dates and copy are supplied. Signed publishing and
cache invalidation follow [Menu operations](menus.md#sanity-connection).

### Editing What’s On in development

1. Open this branch's Studio. Choose **What’s On → Events and campaigns**.
2. Create an entry and choose Campaign, Event or Menu Moment.
3. Fill in the title, URL name, start date, category, diary description and page
   introduction. Upload a photo and give it descriptive alternative text.
4. Use an end date for a campaign spanning several days. The dates control the
   diary; the optional Event information fields control the displayed details.
5. Optional sections may be left unset. When adding one, complete its required
   fields. Add linked cards in Menu & Experience or More to Explore and fill in
   each card's Button URL, such as `/seasonal/lobster-season`, `/menus?menu=dinner`
   or `https://example.com/event`. Publish destination pages before linking to
   them. Galleries accept three to five photographs.
6. Keep **Keep out of search engines** on for testing. Click **Publish**, then
   refresh `/seasonal` and click the entry. Draft edits do not change the website.
7. To remove an entry, unpublish it or turn **Show on website** off and publish.
   To change shared headings/photos, edit **What’s On → Page settings**.

For an initial example, from `studio` run
`bun run seed:events:preview` to preview, then
`bun run seed:events:development` to create it. This command is restricted to
`w789ottu/development`, creates only missing settings and one labelled test
event, and never replaces existing documents. The example is not a real event.
No production content is copied automatically.
The package commands use a Node launcher to set `PEPLOES_SEED_APPLY` explicitly: preview commands force
`0`, and development commands set `1`. Do not pass `--apply` to `sanity exec`;
the installed CLI rejects that flag. The launcher overrides inherited mode
values directly in the child environment, including on Windows.

## Journal

Category selection keeps the featured story, updates the URL and supports direct
links, Back and Forward. Changing category resets pagination; Load more appends
stories and focuses the first new story without replaying existing cards.
Exclude the featured article from its listing and the current article from its
related stories. Related stories share the category. Unknown or unpublished
articles return HTTP 404; provider failures report an error instead of a false
404. Publishing and indexing are separate editorial decisions.

### Preparing Journal content

The website reads published Sanity documents. It has no local content fallback.
Schemas alone do not populate the site. The optional development import below
creates the initial Figma content; subsequent edits belong in Studio.

1. In Studio, open **Journal → Categories**. Create the design categories below,
   keeping these URL names for the existing homepage and footer links.
2. Create and publish the articles those links target. An article needs its
   title, standfirst, date, reading time, author, category, hero image and alt
   text, intro, search description and at least one body block. Paragraphs,
   h2/h3 headings, images with captions and quotes with attribution are supported.
3. Open **Journal → Page settings** (`journal-page`). Complete the hero,
   listing labels, closing image/heading and select one published featured
   article. Publish the settings after the referenced article and category.
4. Keep **Keep out of search engines** on for design previews. Turn it off only
   for approved public articles; only those articles enter the sitemap.

| Navigation order | Category | URL name |
| --- | --- | --- |
| 1 | From Gina | `from-gina` |
| 2 | People & Produce | `people-produce` |
| 3 | Food & Wine | `food-wine` |
| 4 | Art & Place | `art-place` |
| 5 | Family & History | `family-history` |

Existing article links require `some-things-have-changed`,
`wine-things-just-happen` and `the-art-of-peploes`. The mobile homepage advertises
a different wine story from the desktop Gina card, so those destinations differ.
Publish their approved copy before enabling these journeys in a public release.

The design photographs already exist in `public/`: `peploes-seasonal-hero.jpg`
for the hub hero, `peploes-private-dining-service.webp` for the featured story,
`peploes-private-dining-steak.webp`, `peploes-visit-entrance.webp`,
`peploes-wine-dinner.jpg`, `peploes-private-dining-celebrations.webp` and
`peploes-events-cellar-room.webp` for the grid, and
`peploes-events-gathering.webp` for the closing banner and example article hero.
Upload the matching originals to Sanity and supply accurate alternative text.

### Importing the development design content

`studio/journal-content.ts` contains the hub copy, five categories and twelve
articles shown across the Journal and homepage designs. The owner approved
using the complete Growers article body temporarily for the other article
cards, whose full copy is not present in Figma. All imported articles remain
out of search engines until their editorial copy is approved.

Run these commands from the repository root using an authorized Sanity CLI
login:

```sh
bun run --cwd studio seed:journal:preview
bun run --cwd studio seed:journal:development
```

The import only targets `w789ottu/development`. Preview reads the existing
documents and validates the content and local images without uploading or
writing. Apply creates missing documents and uploads their images, preserving
existing published documents and drafts. A conflicting ID or URL stops the
import. It does not overwrite later Studio edits or publish draft-only content.

Run the import while nobody else is editing Journal content. Its conflict and
draft checks describe the state before image uploads; it does not lock Studio
or protect against another writer creating content during the import.

Both reference frames feed one catalogue. The development import assigns
Listing order 1–6 to Rooted in good relationships, A season at its best, The art
of Peploe’s, Moments, menus and memories, A room worth being in, and Bottles
worth sharing. Remaining stories follow in Load more. For existing content,
set these six Listing order values in Studio; the import preserves existing
documents. Related stories remain the newest three in the same category. The
related cards that specify only a month use its first day as their stored date. The
homepage-only wine story uses the article template's date and body until its
own copy is supplied.

`e2e/journal-fixtures.ts` is a reviewable design/testing content set, not a CMS
seed or publishing source. The hub and article frames depict different example
catalogues; the detail-only fixtures preserve those separate design scenarios.
Additional stories and body blocks are labelled synthetic and exercise
pagination, rendering and related-story exclusion. Never publish that synthetic
copy as restaurant editorial content.

## Homepage newsletter popup

The approved trigger opens the popup after the Wine section has scrolled fully
above the viewport.
The popup uses the footer's approved "A Letter from Gina" copy and shared signup
form. It adds no offer or discount.

As in Samsu, a display starts a seven-day cooldown. Closing or subscribing
suppresses future displays indefinitely in that browser. Storage contains only
markers and a display timestamp. When storage is blocked, suppression lasts for
the current visit. Another open dialog, a focused booking link, or an active
summary or form control skips the opening opportunity. Escape, the close button
and a backdrop click dismiss it and restore focus without scrolling. The accepted
message stays visible until dismissal.

Newsletter signup validates the address and submits to the configured provider.
Show acceptance only after provider acceptance. Unconfigured delivery reports
unavailable; definite failures preserve the address for correction or retry.
