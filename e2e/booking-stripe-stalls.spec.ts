import type { Page } from "@playwright/test";
import { bookingTestTime } from "./booking-fixtures";

import { restorePaymentStep } from "./booking-page";
import { expect, test } from "./booking-test";

async function stripeStub(
  page: Page,
  stall: "intent" | "element" | "confirm" | "card-success",
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
      confirmSetup: () => { window.stripeCalls.push('confirmSetup'); return Promise.resolve({ setupIntent: { status: 'succeeded' } }); }
    }); window.Stripe.version = 'endive';`,
    }),
  );
}

for (const stalled of ["script", "intent", "element"] as const) {
  test(`a stalled Stripe ${stalled} offers retry and unlocks Edit`, async ({
    page,
  }) => {
    await page.clock.install({ time: bookingTestTime() });
    if (stalled === "script")
      await page.route("https://js.stripe.com/**", () => undefined);
    else await stripeStub(page, stalled);
    const reservations = await restorePaymentStep(page);
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

test("a successful card-guarantee confirmation uses SetupIntent and checks ResDiary without requesting payment", async ({
  page,
}) => {
  await stripeStub(page, "card-success");
  const reservations = await restorePaymentStep(page, "card");
  const recovered: URL[] = [];
  await page.route("**/api/bookings/hold-status?**", async (route) => {
    const confirmed = await page.evaluate(() =>
      (Reflect.get(window, "stripeCalls") as string[]).includes("confirmSetup"),
    );
    if (confirmed) recovered.push(new URL(route.request().url()));
    await route.fulfill({ json: { ok: true, data: { status: "pending" } } });
  });
  await reservations
    .getByRole("button", { name: "Save Card and Reserve", exact: true })
    .click();
  await expect.poll(() => recovered.length).toBeGreaterThan(0);
  expect(recovered[0]?.searchParams.get("holdReference")).toBe("E2E99999");
  expect(recovered[0]?.searchParams.get("holdRevision")).toBe("1");
  await expect(
    reservations.getByText("Confirming your booking…", { exact: true }),
  ).toBeVisible();
  await expect(
    reservations.getByRole("button", {
      name: "Save Card and Reserve",
      exact: true,
    }),
  ).toHaveCount(0);
  const calls = await page.evaluate(() => Reflect.get(window, "stripeCalls"));
  expect(calls).toContain("confirmSetup");
  expect(calls).not.toContain("confirmPayment");
});
