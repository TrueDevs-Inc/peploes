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

- Start checking `GET /api/bookings/hold-status` once Stripe reports success.
  Check every 2 seconds.
- `confirmed`: show the confirmation.
- `failed` or `expired`: say the booking was not confirmed and that the guest
  may have been charged, with the phone number.
- `pending`, `ServiceUnavailable` or `NotFound`: keep checking.
- After 60 seconds without `confirmed`, stop and show
  `BOOKING_MESSAGES.stillConfirming`. Never say the booking failed.

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
