import { expect, test } from "./menu-test";

test("when ResDiary is slow and then down the page shows at once and the booking panel offers phone and email", async ({
  page,
}) => {
  await page.goto("/book-a-table", { waitUntil: "commit" });

  await expect(
    page.getByRole("heading", { name: "A table at Peploe’s.", level: 1 }),
  ).toBeVisible();
  const reservations = page.getByRole("region", { name: "Table reservations" });
  await expect(
    reservations.getByRole("status").getByText("Loading available dates…"),
  ).toBeVisible();
  await expect(
    reservations.getByText(
      "Online booking isn't available right now. Please call us on +353 1 676 3144 or email reception@peploes.com.",
      { exact: true },
    ),
  ).toBeVisible({ timeout: 15_000 });
  await expect(
    reservations.getByRole("button", { name: /^Date / }),
  ).toHaveCount(0);
  await expect(
    reservations.locator('a[href="mailto:reception@peploes.com"]'),
  ).toBeVisible();
  await expect(
    reservations.locator('a[href="tel:+35316763144"]'),
  ).toBeVisible();
  await expect(
    page
      .getByRole("main")
      .getByRole("link", { name: "Private Dining & Events", exact: true }),
  ).toHaveAttribute("href", "/private-dining");
});
