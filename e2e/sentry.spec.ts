import { bookingTestTime } from "./booking-fixtures";
import { restorePaymentStep } from "./booking-page";
import { expect, test } from "./menu-test";

function parseEvent(line: string): Record<string, unknown> | null {
  try {
    const value = JSON.parse(line);
    return value.exception ? value : null;
  } catch {
    return null;
  }
}

test("browser errors use configured labels and scrub URLs without deployment-based indexing changes", async ({
  page,
}) => {
  const events: Record<string, unknown>[] = [];
  await page.route("https://sentry.e2e.test/**", async (route) => {
    for (const line of (route.request().postData() ?? "").split("\n")) {
      const event = parseEvent(line);
      if (event) events.push(event);
    }
    await route.fulfill({
      status: 200,
      body: "{}",
      headers: { "access-control-allow-origin": "*" },
    });
  });
  const response = await page.goto(
    "/?token=synthetic-private-token#private-fragment",
  );
  expect(response?.headers()["x-robots-tag"]).toBeUndefined();
  await page.evaluate(() => {
    setTimeout(() => {
      throw new Error("Peploes browser staging verification");
    }, 0);
  });
  await expect.poll(() => events.length, { timeout: 15_000 }).toBe(1);
  expect(JSON.stringify(events[0]?.exception)).toContain(
    "Peploes browser staging verification",
  );
  expect(events[0]?.environment).toBe("e2e");
  expect(events[0]?.release).toBe("peploes-e2e");
  expect(JSON.stringify(events)).not.toContain("synthetic-private-token");
  expect(JSON.stringify(events)).not.toContain("private-fragment");
});

for (const kind of ["payment", "card"] as const) {
  test(`a rejected Stripe ${kind} confirmation reports safe operation diagnostics`, async ({
    page,
  }) => {
    await page.clock.setSystemTime(bookingTestTime());
    const events: Record<string, unknown>[] = [];
    await page.route("https://sentry.e2e.test/**", async (route) => {
      for (const line of (route.request().postData() ?? "").split("\n")) {
        const event = parseEvent(line);
        if (event) events.push(event);
      }
      await route.fulfill({
        status: 200,
        body: "{}",
        headers: { "access-control-allow-origin": "*" },
      });
    });
    await page.route("https://js.stripe.com/**", (route) =>
      route.fulfill({
        contentType: "application/javascript",
        body: `window.Stripe = () => ({
        retrievePaymentIntent: () => Promise.resolve({ paymentIntent: { status: 'requires_payment_method', amount: 2000, currency: 'eur' } }),
        retrieveSetupIntent: () => Promise.resolve({ setupIntent: { status: 'requires_payment_method' } }),
        elements: () => ({ create: () => { let ready; return {
          on: (event, handler) => { if (event === 'ready') ready = handler; },
          mount: target => { target.textContent = 'Card details'; ready(); },
          destroy: () => {}
        }; } }),
        confirmPayment: () => Promise.reject(new Error('synthetic-private-payment-secret')),
        confirmSetup: () => Promise.reject(new Error('synthetic-private-payment-secret'))
      }); window.Stripe.version = 'endive';`,
      }),
    );
    const reservations = await restorePaymentStep(page, kind);
    await reservations
      .getByRole("button", {
        name:
          kind === "card" ? "Save Card and Reserve" : "Pay €20.00 and Reserve",
        exact: true,
      })
      .click();
    await expect
      .poll(
        () =>
          events.filter((event) =>
            JSON.stringify(event.exception).includes(
              "Stripe confirmation rejected",
            ),
          ).length,
      )
      .toBe(1);
    const diagnostic = events.find((event) =>
      JSON.stringify(event.exception).includes("Stripe confirmation rejected"),
    );
    expect(diagnostic?.contexts).toMatchObject({
      stripe: {
        operation: kind === "card" ? "confirmSetup" : "confirmPayment",
      },
    });
    expect(JSON.stringify(diagnostic?.exception)).toContain("frames");
    expect(JSON.stringify(events)).not.toContain(
      "synthetic-private-payment-secret",
    );
    await expect(
      reservations.getByRole("button", {
        name:
          kind === "card" ? "Save Card and Reserve" : "Pay €20.00 and Reserve",
        exact: true,
      }),
    ).toBeEnabled();
  });
}
