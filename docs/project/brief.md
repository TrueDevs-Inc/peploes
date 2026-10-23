# Peploe's website brief

Menu implementations, approved Figma comments and the local Sanity-ready
content contract are documented in [Menu pages](menus.md).

Dedicated occasion pages, their Figma references and enquiry preview are
documented in [Private dining and events](private-dining.md).

## Book a Table design preview

The /book-a-table page follows the desktop and mobile booking frames in Figma.
Its server contract, hold timer and failure behaviour are documented in
[Booking page and the table hold](booking-page.md).
Its four steps run in browser memory: choose a date and party size, select a
sample time, enter guest details, and view the confirmation layout. The page
stays noindex. A visible notice identifies the flow as a design preview.

The booking layout and colours retain the Figma structure. Its controls and
typography use the site's smaller scale: desktop actions are 48px tall with
16px text, time choices use 18px text, and flow headings are 36px. Keep the
existing card width, column counts and responsive arrangement. Let each step
fit its content instead of retaining the design artboard's fixed minimum height.

This preview does not query ResDiary, create reservations, send email, store
guest details, or export calendar entries. The confirmation explicitly says no
reservation was made. Refreshing the page resets the preview. Menu, Visit &
Contact, telephone and email links use the existing destinations.

The available-times frame includes the two-hour return-time acknowledgement for
the sample 7pm slot. Changing the date or party size clears the previous time
selection. Guest fields validate before advancing; back navigation preserves
the entered details. First name and surname are stored independently, including
spaces within either part. Mobile displays them together in one field; switching
widths does not reinterpret the name. Returning from guest details reopens the
extra time slots when the retained selection is in that list. Booking terms remain placeholder
copy until the restaurant supplies the final terms and ResDiary is integrated.

Verify the forward and back journey, invalid guest details, contact destinations,
image loading and overflow at 1440px, 390px and 320px. Every Book a Table link,
including the homepage hero and closing banner, menu banners, and Visit &
Contact buttons, opens `/book-a-table`. Visit's Check Online Availability action
opens the same preview. Group enquiry links keep their existing destinations.

## Visit & Contact

`/visit-contact` follows the Final Pages Visit & Contact frame (`3602:4457`).
At the 1440px reference, its section heights are 604, 236, 698, 302, 419, 366
and 480px, followed by the 468px production footer. Content uses the shared
72px desktop gutters, DM Sans and EB Garamond, and the existing colour tokens.
The contact strip and dining-hours background mix 6% burgundy into warm cream.

Eyebrow rules are 48px wide and 2px high. Outlined buttons and section dividers
use 1px strokes; button corners retain their individual Figma radii. Render
button outlines with inset shadows so fractional display scaling does not round
their thickness down. The active Visit navigation underline is 2px thick.
On desktop, transport paragraphs retain their 207.25–208.25px Figma widths so
wider columns do not shorten the text or dividers.
Reservation assistance keeps its 450px action column, 394px buttons and 782px
paragraph maximum on desktop, with the original phone SVG and text arrows.

Use the original entrance photograph and illustrations exported from
Figma. The closing photograph reuses `peploes-entrance-backdrop.png`. The desktop
hero preserves the source's crop and slight vertical compression; smaller
layouts use an undistorted cover crop. Its original entrance photograph is only
765px wide. The page's review comment approves the design and notes that its
images may be improved later; it does not supply replacement photography.

There is no separate mobile Visit & Contact frame. Smaller layouts retain
16px gutters, stack the content and actions, and allow text to increase section
heights. All four Getting here descriptions use the secondary text colour.
Phone, email, directions and private dining links are active. The map
loads Mapbox GL JS automatically, matching the Samsu reference. It keeps the local
Figma map as a preview when unconfigured, loading or unavailable. The hero’s
Get Directions button opens Google Maps. The default light style uses warm cream land, muted green parks,
blue water and a burgundy location pin. Mapbox Studio styles can be supplied
through `NEXT_PUBLIC_MAPBOX_STYLE_URL`; a custom style keeps its own colours.
Set `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` to a public development token locally and
replace it with the client's URL-restricted public token for production.
Mapbox attribution stays visible. Zoom, fullscreen and recenter controls are
available; scroll-wheel zoom is disabled so the page remains easy to scroll.
Booking controls open the [Book a Table design preview](#book-a-table-design-preview).
Main navigation and footer opening-hours and location links point to this page,
using its `#opening-hours` and `#find-us` anchors where relevant. The desktop
Explore footer's Visit & Contact link uses
the same-site `/visit-contact` route so it works on every deployment.
Direct anchor links recover a missed initial browser scroll after the document
loads. Client navigation and history remain handled by the router.

Below 640px, section headings use the Private Dining phone scale of 36/44px,
with 16/24px supporting text. Transport and dining hours use 48px icons beside
left-aligned details, 16px column gaps and horizontal Soft Stone dividers.
Dining-hour meal names use 22/26px, timings 18/26px and notes 14/22px.
The opening-hours table spans the contact grid, with times aligned on the right.
Contact links have at least 44px touch targets; primary actions remain full width.
The hero image scales between 220px and 280px high, and the map has a 240px frame
that keeps the restaurant marker visible. Tablet and desktop layouts retain
their original dimensions.

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

## Site content width

Site content has a shared 1440px maximum, defined by
`--site-content-max-width` in `src/app/globals.css`. Section backgrounds and
full-width photographs fill the page. Keep the root layout full-width and put
content inside the shared `site-container` or `site-container-inset` utilities.
This applies to the homepage, menu pages, private dining pages, navbar and footer.

Both utilities use 16px gutters below the desktop breakpoint. On desktop,
the standard container leaves at least 72px on each side and the inset container
leaves at least 80px. The menu footer uses the standard 72px gutters; the
homepage footer uses the 80px inset. At the 1440px Figma reference, their content
widths remain 1296px and 1280px. At a 2400px available page width, both are 1440px wide and
centered with 480px on each side. Measure the content, not its background.
At a 1520px page width, standard content is 1376px wide and inset content is
1360px wide. At 1920px, both containers are 1440px wide with 240px side gaps.
Verify navbar, hero copy, section content and footer at the Figma reference
and wider viewports; keep intentional text-column and artwork widths separate
from the shared page gutters.

Custom split sections must respect the same content edges. Hospitality includes
its existing 72px internal offset when capping and positioning its grid. Private
dining's overview menu and wedding-hire copy use the shared maximum to calculate
their outer gutters. Wedding hire keeps its inner padding fixed on wide screens
so increasing the outer gutter cannot squeeze its text column.
Split hero photographs align their inner edge to the capped text container and
extend outward to the page edge, keeping text clear of the photograph.

Wine keeps its 748px
text column. Hospitality caps its text at 783px and reserves a separate artwork
column on desktop, with a 32px gap and the shared left gutter. Stories follows the
source frame's fixed 636px columns and 28px gap, shrinking those tracks on
narrower desktops without stretching them on wider pages. At 1440px its
desktop grid extends 4px beyond the 1296px content width. Its
right-hand cards similarly extend 4px below the 640px left card; preserve this
source geometry when comparing the design.

The navigation and features use inset rules so strokes do not change their
76px and 214px desktop heights or shift centered controls. Compare against
the browser's available page width, excluding the scrollbar gutter, at the
same zoom and pixel density. Check mobile, tablet, laptop and wide desktop
layouts for horizontal overflow and undistorted images after width changes.

## Mobile homepage reference

The 390px Final Pages mobile homepage (`3395:17700`) owns the phone layout.
Below 640px, use 16px gutters with the reference type sizes, vertical spacing,
image frames and stacked full-width actions. Keep the existing tablet and desktop layouts.
At the reference width the page is 11,526px tall, including the 72px header.
Sections may grow when narrower screens or enlarged text need more room.

Use the mobile entrance and dining-room photographs exported from Figma.
The reception artwork reproduces the mobile frame's image scaling. Photographs,
including the entrance, retain their aspect ratio and crop to their frames.
Event and occasion copy variants live beside their desktop content in the local
catalogs.
Mobile Stories uses the From the cellar eyebrow over the “Wine things just
happen.” heading and omits the art description.
The closing booking heading is upright on mobile and retains its desktop italic.

Compare section positions, line breaks, crops and overlays at 390px, then check
narrow phones, tablet and desktop for overflow. Book a Table opens its design
preview. Homepage telephone actions use the shared restaurant contact. Event
buttons open the existing seasonal event templates; menu, story, private dining
and contact links open their matching pages. Unbuilt editorial pages, Gift
Vouchers and newsletter subscription remain inactive.

## Homepage interaction previews

Enabled links, buttons, selects, disclosure summaries and choice controls use a
pointer cursor across the site, including menu dropdowns and the wine-index close
button (issue #27). Text-entry fields retain their text cursor.

Remaining placeholder actions use inert `type="button"` controls with `aria-disabled="true"`
and no click handlers. They remain focusable and show the Figma hover styles
without navigating, booking or submitting. The newsletter form validates email
on Enter or Subscribe, then explains that signup is unavailable. It does not
send or store the entered address.

The existing shared button owns the homepage's brand variants: primary,
primary inverse, secondary inverse, editorial text, navigation and contact.
Use the Figma primary hover colour `#68181E`, 90% cream for inverse buttons,
a 12% cream tint with a cream border for inverse outlines, underlines for text
links, and a 6%
burgundy fill with a 60% border for contact actions. Navigation text changes
to burgundy with an underline. Interactions use the 160ms token and respect
reduced motion; buttons and images do not scale on hover, except the three
Groups and occasions and What's On card images, which use a 300ms, 5% zoom.

Homepage action arrows use Lucide's 16px `ArrowRight`, matching the footer
Subscribe button, including the menu category arrows. Keep existing button
padding when adding direct SVG children; the shared Button's icon defaults
otherwise change it. Mobile navigation chevrons remain separate glyphs.

What's On, Groups & Occasions, Menu & Experience and More to Explore card
images open the same destination as their text actions and use a 300ms, 5% zoom.
Hovering an image also underlines its own text action and moves its arrow 3px
right. Keyboard focus on the image link also moves the arrow. Reduced motion
disables image zoom and arrow movement. CMS menu highlights without destinations
remain non-interactive.

Verify hover and keyboard focus, unchanged layout, inactive placeholder clicks,
and working contact destinations when changing these controls.

## Navigation implementation

The initial navbar follows the Final Pages desktop navigation in Figma
(`3131:11099`), including the yellow note requiring a sticky header. It uses the
existing brand colours, DM Sans, 44px control targets and a centered logo.
The logo artwork comes from the [existing website](https://peploes.com/), stored
locally and tinted with the Ink token using a CSS mask. Preserve its aspect
ratio; replace it with the exact Figma vector when that export is available.

The desktop Menus dropdown follows the updated Nav / Shelf / Menus / Light
frame (`3732:6583`). Hovering over Menus or pressing ArrowDown opens the shelf;
clicking or pressing Enter navigates to Lunch. The shelf overlays
the page below the 76px header without moving the logo or page content. At
1440px, the Warm Cream panel is 352px high with 36px vertical padding, 72px
side gutters, a 360px introduction and a 56px gap before the destinations.
Both desktop shelves cap their height to the available viewport space below
the header and scroll when needed.
Six active menu links sit in three 146px-high columns, paired Lunch/Wine,
Dinner/Cocktails and Pre-Theatre/Seasonal, with 40px column gaps, 24px row gaps
and 1px Soft Stone dividers after the first two columns. The introduction and
links omit the old descriptions; homepage menu content stays unchanged.
Verify pointer travel into the panel, keyboard activation and tab order, Escape
with focus restoration, outside-click and focus-leave dismissal, short-viewport
scrolling, reduced motion and dismissal when switching to mobile navigation.
The desktop Private Dining & Events dropdown follows the updated Nav / Shelf /
Groups / Light frame (`3732:6657`): a 352px panel with a 320px introduction,
56px column gap and three photo destinations with 132px images and 36px gaps.
The introduction replaces its description with a 44px-high Explore text action
that opens the private dining overview. The first destination is Celebrations &
Gatherings; the shared mobile navigation uses the same label. The local shelf
catalog owns its copy and the crops exported from Figma. Destination titles turn burgundy with a 32px underline on hover;
retain visible keyboard focus and the shared reduced-motion-aware duration.
The destinations now open their dedicated pages. On desktop, clicking Private
Dining & Events opens the overview; hover and Arrow Down open the shelf. On
mobile, the entire row toggles the submenu, like Menus. The first submenu link,
Overview, opens `/private-dining`. See
[Private dining and events](private-dining.md) for the shared page sections.

Both desktop shelves share one open state so switching triggers replaces the
visible panel. Verify switching by pointer and keyboard as well as dismissal.
The navbar renders shelf content and fonts on the server and passes the result
to the interactive navigation. Check font compilation in the dev server as well
as the production build.

Below the desktop breakpoint, navigation follows the Design System's light
mobile variants: closed (`3041:1863`), menu open (`3041:1812`) and Menus expanded
(`3041:1718`). The header is 72px tall with 16px gutters, the logo and a compact
Book button. The open menu's close icon occupies the same position as the
hamburger icon, including when the browser reserves scrollbar space.
The full-screen menu expands Menus and Groups & Occasions inline, then shows
Gift Vouchers and the People make Peploe's brand line. Contact details remain on Visit & Contact.
Preserve the 44px minimum control targets.

Unbuilt page links and Gift Vouchers remain inactive placeholders. Book opens
the booking design preview; Home and Visit & Contact links work. Keep modal focus
containment and restoration, Escape and close-button dismissal, scroll locking
and automatic dismissal at the desktop breakpoint. Verify both accordion
groups, narrow screens, short viewports, enlarged text and overflow with the
menu open and closed.

## Footer implementation

The shared footer uses Figma Footer / Production desktop (`3041:2359`) and the
mobile homepage footer (`3395:17877`). Desktop has brand, Explore, Contact and
newsletter columns. Mobile shows brand, newsletter, expanded Explore,
Occasions and Peploe's navigation, then contact details, socials and legal links.
It uses the existing local logo and brand tokens, DM Sans body text and
EB Garamond headings.
Footer dividers, mobile row borders and the email field rule use 1px thickness.
The three burgundy heading underlines are 32px wide and 2px high, matching Figma.

Telephone and email links are active. The footer lists Privacy Policy, Terms,
Accessibility, Booking & Cancellation and Cookie Settings in that order. The first
four open their policy pages; Cookie Settings opens the Cookie Preferences
modal. Booking & Cancellation Terms retains its existing URL. Legal links may
wrap on narrow screens and when text is enlarged.
On mobile, legal links stack vertically and the copyright is centered.
The modal follows the desktop and mobile Cookie Preferences designs: necessary
cookies are always active, optional Analytics, Performance and Marketing choices
are saved individually, and Accept All or Reject non-essential saves and closes.
Escape and the close control restore focus to Cookie Settings. Unavailable
storage shows a save error and keeps optional tracking denied.
On mobile, the modal uses a compact rounded card with space around it, smaller
type and a 44px close target. Tapping outside the card also closes it and
restores focus; touches inside the card keep its controls usable.
All four policies use the shared `src/app/[slug]/page.tsx` route and the
[Terms & Conditions template](https://www.figma.com/design/0fEgisdlNBr23CuWHJOTNC/Peploe-s?node-id=3837-20047),
as requested in Rabia's Figma comment #68. Hero geometry, typography, the
"On this page" contents navigation, section layout and help panel are shared.
The desktop reading column stays within the template's 936px section width,
leaving 824px for copy after the number column and gap. Section headings use
32px type with 38px line-height and an 8px gap above body copy; section dividers
use the 1px soft-stone token. Paragraphs wrap naturally without forced breaks.
On mobile, the contents navigation is expandable, numbered headings sit above
full-width paragraphs, and contact links stack as outlined touch targets. The
24px side gutters and existing fonts match the other mobile pages. Tablet
reading content is capped at 720px; the desktop template remains unchanged.
Only policy content, metadata and photograph crops vary, with local content in
`src/lib/constants/policies.ts`. Existing policy URLs are preserved; unknown
slugs return 404. Figma comment #76 adds two related policies below each contents
list: Privacy links to Terms then Accessibility; Accessibility links to Privacy
then Terms; Terms links to Booking then Privacy; Booking links to Terms then
Privacy. The links share the contents disclosure on mobile.
Footer Instagram and Facebook links use the restaurant
profiles linked from [the official website](https://peploes.com/) and open in a
new tab. Other unbuilt navigation destinations remain inactive. The newsletter
email field has an accessible label and inline completion for common email
domains. Tab accepts the completion, and Escape dismisses it. No popup suggestion
list is shown; browser autocomplete and the native datalist are disabled.
Focus changes the existing bottom border to 2px burgundy
without adding another line. Enter and Subscribe show an error for empty
or malformed addresses, including addresses without a dotted domain. Valid input
shows that signup is unavailable pending integration; no email is sent or saved.
Opening hours and contact details follow the design and should be confirmed by
the restaurant before launch.

When changing the footer, verify the desktop columns, mobile reading order,
phone and email targets, keyboard focus, 200% zoom and horizontal overflow.

## Hero implementation

The homepage hero follows the Final Pages hero and entrance group (`3131:11100`).
The desktop photo panel is 780px tall with EB Garamond headings and DM Sans
supporting copy. Book a Table opens the booking design preview; Call Peploe's
uses the restaurant's telephone number.
On phones below 640px, hide the supporting description and use 46px headings
with stacked full-width buttons. The photo panel fills the visible viewport
below the 72px navbar, so the entrance photograph starts after scrolling. Allow
the panel to grow when short screens or enlarged text need more space. The
520px entrance photograph has a separate 74px caption below it.

The restaurant photo and transparent entrance artwork were downloaded from
Figma. The entrance uses its original Figma backdrop behind the cutout. Narrow
screens use the mobile design's vertical hero gradient over the centre crop.
The desktop entrance retains the yellow note's gentle fade and rise through
the existing scroll-reveal component and reduced-motion styles.

When changing the hero, compare desktop line breaks, photo crop, overlays and
the entrance overlap with Figma. Check image loading, narrow screens, sidebar
overlap, scroll reveal and reduced-motion styling.

The desktop hero, menu and wine backgrounds advertise the viewport width in
their responsive image sizes. Event cards and booking artwork follow their
responsive image boxes. The hero background retains larger mobile and tablet
sources for its tall crop. The Gina and Sunday source photographs are only
243px wide; larger originals are needed for sharper rendering on high-density
screens.

## Restaurant features implementation

The four features directly below the entrance follow the Final Pages section
`3131:11112`. They use the original 48px SVG illustrations exported from Figma,
22px EB Garamond headings and 14px DM Sans descriptions on Warm Cream. The
desktop row has 48px vertical spacing and a Soft Stone top border. It becomes
two columns on tablet and one column with 13px descriptions on phones.

When changing this section, compare its copy, icon order and desktop spacing
with Figma. Check that every illustration loads and that text wraps without
horizontal scrolling at narrow widths and enlarged text sizes.

## Menus introduction implementation

The homepage menus introduction follows Final Pages `3131:11245`. It uses the
dining-room photograph exported with Figma's crop, a 370px desktop image band,
the Our Menus eyebrow, and six categories in their design order. The content
uses the shared brand fonts, colours and content container. The category grid
adapts to three and then two columns on tablet, and six full-width ruled rows
on phones. Mobile uses its separate 238px-high dining-room photograph.
The phone introduction uses a 12px eyebrow, a balanced 38px/40px heading
(34px/38px below 360px), and 16px/24px body copy with paragraph wrapping
that avoids a short final line. The eyebrow-to-heading gap is 20px; the
heading-to-body gap is 12px. Tablet and desktop retain their existing sizing.

The yellow note (`3131:11686`) specifies structured web menu categories and
CMS-editable content. This section keeps the category actions and Explore Our
Menus button inactive, following the approved placeholder behaviour. Menu pages
and CMS integration remain future work. No PDF destinations are introduced.

When changing this section, compare the photograph's crop, heading, category
spacing and button with Figma. Verify image loading, placeholder controls and
text wrapping without horizontal overflow on narrow screens.

## What's On implementation

The homepage section follows Final Pages `3131:11285`: a dark burgundy
background, one featured event and a column of smaller cards. It uses the
original Figma photographs, EB Garamond headings and DM Sans supporting copy.
The cards stack on narrow screens.

Each event image opens the same destination as its text action and gently zooms
on hover or keyboard focus. Preserve its resting crop and disable the zoom when
reduced motion is requested.

The adjacent yellow note (`3131:11688`) calls for CMS-managed campaigns that
can be published or removed without changing the homepage layout, with cards
linking to their campaign pages. For this phase, the contributor requested
local event data. Homepage event actions now open the existing Lobster Season,
Italian Wine Dinner and Sunday at Peploe’s templates. Edit the ordered `whatsOnEvents` array in
`src/lib/constants/whats-on.ts` to add, remove or reorder cards; the first entry is
featured. An empty list hides the section. The Figma entries are preview copy,
not verified current events. Event pages retain the approved placeholder copy;
CMS publishing and final campaign content remain future work.

When changing this section, compare its image crops, typography and desktop
spacing with Figma. Check image loading, stacked cards, long text and horizontal
overflow at narrow widths. Keep placeholder actions inactive until their
destinations exist, and verify zero, one and multiple event layouts when the
content source changes.

## Wine introduction implementation

The section immediately after What's On follows Final Pages `3131:11325`:
the wine-service photograph, a dark horizontal gradient, the Wine at Peploe's
eyebrow and the heading "Bottles worth lingering over." It reuses the same
photograph as the wine-dinner card, shared fonts and existing button component.
Its text column is capped at 748px with 80px desktop vertical padding. Phones
use the mobile vertical gradient, 720px minimum height and stacked buttons;
Stories from the cellar uses an outline on mobile.

The yellow Wine journey note (`3131:11692`) sends Explore the Wine List to a
structured wine menu and Stories from the cellar to related Journal content
when available. Both actions remain inactive placeholders until those
destinations are built, following the current homepage convention.

When changing this section, compare the background crop, gradient, line breaks
and stacked actions with Figma. Check image loading, mobile text contrast,
horizontal overflow and the two inactive controls.

## Groups and occasions implementation

The homepage section follows Final Pages `3131:11372`: a dining-room photo
banner with a dark horizontal gradient, followed by three cards on Warm Cream.
It uses the original Figma photographs, shared fonts and existing buttons. At
1440px, the banner is 410px tall. The card row (`3338:682`) uses three 433px-wide
cards with 28px gaps, 160 by 185px images, 213px text columns and
full-height left dividers. The cards stack on smaller screens. Phones use a 560px banner
with a vertical gradient and horizontal cards with 140px-wide photos
(124px below 360px). Phone dividers and inline card padding are hidden.
Descriptions contain at most 12 words. Desktop images are 160 by 185px from
1280px. Below that, images use a 3:4 ratio minus 2px of height on tablets and
4px on phones, with 40px between phone cards.
Mobile card headings use 22px/28px; desktop stays 24px/30px.
The three 1264 by 848 landscape source photos use crop-aware loading sizes so
portrait cards retain enough decoded pixels on high-density displays.
The fresh Figma row download confirms the celebrations original is unchanged;
its corporate and wedding fills are flattened 160 by 187px images. Retain the
matching larger source photos rather than replacing them with those thumbnails.

The yellow Distinct commercial journeys note (`3131:11700`) requires separate
pages and enquiry experiences for Groups & Celebrations, Corporate & Exclusive
Hire and Weddings. These remain distinct cards with local content. The banner
button now opens the private dining overview. Each card image and its Explore
action open the same dedicated page. Images gently zoom on hover or keyboard
focus, with motion disabled for visitors who prefer reduced motion.
See [Private dining and events](private-dining.md)
for the page layouts and enquiry preview limits.

When changing this section, compare the photograph crops, gradient, typography,
card order and spacing with Figma. Verify image loading, four destination links,
mobile reading order and wrapping without horizontal overflow.

## Stories implementation

The homepage Stories section follows Final Pages `3131:11334`, with the original
Figma photographs, a large Our Story card, a People & Produce card and two smaller
Journal cards. It uses the shared brand fonts, colours and content container,
with the design's individual image gradients. The cards stack on narrow
screens, with a vertical gradient behind the producer copy on mobile.

The yellow Editorial gateway note (`3131:11698`) sends Our Story to its dedicated
page, the other cards to Journal categories or articles, and Explore the Journal
to the Journal hub. Discover Our Story now opens `/our-story`. The Journal
actions remain inactive placeholders until those destinations are built.

When changing this section, compare the card arrangement, image crops, line
breaks and overlays with Figma. Check all four images, mobile text contrast,
placeholder controls and horizontal overflow at narrow widths.

## Seasonal / What’s On implementation

`/seasonal` follows Final Pages `3821:14668`: the cocktail hero, monthly event
diary, terrace feature and closing invitation. It is separate from the existing
seasonal menu at `/menus/seasonal`. At the 1440px reference width, the sections
are 437, 1729, 256 and 444px high. The diary uses 72px gutters, 45px month bars,
224px event rows and 1px Soft Stone dividers. Its empty right column and the
absence of decorative eyebrow rules are intentional.

The hub reads published Sanity `seasonalEntry` documents. Each entry selects
Campaign, Event or Menu Moment; a separate category label supports Rugby,
Wine Dinner and other programme labels. Start/end dates control the upcoming
diary in Europe/Dublin time. Entries are grouped by month and year internally,
with the original month-only visible headings, sorted by start date, and shows the configured empty message when no dates remain. Past detail
pages remain accessible until unpublished or disabled. No static event fixtures
are shown when Sanity is empty or unavailable.

The `whatsOnPage` singleton controls the hero, diary introduction, optional
terrace feature and shared closing invitation. Until settings are first
published, existing shared design copy is used. Invalid settings and API failures
reach the error boundary instead of silently showing fallback events.
Book a Table opens the existing `/book-a-table` page. Contact Us opens Visit & Contact. Navigation and footer links, plus the homepage’s
“View what’s on” action, open the new hub.

Use the three original Figma photos. The terrace source is only 243×244px;
it needs an approved larger source for a sharp desktop image. Preserve its
natural proportions when cropping. No separate mobile frame is supplied. Below
640px, follow the homepage and menu pages: 16px gutters, 48px hero type, 42px
section headings, 16px body copy and stacked full-width invitation buttons.
Photo banners use vertical overlays with room above the text; their height grows
with the content. The diary retains its date column, 1px horizontal row dividers
and a 1px Soft Stone vertical rule beside each date. Use compact month headings
and 44px minimum action targets. The terrace photo uses a 3:2 crop.
The shared invitation follows these phone styles on individual events too;
tablet and desktop layouts retain their existing sizing. Check the desktop
line breaks, image placement, mobile navigation,
image loading and horizontal overflow when changing this page.

### Individual event template

`/seasonal/[slug]` follows Final Pages `3889:13660`, “Peploe’s luxury dining
campaign.” Comment #69 identifies it as the page for individual events. The
CMS implementation uses this layout for each published entry's own content.
New slugs work without a code change or rebuild. Unknown, unpublished or
disabled entries return HTTP 404 and show the not-found page. A route-specific
proxy checks only the published document’s existence before the shared loading
boundary can stream a response. This adds one small Sanity read per detail
request; full content is still loaded once per render. Provider failures reach
the page error boundary, not a false 404. Search indexing is off by default for test content.
Approved entries with indexing enabled appear in the sitemap; metadata uses
their title, description and hero. No unverified Event structured data is emitted.

The template includes optional event information, menu cards, a story block,
gallery and related content, followed by the existing invitation banner.
At 1440px, the eight section heights are 416, 166, 704, 470, 522.674, 372,
262 and 444px. Use 72px desktop gutters, 48px information icons, 2px eyebrow
rules and the original Figma photography. Keep image proportions natural;
the hero uses a uniform cover crop instead of the source design’s slight
vertical stretch. Two gallery sources are only 243px wide and need approved
larger originals for sharper desktop rendering.

The Menu & Experience container is capped at 1296px. Its heading is 64px/65px,
with 20px gaps between the eyebrow, heading and body, then 48px before the cards.
At the 1440px design width, the story has a 704px content column, a 48px gap and
a 688px image. Its text block is 600px wide, with 54px top and 48px bottom padding,
a 72px/73px heading and 22px/31px paragraphs. Both headings use -1px letter spacing.
Keep desktop type sizes fixed; allow narrower columns to wrap and the section
to grow beyond its 470px minimum rather than shrinking or clipping the copy.

Make an Inquiry opens `/private-dining#enquire`. Contact Us opens Visit & Contact.
Both linked card sections
open the editable URL entered for each card. Legacy event references still omit
unpublished or disabled destinations; explicit URLs are not availability-checked.
Each diary entry can override its link label; leaving
it empty uses the shared diary label.
Book this Experience and Book a Table open the existing `/book-a-table` page.
These links do not preselect an event or submit a reservation. Invitation buttons grow to fit CMS labels and
wrap onto another row when needed. On phones they remain full-width; long labels
wrap inside the button instead of overflowing its border.
At tablet widths, the related row scrolls with touch or its arrow controls.
No separate mobile design is supplied. Below 640px, use the shared 16px
gutters, 42px/44px section headings, 16px/24px body copy and 12px eyebrows.
Stack the menu cards, story and gallery; use 3:2 menu and story photos with
40px section padding. Keep information icons at 40px and invitation buttons
stacked at full width with at least 44px touch targets. Hide carousel controls
on phones.

More to Explore now follows the homepage Groups & Occasions card layout: a
160 by 185px image, 20px image-to-copy gap, vertical divider,
24px/30px heading and 14px/21px description on desktop. Both sections share
their card styles.
Desktop images are 160 by 185px from 1280px. Below that, images use a 3:4 ratio
minus 2px of height on tablets and 4px on phones, with 40px between phone cards;
cards can grow with copy.
Below 1280px the carousel shows one card at a time. Phones show a vertical list with
horizontal image-and-copy cards and 140px-wide images (124px below 360px).
Mobile card headings use 22px/28px; supporting text remains 14px/21px.
Related-card actions use 15px text on phones and 16px from 640px. Homepage
occasion actions retain 16px text.
Phone dividers and inline padding are hidden to give images more room. Card
descriptions have a 12-word maximum, enforced in Studio for related cards;
legacy event references use only the first 12 words of their summary.
Each image links to the same URL as its action and uses the homepage
300ms zoom transition, disabled for reduced motion.
Check published event routes, unknown-route 404,
image loading, navigation, carousel controls and horizontal overflow when
changing this template.

### Figma CMS notes and reference alignment

Comments #63 and #65 confirm Campaign, Event and Menu Moment variants and
support for rugby fixtures throughout the year. In comment #69, Gina asks to
edit all event elements; Rabia confirms editable content and optional sections
for smaller events. The six sticky notes alongside the individual template
specify optional information fields, linked menus or on-page menu highlights,
an optional story section, three to five gallery images, and related cards that
can point to events, menus, Journal articles or group pages.

The implementation keeps the fixed section order, typography, gutters, image
crops and responsive CSS. Legacy highlight cards still render without an action,
but Studio only offers linked cards for new content. Extra
gallery photos use the existing grid. Samsu's Sanity setup is a reference for
editorial documents, references, singleton settings and mapping published data
to fixed UI components; Peploe's keeps its existing provider, validation and
service boundaries. It does not copy Samsu's project configuration or content.

The development diary currently shows the homepage’s three events: Lobster Week
Returns, A Seasonal Wine Dinner and Sunday at Peploe’s. Each uses the same full
template with dummy event information, two linked menu cards (View Menu and Find
Out More), a story, three gallery photos, an invitation and three related cards.
Earlier demo entries were removed after saving local recovery backups. All demos use
`noIndex`. This is a content selection, not a three-event limit: new published
entries get their own URL and appear in the diary without a code change.
Real event dates and copy must be supplied and published before launch.

Empty optional section objects and sections without any cards, paragraphs or
photos are omitted. Empty information rows are omitted too. Non-empty sections
still require valid text, photos and destinations. In Studio, unset an unused
section; complete its required fields when adding content. Both Menu & Experience
and More to Explore use editable cards with an image, title, description, button
label and required Button URL. URLs accept site paths, anchors and full HTTP(S)
website links; blank or unsafe destinations prevent publication. Clients are
responsible for linking to an available page. Legacy menu/event references remain
readable, but new cards use explicit URLs.

### Editing What’s On in development

1. Open this branch's Studio. Choose **What’s On → Events and campaigns**.
2. Create an entry and choose Campaign, Event or Menu Moment.
3. Fill in the title, URL name, start date, category, diary description and page
   introduction. Upload a photo and give it descriptive alternative text.
4. Use an end date for a campaign spanning several days. The dates control the
   diary; the optional Event information fields control the displayed details.
5. Optional sections may be left unset. When adding one, complete its required
   fields. Add linked cards in Menu & Experience or More to Explore and fill in
   each card's Button URL, such as `/seasonal/lobster-season`, `/menus/dinner`
   or `https://example.com/event`. Publish destination pages before linking to
   them. Galleries accept three to five photographs.
6. Keep **Keep out of search engines** on for testing. Click **Publish**, then
   refresh `/seasonal` and click the entry. Draft edits do not change the website.
7. To remove an entry, unpublish it or turn **Show on website** off and publish.
   To change shared headings/photos, edit **What’s On → Page settings**.

For an initial example, from `studio` run
`bun run seed:events:preview` to preview, then
`bun run seed:events:development` to create it. This command is restricted to
`3ggctsor/development`, creates only missing settings and one labelled test
event, and never replaces existing documents. The example is not a real event.
No production content is copied automatically.
The package commands use a Node launcher to set `PEPLOES_SEED_APPLY` explicitly: preview commands force
`0`, and development commands set `1`. Do not pass `--apply` to `sanity exec`;
the installed CLI rejects that flag. The launcher overrides inherited mode
values directly in the child environment, including on Windows.

The What’s On branch builds on `feat/ali/sanity-setup`
([PR #14](https://github.com/TrueDevs-Inc/peploes/pull/14)). Its PR targets
`dev`, so the diff includes the parent menu CMS commit until that work is
integrated. Merge the menu CMS work first, then update this branch against
`dev` and review the remaining diff.

The homepage retains its existing event cards and checks their destinations
against published entries on each request. Cards without a published destination
open the What’s On hub. Publishing or unpublishing an event updates these links
on the next page load without a rebuild. CMS failures reach the error boundary.

The Studio code generation dependency patch from PR #14 removes the vulnerable
`braces` dependency paths. Keep the patch and overrides together as described in
[the Studio README](../../studio/README.md#code-generation-dependency-patch),
and retain both high-severity audit gates.

## Our Story implementation

`/our-story` follows Final Pages `3609:5115`: the dining-room hero, history
timeline, Georgian building, founder, mural, archive, next generation and
closing service photograph. It uses the existing brand fonts, buttons and
production footer. Desktop section minimum heights at 1440px are 546, 457, 600,
390, 444, 516, 340 and 390px. The mural and closing service banners use matching
48px top and bottom padding (issue #28), growing beyond their minimum heights
as needed. Narrow layouts stack the content with 16px gutters,
a vertical timeline and readable overlays; Figma has no separate mobile frame.
Main headings use 38px type on phones and 35px below 360px, with 42px and
40px line heights respectively. Smaller timeline titles retain their existing
scale. Tablet and desktop typography and image crops remain
unchanged. Page styling lives in Tailwind classes in the Our Story component.
At the 1440px reference width and above, the philosophy column stays 525px
wide beside a flexible timeline, with a 100px gap. The timeline has 22px top
padding, so its dates and divider do not move when the descriptions reflow.
The desktop descriptions keep Figma's 199.667px text width and 4/5/4 line
breaks even when the timeline columns grow. Mobile paragraphs remain fluid.
From 1280px, the founder section keeps a 490px copy column and a 68px gap
beside the portrait. The portrait fills the remaining width, preserving the
390px section height and the paragraph's five authored desktop lines.
The next-generation section also keeps its 527px copy column, 16px portrait
gap and five authored lines from 1280px, with 48px vertical padding inside
the 340px section. Its paragraph wraps naturally on smaller screens.
The closing banner retains its 60px heading and 20px body text on desktop.
From 1440px, anchor the photograph to the wrist beneath
“dining” on the third body line. Scale the image uniformly around that point
to fill the banner as it widens, preserving the word-to-hand alignment.

The design gives 2003 as the opening year; comment #47 requests Barry Canny
alone in the founder references. The page and public site description use those
facts consistently. The founder and Gina image areas are still empty grey placeholders
in Figma. Preserve those areas until approved portraits are supplied. Comment
#60 says archive pieces will be supplied; the current archive artwork remains
the design's temporary image. The building illustration and mural are also
limited by the resolution of the supplied Figma sources.

Our Location opens Visit & Contact at Find Us. Navigation, footer and the
homepage family card open Our Story. The mural, archive and booking actions
remain inactive placeholders until their destinations are built. Browser tests
cover these journeys, image loading and narrow-screen overflow. Compare crops,
type sizes, line breaks, 2px eyebrow rules and 1px button outlines with Figma
when changing the page.

## Human Hospitality implementation

The homepage section follows Final Pages `3131:11401`, with the burgundy heading
"Would you prefer to speak to us?", a faded Warm Cream background and the
original transparent reception artwork from Figma. Its text column is capped
at 783px with 80px vertical padding. From 1280px, the reception crop occupies a
separate column capped at 563px, with a 32px gap so the copy cannot overlap it.
The section grows with the text. The image crop keeps the lamp, telephone and
reception sign in their design positions. Smaller screens stack the copy above
the artwork and let the contact buttons wrap.

The yellow Booking fallback note (`3131:11706`) requires functional phone and
email actions on desktop and mobile. These use `tel:` and `mailto:` links, with
the same shared contact details as the footer. They reuse the existing button
component and contact icons, with 44px targets and visible keyboard focus.

When changing this section, compare the heading sizes, image crop and spacing
with Figma. Verify image loading, contact destinations, keyboard focus, enlarged
text and horizontal overflow on narrow screens.

## Closing booking banner implementation

The banner immediately before the footer follows Final Pages `3131:11412`.
It uses the dark burgundy background, original botanical illustration at 35%
desktop opacity, 48px EB Garamond heading and 16px DM Sans supporting copy.
The phrase "from the city." uses the font's regular italic style. At 1440px,
the banner is 318px tall with 72px vertical padding.
On narrow screens the text wraps, margins reduce and the illustration fades
to keep the copy readable.

Book a Table opens the [booking design preview](#book-a-table-design-preview).
The nearby Booking fallback note (`3131:11704`) requires
working phone and email options when online availability is missing. The
footer retains those active links; ResDiary integration remains future work.

When changing the banner, compare the italic text, botanical crop, background,
spacing and button with Figma. Check artwork and font loading, narrow-screen
wrapping, horizontal overflow and navigation to the booking preview.
