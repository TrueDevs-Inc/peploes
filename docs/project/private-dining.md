# Private dining and events

The pages use the Final Pages designs in [Peploe’s Figma file](https://www.figma.com/design/0fEgisdlNBr23CuWHJOTNC/Peploe-s?node-id=3480-3107).

| Route | Design |
| --- | --- |
| `/private-dining` | Groups & Occasions, desktop `3480:3107` and mobile `3494:7222` |
| `/private-dining/groups-celebrations` | Groups & Celebrations, `3526:11759` |
| `/private-dining/corporate-events` | Corporate Events & Exclusive Hire, `3526:12248` |
| `/private-dining/weddings` | Weddings, `3527:12848` |

Only the overview has a separate mobile frame. The three detail pages use its
24px phone gutters, stacked content, type scale and full-width controls.
Desktop references are 1440px wide; the overview phone reference is 390px.
Sections can grow at narrower widths and with enlarged text.
Below 640px, the overview hero has a minimum height of one small viewport
(`100svh`) and grows when its copy needs more room.

The desktop Private Dining & Events navigation shelf links each occasion image
and its title to the matching detail page. Image links support keyboard focus
and activation.

Below 640px, Every Reason to Gather and Good to Know use 48px icons beside
their text, a 16px column gap and horizontal Soft Stone separators. Their item
titles use 22/26px type, with 16/24px lists and descriptions. Made Personal
uses full-width detail copy and horizontal cream dividers in place of the
desktop indentation. These three sections use 16px eyebrow spacing and 32px
between their introduction and items. They retain the existing 24px gutters,
section headings and content. These are responsive adaptations of the desktop
design; tablet columns and desktop layouts are unchanged.

The celebrations hero uses a 480px desktop text column and 48px gap before
the full-bleed photograph. Its 383px reference height includes 48px top and
bottom padding, with 16px between content blocks. The heading is 56/55px;
the description is secondary-colour EB Garamond at 18/23px. Its eyebrow rule
is 2px and its primary action is 223 × 44px.
The column stops growing on wider screens and remains fluid on smaller desktops.

The celebrations occasion categories use medium-weight EB Garamond at 22/23px
on desktop and DM Sans at 16/23px for their lists. Their text measures stop at
226.4px, preserving the reference wrapping on wider screens. The last list keeps
the design's break before “and family occasions”. The final desktop column has
extra width to keep “Seasonal & personal occasions” on one line. Columns share
the remaining width after padding and 1px dividers; the eyebrow rule is 2px.
Each occasion list item has 8px vertical padding, with Soft Stone dividers between
items to keep individual occasions distinct at every screen width.

The celebrations “Made personal” section follows [Personal touches in Figma](https://www.figma.com/design/0fEgisdlNBr23CuWHJOTNC/Peploe-s?node-id=3526-11891).
At 1440px, its columns are 580px and 668px with a 48px gap and 48px vertical
padding. The eyebrow rule is 2px; the title is regular EB Garamond at 48px
with 104% line height. Introductory copy is 18px DM Sans with 140% line height.
The details start 14px below the left column and have 24px between them.
Their medium-weight EB Garamond titles use 23px type, 100% line height and
29px text frames, followed by an 8px gap and 15px DM Sans at 140% line height.
Each detail has a 1px inset Soft Stone divider and 24px left padding.
Desktop text measures stay capped at the reference widths on wider screens.
The section keeps its responsive stacked layout below 1024px.

The celebrations Group Dining section has a 624px desktop text column, a
46/48px heading and secondary-colour EB Garamond copy at 18/23px. The copy sits
16px below the heading; menu cards follow after 48px. Each card is 296 × 75px
at the reference width, with a 32px gap, 2px corners and a 1px inset burgundy
border. Labels use 13/17px DM Sans and links use medium-weight 16/24px type.
The original portrait photograph retains the frame's stretched crop and
three-stop cream gradient. These styles are scoped to celebrations; corporate
menu presentation keeps its own layout.

The celebrations Good to Know section uses a regular 48/50px heading,
medium-weight 22/24px item titles and 14/20px DM Sans descriptions on desktop.
The titles and descriptions have a 6px gap. Its 48px icons, 22px icon-to-text
gap, 1px inset dividers and 2px eyebrow rule follow the reference. The remaining
three items fill equal desktop columns after applying comment #50; their text
widths retain the reference wrapping. Mobile and tablet keep the stacked and
two-column layouts.

The celebrations enquiry follows [Let’s talk about your celebration in Figma](https://www.figma.com/design/0fEgisdlNBr23CuWHJOTNC/Peploe-s?node-id=3526-11992).
Its desktop columns are 598px and 650px with a 48px gap. The form's inset
divider spans the full 603px section, including its 48px vertical padding.
The left and right headings use 44/46px and 34/35px EB Garamond respectively.
Fields use secondary-colour 16/24px DM Sans and 38px desktop control heights.
All enquiry variants use 4px field corners, pointer cursors for date and select
controls, and an inset neutral focus indicator without an outer outline.
Forced-colors mode retains a distinct keyboard outline. Occasion selects use
the styled native picker where supported, with native fallbacks.
Picker placeholders are excluded from the menu. Hovered and selected options use
the same pale background; keyboard focus uses an outline. Pickers prefer opening below the
field with a small gap and retain browser positioning fallbacks near screen edges.
The date and guest fields have a 12px gap.
Consent uses a 22px checkbox and 14/21px text; contact buttons have 2px corners,
and Send Enquiry is 161 × 44px. Privacy-policy text links to `/privacy-cookies`
and retains the design styling. Submission uses the connected enquiry service described below.

The overview's occasion cards use 416 × 216px image frames and 24px gaps at the
1440px reference. Their photographs retain the Figma crops toward the bottom of
the original images. Desktop copy has a 12px left inset from the photographs,
and card numbers are 12px. The 1.3px dividers use 70% opacity, span the full card
height and sit halfway across the gaps, with no dividers at the row's outer edges.
The corporate title breaks
before “Exclusive Hire” on desktop. The eyebrow rule is 2px on desktop and 3px
on mobile. At 390px, the image frames are
342 × 380px with 24px side gutters. Wider layouts use the shared 1440px content
limit described in the [project brief](brief.md#site-content-width).

Occasion photographs zoom by 5% over 300ms with gentle ease-in-out timing on
hover or keyboard focus. Leaving or re-entering during the zoom reverses from
the current scale. Their rendering layer stays stable when the zoom finishes,
preventing a sharpness jump at fractional display scaling. Reduced motion
disables the image zoom and the retained layer.

Occasion typography uses EB Garamond for headings and descriptions, and DM Sans
for labels, numbers and links. Desktop section titles are 50/52px, card titles
32/34px and descriptions 18px with 130% line height. Descriptions use the secondary
text colour and a 72px minimum height. Descriptions fill their card's content
column and wrap naturally on wider desktops.
On mobile, section titles are 36/44px, card titles 28/34px and descriptions
18/28px. Mobile numbers are 14/16px, medium weight, with 10% letter spacing;
desktop numbers are 12/16px, regular weight, without added spacing. Links use
16/24px in both layouts.

The overview's “View Group Set Menus” button uses a 1px solid burgundy border
at full opacity, matching Figma's secondary button treatment.

Overview benefit labels use medium-weight EB Garamond at 22/26px on desktop
and 22/28px on mobile. Their desktop columns have 40px gaps; centred label widths
are capped at 294px to preserve the Figma line breaks on wider screens. The menu
description uses secondary text at 20/24px on desktop and 18/28px on mobile. The compact
enquiry description is 580px wide at most, with 18px DM Sans and 23px line height
on desktop. Its mobile date placeholder uses the shared vertical-centering rule, without a fixed top offset. Empty, unfocused date fields hide the browser date text so it cannot overlap the placeholder; focused and valid dates remain readable.

All private-dining pages use the shared homepage footer, including its desktop
columns, spacing, gutters and mobile reading order. Footer content remains
server-rendered; newsletter behavior follows the shared footer contract in
[the project brief](brief.md#footer-implementation).

The overview closing banner keeps the original table photograph with separate
desktop and mobile crops and Figma's ink gradients. Its reference heights are
288px and 512px. Contact labels are 15/22px with a 1px cream border at 35% opacity;
desktop buttons fit their labels with a 16px gap, while mobile buttons stack
across the content width with a 10px gap. The enlarged mobile photo has its own
image size hint. Other closing banners and enquiry contact styles are unchanged.

The celebrations closing banner keeps the gathering photograph at its original
proportions. At the 1440px reference width, its 250px frame crops the 960px-high
image by 611.13px from the top (`object-position: center 86.075%`).
The [closing section in Figma](https://www.figma.com/design/0fEgisdlNBr23CuWHJOTNC/Peploe-s?node-id=3526-12019)
uses 48px vertical padding. The heading and body now share a 740px maximum width.
The warm-ink overlay fades from full opacity on the left to 60% at 53% of
the banner width, then becomes transparent at 73%.

## Notes and comments

The corporate page follows the current 1440 × 4088px frame, including its
72px desktop gutters. Its section heights are 392, 431, 350, 411, 318, 435,
326, 603 and 278px, followed by the 468px footer. Content can grow when the
viewport narrows. Corporate styles stay scoped to that page; the navigation
uses explicit data attributes for its 28px link gaps and ink voucher label.

The corporate hero's desktop text column occupies 16/27 of the shared content
container, with its heading and introduction capped at the reference's 768px.
The photograph extends to the left page edge with a 48px gap before the column.
At 1440px, the photograph is 552 × 392px and the copy starts at 600px. Keeping
the column proportional prevents the photograph from taking all additional
width when its text reaches the cap. The content keeps 48px vertical
padding and 16px gaps, with 60/62px regular EB Garamond for the heading and
21/30px regular DM Sans for the introduction. Its 287 × 48px action uses
18/26px medium DM Sans, the design's text arrow and an 8px gap. The copy
shrinks on smaller desktops and retains its reference wrapping on wider ones.

Corporate occasion cards have no numbers. Their 20/26px medium EB Garamond titles
and 1px inset Soft Stone dividers follow the current frame. The section has 48px
vertical padding, a 60/62px heading and 21/30px introductory copy, with 28px
between the introduction and the 125px card row. At desktop widths, the intro
stops at 1296px and card descriptions at 276.25px (275.25px for the first card)
to preserve Figma's line breaks as the shared container grows. The descriptions
use 16/23px DM Sans, except the last card's 14/20px text. The exclusive-hire
copy measures 634px. At the 1440px reference, the menu copy measures 624px
with two 296 × 75px menu cards and a 32px gap. Its text column grows with
the shared container instead of stopping at 624px. The section preserves the
1440:435 frame ratio on wider screens, with the copy vertically centred, and
grows when wrapped text needs more height. The desktop menu photograph uses
Figma's image-fill crop,
including its slight vertical compression and full-width gradient. Below 1024px,
it retains a proportional cover crop in the 290px stacked image frame.
The enquiry has 598px and 650px columns separated by
48px, a full-height inset divider, 38px fields, 4px corners and a 22px checkbox.
The privacy-policy link points to `/privacy-cookies` and retains the design's
underline.

On phones, the corporate Location Matters heading, eyebrow, icons and card text are centered. Card headings use 23px type and descriptions use 15px type.
The corporate Location Matters section uses 36px top and 40px bottom padding,
a 48/50px regular heading, 48px icons and 1px inset Soft Stone dividers.
At desktop widths, card titles use 22/25px regular EB Garamond and descriptions
use 16/22px DM Sans, separated by 6px. Text stops at 201.75px (200.75px in the
first card), retaining the reference's line breaks on wider screens. Descriptions
wrap naturally within those columns on desktop. The final
card's divider is 137px high; the other dividers are 140px. Cards grow when
wrapped content needs more space.

The corporate hero and cellar use optimized exports of the original Figma
photographs instead of the earlier small previews. The closing banner uses
the St Stephen's Green photograph now present in Figma, as requested in its
comment. Photographs use proportional cover crops except for the desktop menu
image described above. Other Figma fills that scale their source unevenly keep
their natural proportions on the web page, with aligned focal points. The bar
and dining-room source images in Figma are only 243px wide.

The corporate closing photograph covers the full banner, including behind the
text, with a continuous dark gradient. Its desktop crop is centred horizontally
at 35% vertically, keeping the buildings and lake visible. The image has no
left offset or uncovered strip and retains its natural proportions.

The corporate space cards have 230px image frames, 8px gaps and 88px caption
areas at the 1440px reference width. Captions use 20px vertical and 36px
horizontal padding, with 13/17px semibold DM Sans labels, an 8px gap and
16/23px descriptions. Each card has 1px inset Soft Stone strokes on its right
and bottom edges, including the photograph. Stacked cards keep the bottom stroke
on mobile and tablet. A continuous 1px solid Soft Stone rule spans the section's
bottom edge at every viewport width without changing its height.
The photographs use centred cover crops without stretching. The two 243px sources
are saved as lossless WebP and
served without another compression pass; larger originals are still needed for
sharper display. The terrace retains responsive image optimization.

The hero-photo replacement comment is still pending; the current Figma photo
is retained. The capacity comment asking to remove “~100 seated + standing”
has a clarification request from the designer. The contributor asked to retain
that item until the comment is resolved.

Below 640px, the corporate capacity section presents the two guest capacities as
equal-width cards, followed by full-width space and availability rows. Cards use
32px icons and 44/46px numbers; detail rows use 40px icons and 24/30px headings.
Labels use 16/22px body type; supporting text is at least 14/22px. Subtle cream
borders separate the groups. All four items remain in the page flow. Tablet and
desktop layouts retain their existing columns.

The homepage's yellow “Distinct commercial journeys” note requires separate
content and enquiry experiences for celebrations, corporate events and weddings.
Each detail page has its own enquiry copy and relevant fields. Corporate
enquiries include a company field; wedding enquiries do not ask for an occasion
type. The overview note `3482:6834` supplies its five occasion choices: Groups &
Celebrations, Corporate Event, Exclusive Hire, Wedding and Other.

Textarea resize grips use burgundy diagonal lines in browsers that support styling the native grip. On phones, a visible 24px touch handle provides vertical dragging; keyboard users can use arrow keys or activate the handle to add a line. The handle preserves message text and does not submit the form. Below 640px, compact-form dropdown arrows align with
the first line of the field text.

Resolved comments on the overview ask for cleaner sections with less text
(#38 and #40), and copy without dashes (#39). The current frame is the visual
reference; removed descriptions are not restored. The subsequent comments
approve the revised direction.

The comment attached to “Made personal” says “Remove the decoration element”.
The Decorations detail is omitted, and the section height follows the two
remaining details. The introductory paragraph retains the current Figma copy.

Comment #50 on [Good to Know](https://www.figma.com/design/0fEgisdlNBr23CuWHJOTNC/Peploe-s?node-id=3526-11924)
asks to omit the detail about menu choice. The Menu choices item and its
pre-selection statement are removed from the local content catalog.

Original photographs come from the exported Figma frames. Illustrations use
the original SVG exports and the isolated botanical export. Shared homepage
illustrations are reused where the artwork is the same. Images remain local;
no new external media origin is required.

## Content and components

The current [Your day at Peploe’s frame](https://www.figma.com/design/0fEgisdlNBr23CuWHJOTNC/Peploe-s?node-id=3527-12858)
uses four text columns without numbered circles or a connecting line. At the
1440px desktop reference, the section is 453px tall with 48px vertical padding,
72px side insets, 294px columns and 40px column gaps. The first three columns
have a 1px Soft Stone divider inset at their right edge. Headings use 52px and
30px EB Garamond; supporting copy uses 21px and 20px DM Sans. Desktop line breaks
follow the frame, including its updated capacity of approximately 80 guests.
On smaller screens, the columns stack and the text wraps naturally.

The [Entirely yours frame](https://www.figma.com/design/0fEgisdlNBr23CuWHJOTNC/Peploe-s?node-id=3527-12891)
is 1440 × 348px, with a 752px photo and 688px text panel. Its desktop columns
keep that 47:43 ratio. The text panel uses 48px vertical padding, 72px side
padding at the reference width, a 2px eyebrow rule and a 544px maximum text
width. The heading is 52/54px EB Garamond; the description is 21/28px DM Sans
with a 16px gap. The existing 1504 × 696px photograph matches the Figma crop
and uses proportional cover sizing. Narrower layouts stack the photo and copy.

The [Made around you frame](https://www.figma.com/design/0fEgisdlNBr23CuWHJOTNC/Peploe-s?node-id=3530-13501)
is 915px tall at 1440px, with 36px vertical padding and 48px between its
introduction, tasting panel and detail grid. The tasting panel is 1296 × 249px;
its 604 × 255px image layer is clipped by the panel. The local source photograph
uses the exported Figma crop transform and separate cream and burgundy fades.
Cover sizing keeps the image filling the panel when the copy grows. The 675px text
measure, 40/42px heading and 18/23px description match the reference.
The details use 643.5px and 652.5px columns, 170px and 190px rows, 32/36px
headings and 1px inset Soft Stone dividers. Comment #58 removes late-night food
from the last card and asks for the same title size as the other cards; the
designer confirms it is updated. The current copy is “Canapés & drinks”.

The [wedding enquiry frame](https://www.figma.com/design/0fEgisdlNBr23CuWHJOTNC/Peploe-s?node-id=3527-13048)
is 1440 × 557px, with 598px and 650px columns separated by 48px. Both columns
use 48px vertical padding; the form's inset Soft Stone divider spans the full
section height. Headings use 40/42px and 34/35px EB Garamond. The introduction
uses 18/24px DM Sans, with 48px before the two 262 × 48px contact buttons.
The 602px form has 38px fields, a 68px message field and 4px corners on inputs
and selects. Its first row uses 294px and 296px controls with a
12px gap. Secondary-colour field text uses 16/24px DM Sans.
Send Enquiry is 161 × 44px.
The pale background mixes 6% burgundy over Warm Cream. The responsive layout
keeps stacked columns and larger controls below 1024px; the enquiry
behaviour is described below.

The [wedding closing banner](https://www.figma.com/design/0fEgisdlNBr23CuWHJOTNC/Peploe-s?node-id=3527-13075)
is 1440 × 224px, with 48px vertical padding and a 530px text measure. The
heading uses 52/54px EB Garamond; the description uses 20/29px DM Sans with
a 16px gap. The existing 1360 × 1020px terrace photograph uses a proportional
cover crop centred horizontally at 23.915% vertically. Its warm-black overlay
fades from full opacity to 50% at 42.8269% of the width, then to transparent at
64%. Smaller screens retain the taller banner and vertical overlay for legibility.

The `private-dining*.ts` catalogs under `src/lib/constants/` hold editorial copy,
images, stable item keys, enquiry options and SEO descriptions. The types live
in `src/lib/types.ts`. This is local preview content, not a connected Sanity
dataset. A future Sanity read should supply these content shapes without moving
SDK calls into components. Enquiry delivery uses the separate service configured
in the [transactional email guide](../guides/email-guide.md).

Thin App Router pages compose four page components. They share hero, heading,
feature list, menu links, contact links, enquiry and closing-banner components.
`PrivateDiningFeatureSection` combines the heading and feature grid for occasion,
planning and location sections. `PrivateDiningImageSection` owns the responsive
image and text layout for group menus, corporate hire and wedding tasting;
the callers supply copy and optional links or notes. Page variants retain their
Figma spacing and image placement.
The page-specific sections remain separate because their layouts differ.
Within the page content, only the enquiry fields need client JavaScript, for
the date calendar, validation and enquiry submission feedback.

Desktop and mobile navigation, homepage occasion cards and footer links lead to
the new pages. Group lunch and dinner links target the existing sections of
`/menus/group-set-menu`. Hero enquiry buttons scroll to their page's form.
Telephone and email links use the shared restaurant contact details.

On desktop, the navbar's Private Dining & Events label links to `/private-dining`.
Mouse hover or Arrow Down opens its three-page shelf; Enter follows the overview
link. Escape closes the shelf and restores focus to the label. On mobile, the
entire row toggles the submenu, including the label, empty space and plus/minus.
The first submenu link, Overview, opens `/private-dining`.

Enquiry select fields use maroon outline chevrons, centered at the right edge with space reserved beside the text. Decorative icons do not intercept clicks.

## Enquiry submission

Shared enquiry fields, message areas and form wrappers have no minimum-height constraints at any breakpoint. Existing desktop height and padding rules remain in place. On phones, all shared enquiry forms use natural field heights. Inputs and selects use 10px vertical padding and 22px line height, giving 44px controls. The three-row message field uses 12px vertical padding for a 92px initial height and remains vertically resizable. Fields share 8px gaps, Soft Stone borders and 4px corners.

The shared guest-count field accepts a custom positive whole number, including 80 or more.
Maroon outlined chevron up/down buttons sit beside the guest count; typing and keyboard adjustment remain available. The submit button has an additional 16px of space above it.
Set `NEXT_PUBLIC_ENQUIRY_MAX_GUESTS` to a positive whole number to cap enquiries in both the form and server validation. Leave it empty for no fixed capacity cap. This public setting requires a rebuild after changes. Book a Table keeps its separate online booking limit.
Restaurant capacity and group menu eligibility remain separate content.
For occasion selects, supporting browsers show a styled picker capped at 310px (or 40% of the
viewport height), with scrolling inside the list. It retains native keyboard
selection and required-field validation. Other browsers use their native picker.
Option text aligns with the field value, selected checks sit on the right, and
the list ends immediately after its last option. The page scrollbar uses Samsu's
scrollbar CSS, with only its colour changed to Peploe's burgundy at 40% opacity.

The preferred date allows today or a later date in the restaurant's Dublin
time zone. Past dates are disabled in the picker and fail validation when typed.
The minimum date refreshes on interaction and submission for pages left open overnight.
The shared calendar hides fully elapsed weeks and keeps earlier dates in the
current week disabled. Enquiry sections stack above following content so the
calendar stays visible when it extends over the closing banner.
The calendar uses the site's warm cream, burgundy and typography, with month
navigation and keyboard date selection. Its left and right edges match the
preferred-date field at every screen width. Autofilled fields keep their cream background.
Narrow calendars use compact headings and day controls to keep dates separate.

The shared form calls the enquiry action connected in issue #100.
Send Enquiry is enabled once the form is interactive. Clicking it with missing
or invalid fields shows the browser's validation message and focuses the first
invalid control. No enquiry variant includes an agreement checkbox. A valid enquiry shows a
spinner while delivery is pending, then an animated check and Complete label
only after the server confirms acceptance. Reduced motion keeps both icons static.
A live status announces the server's result. The form has no simulated completion timer.

The form retains entered values after a definite delivery failure and permits a
retry with the same notification ID. Editing after a definite rejection starts a
new notification. Successful submission resets the form; editing clears its
completion state. Send stays disabled during loading, after completion until a
field changes, and after an uncertain outcome. Editing cannot cancel an email
already being delivered or unlock an uncertain outcome. Guests must contact the
restaurant before retrying an uncertain send. Before JavaScript loads, Send stays disabled.

The privacy-policy link opens `/privacy-cookies`. Server validation, rate limits,
delivery records and provider failure handling follow the transactional email guide.
Missing delivery configuration produces an explicit unavailable response.
Provider acceptance does not prove inbox receipt. Booking and newsletter
integration remain outside these pages.

## Verification

Compare section positions, typography, image crops and gradients with the
desktop references and the 390px overview. Check narrower phones, tablet and
wide desktop for wrapping and horizontal overflow. Verify all new routes,
navigation links, menu anchors, enquiry anchors, contact destinations, input
labels, required-field validation, loading/completion, editing and reduced motion.
Verify delivery using intercepted providers and synthetic data; no live email is
needed for browser tests. Inspect the browser console and image loading.
Check the desktop overview link, Arrow Down, Tab and Escape. On mobile, verify
the full row toggles by tap, Enter and Space, and the Overview submenu link
opens the overview and closes the menu. Confirm refactored sections retain
their desktop and phone dimensions.
In forced-colors mode, check that corporate, celebration and wedding enquiry
fields and contact links retain visible outlines and keyboard focus remains distinct.
Run the gates in the [quality guide](../guides/quality-guide.md).
