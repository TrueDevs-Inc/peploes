import type { Page } from "@playwright/test";

import { laterFreeDate, openBooking } from "./booking-page";
import { expect, test } from "./menu-test";

async function paymentStep(page: Page, kind: "payment" | "card" = "payment") {
  const reservations = await openBooking(page);
  await page.route("**/api/bookings/hold-status?**", (route) =>
    route.fulfill({ json: { ok: true, data: { status: "pending" } } }),
  );
  await page.evaluate(
    ({ date, kind }) => {
      sessionStorage.setItem(
        "peploes:booking-payment",
        JSON.stringify({
          kind,
          amountText: "€20.00",
          stripe: {
            publishableKey: "pk_test_e2e",
            accountId: "acct_e2e",
            clientSecret:
              kind === "card"
                ? "seti_saved_secret_saved"
                : "pi_saved_secret_saved",
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
      );
    },
    { date: laterFreeDate(), kind },
  );
  await page.reload({ waitUntil: "domcontentloaded" });
  return reservations;
}

async function stripeStub(
  page: Page,
  stall: "intent" | "element" | "confirm" | "card-success" | "card-rejected",
) {
  await page.route("https://js.stripe.com/**", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: `window.stripeCalls = []; window.Stripe = () => ({
      retrievePaymentIntent: () => {
        window.stripeCalls.push('paymentIntent');
        if (${JSON.stringify(stall)} === 'intent' && !window.stripeIntentReady) return new Promise(() => {});
        return Promise.resolve({ paymentIntent: { status: 'requires_payment_method', amount: 2000, currency: 'eur' } });
      },
      retrieveSetupIntent: () => {
        window.stripeCalls.push('setupIntent');
        return Promise.resolve({ setupIntent: { status: 'requires_payment_method' } });
      },
      elements: () => ({ create: () => {
        let ready;
        return {
          on: (event, handler) => { if (event === 'ready') ready = handler; },
          mount: target => { target.textContent = 'Card details'; ${stall === "element" ? "" : "ready();"} },
          destroy: () => {}
        };
      } }),
      confirmPayment: () => { window.stripeCalls.push('confirmPayment'); return Promise.reject(new Error('Connection lost')); },
      confirmSetup: () => { window.stripeCalls.push('confirmSetup'); return ${stall === "card-rejected" ? "Promise.reject(new Error('Connection lost'))" : "Promise.resolve({ setupIntent: { status: 'succeeded' } })"}; }
    }); window.Stripe.version = 'endive';`,
    }),
  );
}

for (const stalled of ["script", "intent", "element"] as const) {
  test(`a stalled Stripe ${stalled} offers retry and unlocks Edit`, async ({
    page,
  }) => {
    await page.clock.install();
    if (stalled === "script")
      await page.route("https://js.stripe.com/**", () => undefined);
    else await stripeStub(page, stalled);
    const reservations = await paymentStep(page);
    await expect(
      reservations.getByText("Loading secure payment…", { exact: true }),
    ).toBeVisible();
    await page.clock.fastForward(16_000);
    await expect(
      reservations.getByRole("button", { name: "Try Again", exact: true }),
    ).toBeVisible();
    await expect(
      reservations.getByRole("button", { name: "Edit date & guests" }),
    ).toBeEnabled();
    if (stalled === "intent") {
      await page.evaluate(() => Reflect.set(window, "stripeIntentReady", true));
      await page.addInitScript(() =>
        Reflect.set(window, "stripeIntentReady", true),
      );
    }
    if (stalled === "script") {
      await page.unroute("https://js.stripe.com/**");
      await stripeStub(page, "confirm");
    }
    if (stalled !== "element") {
      await reservations
        .getByRole("button", { name: "Try Again", exact: true })
        .click();
      await expect(
        reservations.getByRole("button", {
          name: "Pay €20.00 and Reserve",
          exact: true,
        }),
      ).toBeEnabled();
    }
  });
}

test("a rejected Stripe confirmation checks the reservation instead of offering another payment", async ({
  page,
}) => {
  await stripeStub(page, "confirm");
  const reservations = await paymentStep(page);
  await reservations
    .getByRole("button", { name: "Pay €20.00 and Reserve", exact: true })
    .click();
  await expect(
    reservations.getByText("Confirming your booking…", { exact: true }),
  ).toBeVisible();
  await expect(reservations.getByRole("button", { name: /^Pay / })).toHaveCount(
    0,
  );
});

for (const outcome of ["success", "rejected"] as const) {
  test(`a ${outcome} card-guarantee confirmation uses SetupIntent and checks ResDiary without requesting payment`, async ({
    page,
  }) => {
    await stripeStub(
      page,
      outcome === "success" ? "card-success" : "card-rejected",
    );
    const reservations = await paymentStep(page, "card");
    await reservations
      .getByRole("button", { name: "Save Card and Reserve", exact: true })
      .click();
    await expect(
      reservations.getByText("Confirming your booking…", { exact: true }),
    ).toBeVisible();
    await expect(
      reservations.getByRole("button", {
        name: "Save Card and Reserve",
        exact: true,
      }),
    ).toHaveCount(0);
    expect(
      await page.evaluate(() => Reflect.get(window, "stripeCalls")),
    ).toEqual(["setupIntent", "confirmSetup"]);
  });
}
