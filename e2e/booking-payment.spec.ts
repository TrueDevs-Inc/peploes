import type { Page } from "@playwright/test";

import { FAKE_TIMES } from "./booking-fixtures";
import {
  chooseDate,
  findTable,
  laterFreeDate,
  openBooking,
} from "./booking-page";
import { expect, test } from "./menu-test";

function label(time: string): string {
  return FAKE_TIMES.find((slot) => slot.time === time)?.label ?? time;
}

async function paidFor(page: Page, time: string) {
  await page.clock.install();
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
  const reference = await page.evaluate(() => {
    const hold = JSON.parse(
      sessionStorage.getItem("peploes:booking-hold") ?? "{}",
    ) as { holdReference: string; holdRevision: number };
    sessionStorage.setItem(
      "peploes:booking-paid",
      JSON.stringify({
        reference: hold.holdReference,
        revision: hold.holdRevision,
      }),
    );
    return hold.holdReference;
  });
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
    reservations.getByRole("button", { name: "Edit date & guests" }),
  ).toBeDisabled();
  await page.clock.fastForward("01:01");
  await expect(
    reservations.getByText(
      `Hang tight! We're still confirming booking ${reference}. If your card was charged, your confirmation will follow shortly. If you hear nothing in a few minutes, please call us on +353 1 676 3144.`,
      { exact: true },
    ),
  ).toBeVisible({ timeout: 10_000 });
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

test("a return address from a different payment is cleared and never counts as paid", async ({
  page,
}) => {
  const reservations = await openBooking(page);
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
