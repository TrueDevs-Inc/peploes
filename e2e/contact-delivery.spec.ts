import { expect, test } from "@playwright/test";

test("Visit keeps general enquiries on direct contact links when email delivery is configured", async ({
  page,
}) => {
  await page.goto("/contact");
  await expect(
    page.getByRole("form", { name: "General contact message" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("form", { name: "Plan your gathering" }),
  ).toBeVisible();
  const contact = page.getByRole("region", {
    name: "Opening hours, address and contact",
  });
  await expect(contact.locator('a[href^="mailto:"]')).toBeVisible();
  await expect(contact.locator('a[href^="tel:"]')).toBeVisible();
});
