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
  await holding.click({ force: true });
  await expect(reservations.getByRole("timer")).toBeVisible({
    timeout: 10_000,
  });
  expect(posts).toHaveLength(1);
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
  await reservations
    .getByRole("button", { name: label("20:00"), exact: true })
    .click();
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
