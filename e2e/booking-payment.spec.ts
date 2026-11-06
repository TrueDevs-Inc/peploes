import type { Page, Route } from "@playwright/test";
import type { IHoldSummary } from "../src/lib/types";
import {
  addDays,
  bookingTestTime,
  dublinToday,
  FAKE_TIMES,
  shortDayLabel,
} from "./booking-fixtures";
import {
  chooseDate,
  findTable,
  laterFreeDate,
  openBooking,
} from "./booking-page";
import { expect, test } from "./booking-test";

function label(time: string): string {
  return FAKE_TIMES.find((slot) => slot.time === time)?.label ?? time;
}

async function paidFor(page: Page, time: string) {
  await page.clock.install({ time: bookingTestTime() });
  const reservations = await openBooking(page);
  await chooseDate(reservations, laterFreeDate());
  await findTable(reservations);
  await reservations
    .getByRole("button", { name: label(time), exact: true })
    .click();
  await reservations
    .getByRole("button", { name: "Continue", exact: true })
    .click();
  await expect(reservations.getByRole("timer")).toBeVisible();
  const date = laterFreeDate();
  const reference = await page.evaluate(
    ({ date, dateLabel, time, timeLabel }) => {
      const hold = JSON.parse(
        sessionStorage.getItem("peploes:booking-hold") ?? "{}",
      ) as { holdReference: string; holdRevision: number };
      sessionStorage.setItem(
        "peploes:booking-paid",
        JSON.stringify({
          reference: hold.holdReference,
          revision: hold.holdRevision,
          date,
          dateLabel,
          time,
          timeLabel,
          partySize: 4,
          guestsLabel: "4 guests",
          offer: {
            kind: "standard",
            feeCents: 0,
            mayRequireCard: false,
            returnBy: null,
          },
        } satisfies IHoldSummary),
      );
      return hold.holdReference;
    },
    { date, dateLabel: shortDayLabel(date), time, timeLabel: label(time) },
  );
  await page.reload();
  return { reservations, reference };
}

test("when ResDiary stays pending after payment the page keeps calm and gives the reference after a minute", async ({
  page,
}) => {
  const { reservations, reference } = await paidFor(page, "18:00");

  await expect(
    reservations.getByText("Confirming your booking…", { exact: true }),
  ).toBeVisible();
  await expect(
    reservations.locator('[data-booking-skeleton="status"]:visible'),
  ).toHaveCount(1);
  await expect(
    reservations.getByRole("button", { name: "Edit date & guests" }),
  ).toBeDisabled();
  await page.clock.fastForward("01:01");
  await expect(
    reservations.getByText(
      `Hang tight! We're still confirming booking ${reference}. If your card was charged, your confirmation will follow shortly. If you hear nothing in a few minutes, please call us on +353 1 676 3144.`,
      { exact: true },
    ),
  ).toBeVisible({ timeout: 10_000 });
  await expect(
    reservations.locator('[data-booking-skeleton="status"]:visible'),
  ).toHaveCount(0);
  await expect(reservations.getByRole("alert")).toHaveCount(0);
  await expect(reservations.getByRole("button", { name: /^Pay / })).toHaveCount(
    0,
  );
});

test("a status check that never answers still gives the reference and phone after a minute", async ({
  page,
}) => {
  await page.route("**/api/bookings/hold-status?**", () => undefined);
  const { reservations, reference } = await paidFor(page, "18:00");

  await expect(
    reservations.getByText("Confirming your booking…", { exact: true }),
  ).toBeVisible();
  await page.clock.fastForward("01:01");
  await expect(
    reservations.getByText(
      `Hang tight! We're still confirming booking ${reference}.`,
    ),
  ).toBeVisible({ timeout: 10_000 });
});

test("when ResDiary reports the booking failed after payment the page says so with the phone and reference", async ({
  page,
}) => {
  const { reservations, reference } = await paidFor(page, "12:00");

  await expect(reservations.getByRole("alert")).toHaveText(
    `We couldn't confirm booking ${reference}. If your card was charged, please call us on +353 1 676 3144 and quote this reference.`,
    { timeout: 10_000 },
  );
});

test("after a failed booking the guest can start again, and a reload does not bring the failure back", async ({
  page,
}) => {
  const { reservations, reference } = await paidFor(page, "12:00");

  await expect(reservations.getByRole("alert")).toHaveText(
    `We couldn't confirm booking ${reference}. If your card was charged, please call us on +353 1 676 3144 and quote this reference.`,
    { timeout: 10_000 },
  );
  await page.reload();
  await expect(
    reservations.getByRole("button", { name: "Find a Table", exact: true }),
  ).toBeVisible();
  await expect(reservations.getByRole("alert")).toHaveCount(0);
  await expect(
    reservations.getByRole("button", { name: "Edit date & guests" }),
  ).toHaveCount(0);
});

test("the failed booking message offers Start Again, which opens a fresh search", async ({
  page,
}) => {
  const { reservations } = await paidFor(page, "12:00");

  await expect(reservations.getByRole("alert")).toBeVisible({
    timeout: 10_000,
  });
  await reservations
    .getByRole("button", { name: "Start Again", exact: true })
    .click();
  await expect(
    reservations.getByRole("button", { name: "Find a Table", exact: true }),
  ).toBeVisible();
  await expect(reservations.getByRole("alert")).toHaveCount(0);
});

test("while the booking is still confirming the guest can start again, and a reload stays on the fresh search", async ({
  page,
}) => {
  const { reservations, reference } = await paidFor(page, "18:00");

  await expect(
    reservations.getByText("Confirming your booking…", { exact: true }),
  ).toBeVisible();
  await page.clock.fastForward("01:01");
  await expect(
    reservations.getByText(
      `Hang tight! We're still confirming booking ${reference}.`,
    ),
  ).toBeVisible({ timeout: 10_000 });
  await reservations
    .getByRole("button", { name: "Start Again", exact: true })
    .click();
  const warning = reservations.getByText(
    `Booking ${reference} may still go through. If it does and you book again, you'll have two bookings and could be charged twice.`,
    { exact: true },
  );
  await expect(warning).toBeVisible();
  await expect(warning).toBeFocused();
  await expect(
    reservations.getByRole("button", { name: "Find a Table", exact: true }),
  ).toHaveCount(0);
  await expect(
    reservations.getByRole("button", { name: "Check Again", exact: true }),
  ).toHaveCount(0);
  await reservations
    .getByRole("button", { name: "Start Again", exact: true })
    .click();
  await expect(
    reservations.getByRole("button", { name: "Find a Table", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    reservations.getByRole("button", { name: "Find a Table", exact: true }),
  ).toBeVisible();
  await expect(
    reservations.getByText(`Hang tight! We're still confirming booking`),
  ).toHaveCount(0);
});

test("Keep Waiting returns to the still-confirming booking without clearing the paid state", async ({
  page,
}) => {
  const { reservations, reference } = await paidFor(page, "18:00");

  await expect(
    reservations.getByText("Confirming your booking…", { exact: true }),
  ).toBeVisible();
  await page.clock.fastForward("01:01");
  const stillConfirming = reservations.getByText(
    `Hang tight! We're still confirming booking ${reference}.`,
  );
  await expect(stillConfirming).toBeVisible();
  const savedPaid = await page.evaluate(() =>
    sessionStorage.getItem("peploes:booking-paid"),
  );
  expect(savedPaid).not.toBeNull();
  await reservations
    .getByRole("button", { name: "Start Again", exact: true })
    .click();
  await reservations
    .getByRole("button", { name: "Keep Waiting", exact: true })
    .click();

  await expect(stillConfirming).toBeVisible();
  await expect(
    reservations.getByText(`Booking ${reference} may still go through.`),
  ).toHaveCount(0);
  await expect(
    reservations.getByRole("button", { name: "Check Again", exact: true }),
  ).toBeVisible();
  await expect(
    reservations.getByRole("button", { name: "Start Again", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => sessionStorage.getItem("peploes:booking-paid")),
  ).toBe(savedPaid);
  await expect(
    reservations.getByRole("button", { name: "Find a Table", exact: true }),
  ).toHaveCount(0);
});

test("Check Again checks the same paid booking and shows its confirmation when ResDiary confirms", async ({
  page,
}) => {
  const { reservations, reference } = await paidFor(page, "18:00");

  await expect(
    reservations.getByText("Confirming your booking…", { exact: true }),
  ).toBeVisible();
  await page.clock.fastForward("01:01");
  await expect(
    reservations.getByText(
      `Hang tight! We're still confirming booking ${reference}.`,
    ),
  ).toBeVisible();
  const requests: Route[] = [];
  await page.route("**/api/bookings/hold-status?**", (route) => {
    requests.push(route);
  });
  await reservations
    .getByRole("button", { name: "Check Again", exact: true })
    .click();

  await expect(
    reservations.getByText("Confirming your booking…", { exact: true }),
  ).toBeVisible();
  await expect.poll(() => requests.length).toBe(1);
  const request = requests[0];
  expect(request?.request().url()).toContain(`holdReference=${reference}`);
  await request?.fulfill({
    json: {
      ok: true,
      data: {
        status: "confirmed",
        reference,
        summary: {
          reference,
          revision: 1,
          date: laterFreeDate(),
          dateLabel: "Sat, 7 Nov 2026",
          time: "18:00",
          timeLabel: "6:00 pm",
          partySize: 4,
          guestsLabel: "4 guests",
          offer: {
            kind: "standard",
            feeCents: 2000,
            mayRequireCard: false,
            returnBy: null,
          },
        },
      },
    },
  });
  await expect(
    reservations.getByRole("heading", {
      name: "Your table is booked.",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    reservations
      .locator("p", { hasText: "Booking reference" })
      .locator("strong"),
  ).toHaveText(reference);
});

test("Check Again returns to Hang tight after another minute without confirmation", async ({
  page,
}) => {
  const { reservations, reference } = await paidFor(page, "18:00");
  const checking = reservations.getByText("Confirming your booking…", {
    exact: true,
  });
  const stillConfirming = reservations.getByText(
    `Hang tight! We're still confirming booking ${reference}.`,
  );
  await expect(checking).toBeVisible();
  await page.clock.fastForward("01:01");
  await expect(stillConfirming).toBeVisible();
  await reservations
    .getByRole("button", { name: "Check Again", exact: true })
    .click();

  await expect(checking).toBeVisible();
  await page.clock.fastForward("01:01");
  await expect(stillConfirming).toBeVisible();
});

test("Check Again shows the failed message if ResDiary says the paid booking failed", async ({
  page,
}) => {
  const { reservations, reference } = await paidFor(page, "18:00");
  await expect(
    reservations.getByText("Confirming your booking…", { exact: true }),
  ).toBeVisible();
  await page.clock.fastForward("01:01");
  await expect(
    reservations.getByText(
      `Hang tight! We're still confirming booking ${reference}.`,
    ),
  ).toBeVisible();
  await page.route("**/api/bookings/hold-status?**", (route) =>
    route.fulfill({ json: { ok: true, data: { status: "failed" } } }),
  );
  await reservations
    .getByRole("button", { name: "Check Again", exact: true })
    .click();

  await expect(reservations.getByRole("alert")).toHaveText(
    `We couldn't confirm booking ${reference}. If your card was charged, please call us on +353 1 676 3144 and quote this reference.`,
  );
});

test("a return address from a different payment is cleared and never counts as paid", async ({
  page,
}) => {
  await page.route("https://js.stripe.com/**", (route) => route.abort());
  const reservations = await openBooking(page);
  await page.route("**/api/bookings/hold-status?**", (route) =>
    route.fulfill({ json: { ok: true, data: { status: "pending" } } }),
  );
  await page.evaluate(
    (date) =>
      sessionStorage.setItem(
        "peploes:booking-payment",
        JSON.stringify({
          kind: "payment",
          amountCents: 2000,
          amountText: "€20.00",
          stripe: {
            publishableKey: "pk_test_e2e",
            accountId: "acct_e2e",
            clientSecret: "pi_saved_secret_saved",
          },
          summary: {
            reference: "E2E99999",
            revision: 1,
            date,
            time: "18:00",
            partySize: 4,
          },
        }),
      ),
    laterFreeDate(),
  );

  await page.goto(
    "/book-a-table?payment_intent=pi_other&payment_intent_client_secret=pi_other_secret_other&redirect_status=succeeded",
  );
  await expect(page).toHaveURL(/\/book-a-table$/);
  await expect(
    reservations.getByRole("heading", {
      name: "Secure your table",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    reservations.getByText("Confirming your booking…", { exact: true }),
  ).toHaveCount(0);
});

test("Edit is already disabled when the payment step first appears, before Stripe has answered", async ({
  page,
}) => {
  await page.route("https://js.stripe.com/**", () => undefined);
  await page.addInitScript(() => {
    const seen: boolean[] = [];
    Object.assign(window, { editWhenPaymentAppeared: seen });
    new MutationObserver(() => {
      if (seen.length > 0) return;
      const heading = [...document.querySelectorAll("h2")].find(
        (element) => element.textContent === "Secure your table",
      );
      const edit = document.querySelector<HTMLButtonElement>(
        'button[aria-label="Edit date & guests"]',
      );
      if (heading && edit) seen.push(edit.disabled);
    }).observe(document, { childList: true, subtree: true });
  });
  const reservations = await openBooking(page);
  await page.route("**/api/bookings/hold-status?**", (route) =>
    route.fulfill({ json: { ok: true, data: { status: "pending" } } }),
  );
  await page.evaluate(
    (date) =>
      sessionStorage.setItem(
        "peploes:booking-payment",
        JSON.stringify({
          kind: "payment",
          amountCents: 2000,
          amountText: "€20.00",
          stripe: {
            publishableKey: "pk_test_e2e",
            accountId: "acct_e2e",
            clientSecret: "pi_saved_secret_saved",
          },
          summary: {
            reference: "E2E99999",
            revision: 1,
            date,
            dateLabel: "Sat, 7 Nov 2026",
            time: "18:00",
            timeLabel: "6:00 pm",
            partySize: 4,
            guestsLabel: "4 guests",
            offer: {
              kind: "standard",
              feeCents: 2000,
              mayRequireCard: false,
              returnBy: null,
            },
          },
        }),
      ),
    laterFreeDate(),
  );
  await page.reload();

  await expect(
    reservations.getByRole("heading", {
      name: "Secure your table",
      exact: true,
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { editWhenPaymentAppeared: boolean[] })
          .editWhenPaymentAppeared,
    ),
  ).toEqual([true]);
});

test("restoring yesterday's payment keeps its reservation date in subsequent reads", async ({
  page,
}) => {
  await page.route("https://js.stripe.com/**", (route) => route.abort());
  const requestedDates: string[] = [];
  await page.route("**/api/bookings/times?**", (route) => {
    requestedDates.push(
      new URL(route.request().url()).searchParams.get("date") ?? "",
    );
    return route.fallback();
  });
  await openBooking(page);
  const evening = addDays(dublinToday(), -1);
  await page.evaluate(
    (date) =>
      sessionStorage.setItem(
        "peploes:booking-payment",
        JSON.stringify({
          kind: "payment",
          amountCents: 2000,
          amountText: "€20.00",
          stripe: {
            publishableKey: "pk_test_e2e",
            accountId: "acct_e2e",
            clientSecret: "pi_saved_secret_saved",
          },
          summary: {
            reference: "E2E99999",
            revision: 1,
            date,
            dateLabel: date,
            time: "18:00",
            timeLabel: "6:00 pm",
            partySize: 4,
            guestsLabel: "4 guests",
            offer: {
              kind: "standard",
              feeCents: 2000,
              mayRequireCard: false,
              returnBy: null,
            },
          },
        }),
      ),
    evening,
  );
  await page.reload();
  await expect(
    page.getByText("We can't check booking E2E99999 from this page.", {
      exact: false,
    }),
  ).toBeVisible();
  await expect.poll(() => requestedDates).toContain(evening);
  expect(requestedDates).not.toContain(dublinToday());
});
