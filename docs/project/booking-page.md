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
- If the first load fails, the panel shows the server's message, which names the
  phone and email. The rest of the page is unchanged.
- After a booking action changes a cookie, the page re-renders on the server.
  If loading the booking data fails then, the panel stays mounted with the data
  it already has.
- The date picker opens on `calendar.defaultDate`. A day can be chosen only when
  `isBookableDay` in `src/lib/dates.ts` allows it: from `today` to `lastDate`,
  and not on a closed weekday or in a closed period. If the selected date moves
  to another month, the picker shows that month. Browsing with the month arrows
  keeps the month the guest chose until the selection changes month.
  The server checks closed days with the same `isClosed`.
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
  month first loads, the calendar says "Checking which days are full…" and stays
  usable. A successful reply stays fresh for two minutes from receipt. Opening
  the picker, showing a month again or returning to search then refreshes stale
  months. Two minutes limits repeat requests while finding tables freed by
  cancellations or holds, which last five minutes and can take up to eleven
  minutes to clear on ResDiary. A refresh keeps the last known days until the
  new reply arrives. Each party size and month has at most one request in flight.
  A failed month retries the next time it is needed, without waiting. If no
  reply has succeeded, only the closed-day rules apply. A failed refresh keeps
  the last known days. The times step has the final word.
- In the search step, a full date the page chose moves to the first free day
  on or after it in that month or the next. Only bookable days within the
  booking window count. If this month has no free day and the next is still
  loading, wait for its reply.
  If neither month has a free day, keep the date and show the full-day note.
  A date the guest chose stays, with a note such as "No tables for 2 guests on
  Thu, 22 Oct 2026. Please choose another day."
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
- Picking another time clears the return-deadline tick. Find a Table and
  making another booking also clear it.

## Holding a table

- "Continue" sends the chosen time to `holdTable`, with the current
  `holdReference` when the tab already holds a table. While it waits, the button
  says "Holding Your Table…" and cannot be pressed again, so a double click
  makes one hold. On the sandbox on 23 Oct 2026 the table was held 1.4 to 3.4
  seconds after the click.
- If the hold fails, the times step shows the server's message and the guest can
  pick a time and continue again.
- If the request gets no answer at all (a dropped connection), the times step
  says "We couldn't reach our booking system. Check your connection and try
  again, or call us on …" and Continue works again. The rest of the page stays
  as it was; it never falls back to the error page.
- Going back and choosing another time, date or party size moves the same hold:
  the reference stays, the revision goes up and the timer carries on.
- "Edit date & guests", "Back to search" and "Back to times" are disabled
  while the table is being held, the details are sending, the payment step is
  still loading or checking with Stripe whether it was already paid, Stripe is
  processing a payment, or the page is checking ResDiary after a payment or an
  unclear reply. A booking or a payment may already be on its way in each of
  those. The payment step counts as loading until Stripe's card form is ready
  or has failed to load.
- The tab keeps the choice, `holdReference` and `holdRevision` in
  `sessionStorage` under `peploes:booking-hold`. Unless details or payment are
  being checked, a reload sends them to `holdTable` again and brings the guest
  back to their held table. If restoring the hold fails, the search shows the
  server's message, including any booking reference.
- When the timer reaches zero, the details form is replaced by "Your table hold
  ran out. Please choose a time again." and a "Choose a Time Again" button.
  Everything the guest typed is kept.

## Sending the details

- The agreement's terms button opens a popup with ResDiary's booking terms as
  plain text paragraphs, including repeats. The label text toggles the agreement;
  the terms button only opens the popup. If ResDiary has no terms, it shows the
  phone and email fallback. Close, Escape and platform close requests dismiss it. Focus returns
  to the terms button. Opening or closing it keeps the agreement unchanged.
  Long terms scroll inside the popup; the page behind stays still.
- The standalone `/booking-cancellation-terms` page is general information.
  The restaurant keeps it in sync with ResDiary's terms.

- The phone number has a country code picker (default +353 from
  `BOOKING_GUEST_LIMITS.defaultCountryCode`) and a number typed without the
  code. ResDiary stores the two separately.
- "Confirm Reservation" sends the form to `submitGuestDetails` with the held
  table's `holdReference` and `holdRevision`. The button says "Confirming…"
  while it waits. Field errors from the server show under their fields; any
  other error shows above the buttons. What the guest typed is kept.
- A `confirmed` reply shows the confirmation with ResDiary's booking reference.
  A `payment` or `card` reply shows the Stripe step.
- If the reply is lost (a dropped connection) or the server answers
  `OutcomeUnknown`, the page doesn't offer Confirm again straight away. It says
  "Checking whether your booking went through…" and asks `hold-status`:
  - `confirmed`: shows the confirmation;
  - `pending`: the details didn't land, so the form comes back with "We couldn't
    tell whether your details reached us. Your table is still held, so please
    press Confirm Reservation again." Sending again is safe because a hold turns
    into one booking at most, and the server resends once in the same case;
  - `failed` or `expired`: the hold-ran-out message and "Choose a Time Again";
  - no answer: keeps asking every 2 seconds, and after 60 seconds says "Hang
    tight! We're still confirming booking …" with the reference and the phone
    number. Like the payment message, it doesn't promise an email.
  Before sending, the tab saves the hold and send start time under
  `peploes:booking-details`. A reload brings back the held summary and checks
  that hold. It does not send details or place a hold again. A bank return,
  accepted payment or saved card step takes priority. After a reload, a pending
  hold keeps the check running until 18 seconds after sending started: the
  server's 15-second budget plus a margin. Only then can it ask the guest to
  confirm again. A known reply or settled check clears the saved send. An
  unanswered check keeps it for another reload.
  The check belongs to the hold the details were sent for. If the guest goes
  back and moves the hold meanwhile, the form shows for the new hold instead.
- If the server's cookie change reaches the browser but the reply's body
  doesn't, `hold-status` finds no hold and the check ends in that 60-second
  message. The booking itself is unaffected.

## Paying a deposit or saving a card

- Payment mode follows the connected ResDiary account and the Stripe keys it
  returns. The app does not reject test keys based on deployment labels.
- The Stripe step uses only what ResDiary sends: `loadStripe(publishableKey,
  { stripeAccount: accountId })` and the `clientSecret`. Stripe.js is imported
  from `@stripe/stripe-js/pure`, so it loads only at this step, not for every
  visitor.
- Every page's CSP allows Stripe.js, its 3-D Secure frames and api.stripe.com.
  Following an in-site booking link keeps the original document's CSP, so
  payment must work under that policy too.
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
- The page writes the payment step to session storage and reads it back before
  showing the card form. If it cannot save the step, it shows the heading and
  amount but takes no payment. It asks the guest to allow site data, try a
  normal browser window or call the restaurant. Edit and the change dialog
  still work. Other booking steps are not blocked by storage failures.
- The pay button turns on only when Stripe's form reports it is ready.
- If Stripe's script fails to load (a dropped connection or a blocking browser
  extension), the step says "We couldn't load the secure payment form. Check
  your connection and try again, or call us on …" and shows a "Try Again"
  button, which reloads the page and restores the saved payment step before
  loading Stripe again. A component remount cannot reset Stripe's cached pending
  script promise. The same happens when Stripe's script
  loads but its card form doesn't (Stripe's `loaderror`). The message
  replaces "Loading secure payment…" and the space kept for the card form, so
  the step shows one message under its heading.
- Loading has one 15-second deadline, from starting Stripe until the card form
  is ready. This includes the intent and hold checks. If it runs out, show the
  same loading error and Try Again. Edit works again. Keep the payment step and
  hold. Ignore late replies and events, and destroy any card form from that
  attempt. Try Again reloads the page and restores the saved payment step
  with a fresh deadline.
- A reload on this step brings the card form back from the saved step without
  sending the details to ResDiary again. A
  declined card shows Stripe's message and the guest can try again. 3-D Secure
  opens Stripe's own check.
- "Edit date & guests" opens the native "Change your booking?" dialog.
  Focus starts on "Keep My Table"; it, Escape and close requests leave the
  payment step alone. "Choose Another Time" makes one read-only
  `GET /api/bookings/hold-status` check, with the payment step's five-second
  timeout. Both buttons and dismissal are disabled while it waits; a browser
  close reopens the dialog, and a delayed close event cannot dismiss it.
  A confirmed booking shows its reference and summary through the usual
  confirmation path. Every other result, including no answer, closes the
  dialog and calls `startOver`: forget the payment step, paid state, bank
  return and hold in this tab, then open date and guests with the guest's
  details kept. A reload stays on search, and the next Continue makes a new
  hold. The dialog asks the guest not to finish the old payment in another tab.
- Before showing the card form, ask Stripe for the PaymentIntent's or
  SetupIntent's status first. If it is `succeeded`, `processing` or
  `requires_capture`, go straight to the paid check and never show Pay again.
  Otherwise, ask ResDiary for the hold's status. A confirmed hold shows the
  booking. A failed or expired hold clears the saved payment and hold and asks
  the guest to choose a time again. If the check answers `NotFound`, keep the
  saved payment and hold. Show the reference, phone number and Start Again
  without the card form. A reload shows this message again. Start Again clears
  the saved payment and hold and opens a fresh search. For pending, unavailable
  or unanswered checks,
  show the Stripe loading error or mount the card form as usual. Check ResDiary again
  on Pay. If it answers `NotFound`, ask Stripe again first. A paid intent goes
  to the paid check. Otherwise show the same message without confirming
  payment. This Stripe check also has a five-second limit. Pending,
  unavailable or unanswered hold checks allow payment to continue.
  Use ResDiary's answer rather than the clock. On 30 October 2026, sandbox hold BDAZR3NZ stayed
  Pending past expiry. It accepted its €20 deposit 116 seconds after expiry and
  confirmed seven seconds later.
- If Stripe's reply to Pay is an error other than a card problem
  (`card_error` or `validation_error`), such as a dropped connection, the page
  asks Stripe for the payment's status first. Paid: it checks ResDiary. Not
  paid: it shows Stripe's message and Pay works again. Stripe unreachable: it
  checks ResDiary, which ends in the 60-second "Hang tight" message if nothing
  was taken.
- If either Stripe confirm call throws, ask Stripe for the intent again.
  `succeeded`, `processing` or `requires_capture` goes to the paid check.
  The intent read has a five-second limit; an unanswered or unreadable intent
  goes to the paid check too. Show the reference while checking.
  Never offer Pay again in these cases.
  If Stripe says it was not paid, show the payment error with the reference
  and phone number. Only this result says "You haven't been charged".
  Pay and Edit work again, and Pay can retry. A failure before the confirm
  call shows the same message and unlocks both controls without calling confirm.
- When the Stripe step appears, the tab saves it in `sessionStorage` under
  `peploes:booking-payment`. Stripe's return URL is `/book-a-table` with only
  `holdReference` and `holdRevision` from the hold summary. Neither grants
  access without the hold's httpOnly cookie. The page adds no keys or secrets.
- If a bank takes the guest to its own page, Stripe appends `payment_intent`
  (or `setup_intent`), its client secret and `redirect_status` to the return URL.
  If the secret matches the saved step, remove the query string and:
  - after `succeeded` or `processing`, check ResDiary until it confirms;
  - after `failed` or `requires_payment_method`, show the card form again with
    "Your bank didn't approve the payment. Please try again or use another
    card."
- A return in another tab has no saved step. If a return cannot match a saved
  step but names a hold, show "Confirming your booking…" and check hold-status.
  The cookie is shared across tabs in the same browser. A confirmed hold shows
  its confirmation. A pending hold after `succeeded` or `processing` supplies
  the summary and starts the paid check. Save the paid state when storage works.
  A refused payment with a pending hold shows the reference, phone and Start
  Again. It cannot rebuild the card form without the saved step.
- A failed or expired hold shows the not-confirmed message with the reference.
  `NotFound` shows that this page cannot check the booking, with the reference
  and phone. This can happen in another browser or after the cookie ends.
  Unavailable or unanswered checks keep checking and show the still-confirming
  message after a minute. Check Again retries. Start Again first warns that the
  booking may still go through. Never silently open an empty search.
- During recovery, strip Stripe's secrets from the address. Keep the hold
  reference, revision and return status until the paid state is saved, the
  booking is confirmed or the guest starts again. A reload can resume even
  when storage fails or the first check never answers.
- A return that does not match the saved step and names no hold is cleared
  and ignored.
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
   time again makes a new hold. While the guest details are sending, the timer
   stays at 0:00 and doesn't end the hold: the server may still be booking it
   for up to 15 seconds. If the reply is a plain error, the hold-ran-out view
   shows straight after it; if the reply is lost or unclear, the booking check
   runs.
6. **After a reload,** resume any details or payment check first. Otherwise,
   send the stored choice and `holdReference` to `holdTable` again. The server
   hands back the same hold and its time left, without making a new hold or counting against the limit. If 30 seconds or
   less remain, it makes a new hold instead.
7. **During payment,** hide the timer once the details step returns a payment
   or card step. Ask ResDiary whether the hold is still pending before payment; its
   recorded expiry alone does not mean it has ended.

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

## Changing a booking at payment

The site never cancels a booking at the payment stage: Change leaves the old
hold to lapse, so a payment completed elsewhere can still confirm a real
booking. One read-only status check shows the booking if it is already
confirmed; otherwise the guest starts a fresh search. On 2 November 2026,
sandbox bookings B7LZ77KZ (pay then cancel while status still read pending)
and B6K6T93C (cancel then pay) both stayed Cancelled with €20 paid, showing
that ResDiary's Cancel neither waits for nor voids its Stripe payment, which
the site cannot cancel.

## After payment

Stripe accepting a payment is not a confirmed booking. Show a confirmation only
after ResDiary confirms it.

- A bank return without saved state reaches this check once a pending hold
  supplies its summary. It uses the same paid outcomes, Check Again and Start
  Again warning.
- Start checking `GET /api/bookings/hold-status` once Stripe reports success.
  Check every 2 seconds.
- `confirmed`: show the confirmation.
- `failed` or `expired`: say the booking was not confirmed and that the guest
  may have been charged, with the phone number. Forget the paid state and the
  hold in this tab, so a reload opens a fresh search, and offer Start Again.
- `pending` or `ServiceUnavailable`: keep checking.
- `NotFound`: the hold can no longer be checked from this tab (its cookie has
  ended), so show the 60-second message at once instead of waiting.
- After 60 seconds without `confirmed`, stop and say "Hang tight! We're still
  confirming booking …" with the reference, so the guest can quote it. The 60
  seconds run on their own timer, so a status request that never answers still
  ends there, and a confirmation that arrives later still shows. Never say
  the booking failed, and never offer to pay again. This copy does not promise
  an email, because Peploe's live account's emails are not yet verified.
  Offer Check Again and Start Again. Check Again restarts the status checks.
  Show "Confirming your booking…" while checking. Show the confirmation if
  ResDiary confirms, the not-confirmed message if it fails, or "Hang tight"
  after another 60 seconds.
  Start Again shows an inline warning with the reference. Warn that the first
  booking may still go through and booking again could mean two bookings and
  two deposits. Move focus to the warning. Keep Waiting returns to "Hang tight"
  and keeps the paid state. Start Again in the warning forgets the paid state
  in this tab and opens a fresh search. Until then, a reload checks
  `hold-status` again.
- Make this "payment taken, not yet confirmed" state calm and reassuring, not
  an error. Elhaam's example of the tone is "Hang tight! You'll get a
  confirmation soon if your money is deducted." Follow how AnjomaZone
  handles the same case.
- Store in `sessionStorage` that Stripe accepted a payment for this
  `holdReference`. Remove the saved payment step only after saving the paid
  marker succeeds, so a failed write leaves the payment step available for
  recovery. After a reload or a return from Stripe, check `hold-status` again
  before showing anything else. If it answers `NotFound` after a payment
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
- **The live card-guarantee policy and gateway.** The test-account guarantee
  journey is now verified below. The live diary's equivalent configuration and
  approved live-account acceptance remain separate release checks.

### Hosted payment verification on 2 November 2026

The reviewed preview was updated to deployment
`dpl_6oAt3T8i8BbSt3d9W2uWbWq8MT4r`, release
`peploes-staging-preview-2026-11-02-227359b-r4`, at
`https://peploes-fork.vercel.app/`. Its production application files
include the reload-based Stripe retry and visible desktop booking reference.
The latter removes an existing desktop-only hide rule; the reference remains
the one ResDiary confirmed. Changes remain uncommitted, based on
PR #75 head `227359bc428dc5860bbf9c1996732a1b77ec7748`.

The previous preview passed actual sandbox deposit payment, 3-D Secure,
decline/retry, reload before payment, reload after payment and a lost Stripe
reply. The initial six-case run had five passes and one provider-details
uncertainty before reaching the card form. The app offered its documented safe
Confirm retry. That declined-card case passed unchanged on a focused rerun.
Its abandoned synthetic hold was cancelled and verified as Cancelled.

The test diary `3899`, labelled Peploes Test, had a card requirement for parties
larger than eight, outside the website's seven-guest limit. Its existing Credit
Card rule `1928` was changed to parties larger than six for staging acceptance.
All other card-rule switches were preserved. Stripe's Use Live Stripe Settings
remained unchecked. Read-only API checks confirm two guests do not require a
card and seven do. No live diary setting, production credential or website
party-size limit was changed. To undo this test setup, edit Payment & Card
Settings, Credit Card, and restore its threshold from six to eight. Keep six
through Gina's seven-person guarantee test; do not copy it as a live policy.

On the updated preview, all three real guarantee scenarios passed across runs:
save/reload/confirm, declined card followed by another card, and 3-D Secure.
Each asserts a test-mode SetupIntent, no deposit-payment confirmation request,
SetupIntent `succeeded`, ResDiary Booked status and zero deposit paid. Each
known test reference was cancelled and verified as Cancelled. The initial
standard run encountered a five-second create-hold timeout; another initial
retry click did not submit a second request. Both focused reruns passed without
changing production code or increasing provider deadlines. These failures are
retained in the verification record; passing reruns do not prove provider
availability or a zero-failure rate.

After another times-search timeout on the Washington deployment, the next
preview was placed in Dublin with Vercel's `--regions dub1` option. Request
headers distinguish the connecting edge from execution: `bom1::iad1` before,
`bom1::dub1` afterwards. The log's Mumbai label alone was not evidence that
functions executed there. Three subsequent availability reads returned 200
in 772–866 ms. Dublin deployment `dpl_BGqZTQKLwxzb3hvZ7MNaL7vQzLy4`
passed all four provider-backed scenarios together, without retries: deposit,
standard guarantee with reload, declined guarantee with retry, and 3-D Secure
guarantee. The final deployment above then passed deposit and standard guarantee
again, including a visible confirmation reference. Known test references were
cancelled and verified as Cancelled. This small sample supports using Dublin for
staging; it does not establish a general latency guarantee.

The final source passes `bun run ci`: 1,013 unit tests, lint, application/Studio
types and builds, and both high-severity audits. A visibility regression failed
before removing the desktop hide rule. The stalled-script recovery regression
also failed before the reload fix. Hosted tests with simulated Stripe faults
passed script, intent-read and element stalls; their assertions retain staging's
disabled cancellation policy. No dependency or booking service was added.

For Gina, choose 3 November 2026, two guests at 7:15 pm for the €20 deposit,
or seven guests at a morning or lunch time with no deposit for the card
guarantee. Availability can change. Two guests at a no-deposit time exercise
the reservation without a card. Use Stripe's documented test Visa
`4242 4242 4242 4242`, future expiry such as `12/34`, and CVC `123` only while
the test account and test gateway are configured. No real card is needed.
Actual email delivery and live ResDiary/gateway mapping remain release checks.

### Resolving an unknown outcome

Follow the [booking reconciliation runbook](../guides/booking-reconciliation-guide.md)
for restricted server evidence, payment checks, escalation and release verification.

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
