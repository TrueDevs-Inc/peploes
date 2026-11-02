import {
  chooseDate,
  findTable,
  laterFreeDate,
  openBooking,
} from "./booking-page";
import { expect, test } from "./menu-test";

test("payment editing gives the restaurant phone instead of cancelling when cancellation is disabled", async ({
  page,
}) => {
  await page.route("https://js.stripe.com/**", (route) => route.abort());
  const reservations = await openBooking(page);
  await chooseDate(reservations, laterFreeDate());
  await findTable(reservations);
  await reservations
    .getByRole("button", { name: "6:30 pm", exact: true })
    .click();
  await reservations
    .getByRole("button", { name: "Continue", exact: true })
    .click();
  await reservations
    .getByLabel("Full name", { exact: false })
    .fill("Preview Guest");
  await reservations
    .getByLabel("Email address", { exact: false })
    .fill("preview@example.com");
  await reservations
    .getByLabel("Telephone number", { exact: false })
    .fill("087 123 4567");
  await reservations.getByRole("checkbox", { name: /By confirming/ }).check();
  await expect(
    reservations.getByRole("button", {
      name: "Edit date & guests",
      exact: true,
    }),
  ).toBeEnabled();
  await reservations
    .getByRole("button", { name: "Confirm Reservation", exact: true })
    .click();
  await expect(
    reservations.getByRole("heading", {
      name: "Secure your table",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    reservations.getByRole("button", {
      name: "Edit date & guests",
      exact: true,
    }),
  ).toBeDisabled();
  await expect(
    reservations.getByText(/To change this table, please call us on/),
  ).toBeVisible();
  await expect(
    reservations
      .getByRole("link", { name: "+353 1 676 3144", exact: true })
      .first(),
  ).toHaveAttribute("href", "tel:+35316763144");
  await expect(
    page.getByRole("dialog", { name: "Change your booking?" }),
  ).toHaveCount(0);
});
