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

test("if the guest moves the hold while the page is still checking, the details form comes back for the new time", async ({
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

  await page.unroute("**/book-a-table");
  await reservations
    .getByRole("button", { name: "Edit date & guests" })
    .click();
  await findTable(reservations);
  await reservations
    .getByRole("button", { name: "7:00 pm", exact: true })
    .click();
  await reservations
    .getByLabel("I understand the table is required back by 9:00 pm")
    .check();
  await reservations
    .getByRole("button", { name: "Continue", exact: true })
    .click();
  await expect(reservations.getByRole("timer")).toBeVisible({
    timeout: 10_000,
  });
  await expect(confirm).toBeEnabled();
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
