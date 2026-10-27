# Booking page and the table hold

This is the contract between the `/book-a-table` page and the booking server:
what the page sends, how it runs the hold timer, and how it behaves when
something fails. The server side is in `src/actions/bookings.ts`,
`src/app/api/bookings/` and `src/services/bookings/`. Read this before wiring
the page to them.

## What the page sends and keeps

- A guest's choice is `searchDate`, `time`, `partySize` and `offer`, exactly as
  the times list returned them. For a time after midnight, `searchDate` is the
  evening's date and `date` is the next calendar day (see
  [Times after midnight](#times-after-midnight)). Send them back unchanged.
- Every hold, guest-details and hold-status request names the hold it is about
  with `holdReference`, plus `holdRevision` for details and status. The server
  reads and deletes only the cookie named by that reference.
- Keep the choice, `holdReference` and `holdRevision` per tab in
  `sessionStorage`, so a reload or a return from Stripe reaches the same hold.
- The hold token is an `httpOnly` cookie. The page never reads it and must not
  try to.

## Finding a table

- The page starts `getFindTableData` on every request and streams the booking
  panel behind `Suspense`, so the hero and the rest of the page never wait for
  ResDiary. While it loads, the panel says "Loading available dates…", shows
  the phone and email, and reserves roughly its final height.
- If the call fails, the panel shows the server's message, which names the
  phone and email. The rest of the page is unchanged.
- The date picker opens on `calendar.defaultDate`. A day can be chosen only when
  `isBookableDay` in `src/lib/dates.ts` allows it: from `today` to `lastDate`,
  and not on a closed weekday or in a closed period. The server checks closed
  days with the same `isClosed`.
- The month arrows stop at today's month and at the month of `lastDate`. They
  use `aria-disabled`, not `disabled`, so the arrow the guest just pressed
  keeps focus and the calendar stays open.
- Party size lists `partySize.min` to `partySize.max` and starts on
  `partySize.default`.
- As soon as the panel appears, the page asks `/api/bookings/calendar` for the
  selected month's six-week grid and the month after, at the chosen party
  size. Showing another month asks for it and the one after. Replies are kept
  per party size and month, so a late reply for another party size never
  changes what is shown.
- Days missing from `openDates` are disabled as well as closed days. While a
  month loads, the calendar says "Checking which days are full…" and stays
  usable. If the request fails, the calendar works on the closed-day rules
  alone and does not ask again; the times step has the final word.
- If the selected date turns out full, a date the page chose moves to the first
  free day in the reply. A date the guest chose stays, with a note such as "No
  tables for 2 guests on Thu, 22 Oct 2026. Please choose another day."
- Availability is fetched a month at a time, not for the whole booking window.
  On the sandbox on 21 Oct 2026, a year took 8 to 10 seconds per party size,
  against 1.3 to 2.3 seconds for a month.

## Choosing a time

- "Find a Table" asks `/api/bookings/times` for the chosen date and party size.
  While it waits, the panel says "Finding tables…". It then lists every time
  ResDiary can book online, in time order. On the sandbox on 21 Oct 2026 the
  times were on screen 0.85 to 1.4 seconds after the click.
- A reply for an earlier search is ignored, so going back and searching again
  never shows the older search's times.
- A day with no times says why: the restaurant is closed, there are no tables
  online for that party size, or online booking for today has closed. The last
  two name the phone number.
- If the search fails, the panel shows the server's message, which names the
  phone and email, and the guest can go back to the search.
- When the guest picks a time, its return time shows as "Table until 8:15 pm".
  If ResDiary marks that return time as required, the guest must tick "I
  understand the table is required back by 8:15 pm" before continuing. On the
  sandbox, dinner times from 7:15 pm are required.

## Holding a table

- "Continue" sends the chosen time to `holdTable`, with the current
  `holdReference` when the tab already holds a table. While it waits, the button
  says "Holding Your Table…" and cannot be pressed again, so a double click
  makes one hold. On the sandbox on 23 Oct 2026 the table was held 1.4 to 3.4
  seconds after the click.
- If the hold fails, the times step shows the server's message and the guest can
  pick a time and continue again.
- Going back and choosing another time, date or party size moves the same hold:
  the reference stays, the revision goes up and the timer carries on.
- The tab keeps the choice, `holdReference` and `holdRevision` in
  `sessionStorage` under `peploes:booking-hold`. A reload or a return to the
  page sends them to `holdTable` again and brings the guest back to their held
  table.
- When the timer reaches zero, the details form is replaced by "Your table hold
  ran out. Please choose a time again." and a "Choose a Time Again" button.
  Everything the guest typed is kept.

## Sending the details

- The phone number has a country code picker (default +353 from
  `BOOKING_GUEST_LIMITS.defaultCountryCode`) and a number typed without the
  code. ResDiary stores the two separately.
- "Confirm Reservation" sends the form to `submitGuestDetails` with the held
  table's `holdReference` and `holdRevision`. The button says "Confirming…"
  while it waits. Field errors from the server show under their fields; any
  other error shows above the buttons. What the guest typed is kept.
- A `confirmed` reply shows the confirmation with ResDiary's booking reference.
  A `payment` or `card` reply shows the Stripe step.

## Paying a deposit or saving a card

- The Stripe step uses only what ResDiary sends: `loadStripe(publishableKey,
  { stripeAccount: accountId })` and the `clientSecret`. Stripe.js is imported
  from `@stripe/stripe-js/pure`, so it loads only at this step, not for every
  visitor.
- A deposit's amount comes from Stripe's PaymentIntent
  (`retrievePaymentIntent`), so the page shows exactly what the card will be
  charged. A card guarantee charges nothing now, so its possible charge comes
  from ResDiary's `amountText`.
- The Payment Element is styled through Stripe's appearance settings to match
  the panel. It uses the system font because loading DM Sans from Google Fonts
  would break the CSP and send guests' IP addresses to Google.
- The deposit step reads "Secure your table", "A €20.00 deposit is needed to
  reserve this table." and "Pay €20.00 and Reserve". A card guarantee's button
  is "Save Card and Reserve". Buttons capitalise each main word, like the rest
  of the panel.
- The pay button turns on only when Stripe's form reports it is ready.
- If Stripe's script fails to load (a dropped connection or a blocking browser
  extension), the step says "We couldn't load the secure payment form. Check
  your connection and try again, or call us on …" and shows a "Try Again"
  button, which loads Stripe again.
- A reload on this step brings the card form back from the saved step without
  sending the details to ResDiary again. A
  declined card shows Stripe's message and the guest can try again. 3-D Secure
  opens Stripe's own check.
- When the Stripe step appears, the tab saves it in `sessionStorage` under
  `peploes:booking-payment`. If a bank takes the guest to its own page, Stripe
  sends them back to `/book-a-table` with `payment_intent` (or `setup_intent`),
  its client secret and `redirect_status`. The page checks that the secret
  matches the saved step, removes these values from the address bar, and then:
  - after `succeeded` or `processing`, checks ResDiary until the booking is
    confirmed, as after Stripe's popup;
  - after `failed` or `requires_payment_method`, shows the card form again with
    "Your bank didn't approve the payment. Please try again or use another
    card."
  A return address that doesn't match the saved step is ignored.
- The hold timer is hidden from this step on (rule 7).
- On the sandbox on 23 Oct 2026 the deposit step appeared 1.4 to 1.9 seconds
  after "Confirm Reservation", and ResDiary confirmed 4.5 to 6.1 seconds after
  "Pay".

## The hold timer

The timer tells the guest how long their table is held.

1. **Source.** Count down from `expiresInMs` in the latest `holdTable` reply
   (a new hold, a reused hold or a moved hold). Never use the cookie: the page
   cannot read it, and it lasts 15 minutes longer than the hold on purpose.
2. **Count from receipt on a steady clock.** Record `performance.now()` when the
   reply arrives. Show `expiresInMs - (performance.now() - receivedAt)`,
   redrawn every second. Do not subtract one per tick: phones pause background
   tabs, and a ticking counter drifts. Do not use `Date.now()` or the device's
   clock; the guest can change it.
3. **Restart from every new reply.** A move keeps the hold's original end time,
   so the countdown carries on from the new `expiresInMs` without jumping.
4. **Stop 5 seconds early.** The server refuses guest details when 5 seconds or
   less remain, so a booking never starts on a hold that is about to vanish.
   Show 0:00 and turn off the Book button when the time left reaches
   `BOOKING_HOLD.submitMinRemainingMs`, not 0. Import that constant from
   `src/lib/constants/booking.ts` rather than typing 5000, so the screen and the
   server always use the same number.
5. **At zero,** show `BOOKING_MESSAGES.holdExpired` ("Your table hold ran out.
   Please choose a time again."). Keep everything the guest typed. Choosing a
   time again makes a new hold.
6. **After a reload,** send the stored choice and `holdReference` to
   `holdTable` again. The server hands back the same hold and its time left,
   without making a new hold or counting against the limit. If 30 seconds or
   less remain, it makes a new hold instead.
7. **During payment,** hide the timer once the details step returns a payment
   or card step. Whether ResDiary extends a hold while the guest pays is not yet
   known.

### Why the screen and the server can differ

There are three clocks:

1. **ResDiary's end:** when ResDiary releases the table.
2. **Our server's end:** slightly earlier. The server subtracts the time
   ResDiary's reply took to reach it, so it errs on the safe side.
3. **The screen's end:** slightly later than ours, by the time our reply took to
   reach the browser (usually under a second).

The 5-second stop in rule 4 covers that gap. Without it, the screen could show
0:04 while the server already says the hold ran out.

### Cookie lifetime

The hold cookie lasts until the hold ends plus 15 minutes, so the payment check
still works after the timer reaches zero. The server refuses an older cookie
without asking ResDiary, even if a client keeps sending it.

## After payment

Stripe accepting a payment is not a confirmed booking. Show a confirmation only
after ResDiary confirms it.

- Start checking `GET /api/bookings/hold-status` once Stripe reports success.
  Check every 2 seconds.
- `confirmed`: show the confirmation.
- `failed` or `expired`: say the booking was not confirmed and that the guest
  may have been charged, with the phone number.
- `pending`, `ServiceUnavailable` or `NotFound`: keep checking.
- After 60 seconds without `confirmed`, stop and say "Hang tight! We're still
  confirming booking …" with the reference, so the guest can quote it. Never say
  the booking failed, and never offer to pay again. This copy does not promise
  an email, because Peploe's live account's emails are not yet verified.
- Make this "payment taken, not yet confirmed" state calm and reassuring, not
  an error. Elhaam's example of the tone is "Hang tight! You'll get a
  confirmation soon if your money is deducted." Follow how AnjomaZone
  handles the same case.
- Store in `sessionStorage` that Stripe accepted a payment for this
  `holdReference`. After a reload or a return from Stripe, check `hold-status`
  again before showing anything else. If it answers `NotFound` after a payment
  was accepted (the hold cookie ends 15 minutes after the hold), show
  `stillConfirming` with the reference, not "choose a time again".

### If the guest leaves after paying

ResDiary finalises a paid booking itself once Stripe accepts the payment. The
page's checks only report the result, so closing the tab does not lose the
booking.

Sandbox evidence, 21 October 2026: booking B3TCDXPK was held at 05:44:49 UTC,
and its €20 deposit was paid with a Stripe test card at 05:44:54. Nothing then
called ResDiary for 7 minutes, past the hold's 5-minute end. The first read
afterwards showed it Booked with the €20 deposit paid. On 15 October 2026 a
card-guarantee booking also confirmed by itself, within about 5 seconds.

ResDiary also sends the guest's confirmation email by itself. In a rerun the
same day, B473H933 was paid at 05:56:16 UTC with a real inbox as the guest, and
nothing called ResDiary afterwards. The guest received ResDiary's confirmation
email: reference, date, time, guests, leave time and a feedback link. In the
sandbox, Settings > Email Templates sends a custom confirmation email
(cancellation emails are off), and Notification Settings shows no suppressions
for any booking channel.

Not yet verified:

- **Peploe's live account.** `stillConfirming` promises an email. Before
  payments go live, confirm the live account also sends confirmation emails,
  and review their wording. The sandbox email says "Book.ResDiary.com" and
  doesn't mention the deposit.
- **A confirmation that takes longer than 60 seconds.** The slowest seen was
  about 5 seconds.
- **A completed 3-D Secure challenge.**

### Resolving an unknown outcome

- **The guest** has the reference on screen and the confirmation email if one
  is sent, and can call the restaurant.
- **Staff** find the reference in the ResDiary diary, which shows the booking's
  status and deposit. The restaurant's Stripe account shows the payment.

## When something fails

- Keep menus, opening hours, directions and the page itself independent of
  ResDiary. A booking failure affects the booking panel only.
- Keep the phone and email links visible, including when booking scripts fail.
  Both come from `RESTAURANT_CONTACT` in `src/lib/constants.ts`.
- Keep the guest's details on any error they can recover from.
- If a booking or payment reply is lost, show a "still checking" state and check
  the existing hold before inviting another submission. Show a confirmation only
  after ResDiary confirms.
- Show the server's messages as they are. They already name the phone and email
  where a guest should call instead.

## Times after midnight

ResDiary dates a time after midnight on the evening it belongs to. The times
list marks it: `date` is the next calendar day and the label ends with
"(next day)", for example "12:15 am (next day)". It is listed after the evening.
The hold summary shows the calendar day, for example "Sat, 24 Oct 2026,
12:15 am". When holding, send the `searchDate` and `time` from the list
unchanged; the server sends ResDiary the evening's date, which is what ResDiary
expects.
