import type { Page } from "@playwright/test";
import { expect, settle, test } from "./analytics-harness";
import { bookingTestTime } from "./booking-fixtures";
import {
  chooseDate,
  findTable,
  laterFreeDate,
  openBooking,
} from "./booking-page";

test.beforeEach(async ({ page }) => {
  await page.clock.setSystemTime(bookingTestTime());
});

async function stubStripe(
  page: Page,
  outcome: "accepted" | "declined" | "unknown" | "load_failed",
) {
  await page.route("https://js.stripe.com/**", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: `window.stripeConfirmationCalled = false; window.Stripe = () => ({
        retrievePaymentIntent: () => ${outcome === "unknown" ? "window.stripeConfirmationCalled ? Promise.reject(new Error('Connection lost')) : " : ""}Promise.resolve({ paymentIntent: {status:'requires_payment_method',amount:2000,currency:'eur'} }),
        elements: () => ({ create: () => { let ready, failed; return { on:(event,handler)=>{if(event==='ready')ready=handler;if(event==='loaderror')failed=handler;}, mount: target=>{target.textContent='Card details'; ${outcome === "load_failed" ? "failed();" : "ready();"}}, destroy:()=>{} }; } }),
        confirmPayment: () => { window.stripeConfirmationCalled = true; return ${outcome === "unknown" ? "Promise.reject(new Error('Connection lost'))" : outcome === "declined" ? "Promise.resolve({error:{type:'card_error',message:'Synthetic decline'}})" : "Promise.resolve({paymentIntent:{status:'succeeded'}})"}; }
      }); window.Stripe.version='endive';`,
    }),
  );
}

async function heldDetails(page: Page, time = "6:30 pm") {
  const reservations = await openBooking(page);
  await chooseDate(reservations, laterFreeDate());
  await findTable(reservations);
  await reservations.getByRole("button", { name: time, exact: true }).click();
  await reservations
    .getByRole("button", { name: "Continue", exact: true })
    .click();
  await reservations.getByLabel("First name", { exact: false }).fill("Funnel");
  await reservations.getByLabel("Surname", { exact: false }).fill("Synthetic");
  await reservations
    .getByLabel("Email address", { exact: false })
    .fill("funnel@example.com");
  await reservations
    .getByLabel("Mobile number", { exact: false })
    .fill("087 123 4567");
  await reservations.getByRole("checkbox", { name: /By confirming/ }).check();
  return reservations;
}

for (const outcome of [
  "accepted",
  "declined",
  "unknown",
  "load_failed",
] as const) {
  test(`staging deposit ${outcome} reports its funnel without inventing a confirmed booking`, async ({
    page,
    context,
    analytics,
  }) => {
    await stubStripe(page, outcome);
    const reservations = await heldDetails(page);
    await reservations
      .getByRole("button", { name: "Confirm Reservation", exact: true })
      .click();
    if (outcome !== "load_failed") {
      await reservations
        .getByRole("button", { name: "Pay €20.00 and Reserve", exact: true })
        .click();
    }
    await expect
      .poll(() =>
        analytics
          .gaNamed("booking_payment")
          .some((event) => event.params.result === outcome),
      )
      .toBe(true);
    await expect
      .poll(() =>
        analytics
          .posthogNamed("booking_payment")
          .some((event) => event.properties.result === outcome),
      )
      .toBe(true);
    expect(analytics.gaNamed("booking_confirmed")).toHaveLength(0);
    if (outcome === "accepted") {
      const summary = await page.evaluate(() =>
        JSON.parse(sessionStorage.getItem("peploes:booking-paid") ?? "null"),
      );
      expect(summary?.reference).toMatch(/^E2E/);
      const other = await context.newPage();
      await other.addInitScript(
        (saved) =>
          sessionStorage.setItem("peploes:booking-paid", JSON.stringify(saved)),
        summary,
      );
      await context.route("**/api/bookings/hold-status?**", (route) =>
        route.fulfill({
          json: {
            ok: true,
            data: {
              status: "confirmed",
              reference: summary.reference,
              summary,
            },
          },
        }),
      );
      await other.goto("/book-a-table");
      await expect(
        reservations.getByRole("heading", {
          name: "Your table is booked.",
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        other.getByRole("heading", {
          name: "Your table is booked.",
          exact: true,
        }),
      ).toBeVisible();
      await settle(page);
      expect(analytics.gaNamed("booking_confirmed")).toHaveLength(1);
      expect(analytics.posthogNamed("booking_confirmed")).toHaveLength(1);
      expect(
        analytics
          .gaNamed("booking_recovery")
          .some((event) => event.params.result === "confirmed"),
      ).toBe(true);
      const ids = analytics.ga
        .filter((event) => event.event.startsWith("booking_"))
        .map((event) => event.params.attempt_id);
      expect(new Set(ids).size).toBe(1);
      await other.close();
    }
    const payloads = JSON.stringify([analytics.ga, analytics.posthogEvents]);
    expect(payloads).not.toContain("funnel@example.com");
    expect(payloads).not.toContain("087 123 4567");
    expect(payloads).not.toContain("E2E000");
    expect(payloads).not.toContain("pi_e2e_secret");
  });
}

test("the details countdown reports hold expiry before clearing the hold", async ({
  page,
  analytics,
}) => {
  await page.clock.install({ time: bookingTestTime() });
  const reservations = await heldDetails(page, "6:00 pm");
  await expect
    .poll(() => analytics.posthogNamed("booking_hold").length)
    .toBe(1);
  await page.clock.fastForward("05:01");
  await expect(reservations.getByRole("alert")).toHaveText(
    "Your table hold ran out. Please choose a time again.",
  );
  await expect
    .poll(() =>
      analytics
        .gaNamed("booking_hold")
        .some((event) => event.params.result === "expired"),
    )
    .toBe(true);
  await expect
    .poll(() =>
      analytics
        .posthogNamed("booking_hold")
        .some((event) => event.properties.result === "expired"),
    )
    .toBe(true);
  expect(analytics.gaNamed("booking_confirmed")).toHaveLength(0);
});

test("a provider-reported failed hold is not reported as expiry", async ({
  page,
  analytics,
}) => {
  await stubStripe(page, "accepted");
  const reservations = await heldDetails(page);
  await page.route("**/api/bookings/hold-status?**", (route) =>
    route.fulfill({ json: { ok: true, data: { status: "failed" } } }),
  );
  await reservations
    .getByRole("button", { name: "Confirm Reservation", exact: true })
    .click();
  await expect
    .poll(() =>
      analytics
        .gaNamed("booking_hold")
        .some((event) => event.params.result === "failed"),
    )
    .toBe(true);
  expect(
    analytics
      .gaNamed("booking_hold")
      .some((event) => event.params.result === "expired"),
  ).toBe(false);
  expect(analytics.gaNamed("booking_confirmed")).toHaveLength(0);
});

for (const payment of [false, true]) {
  test(`blocked browser storage preserves ${payment ? "payment failure measurement" : "booking confirmation measurement"}`, async ({
    page,
    analytics,
  }) => {
    await page.addInitScript(() => {
      for (const name of ["localStorage", "sessionStorage"])
        Object.defineProperty(window, name, {
          get() {
            throw new Error("blocked");
          },
        });
    });
    const reservations = await heldDetails(
      page,
      payment ? "6:30 pm" : "6:00 pm",
    );
    await reservations
      .getByRole("button", { name: "Confirm Reservation", exact: true })
      .click();
    if (payment) {
      await expect
        .poll(() =>
          analytics
            .gaNamed("booking_payment")
            .some(
              (event) =>
                event.params.result === "load_failed" &&
                event.params.error_code === "STORAGE",
            ),
        )
        .toBe(true);
      expect(analytics.gaNamed("booking_confirmed")).toHaveLength(0);
      await expect(
        reservations.getByRole("button", { name: /^Pay / }),
      ).toHaveCount(0);
    } else {
      await expect(
        reservations.getByRole("heading", {
          name: "Your table is booked.",
          exact: true,
        }),
      ).toBeVisible();
      await expect
        .poll(() => analytics.gaNamed("booking_confirmed").length)
        .toBe(1);
      await expect
        .poll(() => analytics.posthogNamed("booking_confirmed").length)
        .toBe(1);
    }
  });
}
