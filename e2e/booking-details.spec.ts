import type { Page } from "@playwright/test";
import type { TPaymentStep } from "../src/lib/types";
import {
  bookingTestTime,
  FAKE_RESDIARY,
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

const RESEND_NOTE =
  "We couldn't tell whether your details reached us. Your table is still held, so please press Confirm Reservation again.";

async function openBookingFromHome(page: Page) {
  await page.goto("/");
  const documentStarted = await page.evaluate(() => performance.timeOrigin);
  await page
    .getByRole("navigation", { name: "Main navigation", exact: true })
    .getByRole("link", { name: /^Book(?: a Table)?$/ })
    .click();
  await expect(page).toHaveURL("/book-a-table");
  expect(await page.evaluate(() => performance.timeOrigin)).toBe(
    documentStarted,
  );
  return page.getByRole("region", { name: "Table reservations" });
}

async function heldWithDetails(
  page: Page,
  isMobile: boolean,
  { email = "preview@example.com", time = "6:00 pm", fromHome = false } = {},
) {
  const reservations = fromHome
    ? await openBookingFromHome(page)
    : await openBooking(page);
  await chooseDate(reservations, laterFreeDate());
  await findTable(reservations);
  await reservations.getByRole("button", { name: time, exact: true }).click();
  if (time === "7:00 pm") {
    await reservations
      .getByLabel("I understand the table is required back by 9:00 pm")
      .check();
  }
  await reservations
    .getByRole("button", { name: "Continue", exact: true })
    .click();
  await expect(reservations.getByRole("timer")).toBeVisible({
    timeout: 10_000,
  });
  if (isMobile) {
    await reservations
      .getByLabel("Full name", { exact: false })
      .fill("Preview Guest");
  } else {
    await reservations
      .getByLabel("First name", { exact: false })
      .fill("Preview");
    await reservations.getByLabel("Surname", { exact: false }).fill("Guest");
  }
  await reservations.getByLabel("Email address", { exact: false }).fill(email);
  await reservations
    .getByLabel(isMobile ? "Telephone number" : "Mobile number", {
      exact: false,
    })
    .fill("087 123 4567");
  await reservations.getByRole("checkbox", { name: /By confirming/ }).check();
  return {
    reservations,
    confirm: reservations.getByRole("button", {
      name: "Confirm Reservation",
      exact: true,
    }),
    booked: reservations.getByRole("heading", {
      name: "Your table is booked.",
      exact: true,
    }),
  };
}

function dropPosts(page: Page, lostAfterServer: boolean) {
  return page.route("**/book-a-table", async (route) => {
    if (route.request().method() !== "POST") {
      await route.fallback();
      return;
    }
    if (lostAfterServer) {
      const cookies = await page.context().cookies();
      await route.fetch();
      await page.context().clearCookies();
      await page.context().addCookies(cookies);
    }
    await route.abort("internetdisconnected");
  });
}

test("if the details never reach us, the page checks the hold and asks the guest to confirm again", async ({
  page,
  isMobile,
}) => {
  const { reservations, confirm, booked } = await heldWithDetails(
    page,
    isMobile,
  );
  await dropPosts(page, false);
  const statusCheck = page.waitForRequest("**/api/bookings/hold-status?**");
  await confirm.click();

  await statusCheck;
  await expect(reservations.getByRole("alert")).toHaveText(RESEND_NOTE, {
    timeout: 10_000,
  });
  await expect(reservations.getByRole("timer")).toBeVisible();
  await page.unroute("**/book-a-table");
  await confirm.click();
  await expect(booked).toBeVisible({ timeout: 10_000 });
  await expect(
    reservations.locator("p", { hasText: "Booking reference" }),
  ).toBeVisible();
});

test("if the reply is lost after the booking landed, the page shows the confirmation from one press", async ({
  page,
  isMobile,
}) => {
  const { reservations, confirm, booked } = await heldWithDetails(
    page,
    isMobile,
  );
  await dropPosts(page, true);
  await confirm.click();

  await expect(booked).toBeVisible({ timeout: 10_000 });
  await expect(
    reservations
      .locator("p", { hasText: "Booking reference" })
      .locator("strong"),
  ).toHaveText(/^E2E\d{5}$/);
});

test("reloading the details check finds the booked table without holding or sending again", async ({
  page,
  isMobile,
}) => {
  const actions: string[] = [];
  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      new URL(request.url()).pathname === "/book-a-table"
    ) {
      actions.push(request.headers()["next-action"] ?? "");
    }
  });
  const { reservations, confirm, booked } = await heldWithDetails(
    page,
    isMobile,
  );
  const held = await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem("peploes:booking-hold") ?? "{}"),
  );
  let statusCheckStarted = false;
  await page.route("**/api/bookings/hold-status?**", () => {
    statusCheckStarted = true;
  });
  await dropPosts(page, true);
  await confirm.click();
  await expect(
    reservations.getByText("Checking whether your booking went through…", {
      exact: true,
    }),
  ).toBeVisible();
  expect(actions).toHaveLength(2);
  expect(new Set(actions).size).toBe(2);
  expect(actions).not.toContain("");
  const sentActions = [...actions];
  await expect.poll(() => statusCheckStarted).toBe(true);
  await page.unroute("**/api/bookings/hold-status?**");
  await page.unroute("**/book-a-table");
  await page.reload();

  await expect(booked).toBeVisible({ timeout: 10_000 });
  await expect(
    reservations
      .locator("p", { hasText: "Booking reference" })
      .locator("strong"),
  ).toHaveText(held.holdReference);
  expect(actions).toEqual(sentActions);
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("peploes:booking-details"),
    ),
  ).toBeNull();
});

test("reloading the details check shows a failed hold rather than a fresh search", async ({
  page,
  isMobile,
}) => {
  const { reservations, confirm } = await heldWithDetails(page, isMobile, {
    time: "12:00 pm",
  });
  let statusCheckStarted = false;
  await page.route("**/api/bookings/hold-status?**", () => {
    statusCheckStarted = true;
  });
  await dropPosts(page, false);
  await confirm.click();
  await expect(
    reservations.getByText("Checking whether your booking went through…", {
      exact: true,
    }),
  ).toBeVisible();
  await expect.poll(() => statusCheckStarted).toBe(true);
  await page.unroute("**/api/bookings/hold-status?**");
  await page.unroute("**/book-a-table");
  await page.reload();

  await expect(reservations.getByRole("alert")).toHaveText(
    "Your table hold ran out. Please choose a time again.",
  );
  await expect(
    reservations.getByRole("button", {
      name: "Choose a Time Again",
      exact: true,
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("peploes:booking-details"),
    ),
  ).toBeNull();
});

test("reloading an unanswered details check keeps the summary and eventually shows the reference", async ({
  page,
  isMobile,
}) => {
  await page.clock.install({ time: bookingTestTime() });
  const { reservations, confirm } = await heldWithDetails(page, isMobile);
  const held = await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem("peploes:booking-hold") ?? "{}"),
  );
  await page.route("**/api/bookings/hold-status?**", () => undefined);
  await dropPosts(page, false);
  await confirm.click();
  await expect(
    reservations.getByText("Checking whether your booking went through…", {
      exact: true,
    }),
  ).toBeVisible();
  await page.unroute("**/book-a-table");
  await page.reload();

  await expect(
    reservations.getByText("Checking whether your booking went through…", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(reservations.getByText(/6:00 pm.*4 guests/)).toBeVisible();
  await expect(
    reservations.getByRole("button", { name: "Edit date & guests" }),
  ).toBeDisabled();
  await page.clock.fastForward("01:01");
  await expect(
    reservations.getByText(
      `Hang tight! We're still confirming booking ${held.holdReference}. If you hear nothing in a few minutes, please call us on +353 1 676 3144 and quote this reference.`,
      { exact: true },
    ),
  ).toBeVisible();
  await page.reload();
  await expect(
    reservations.getByText("Checking whether your booking went through…", {
      exact: true,
    }),
  ).toBeVisible();
});

test("reloading while details are still sending waits for the send budget before accepting pending", async ({
  page,
  isMobile,
}) => {
  await page.clock.install({ time: bookingTestTime() });
  const { reservations, confirm } = await heldWithDetails(page, isMobile);
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
  let sending: () => void = () => undefined;
  const sent = new Promise<void>((resolve) => {
    sending = resolve;
  });
  await page.route("**/book-a-table", async (route) => {
    if (route.request().method() !== "POST") {
      await route.fallback();
      return;
    }
    sending();
  });
  await page.route("**/api/bookings/hold-status?**", () => undefined);
  await confirm.click();
  await sent;
  await expect(
    reservations.getByRole("button", { name: "Confirming…", exact: true }),
  ).toBeDisabled();
  const startedAt = await page.evaluate(
    () =>
      JSON.parse(sessionStorage.getItem("peploes:booking-details") ?? "{}")
        .startedAt,
  );
  await page.clock.fastForward("00:06");
  await page.unroute("**/book-a-table");
  await page.unroute("**/api/bookings/hold-status?**");
  await page.clock.resume();
  await page.reload();

  const checking = reservations.getByText(
    "Checking whether your booking went through…",
    { exact: true },
  );
  await expect(checking).toBeVisible();
  await page.clock.pauseAt(startedAt + 16_000);
  await expect(checking).toBeVisible();
  await expect(
    reservations.getByText(RESEND_NOTE, { exact: true }),
  ).toHaveCount(0);
  await expect(confirm).toHaveCount(0);
  await page.clock.fastForward("00:06");
  await expect(reservations.getByRole("alert")).toHaveText(RESEND_NOTE);
  await expect(reservations.getByRole("timer")).toBeVisible();
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("peploes:booking-details"),
    ),
  ).toBeNull();
});

test("Back to search hides a hold error from the times step", async ({
  page,
}) => {
  const reservations = await openBooking(page);
  await chooseDate(reservations, laterFreeDate());
  await findTable(reservations);
  await reservations
    .getByRole("button", { name: "8:00 pm", exact: true })
    .click();
  await reservations
    .getByRole("button", { name: "Continue", exact: true })
    .click();
  await expect(reservations.getByRole("alert")).toHaveText(
    "Online booking isn't available right now. Please call us on +353 1 676 3144 or email reception@peploes.com.",
    { timeout: 10_000 },
  );
  await reservations
    .getByRole("button", { name: "Back to search", exact: true })
    .click();

  await expect(
    reservations.getByRole("button", { name: "Find a Table", exact: true }),
  ).toBeVisible();
  await expect(reservations.getByRole("alert")).toHaveCount(0);
});

test("an already booked held choice shows its reference on the restored search", async ({
  page,
  isMobile,
}) => {
  const { reservations, confirm } = await heldWithDetails(page, isMobile);
  const held = await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem("peploes:booking-hold") ?? "{}"),
  );
  await page.route("**/api/bookings/hold-status?**", () => undefined);
  await dropPosts(page, true);
  await confirm.click();
  await expect(
    reservations.getByText("Checking whether your booking went through…", {
      exact: true,
    }),
  ).toBeVisible();
  await page.evaluate(() =>
    sessionStorage.removeItem("peploes:booking-details"),
  );
  await page.unroute("**/api/bookings/hold-status?**");
  await page.unroute("**/book-a-table");
  await page.reload();

  await expect(
    reservations.getByRole("button", { name: "Find a Table", exact: true }),
  ).toBeVisible();
  await expect(reservations.getByRole("alert")).toHaveText(
    `You've already booked this table. Your booking reference is ${held.holdReference}.`,
  );
});

test("when ResDiary's reply to the details is unclear and the hold is still pending, the guest is asked to confirm again", async ({
  page,
  isMobile,
}) => {
  const { reservations, confirm } = await heldWithDetails(page, isMobile, {
    email: FAKE_RESDIARY.lostReplyEmail,
  });
  await confirm.click();

  await expect(reservations.getByRole("alert")).toHaveText(RESEND_NOTE, {
    timeout: 15_000,
  });
  await expect(confirm).toBeEnabled();
  await expect(reservations.getByRole("timer")).toBeVisible();
});

test("while the page checks an unclear reply, the guest can't edit the search", async ({
  page,
  isMobile,
}) => {
  const { reservations, confirm } = await heldWithDetails(page, isMobile);
  await dropPosts(page, false);
  await page.route("**/api/bookings/hold-status?**", () => undefined);
  await confirm.click();

  await expect(
    reservations.getByText("Checking whether your booking went through…", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    reservations.getByRole("button", { name: "Edit date & guests" }),
  ).toBeDisabled();
});

test("while the details are sending, the guest can't edit the search or go back", async ({
  page,
  isMobile,
}) => {
  const { reservations, confirm, booked } = await heldWithDetails(
    page,
    isMobile,
  );
  let release: () => void = () => undefined;
  const sent = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/book-a-table", async (route) => {
    if (route.request().method() === "POST") await sent;
    await route.fallback();
  });
  await confirm.click();

  await expect(
    reservations.getByRole("button", { name: "Confirming…", exact: true }),
  ).toBeDisabled();
  await expect(
    reservations.getByRole("button", { name: "Edit date & guests" }),
  ).toBeDisabled();
  await expect(
    reservations.getByRole("button", { name: "Back to times", exact: true }),
  ).toBeDisabled();
  release();
  await expect(booked).toBeVisible({ timeout: 10_000 });
});

test("if the details never reach us and ResDiary says the hold failed, the guest is asked to choose a time again", async ({
  page,
  isMobile,
}) => {
  const { reservations, confirm } = await heldWithDetails(page, isMobile, {
    time: "12:00 pm",
  });
  await dropPosts(page, false);
  await confirm.click();

  await expect(reservations.getByRole("alert")).toHaveText(
    "Your table hold ran out. Please choose a time again.",
    { timeout: 10_000 },
  );
  await expect(
    reservations.getByRole("button", {
      name: "Choose a Time Again",
      exact: true,
    }),
  ).toBeVisible();
});

function savedPaymentStep(
  page: Page,
  reference: string,
  revision: number,
  kind: TPaymentStep["kind"] = "payment",
) {
  const date = laterFreeDate();
  return page.evaluate(
    ({ date, dateLabel, reference, revision, kind }) => {
      sessionStorage.setItem(
        "peploes:booking-payment",
        JSON.stringify({
          kind,
          amountCents: 2000,
          amountText: "€20.00",
          stripe: {
            publishableKey: "pk_test_e2e",
            accountId: "acct_e2e",
            clientSecret:
              kind === "payment"
                ? "pi_saved_secret_saved"
                : "seti_saved_secret_saved",
          },
          summary: {
            reference,
            revision,
            date,
            dateLabel,
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
    {
      date,
      dateLabel: shortDayLabel(date),
      reference,
      revision,
      kind,
    },
  );
}

test("a saved payment wins over the details check and confirmation clears the old attempt", async ({
  page,
  isMobile,
}) => {
  const { reservations, confirm, booked } = await heldWithDetails(
    page,
    isMobile,
  );
  const held = await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem("peploes:booking-hold") ?? "{}"),
  );
  await page.route("**/api/bookings/hold-status?**", () => undefined);
  await dropPosts(page, true);
  await confirm.click();
  await expect(
    reservations.getByText("Checking whether your booking went through…", {
      exact: true,
    }),
  ).toBeVisible();
  await stubStripe(page, "succeeded");
  await savedPaymentStep(page, held.holdReference, held.holdRevision);
  await page.unroute("**/api/bookings/hold-status?**");
  await page.unroute("**/book-a-table");
  await page.reload();

  await expect(booked).toBeVisible({ timeout: 10_000 });
  expect(await page.evaluate(() => Reflect.get(window, "stripeMounts"))).toBe(
    0,
  );
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("peploes:booking-details"),
    ),
  ).toBeNull();
  await page.reload();
  await expect(
    reservations.getByRole("button", { name: "Find a Table", exact: true }),
  ).toBeVisible();
});

async function stubStripe(
  page: Page,
  status = "requires_payment_method",
  stall: "intent" | "element" | null = null,
  rejectConfirm = false,
) {
  const body = `
    window.stripeConfirmations = 0;
    window.stripeMounts = 0;
    window.stripeRetrievals = 0;
    window.stripeDestroys = 0;
    window.stripeStall = ${JSON.stringify(stall)};
    window.stripeRejectConfirm = ${JSON.stringify(rejectConfirm)};
    const retrieveIntent = async (kind) => {
      window.stripeRetrievals += 1;
      if (window.stripeRetrievalFails) throw new Error("Stripe is unreachable");
      const result = () => ({ [kind]: { status: window.stripeIntentStatus ?? ${JSON.stringify(status)}, amount: 2000, currency: "eur" } });
      if (window.stripeStall === "intent") {
        return new Promise((resolve) => { window.stripeResolveIntent = () => resolve(result()); });
      }
      return result();
    };
    const confirm = async (options, method) => {
      window.stripeConfirmations += 1;
      window.stripeConfirmMethod = method;
      window.stripeReturnUrl = options.confirmParams.return_url;
      if (window.stripeRejectConfirm) throw new Error("Stripe confirmation failed");
      return {};
    };
    window.Stripe = () => ({
      retrievePaymentIntent: () => retrieveIntent("paymentIntent"),
      retrieveSetupIntent: () => retrieveIntent("setupIntent"),
      elements: () => ({ create: () => {
        let ready;
        let mounted;
        return {
          on: (event, handler) => {
            if (event === "ready") { ready = handler; window.stripeLateReady ??= handler; }
            if (event === "loaderror") window.stripeLateLoadError ??= handler;
          },
          mount: (target) => {
            window.stripeMounts += 1;
            mounted = target;
            if (window.stripeStall === "element") return;
            target.textContent = "Card details";
            ready();
          },
          destroy: () => { window.stripeDestroys += 1; mounted?.replaceChildren(); }
        };
      } }),
      confirmPayment: (options) => confirm(options, "confirmPayment"),
      confirmSetup: (options) => confirm(options, "confirmSetup")
    });
    window.Stripe.version = "endive";
  `;
  await page.route("https://js.stripe.com/**", (route) =>
    route.fulfill({ contentType: "application/javascript", body }),
  );
  return body;
}

for (const kind of ["payment", "card"] as const) {
  test(`${kind} Pay recovers from a rejected hold check without confirming Stripe`, async ({
    page,
  }) => {
    const reservations = await openBooking(page);
    await stubStripe(page);
    let failCheck = false;
    await page.route("**/api/bookings/hold-status?**", (route) =>
      route.fulfill({
        json: failCheck
          ? { ok: false, error: null }
          : { ok: true, data: { status: "pending" } },
      }),
    );
    await savedPaymentStep(page, "E2E99999", 1, kind);
    await page.reload();
    const pay = reservations.getByRole("button", {
      name:
        kind === "payment" ? "Pay €20.00 and Reserve" : "Save Card and Reserve",
      exact: true,
    });
    await expect(pay).toBeEnabled();
    failCheck = true;
    await pay.click();
    await expect(reservations.getByRole("alert")).toHaveText(
      "Something went wrong with the payment for booking E2E99999. You haven't been charged. Please try again, or call us on +353 1 676 3144.",
    );
    await expect(pay).toBeEnabled();
    await expect(
      reservations.getByRole("button", { name: "Edit date & guests" }),
    ).toBeEnabled();
    await expect(
      reservations.getByRole("button", {
        name: "Processing Payment…",
        exact: true,
      }),
    ).toHaveCount(0);
    expect(
      await page.evaluate(() => Reflect.get(window, "stripeConfirmations")),
    ).toBe(0);
    failCheck = false;
    await pay.click();
    await expect(
      reservations.getByText("Confirming your booking…", { exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => Reflect.get(window, "stripeConfirmations")),
    ).toBe(1);
  });
  for (const status of [
    "succeeded",
    "processing",
    "requires_capture",
    "requires_payment_method",
    "requires_confirmation",
    "unreachable",
  ]) {
    test(`${kind} confirmation rejects and Stripe reports ${status}: leaves Processing Payment safely`, async ({
      page,
    }) => {
      const reservations = await openBooking(page);
      await stubStripe(page, "requires_payment_method", null, true);
      await page.route("**/api/bookings/hold-status?**", (route) =>
        route.fulfill({ json: { ok: true, data: { status: "pending" } } }),
      );
      await savedPaymentStep(page, "E2E99999", 1, kind);
      await page.reload();
      const pay = reservations.getByRole("button", {
        name:
          kind === "payment"
            ? "Pay €20.00 and Reserve"
            : "Save Card and Reserve",
        exact: true,
      });
      await expect(pay).toBeEnabled();
      await page.clock.install({ time: bookingTestTime() });
      await page.evaluate((status) => {
        Reflect.set(window, "stripeIntentStatus", status);
        Reflect.set(window, "stripeRetrievalFails", status === "unreachable");
      }, status);
      await pay.click();
      const notPaid =
        status === "requires_payment_method" ||
        status === "requires_confirmation";
      if (notPaid) {
        await expect(reservations.getByRole("alert")).toHaveText(
          "Something went wrong with the payment for booking E2E99999. You haven't been charged. Please try again, or call us on +353 1 676 3144.",
        );
        await expect(pay).toBeEnabled();
        await expect(
          reservations.getByRole("button", { name: "Edit date & guests" }),
        ).toBeEnabled();
        expect(
          await page.evaluate(() => Reflect.get(window, "stripeConfirmations")),
        ).toBe(1);
        await page.evaluate(() =>
          Reflect.set(window, "stripeRejectConfirm", false),
        );
        await pay.click();
      }
      await expect(
        reservations.getByText("Confirming your booking…", { exact: true }),
      ).toBeVisible();
      await expect(
        reservations.getByText("E2E99999", { exact: true }),
      ).toBeVisible();
      await expect(
        reservations.getByText("You haven't been charged.", { exact: false }),
      ).toHaveCount(0);
      await expect(pay).toHaveCount(0);
      await expect(
        reservations.getByRole("button", {
          name: "Processing Payment…",
          exact: true,
        }),
      ).toHaveCount(0);
      expect(
        await page.evaluate(() => Reflect.get(window, "stripeConfirmations")),
      ).toBe(notPaid ? 2 : 1);
      expect(
        await page.evaluate(() => Reflect.get(window, "stripeConfirmMethod")),
      ).toBe(kind === "payment" ? "confirmPayment" : "confirmSetup");
      await page.clock.fastForward(60_000);
      await expect(
        reservations.getByText(
          "Hang tight! We're still confirming booking E2E99999.",
          {
            exact: false,
          },
        ),
      ).toBeVisible();
      await expect(pay).toHaveCount(0);
    });
  }
}

test("a rejected Stripe confirmation with an unanswered intent read enters the paid check after five seconds", async ({
  page,
}) => {
  const reservations = await openBooking(page);
  await stubStripe(page, "requires_payment_method", null, true);
  await page.route("**/api/bookings/hold-status?**", (route) =>
    route.fulfill({ json: { ok: true, data: { status: "pending" } } }),
  );
  await savedPaymentStep(page, "E2E99999", 1);
  await page.reload();
  const pay = reservations.getByRole("button", {
    name: "Pay €20.00 and Reserve",
    exact: true,
  });
  await expect(pay).toBeEnabled();
  await page.clock.install({ time: bookingTestTime() });
  await page.evaluate(() => Reflect.set(window, "stripeStall", "intent"));
  await pay.click();
  await expect
    .poll(() => page.evaluate(() => Reflect.get(window, "stripeRetrievals")))
    .toBe(2);
  await page.clock.fastForward(4000);
  await expect(
    reservations.getByRole("button", {
      name: "Processing Payment…",
      exact: true,
    }),
  ).toBeDisabled();
  await expect(
    reservations.getByText("Confirming your booking…", { exact: true }),
  ).toHaveCount(0);
  await page.clock.fastForward(1000);
  await expect(
    reservations.getByText("Confirming your booking…", { exact: true }),
  ).toBeVisible();
  await expect(
    reservations.getByText("E2E99999", { exact: true }),
  ).toBeVisible();
  await expect(pay).toHaveCount(0);
  await expect(
    reservations.getByRole("button", { name: "Processing Payment…" }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(() => Reflect.get(window, "stripeConfirmations")),
  ).toBe(1);
});

test("the card form loads after following Book from the home page and booking a deposit time", async ({
  page,
  isMobile,
}) => {
  await stubStripe(page);
  const { reservations, confirm } = await heldWithDetails(page, isMobile, {
    time: "6:30 pm",
    fromHome: true,
  });
  await confirm.click();

  await expect(
    reservations.getByText("Card details", { exact: true }),
  ).toBeVisible();
  await expect(
    reservations.getByRole("button", {
      name: "Pay €20.00 and Reserve",
      exact: true,
    }),
  ).toBeEnabled();
  await expect(
    reservations.getByText("We couldn't load the secure payment form.", {
      exact: false,
    }),
  ).toHaveCount(0);
});

function changeDialog(page: Page) {
  const dialog = page.getByRole("dialog", { name: "Change your booking?" });
  return {
    dialog,
    keep: dialog.getByRole("button", { name: "Keep My Table", exact: true }),
    choose: dialog.getByRole("button", {
      name: "Choose Another Time",
      exact: true,
    }),
  };
}

test("Edit on the payment step asks first, and Keep My Table leaves the payment alone", async ({
  page,
  isMobile,
}) => {
  const { reservations } = await heldWithDetails(page, isMobile);
  const held = await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem("peploes:booking-hold") ?? "{}"),
  );
  await page.route("https://js.stripe.com/**", (route) => route.abort());
  await savedPaymentStep(page, held.holdReference, held.holdRevision);
  await page.reload();
  const payment = reservations.getByRole("heading", {
    name: "Secure your table",
    exact: true,
  });
  await expect(payment).toBeVisible();
  const { dialog, keep } = changeDialog(page);

  await reservations
    .getByRole("button", { name: "Edit date & guests" })
    .click();
  await expect(dialog).toContainText(
    "We'll let go of your table for 6:00 pm on Sat, 7 Nov 2026 so you can choose another time. It's released automatically in a few minutes, and you haven't been charged. Please don't finish its payment in another tab.",
  );
  await expect(keep).toBeFocused();
  await dialog.evaluate(
    (element: HTMLDialogElement) =>
      new Promise<void>((resolve) => {
        element.addEventListener("close", () => queueMicrotask(resolve), {
          once: true,
        });
        element.close();
        element.showModal();
      }),
  );
  await expect(dialog).toBeVisible();
  await expect(keep).toBeFocused();
  await keep.click();
  await expect(dialog).toBeHidden();
  await expect(payment).toBeVisible();

  await reservations
    .getByRole("button", { name: "Edit date & guests" })
    .click();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(payment).toBeVisible();

  await reservations
    .getByRole("button", { name: "Edit date & guests" })
    .click();
  await dialog.evaluate((element: HTMLDialogElement) => element.requestClose());
  await expect(dialog).toBeHidden();
  await expect(payment).toBeVisible();
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("peploes:booking-payment"),
    ),
  ).not.toBeNull();
});

test("Choose Another Time checks once without a write, forgets the payment on reload, and makes a new hold on Continue", async ({
  page,
  isMobile,
}) => {
  const { reservations } = await heldWithDetails(page, isMobile);
  const held = await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem("peploes:booking-hold") ?? "{}"),
  );
  await page.route("https://js.stripe.com/**", (route) => route.abort());
  await savedPaymentStep(page, held.holdReference, held.holdRevision);
  await page.reload();
  await reservations
    .getByRole("button", { name: "Edit date & guests" })
    .click();
  let checks = 0;
  let writes = 0;
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/api/bookings/hold-status") {
      expect(request.method()).toBe("GET");
      checks += 1;
    }
    if (request.method() === "POST") writes += 1;
  });
  await changeDialog(page).choose.click();
  const search = reservations.getByRole("button", {
    name: "Find a Table",
    exact: true,
  });
  await expect(search).toBeVisible();
  expect(checks).toBe(1);
  expect(writes).toBe(0);
  expect(
    await page.evaluate(() => [
      sessionStorage.getItem("peploes:booking-hold"),
      sessionStorage.getItem("peploes:booking-payment"),
      sessionStorage.getItem("peploes:booking-paid"),
    ]),
  ).toEqual([null, null, null]);
  await page.reload();
  await expect(search).toBeVisible();
  await expect(
    reservations.getByRole("heading", {
      name: "Secure your table",
      exact: true,
    }),
  ).toHaveCount(0);
  await chooseDate(reservations, laterFreeDate());
  await search.click();
  await reservations
    .getByRole("button", { name: "6:00 pm", exact: true })
    .click();
  await reservations
    .getByRole("button", { name: "Continue", exact: true })
    .click();
  await expect(reservations.getByRole("timer")).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(sessionStorage.getItem("peploes:booking-hold") ?? "{}")
          .holdReference,
    ),
  ).not.toBe(held.holdReference);
});

for (const outcome of [
  "no answer",
  "NotFound",
  "failed",
  "expired",
  "unavailable",
]) {
  test(`Choose Another Time starts a fresh search when the status check gives ${outcome}`, async ({
    page,
  }) => {
    await page.clock.install({ time: bookingTestTime() });
    const reservations = await openBooking(page);
    await page.route("https://js.stripe.com/**", (route) => route.abort());
    await savedPaymentStep(page, "E2E99999", 1);
    await page.reload();
    await reservations
      .getByRole("button", { name: "Edit date & guests" })
      .click();
    let checks = 0;
    await page.route("**/api/bookings/hold-status?**", (route) => {
      checks += 1;
      if (outcome === "no answer") return;
      if (outcome === "NotFound" || outcome === "unavailable") {
        return route.fulfill({
          status: outcome === "NotFound" ? 404 : 503,
          json: {
            ok: false,
            error: {
              code:
                outcome === "NotFound" ? "NOT_FOUND" : "SERVICE_UNAVAILABLE",
              message: "Unavailable",
            },
          },
        });
      }
      return route.fulfill({ json: { ok: true, data: { status: outcome } } });
    });
    const { dialog, choose, keep } = changeDialog(page);
    await choose.click();
    if (outcome === "no answer") {
      await expect(keep).toBeDisabled();
      await expect(
        dialog.getByRole("button", { name: "Checking…", exact: true }),
      ).toBeDisabled();
      await page.keyboard.press("Escape");
      await dialog.evaluate((element: HTMLDialogElement) =>
        element.requestClose(),
      );
      await expect(dialog).toBeVisible();
      await dialog.evaluate((element: HTMLDialogElement) => element.close());
      await expect(dialog).toBeVisible();
      await page.clock.fastForward("00:06");
    }
    await expect(
      reservations.getByRole("button", { name: "Find a Table", exact: true }),
    ).toBeVisible();
    await expect(dialog).toBeHidden();
    expect(checks).toBe(1);
    await page.reload();
    await expect(
      reservations.getByRole("button", { name: "Find a Table", exact: true }),
    ).toBeVisible();
  });
}

test("if the old table was already booked, Choose Another Time shows its confirmation and reference", async ({
  page,
  isMobile,
}) => {
  const { reservations, confirm, booked } = await heldWithDetails(
    page,
    isMobile,
  );
  const hold = await page.evaluate(
    () =>
      JSON.parse(sessionStorage.getItem("peploes:booking-hold") ?? "{}") as {
        holdReference: string;
        holdRevision: number;
      },
  );
  await page.route("**/api/bookings/hold-status?**", () => undefined);
  await dropPosts(page, true);
  await confirm.click();
  await expect(
    reservations.getByText("Checking whether your booking went through…", {
      exact: true,
    }),
  ).toBeVisible();
  await page.unroute("**/book-a-table");
  await page.route("https://js.stripe.com/**", (route) => route.abort());
  await savedPaymentStep(page, hold.holdReference, hold.holdRevision);
  await page.reload();
  await expect(
    reservations.getByRole("heading", {
      name: "Secure your table",
      exact: true,
    }),
  ).toBeVisible();

  await reservations
    .getByRole("button", { name: "Edit date & guests" })
    .click();
  await page.unroute("**/api/bookings/hold-status?**");
  await changeDialog(page).choose.click();

  await expect(booked).toBeVisible({ timeout: 10_000 });
  await expect(
    reservations
      .locator("p", { hasText: "Booking reference" })
      .locator("strong"),
  ).toHaveText(hold.holdReference);
});

test("when Stripe can't load, the payment step says so once, under the heading, with Try Again", async ({
  page,
}) => {
  await page.route("https://js.stripe.com/**", (route) => route.abort());
  const reservations = await openBooking(page);
  await page.route("**/api/bookings/hold-status?**", (route) =>
    route.fulfill({ json: { ok: true, data: { status: "pending" } } }),
  );
  await savedPaymentStep(page, "E2E99999", 1);
  await page.reload();

  const heading = reservations.getByRole("heading", {
    name: "Secure your table",
    exact: true,
  });
  const alert = reservations.getByRole("alert");
  await expect(alert).toHaveText(
    "We couldn't load the secure payment form. Check your connection and try again, or call us on +353 1 676 3144.",
  );
  await expect(
    reservations.getByText("Loading secure payment…", { exact: true }),
  ).toHaveCount(0);
  await expect(
    reservations.getByRole("button", { name: "Try Again", exact: true }),
  ).toBeVisible();
  await expect(
    reservations.getByRole("button", { name: "Edit date & guests" }),
  ).toBeEnabled();
  const headingBox = await heading.boundingBox();
  const alertBox = await alert.boundingBox();
  expect(
    (alertBox?.y ?? 0) - ((headingBox?.y ?? 0) + (headingBox?.height ?? 0)),
  ).toBeLessThan(80);
  const reloaded = page.waitForEvent("domcontentloaded");
  const rechecked = page.waitForRequest("**/api/bookings/hold-status?**");
  await reservations
    .getByRole("button", { name: "Try Again", exact: true })
    .click();
  await reloaded;
  await rechecked;
  await expect(alert).toHaveText(
    "We couldn't load the secure payment form. Check your connection and try again, or call us on +353 1 676 3144.",
  );
});

test("the payment deadline includes the hold check and ignores its late failed reply", async ({
  page,
}) => {
  await page.clock.install({ time: bookingTestTime() });
  await stubStripe(page, "requires_payment_method", "intent");
  const reservations = await openBooking(page);
  let answerHold = async () => {};
  await page.route("**/api/bookings/hold-status?**", (route) => {
    answerHold = () =>
      route.fulfill({ json: { ok: true, data: { status: "failed" } } });
  });
  await savedPaymentStep(page, "E2E99999", 1);
  const saved = await page.evaluate(() =>
    sessionStorage.getItem("peploes:booking-payment"),
  );
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => Reflect.get(window, "stripeRetrievals")))
    .toBe(1);
  await page.clock.fastForward(12_000);
  const checking = page.waitForRequest("**/api/bookings/hold-status?**");
  await page.evaluate(() => Reflect.get(window, "stripeResolveIntent")());
  await checking;
  await page.clock.fastForward(1000);
  await expect(
    reservations.getByRole("button", { name: /^Pay/ }),
  ).toBeDisabled();
  await expect(
    reservations.getByRole("button", { name: "Edit date & guests" }),
  ).toBeDisabled();
  await page.clock.fastForward(3000);
  const retry = reservations.getByRole("button", {
    name: "Try Again",
    exact: true,
  });
  await expect(retry).toBeVisible();
  const answered = page.waitForResponse("**/api/bookings/hold-status?**");
  await answerHold();
  await (await answered).finished();
  await page.clock.runFor(50);
  await expect(retry).toBeVisible();
  await expect(reservations.getByRole("alert")).toHaveText(
    "We couldn't load the secure payment form. Check your connection and try again, or call us on +353 1 676 3144.",
  );
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("peploes:booking-payment"),
    ),
  ).toBe(saved);
  expect(await page.evaluate(() => Reflect.get(window, "stripeMounts"))).toBe(
    0,
  );
  await page.unroute("**/api/bookings/hold-status?**");
  await page.route("**/api/bookings/hold-status?**", (route) =>
    route.fulfill({ json: { ok: true, data: { status: "pending" } } }),
  );
  await stubStripe(page);
  const reloaded = page.waitForEvent("domcontentloaded");
  await retry.click();
  await reloaded;
  await expect(
    reservations.getByRole("button", {
      name: "Pay €20.00 and Reserve",
      exact: true,
    }),
  ).toBeEnabled();
  await expect(reservations.getByRole("alert")).toHaveCount(0);
});

test("while the payment form is still loading, the guest can't edit the search", async ({
  page,
}) => {
  await page.clock.install({ time: bookingTestTime() });
  await page.route("https://js.stripe.com/**", () => undefined);
  const reservations = await openBooking(page);
  await page.route("**/api/bookings/hold-status?**", (route) =>
    route.fulfill({ json: { ok: true, data: { status: "pending" } } }),
  );
  await savedPaymentStep(page, "E2E99999", 1);
  await page.reload();

  await expect(
    reservations.getByText("Loading secure payment…", { exact: true }),
  ).toBeVisible();
  await page.clock.fastForward(14_000);
  await expect(
    reservations.getByText("Loading secure payment…", { exact: true }),
  ).toBeVisible();
  await expect(
    reservations.getByRole("button", { name: /^Pay/ }),
  ).toBeDisabled();
  await expect(
    reservations.getByRole("button", { name: "Edit date & guests" }),
  ).toBeDisabled();
  await expect(reservations.getByRole("alert")).toHaveCount(0);
  await page.clock.fastForward(2000);
  const retry = reservations.getByRole("button", {
    name: "Try Again",
    exact: true,
  });
  await expect(retry).toBeVisible();
  await expect(
    reservations.getByRole("button", { name: "Edit date & guests" }),
  ).toBeEnabled();
  await page.unroute("https://js.stripe.com/**");
  await stubStripe(page);
  const reloaded = page.waitForEvent("domcontentloaded");
  await retry.click();
  await reloaded;
  await expect(
    reservations.getByRole("button", {
      name: "Pay €20.00 and Reserve",
      exact: true,
    }),
  ).toBeEnabled();
  await expect(reservations.getByRole("alert")).toHaveCount(0);
});

test("if the hold time runs out while the details are sending and the reply is lost, the page still checks the booking", async ({
  page,
  isMobile,
}) => {
  await page.clock.install({ time: bookingTestTime() });
  const { reservations, confirm, booked } = await heldWithDetails(
    page,
    isMobile,
  );
  let answer: () => void = () => undefined;
  const answered = new Promise<void>((resolve) => {
    answer = resolve;
  });
  await page.route("**/book-a-table", async (route) => {
    if (route.request().method() !== "POST") {
      await route.fallback();
      return;
    }
    const cookies = await page.context().cookies();
    await route.fetch();
    await page.context().clearCookies();
    await page.context().addCookies(cookies);
    await answered;
    await route.abort("internetdisconnected");
  });
  await confirm.click();
  await expect(
    reservations.getByRole("button", { name: "Confirming…", exact: true }),
  ).toBeVisible();

  await page.clock.fastForward("05:00");
  await expect(reservations.getByRole("timer")).toHaveText(
    "Table held for 0:00",
  );
  await page.waitForTimeout(500);
  await expect(
    reservations.getByText(
      "Your table hold ran out. Please choose a time again.",
    ),
  ).toHaveCount(0);
  answer();
  await expect(booked).toBeVisible({ timeout: 10_000 });
});

test("a restored payment with no access to the hold keeps its reference until Start Again", async ({
  page,
  isMobile,
}) => {
  const { reservations } = await heldWithDetails(page, isMobile);
  const held = await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem("peploes:booking-hold") ?? "{}"),
  );
  await stubStripe(page);
  await page.route("**/api/bookings/hold-status?**", (route) =>
    route.fulfill({
      status: 404,
      json: {
        ok: false,
        error: {
          code: "NOT_FOUND",
          message:
            "We couldn't find your table hold. Please choose a time again.",
        },
      },
    }),
  );
  await savedPaymentStep(page, held.holdReference, held.holdRevision);
  const saved = await page.evaluate(() => [
    sessionStorage.getItem("peploes:booking-payment"),
    sessionStorage.getItem("peploes:booking-hold"),
  ]);
  await page.reload();
  const message = reservations.getByText(
    `We can't check booking ${held.holdReference} from this page. If you finished it in another tab, your confirmation will follow; otherwise call us on +353 1 676 3144 or start again.`,
    { exact: true },
  );
  await expect(message).toBeVisible();
  await expect(
    reservations.getByText("Card details", { exact: true }),
  ).toHaveCount(0);
  await expect(
    reservations.getByRole("button", {
      name: "Choose a Time Again",
      exact: true,
    }),
  ).toHaveCount(0);
  expect(await page.evaluate(() => Reflect.get(window, "stripeMounts"))).toBe(
    0,
  );
  expect(
    await page.evaluate(() => [
      sessionStorage.getItem("peploes:booking-payment"),
      sessionStorage.getItem("peploes:booking-hold"),
    ]),
  ).toEqual(saved);
  await page.reload();
  await expect(message).toBeVisible();
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("peploes:booking-payment"),
    ),
  ).toBe(saved[0]);
  await reservations
    .getByRole("button", { name: "Start Again", exact: true })
    .click();
  await expect(
    reservations.getByRole("button", { name: "Find a Table", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => [
      sessionStorage.getItem("peploes:booking-payment"),
      sessionStorage.getItem("peploes:booking-hold"),
    ]),
  ).toEqual([null, null]);
  await page.reload();
  await expect(
    reservations.getByRole("button", { name: "Find a Table", exact: true }),
  ).toBeVisible();
});

test("Pay with no access to the hold checks Stripe and keeps an unpaid reference without confirming", async ({
  page,
  isMobile,
}) => {
  const { reservations } = await heldWithDetails(page, isMobile);
  const held = await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem("peploes:booking-hold") ?? "{}"),
  );
  await stubStripe(page);
  let missing = false;
  await page.route("**/api/bookings/hold-status?**", (route) =>
    route.fulfill({
      status: missing ? 404 : 200,
      json: missing
        ? {
            ok: false,
            error: {
              code: "NOT_FOUND",
              message:
                "We couldn't find your table hold. Please choose a time again.",
            },
          }
        : { ok: true, data: { status: "pending" } },
    }),
  );
  await savedPaymentStep(page, held.holdReference, held.holdRevision);
  await page.reload();
  const pay = reservations.getByRole("button", {
    name: "Pay €20.00 and Reserve",
    exact: true,
  });
  await expect(pay).toBeEnabled();
  missing = true;
  await pay.click();
  await expect(
    reservations.getByText(
      `We can't check booking ${held.holdReference} from this page. If you finished it in another tab, your confirmation will follow; otherwise call us on +353 1 676 3144 or start again.`,
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    reservations.getByText("Card details", { exact: true }),
  ).toHaveCount(0);
  await expect(
    reservations.getByRole("button", { name: "Start Again", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => Reflect.get(window, "stripeRetrievals")),
  ).toBe(2);
  expect(
    await page.evaluate(() => Reflect.get(window, "stripeConfirmations")),
  ).toBe(0);
  expect(
    await page.evaluate(
      () =>
        JSON.parse(sessionStorage.getItem("peploes:booking-payment") ?? "{}")
          .summary?.reference,
    ),
  ).toBe(held.holdReference);
  expect(
    await page.evaluate(
      () =>
        JSON.parse(sessionStorage.getItem("peploes:booking-hold") ?? "{}")
          .holdReference,
    ),
  ).toBe(held.holdReference);
  await reservations
    .getByRole("button", { name: "Start Again", exact: true })
    .click();
  await expect(
    reservations.getByRole("button", { name: "Find a Table", exact: true }),
  ).toBeVisible();
});

for (const status of ["succeeded", "processing", "requires_capture"]) {
  test(`Pay with no access to the hold goes to the paid check when Stripe reports ${status}`, async ({
    page,
    isMobile,
  }) => {
    const { reservations } = await heldWithDetails(page, isMobile);
    const held = await page.evaluate(() =>
      JSON.parse(sessionStorage.getItem("peploes:booking-hold") ?? "{}"),
    );
    await stubStripe(page);
    let missing = false;
    await page.route("**/api/bookings/hold-status?**", (route) =>
      route.fulfill({
        status: missing ? 404 : 200,
        json: missing
          ? {
              ok: false,
              error: {
                code: "NOT_FOUND",
                message:
                  "We couldn't find your table hold. Please choose a time again.",
              },
            }
          : { ok: true, data: { status: "pending" } },
      }),
    );
    await savedPaymentStep(page, held.holdReference, held.holdRevision);
    await page.reload();
    const pay = reservations.getByRole("button", {
      name: "Pay €20.00 and Reserve",
      exact: true,
    });
    await expect(pay).toBeEnabled();
    await page.evaluate(
      (paidStatus) => Reflect.set(window, "stripeIntentStatus", paidStatus),
      status,
    );
    missing = true;
    await pay.click();
    await expect(
      reservations.getByText(
        `Hang tight! We're still confirming booking ${held.holdReference}. If your card was charged, your confirmation will follow shortly. If you hear nothing in a few minutes, please call us on +353 1 676 3144.`,
        { exact: true },
      ),
    ).toBeVisible();
    await expect(
      reservations.getByText("Card details", { exact: true }),
    ).toHaveCount(0);
    await expect(
      reservations.getByText(
        `We can't check booking ${held.holdReference} from this page.`,
        { exact: false },
      ),
    ).toHaveCount(0);
    expect(
      await page.evaluate(() => Reflect.get(window, "stripeRetrievals")),
    ).toBe(2);
    expect(
      await page.evaluate(() => Reflect.get(window, "stripeConfirmations")),
    ).toBe(0);
    expect(
      await page.evaluate(
        () =>
          JSON.parse(sessionStorage.getItem("peploes:booking-paid") ?? "{}")
            .reference,
      ),
    ).toBe(held.holdReference);
    expect(
      await page.evaluate(() =>
        sessionStorage.getItem("peploes:booking-payment"),
      ),
    ).toBeNull();
  });
}

test("a restored payment whose hold failed never mounts the card form and stays cleared after reload", async ({
  page,
  isMobile,
}) => {
  const { reservations } = await heldWithDetails(page, isMobile, {
    time: "12:00 pm",
  });
  const held = await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem("peploes:booking-hold") ?? "{}"),
  );
  await stubStripe(page);
  await savedPaymentStep(page, held.holdReference, held.holdRevision);
  await page.reload();
  await expect(reservations.getByRole("alert")).toHaveText(
    "Your table hold ran out. Please choose a time again.",
  );
  await expect(
    reservations.getByRole("button", {
      name: "Choose a Time Again",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    reservations.getByText("Card details", { exact: true }),
  ).toHaveCount(0);
  expect(await page.evaluate(() => Reflect.get(window, "stripeMounts"))).toBe(
    0,
  );
  expect(
    await page.evaluate(() => [
      sessionStorage.getItem("peploes:booking-payment"),
      sessionStorage.getItem("peploes:booking-hold"),
    ]),
  ).toEqual([null, null]);
  await page.reload();
  await expect(
    reservations.getByRole("button", { name: "Find a Table", exact: true }),
  ).toBeVisible();
  await expect(
    reservations.getByText("Card details", { exact: true }),
  ).toHaveCount(0);
});

test("Pay checks the hold again, stays busy, and never confirms Stripe when the hold failed", async ({
  page,
  isMobile,
}) => {
  const { reservations } = await heldWithDetails(page, isMobile);
  const held = await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem("peploes:booking-hold") ?? "{}"),
  );
  await stubStripe(page);
  await savedPaymentStep(page, held.holdReference, held.holdRevision);
  await page.reload();
  const pay = reservations.getByRole("button", {
    name: "Pay €20.00 and Reserve",
    exact: true,
  });
  await expect(pay).toBeEnabled();
  let answer: () => void = () => undefined;
  const answered = new Promise<void>((resolve) => {
    answer = resolve;
  });
  await page.route("**/api/bookings/hold-status?**", async (route) => {
    await answered;
    await route.fulfill({ json: { ok: true, data: { status: "failed" } } });
  });
  await pay.click();
  await expect(
    reservations.getByRole("button", {
      name: "Processing Payment…",
      exact: true,
    }),
  ).toBeDisabled();
  await expect(
    reservations.getByRole("button", { name: "Edit date & guests" }),
  ).toBeDisabled();
  answer();
  await expect(reservations.getByRole("alert")).toHaveText(
    "Your table hold ran out. Please choose a time again.",
  );
  expect(
    await page.evaluate(() => Reflect.get(window, "stripeConfirmations")),
  ).toBe(0);
  await page.reload();
  await expect(
    reservations.getByRole("button", { name: "Find a Table", exact: true }),
  ).toBeVisible();
});

test("an already paid Stripe intent wins over a failed restored hold", async ({
  page,
  isMobile,
}) => {
  const { reservations } = await heldWithDetails(page, isMobile, {
    time: "12:00 pm",
  });
  const held = await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem("peploes:booking-hold") ?? "{}"),
  );
  await stubStripe(page, "succeeded");
  await savedPaymentStep(page, held.holdReference, held.holdRevision);
  await page.reload();
  await expect(reservations.getByRole("alert")).toHaveText(
    `We couldn't confirm booking ${held.holdReference}. If your card was charged, please call us on +353 1 676 3144 and quote this reference.`,
  );
  await expect(
    reservations.getByRole("button", {
      name: "Choose a Time Again",
      exact: true,
    }),
  ).toHaveCount(0);
  expect(await page.evaluate(() => Reflect.get(window, "stripeMounts"))).toBe(
    0,
  );
});

async function depositStep(page: Page, isMobile: boolean) {
  await stubStripe(page);
  const time = FAKE_TIMES.find(
    (slot) => slot.time === FAKE_RESDIARY.depositTime,
  );
  const { reservations, confirm } = await heldWithDetails(page, isMobile, {
    time: time?.label,
  });
  await confirm.click();
  await expect(
    reservations.getByText("Card details", { exact: true }),
  ).toBeVisible();
  const step = await page.evaluate(
    () =>
      JSON.parse(
        sessionStorage.getItem("peploes:booking-payment") ?? "null",
      ) as TPaymentStep,
  );
  return { reservations, step };
}

function returnedUrl(step: TPaymentStep, status: string) {
  const query = new URLSearchParams({
    holdReference: step.summary.reference,
    holdRevision: String(step.summary.revision),
  });
  query.set("payment_intent", "pi_e2e");
  query.set("payment_intent_client_secret", step.stripe.clientSecret);
  query.set("redirect_status", status);
  return `/book-a-table?${query}`;
}

test("Stripe's return URL names only the held booking", async ({
  page,
  isMobile,
}) => {
  const { reservations, step } = await depositStep(page, isMobile);
  await page.evaluate(() =>
    history.replaceState(null, "", "?unrelated=value#details"),
  );
  await reservations
    .getByRole("button", { name: "Pay €20.00 and Reserve", exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => Reflect.get(window, "stripeConfirmations")))
    .toBe(1);
  const value = await page.evaluate(() =>
    String(Reflect.get(window, "stripeReturnUrl")),
  );
  const url = new URL(value);
  expect(url.origin).toBe(new URL(page.url()).origin);
  expect(url.pathname).toBe("/book-a-table");
  expect([...url.searchParams.entries()]).toEqual([
    ["holdReference", step.summary.reference],
    ["holdRevision", String(step.summary.revision)],
  ]);
  expect(url.hash).toBe("");
  expect(value).not.toContain(step.stripe.clientSecret);
  expect(value).not.toContain(step.stripe.publishableKey);
});

for (const status of ["succeeded", "processing"]) {
  test(`a ${status} bank return in a new tab recovers a pending deposit and keeps the paid check`, async ({
    page,
    isMobile,
  }) => {
    const { step } = await depositStep(page, isMobile);
    const returned = await page.context().newPage();
    try {
      await returned.clock.install({ time: bookingTestTime() });
      await returned.goto(returnedUrl(step, status));
      const reservations = returned.getByRole("region", {
        name: "Table reservations",
      });
      await expect(
        reservations.getByText("Confirming your booking…", { exact: true }),
      ).toBeVisible();
      await expect(reservations).toContainText(step.summary.timeLabel);
      await expect(reservations).toContainText(step.summary.guestsLabel);
      await expect
        .poll(() =>
          returned.evaluate(() =>
            JSON.parse(
              sessionStorage.getItem("peploes:booking-paid") ?? "null",
            ),
          ),
        )
        .toEqual(step.summary);
      await expect(returned).toHaveURL(/\/book-a-table$/);
      await expect(
        reservations.getByText("Card details", { exact: true }),
      ).toHaveCount(0);
      await returned.clock.fastForward("01:01");
      await expect(
        reservations.getByText(
          `Hang tight! We're still confirming booking ${step.summary.reference}.`,
        ),
      ).toBeVisible();
      await reservations
        .getByRole("button", { name: "Start Again", exact: true })
        .click();
      await expect(
        reservations.getByText(
          `Booking ${step.summary.reference} may still go through.`,
        ),
      ).toBeVisible();
      await reservations
        .getByRole("button", { name: "Keep Waiting", exact: true })
        .click();
      await returned.route("**/api/bookings/hold-status?**", (route) =>
        route.fulfill({
          json: {
            ok: true,
            data: {
              status: "confirmed",
              reference: step.summary.reference,
              summary: step.summary,
            },
          },
        }),
      );
      await reservations
        .getByRole("button", { name: "Check Again", exact: true })
        .click();
      await expect(
        reservations.getByRole("heading", {
          name: "Your table is booked.",
          exact: true,
        }),
      ).toBeVisible();
      await expect(reservations).toContainText(step.summary.reference);
    } finally {
      await returned.close();
    }
  });
}

test("a bank return in a new tab shows a confirmed booking with its reference", async ({
  page,
  isMobile,
}) => {
  const { step } = await depositStep(page, isMobile);
  const returned = await page.context().newPage();
  try {
    await returned.route("**/api/bookings/hold-status?**", async (route) => {
      const reply = await route.fetch();
      const body = await reply.json();
      expect(body.ok).toBe(true);
      expect(body.data.status).toBe("pending");
      await route.fulfill({
        json: { ok: true, data: { ...body.data, status: "confirmed" } },
      });
    });
    await returned.goto(returnedUrl(step, "succeeded"));
    const reservations = returned.getByRole("region", {
      name: "Table reservations",
    });
    await expect(
      reservations.getByRole("heading", {
        name: "Your table is booked.",
        exact: true,
      }),
    ).toBeVisible();
    await expect(reservations).toContainText(step.summary.reference);
    await expect(reservations).toContainText(step.summary.timeLabel);
  } finally {
    await returned.close();
  }
});

for (const status of ["failed", "requires_payment_method"]) {
  test(`a ${status} bank return without a saved step keeps the reference without a card form`, async ({
    page,
    isMobile,
  }) => {
    const { step } = await depositStep(page, isMobile);
    const returned = await page.context().newPage();
    try {
      await returned.goto(returnedUrl(step, status));
      const reservations = returned.getByRole("region", {
        name: "Table reservations",
      });
      await expect(
        reservations.getByText(
          `Your bank didn't approve the payment for booking ${step.summary.reference}. Please start again, or call us on +353 1 676 3144.`,
        ),
      ).toBeVisible();
      await expect(
        reservations.getByText("Card details", { exact: true }),
      ).toHaveCount(0);
      await expect(
        reservations.getByRole("button", { name: /^Pay / }),
      ).toHaveCount(0);
      await reservations
        .getByRole("button", { name: "Start Again", exact: true })
        .click();
      await expect(
        reservations.getByRole("button", { name: "Find a Table", exact: true }),
      ).toBeVisible();
    } finally {
      await returned.close();
    }
  });
}

test("a bank return in another browser keeps the reference and says it cannot check", async ({
  page,
  isMobile,
  browser,
}) => {
  const { step } = await depositStep(page, isMobile);
  const context = await browser.newContext();
  try {
    const returned = await context.newPage();
    await returned.goto(
      new URL(returnedUrl(step, "succeeded"), page.url()).href,
    );
    const reservations = returned.getByRole("region", {
      name: "Table reservations",
    });
    await expect(
      reservations.getByText(
        `We can't check booking ${step.summary.reference} from this page.`,
        { exact: false },
      ),
    ).toBeVisible();
    await expect(reservations).toContainText("+353 1 676 3144");
    await expect(
      reservations.getByRole("button", { name: "Find a Table", exact: true }),
    ).toHaveCount(0);
  } finally {
    await context.close();
  }
});

for (const status of ["failed", "expired"]) {
  test(`a bank return without saved state keeps the reference when the hold is ${status}`, async ({
    page,
    isMobile,
  }) => {
    const { step } = await depositStep(page, isMobile);
    const returned = await page.context().newPage();
    try {
      await returned.route("**/api/bookings/hold-status?**", (route) =>
        route.fulfill({ json: { ok: true, data: { status } } }),
      );
      await returned.goto(returnedUrl(step, "succeeded"));
      const reservations = returned.getByRole("region", {
        name: "Table reservations",
      });
      await expect(reservations.getByRole("alert")).toHaveText(
        `We couldn't confirm booking ${step.summary.reference}. If your card was charged, please call us on +353 1 676 3144 and quote this reference.`,
      );
      await expect(
        reservations.getByRole("button", { name: "Start Again", exact: true }),
      ).toBeVisible();
    } finally {
      await returned.close();
    }
  });
}

for (const answer of ["unanswered", "unavailable"]) {
  test(`an ${answer} bank recovery check gives the reference after a minute and can check again`, async ({
    page,
    isMobile,
  }) => {
    const { step } = await depositStep(page, isMobile);
    const returned = await page.context().newPage();
    try {
      await returned.clock.install({ time: bookingTestTime() });
      await returned.route("**/api/bookings/hold-status?**", (route) => {
        if (answer === "unavailable")
          return route.fulfill({
            status: 503,
            json: {
              ok: false,
              error: { code: "SERVICE_UNAVAILABLE", message: "Unavailable" },
            },
          });
      });
      await returned.goto(returnedUrl(step, "succeeded"));
      const reservations = returned.getByRole("region", {
        name: "Table reservations",
      });
      await expect(
        reservations.getByText("Confirming your booking…", { exact: true }),
      ).toBeVisible();
      expect(returned.url()).not.toContain(step.stripe.clientSecret);
      await returned.reload();
      await expect(
        reservations.getByText("Confirming your booking…", { exact: true }),
      ).toBeVisible();
      await returned.clock.fastForward("01:01");
      await expect(
        reservations.getByText(
          `Hang tight! We're still confirming booking ${step.summary.reference}.`,
        ),
      ).toBeVisible();
      await reservations
        .getByRole("button", { name: "Check Again", exact: true })
        .click();
      await expect(
        reservations.getByText("Confirming your booking…", { exact: true }),
      ).toBeVisible();
    } finally {
      await returned.close();
    }
  });
}

for (const failure of ["throws", "drops"]) {
  test(`when booking storage ${failure} writes, payment is blocked and Edit still asks before changing the booking`, async ({
    page,
    isMobile,
  }) => {
    await page.addInitScript((mode) => {
      Reflect.set(window, "stripeConfirmations", 0);
      const save = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (this === sessionStorage && key.startsWith("peploes:booking-")) {
          if (mode === "throws") throw new Error("Storage blocked");
          return;
        }
        save.call(this, key, value);
      };
    }, failure);
    await stubStripe(page);
    const { reservations, confirm } = await heldWithDetails(page, isMobile, {
      time: "6:30 pm",
    });
    await confirm.click();
    await expect(
      reservations.getByRole("heading", {
        name: "Secure your table",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      reservations.getByText(
        "A €20.00 deposit is needed to reserve this table.",
        { exact: true },
      ),
    ).toBeVisible();
    await expect(
      reservations.getByText(
        "Your browser isn't letting this page save your booking, so we can't safely take a card payment here. Allow site data or try a normal browser window, or call us on +353 1 676 3144.",
        { exact: true },
      ),
    ).toBeVisible();
    await expect(
      reservations.getByText("Card details", { exact: true }),
    ).toHaveCount(0);
    await expect(
      reservations.getByRole("button", { name: /^Pay / }),
    ).toHaveCount(0);
    expect(
      await page.evaluate(() => Reflect.get(window, "stripeConfirmations")),
    ).toBe(0);
    await reservations
      .getByRole("button", { name: "Edit date & guests" })
      .click();
    await expect(changeDialog(page).dialog).toBeVisible();
    await changeDialog(page).keep.click();
    await expect(
      reservations.getByRole("heading", {
        name: "Secure your table",
        exact: true,
      }),
    ).toBeVisible();
  });
}

test("a return with unrelated saved state shows the recovered hold's summary", async ({
  page,
  isMobile,
}) => {
  const { step } = await depositStep(page, isMobile);
  const returned = await page.context().newPage();
  try {
    await returned.addInitScript((payment) => {
      sessionStorage.setItem(
        "peploes:booking-hold",
        JSON.stringify({
          holdReference: "OTHERHOLD",
          holdRevision: 1,
          choice: { searchDate: "2026-01-01", time: "12:00", partySize: 2 },
        }),
      );
      sessionStorage.setItem(
        "peploes:booking-payment",
        JSON.stringify({
          ...payment,
          stripe: { ...payment.stripe, clientSecret: "pi_other_secret_other" },
        }),
      );
    }, step);
    await returned.goto(returnedUrl(step, "succeeded"));
    const reservations = returned.getByRole("region", {
      name: "Table reservations",
    });
    await expect(
      reservations.getByText("Confirming your booking…", { exact: true }),
    ).toBeVisible();
    await expect(reservations).toContainText(step.summary.dateLabel);
    await expect(reservations).toContainText(step.summary.guestsLabel);
    await expect(reservations).not.toContainText("2 guests");
  } finally {
    await returned.close();
  }
});

for (const flow of ["Pay", "a matching same-tab bank return"]) {
  test(`${flow} keeps the paid check after reload when the paid-marker write fails`, async ({
    page,
    isMobile,
  }) => {
    const { reservations, step } = await depositStep(page, isMobile);
    await page.evaluate(() => {
      const save = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (this === sessionStorage && key === "peploes:booking-paid")
          throw new Error("Storage blocked");
        save.call(this, key, value);
      };
    });
    await page.addInitScript(() => {
      Reflect.set(window, "stripeIntentStatus", "succeeded");
      const save = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (this === sessionStorage && key === "peploes:booking-paid")
          throw new Error("Storage blocked");
        save.call(this, key, value);
      };
    });
    if (flow === "Pay") {
      await reservations
        .getByRole("button", { name: "Pay €20.00 and Reserve", exact: true })
        .click();
    } else {
      await page.goto(returnedUrl(step, "succeeded"));
    }
    await expect(
      reservations.getByText("Confirming your booking…", { exact: true }),
    ).toBeVisible();
    await expect(page).toHaveURL("/book-a-table");
    if (flow === "Pay") {
      expect(
        await page.evaluate(() => Reflect.get(window, "stripeConfirmations")),
      ).toBe(1);
    }
    await page.reload();
    await expect(
      reservations.getByText("Confirming your booking…", { exact: true }),
    ).toBeVisible();
    await expect(reservations).toContainText(step.summary.timeLabel);
    await expect(
      reservations.getByRole("button", { name: "Find a Table", exact: true }),
    ).toHaveCount(0);
    await expect(
      reservations.getByLabel("Email address", { exact: false }),
    ).toHaveCount(0);
    expect(
      await page.evaluate(() => Reflect.get(window, "stripeConfirmations")),
    ).toBe(0);
  });
}

test("a recovered paid booking survives another reload when session writes fail", async ({
  page,
  isMobile,
}) => {
  const { step } = await depositStep(page, isMobile);
  const returned = await page.context().newPage();
  try {
    await returned.addInitScript(() => {
      const save = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (this === sessionStorage && key.startsWith("peploes:booking-"))
          throw new Error("Storage blocked");
        save.call(this, key, value);
      };
    });
    await returned.goto(returnedUrl(step, "succeeded"));
    const reservations = returned.getByRole("region", {
      name: "Table reservations",
    });
    await expect(reservations).toContainText(step.summary.timeLabel);
    expect(returned.url()).not.toContain(step.stripe.clientSecret);
    await returned.reload();
    await expect(
      reservations.getByText("Confirming your booking…", { exact: true }),
    ).toBeVisible();
    await expect(reservations).toContainText(step.summary.timeLabel);
    await expect(
      reservations.getByRole("button", { name: "Find a Table", exact: true }),
    ).toHaveCount(0);
  } finally {
    await returned.close();
  }
});

test("a missing hold cookie during details recovery offers a safe restart", async ({
  page,
  isMobile,
}) => {
  const { reservations, confirm } = await heldWithDetails(page, isMobile);
  await page.route("**/api/bookings/hold-status?**", (route) =>
    route.fulfill({
      status: 404,
      json: { ok: false, error: { code: "NOT_FOUND", message: "Not found" } },
    }),
  );
  await dropPosts(page, false);
  await confirm.click();
  await expect(
    reservations.getByRole("button", { name: "Start Again", exact: true }),
  ).toBeVisible();
  await expect(
    reservations.getByRole("button", {
      name: "Confirm Reservation",
      exact: true,
    }),
  ).toHaveCount(0);
  await reservations
    .getByRole("button", { name: "Start Again", exact: true })
    .click();
  await expect(reservations.getByText(/may still go through/)).toBeFocused();
  await reservations
    .getByRole("button", { name: "Start Again", exact: true })
    .click();
  await expect(
    reservations.getByRole("button", { name: "Find a Table", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("peploes:booking-details"),
    ),
  ).toBeNull();
});
