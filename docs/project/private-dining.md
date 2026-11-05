# Private dining and events

Use the [approved Figma designs](https://www.figma.com/design/0fEgisdlNBr23CuWHJOTNC/Peploe-s?node-id=3480-3107)
for presentation. This document keeps approved content, unresolved restaurant
decisions and enquiry requirements. Styles and the email guide own their
implementation; routine code changes do not require an update here.

| Route | Design node |
| --- | --- |
| `/private-dining` | Desktop `3480:3107`, mobile `3494:7222` |
| `/private-dining/groups-celebrations` | `3526:11759` |
| `/private-dining/corporate-events` | `3526:12248` |
| `/private-dining/weddings` | `3527:12848` |

## Product requirements and decisions

Celebrations, corporate events and weddings have distinct content and enquiry
journeys. Corporate enquiries include company; weddings do not ask occasion type.
The overview offers Groups & Celebrations, Corporate Event, Exclusive Hire,
Wedding and Other. Hero enquiry links reach the page's form; telephone and email
links reach the restaurant. Images and their actions share a destination.

The group-size selector offers 1–7, matching the booking site limit. Restaurant
capacity and group-menu eligibility are separate content. Preserve full guest
names, required consent and entered values after a definite send failure.
Preferred dates use Europe/Dublin, allow today and later, reject past dates,
and refresh the minimum when an overnight page is used again.

The corporate capacity request to remove '~100 seated + standing' still needs
designer clarification. Retain it pending that decision. The requested corporate
hero replacement has no approved replacement yet. Two corporate photographs
are only 243px wide; obtain larger originals before claiming sharp desktop images.
Wedding copy uses approximately 80 guests. Confirm capacities with the restaurant.

Approved design comments omit Decorations from Made personal and Menu choices
from Good to Know. The wedding late-night food item is Canapés & drinks.
Local catalogs are preview editorial content, not a connected Sanity dataset.

## Enquiry submission

The [email guide](../guides/email-guide.md) owns server validation, rate limits,
delivery records, configuration and provider failures. Provider acceptance does
not prove inbox receipt. Missing delivery configuration reports unavailable.

The form enables Send after hydration, validates required fields and consent,
and focuses the first invalid control. A valid submission shows pending state,
then Complete only after confirmed acceptance. A live status announces the result.
Reduced motion retains usable feedback without animation.

A definite failure keeps input and permits retry with the same notification ID.
Editing after rejection starts a new notification. Successful submission resets
the form. Send remains disabled while pending, after success until editing,
and after an uncertain outcome. Editing must not unlock uncertain delivery;
the guest must contact the restaurant before retrying. Privacy links open
`/privacy-cookies`. Newsletter signup and reservations are separate flows.

Keyboard navigation, focus restoration, narrow-screen overflow, enlarged text,
forced-colors focus and real submission recovery need behavioral verification.
Use synthetic data and intercepted providers, never live email for browser tests.
