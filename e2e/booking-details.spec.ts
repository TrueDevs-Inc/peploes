import type { Page } from "@playwright/test";

import { FAKE_RESDIARY } from "./booking-fixtures";
import {
  chooseDate,
  findTable,
  laterFreeDate,
  openBooking,
} from "./booking-page";
import { expect, test } from "./menu-test";

const RESEND_NOTE =
  "We couldn't tell whether your details reached us. Your table is still held, so please press Confirm Reservation again.";

async function heldWithDetails(
  page: Page,
  isMobile: boolean,
  { email = "preview@example.com", time = "6:00 pm" } = {},
) {
  const reservations = await openBooking(page);
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

function savedPaymentStep(page: Page, reference: string, revision: number) {
  return page.evaluate(
    ({ date, reference, revision }) => {
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
            reference,
            revision,
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
    { date: laterFreeDate(), reference, revision },
  );
}

function changeDialog(page: Page) {
  const dialog = page.getByRole("dialog", { name: "Change your booking?" });
  return {
    dialog,
    keep: dialog.getByRole("button", { name: "Keep My Table", exact: true }),
    release: dialog.getByRole("button", {
      name: "Release and Change",
      exact: true,
    }),
  };
}

test("repeated Escape and platform close requests cannot dismiss the dialog while release is pending", async ({
  page,
}) => {
  const reservations = await openBooking(page);
  await page.route("https://js.stripe.com/**", (route) => route.abort());
  await savedPaymentStep(page, "E2E99999", 1);
  await page.reload();
  await page.route("**/book-a-table", (route) => {
    if (route.request().method() !== "POST") return route.fallback();
  });
  await reservations
    .getByRole("button", { name: "Edit date & guests" })
    .click();
  const { dialog, release, keep } = changeDialog(page);
  await release.click();
  await expect(
    dialog.getByRole("button", { name: "Releasing…", exact: true }),
  ).toBeDisabled();
  await expect(keep).toBeDisabled();

  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  await dialog.evaluate((element: HTMLDialogElement) => element.requestClose());
  await expect(dialog).toBeVisible();
  await dialog.evaluate((element) => element.removeAttribute("closedby"));
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  await dialog.evaluate(
    (element: HTMLDialogElement) =>
      new Promise<void>((resolve) => {
        element.addEventListener("close", () => queueMicrotask(resolve), {
          once: true,
        });
        element.close();
      }),
  );
  await expect(dialog).toBeVisible();
  await expect(keep).toBeDisabled();
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("peploes:booking-payment"),
    ),
  ).not.toBeNull();
});

test("when the release reply is lost, the page checks the booking and preserves it across reload", async ({
  page,
  isMobile,
}) => {
  const { reservations, booked } = await heldWithDetails(page, isMobile);
  const held = await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem("peploes:booking-hold") ?? "{}"),
  );
  await page.route("https://js.stripe.com/**", (route) => route.abort());
  await savedPaymentStep(page, held.holdReference, held.holdRevision);
  await page.reload();
  const saved = await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem("peploes:booking-payment") ?? "{}"),
  );
  let status = "pending";
  await page.route("**/api/bookings/hold-status?**", (route) =>
    route.fulfill({
      json: {
        ok: true,
        data: {
          status,
          reference: held.holdReference,
          summary: saved.summary,
          clearHold: status !== "pending",
        },
      },
    }),
  );
  await dropPosts(page, false);
  await reservations
    .getByRole("button", { name: "Edit date & guests" })
    .click();
  const { dialog, release, keep } = changeDialog(page);
  await release.click();

  await expect(dialog.getByRole("status")).toHaveText(
    "Checking whether your table was released…",
  );
  await expect(
    dialog.getByRole("button", { name: "Checking…", exact: true }),
  ).toBeDisabled();
  expect(
    await dialog.evaluate(
      (element) => element.scrollWidth - element.clientWidth,
    ),
  ).toBeLessThanOrEqual(1);
  await expect(keep).toBeDisabled();
  await expect(
    reservations.getByRole("button", { name: "Find a Table", exact: true }),
  ).toHaveCount(0);
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();

  await page.reload();
  await expect(dialog.getByRole("status")).toHaveText(
    "Checking whether your table was released…",
  );
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("peploes:booking-payment"),
    ),
  ).not.toBeNull();
  status = "confirmed";

  await expect(booked).toBeVisible({ timeout: 10_000 });
  await expect(dialog).toHaveCount(0);
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("peploes:booking-release"),
    ),
  ).toBeNull();
});

test("an uncertain release offers status checks without another cancellation, then returns to search only when the hold ends", async ({
  page,
  isMobile,
}) => {
  await page.clock.install();
  const { reservations } = await heldWithDetails(page, isMobile);
  const held = await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem("peploes:booking-hold") ?? "{}"),
  );
  await page.route("https://js.stripe.com/**", (route) => route.abort());
  await savedPaymentStep(page, held.holdReference, held.holdRevision);
  await page.reload();
  let ended = false;
  await page.route("**/api/bookings/hold-status?**", (route) =>
    route.fulfill({
      json: {
        ok: true,
        data: {
          status: ended ? "failed" : "pending",
          reference: held.holdReference,
        },
      },
    }),
  );
  let releaseRequests = 0;
  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      new URL(request.url()).pathname === "/book-a-table"
    ) {
      releaseRequests += 1;
    }
  });
  await dropPosts(page, false);
  await reservations
    .getByRole("button", { name: "Edit date & guests" })
    .click();
  const { dialog, release, keep } = changeDialog(page);
  await release.click();
  await expect(dialog.getByRole("status")).toHaveText(
    "Checking whether your table was released…",
  );
  await page.clock.fastForward("01:01");
  await expect(dialog.getByRole("status")).toHaveText(
    `We couldn't confirm whether booking ${held.holdReference} was released. Please call us on +353 1 676 3144 before booking or paying again.`,
  );
  await expect(keep).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  ended = true;
  await dialog
    .getByRole("button", { name: "Check Again", exact: true })
    .click();

  await expect(
    reservations.getByRole("button", { name: "Find a Table", exact: true }),
  ).toBeVisible();
  expect(releaseRequests).toBe(1);
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("peploes:booking-payment"),
    ),
  ).toBeNull();
});

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
  const { dialog, keep, release } = changeDialog(page);

  await reservations
    .getByRole("button", { name: "Edit date & guests" })
    .click();
  await expect(dialog).toContainText(
    "We'll release your table for 6:00 pm on Sat, 7 Nov 2026 so you can choose another time. You haven't been charged.",
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
  await release.click();
  await expect(
    reservations.getByRole("button", { name: "Find a Table", exact: true }),
  ).toBeVisible({ timeout: 10_000 });
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("peploes:booking-payment"),
    ),
  ).toBeNull();
});

test("a booking confirmed during release shows confirmation instead of a new search", async ({
  page,
  isMobile,
}) => {
  const { reservations, booked } = await heldWithDetails(page, isMobile, {
    time: "7:00 pm",
  });
  const held = await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem("peploes:booking-hold") ?? "{}"),
  );
  await page.route("https://js.stripe.com/**", (route) => route.abort());
  await savedPaymentStep(page, held.holdReference, held.holdRevision);
  await page.reload();
  await reservations
    .getByRole("button", { name: "Edit date & guests" })
    .click();
  await changeDialog(page).release.click();

  await expect(booked).toBeVisible({ timeout: 10_000 });
  await expect(
    reservations.getByRole("button", { name: "Find a Table", exact: true }),
  ).toHaveCount(0);
});

test("if the old table was already booked, Release and Change shows the booking instead of cancelling it", async ({
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
  await changeDialog(page).release.click();

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
});

test("while the payment form is still loading, the guest can't edit the search", async ({
  page,
}) => {
  await page.route("https://js.stripe.com/**", () => undefined);
  const reservations = await openBooking(page);
  await savedPaymentStep(page, "E2E99999", 1);
  await page.reload();

  await expect(
    reservations.getByText("Loading secure payment…", { exact: true }),
  ).toBeVisible();
  await expect(
    reservations.getByRole("button", { name: "Edit date & guests" }),
  ).toBeDisabled();
});
