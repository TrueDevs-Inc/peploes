import { expect, test } from "./menu-test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

for (const destination of [
  { label: "Menus", href: "/menus", heading: "Lunch Menu" },
  {
    label: "Private Dining & Events",
    href: "/private-dining",
    heading: "Life tastes better together.",
  },
]) {
  test(`${destination.label} navigates directly without a hover or keyboard shelf`, async ({
    page,
  }) => {
    const navigation = page.getByRole("navigation", {
      name: "Main navigation",
      exact: true,
    });
    const link = navigation.getByRole("link", {
      name: destination.label,
      exact: true,
    });
    await expect(link).toHaveAttribute("href", destination.href);
    await link.hover();
    await expect(link).not.toHaveAttribute("aria-expanded");
    await link.focus();
    await link.press("ArrowDown");
    await link.press("Enter");
    await expect(page).toHaveURL(destination.href);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      destination.heading,
    );
    await expect(link).toHaveAttribute("aria-current", "page");
    await page.goto("/");
    await link.click();
    await expect(page).toHaveURL(destination.href);
  });
}
