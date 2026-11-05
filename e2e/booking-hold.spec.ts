import { FAKE_TIMES } from "./booking-fixtures";
import {
  chooseDate,
  chooseTime,
  expectBookingAtTop,
  findTable,
  laterFreeDate,
  openBooking,
} from "./booking-page";
import { expect, test } from "./menu-test";

function label(time: string): string {
  return FAKE_TIMES.find((slot) => slot.time === time)?.label ?? time;
}

test("an expired hold opens its notice below the navbar with reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.install();
  const panel = await openBooking(page);
  await chooseDate(panel, laterFreeDate());
  await findTable(panel);
  await chooseTime(panel, "6:00 pm");
  await panel.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(panel.getByRole("timer")).toBeVisible();
  await expectBookingAtTop(panel);
  await panel
    .getByRole("button", { name: "Confirm Reservation", exact: true })
    .scrollIntoViewIfNeeded();
  await page.clock.fastForward("06:00");
  await expect(panel.getByRole("alert")).toHaveText(
    "Your table hold ran out. Please choose a time again.",
  );
  await expectBookingAtTop(panel);
});

test("while the table is being held the button says so, and a second click holds nothing more", async ({
  page,
}) => {
  const posts: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST") posts.push(request.url());
  });
  const reservations = await openBooking(page);
  await chooseDate(reservations, laterFreeDate());
  await findTable(reservations);
  await reservations
    .getByRole("button", { name: label("12:30"), exact: true })
    .click();
  await reservations
    .getByRole("button", { name: "Continue", exact: true })
    .click();

  const holding = reservations.getByRole("button", {
    name: "Holding Your Table…",
    exact: true,
  });
  await expect(holding).toBeDisabled();
  await expect(
    reservations
      .getByRole("status")
      .filter({ hasText: "Holding your table for you…" }),
  ).toBeVisible();
  await holding.click({ force: true });
  await expect(reservations.getByRole("timer")).toBeVisible({
    timeout: 10_000,
  });
  expect(posts).toHaveLength(1);
  await expect(
    reservations.getByText("Holding your table for you…", { exact: true }),
  ).toHaveCount(0);
});

test("a failed hold shows the server's message and lets the guest try another time", async ({
  page,
}) => {
  const reservations = await openBooking(page);
  await chooseDate(reservations, laterFreeDate());
  await findTable(reservations);
  const next = reservations.getByRole("button", {
    name: "Continue",
    exact: true,
  });
  await chooseTime(reservations, label("20:00"));
  await next.click();

  await expect(reservations.getByRole("alert")).toHaveText(
    "Online booking isn't available right now. Please call us on +353 1 676 3144 or email reception@peploes.com.",
    { timeout: 10_000 },
  );
  await expect(
    reservations.getByRole("heading", { name: "Available times", exact: true }),
  ).toBeVisible();
  await reservations
    .getByRole("button", { name: label("18:00"), exact: true })
    .click();
  await next.click();
  await expect(reservations.getByRole("timer")).toBeVisible();
  await expect(reservations.getByRole("alert")).toHaveCount(0);
});

test("if the connection drops while holding, the panel says so and Continue works again", async ({
  page,
}) => {
  const reservations = await openBooking(page);
  await chooseDate(reservations, laterFreeDate());
  await findTable(reservations);
  await page.route("**/book-a-table", (route) =>
    route.request().method() === "POST"
      ? route.abort("internetdisconnected")
      : route.fallback(),
  );
  await reservations
    .getByRole("button", { name: label("18:00"), exact: true })
    .click();
  const next = reservations.getByRole("button", {
    name: "Continue",
    exact: true,
  });
  await next.click();

  await expect(reservations.getByRole("alert")).toHaveText(
    "We couldn't reach our booking system. Check your connection and try again, or call us on +353 1 676 3144.",
    { timeout: 10_000 },
  );
  await page.unroute("**/book-a-table");
  await next.click();
  await expect(reservations.getByRole("timer")).toBeVisible({
    timeout: 10_000,
  });
});

test("while the table is being held, the guest can't edit the search or go back", async ({
  page,
}) => {
  const reservations = await openBooking(page);
  await chooseDate(reservations, laterFreeDate());
  await findTable(reservations);
  await reservations
    .getByRole("button", { name: label("12:30"), exact: true })
    .click();
  await reservations
    .getByRole("button", { name: "Continue", exact: true })
    .click();
  const edit = reservations.getByRole("button", { name: "Edit date & guests" });

  await expect(
    reservations.getByRole("button", {
      name: "Holding Your Table…",
      exact: true,
    }),
  ).toBeDisabled();
  await expect(edit).toBeDisabled();
  await expect(
    reservations.getByRole("button", { name: "Back to search", exact: true }),
  ).toBeDisabled();
  await expect(reservations.getByRole("timer")).toBeVisible({
    timeout: 10_000,
  });
  await expect(edit).toBeEnabled();
});
