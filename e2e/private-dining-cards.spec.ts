import { expect, test } from "./menu-test";

const destinations = [
  "/private-dining/groups-celebrations",
  "/private-dining/corporate-events",
  "/private-dining/weddings",
];

test("occasion photographs open the same pages as their actions", async ({
  page,
}) => {
  for (const destination of destinations) {
    await page.goto("/private-dining");
    const photograph = page.locator(`main a[href="${destination}"]`).filter({
      has: page.getByRole("img"),
    });
    await expect(photograph).toHaveCount(1);
    await photograph.click();
    await expect(page).toHaveURL(destination);
  }
});
