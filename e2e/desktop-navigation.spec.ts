import { expect, test } from "@playwright/test";

test("desktop shelves keep menu links and the private dining overview reachable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const navigation = page.getByRole("navigation", {
    name: "Main navigation",
    exact: true,
  });
  const menus = navigation.getByRole("button", { name: "Menus", exact: true });
  await menus.click();
  await expect(menus).toHaveAttribute("aria-expanded", "true");

  for (const [name, href] of [
    ["Lunch", "/menus/lunch"],
    ["Dinner", "/menus/dinner"],
    ["Pre-Theatre", "/menus/pre-theatre"],
    ["Wine", "/menus/wine"],
    ["Cocktails", "/menus/cocktails"],
    ["Seasonal", "/menus/seasonal"],
  ]) {
    const link = navigation.getByRole("link", { name, exact: true });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", href);
  }

  const dining = navigation.getByRole("link", {
    name: "Private Dining & Events",
    exact: true,
  });
  await dining.press("ArrowDown");
  await expect(dining).toHaveAttribute("aria-expanded", "true");
  await expect(menus).toHaveAttribute("aria-expanded", "false");
  for (const [name, href] of [
    ["Celebrations & Gatherings", "/private-dining/groups-celebrations"],
    ["Corporate & Exclusive Hire", "/private-dining/corporate-events"],
    ["Weddings", "/private-dining/weddings"],
  ]) {
    const link = navigation.getByRole("link", { name, exact: true });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", href);
  }

  const explore = navigation.getByRole("link", {
    name: "Explore",
    exact: true,
  });
  await expect(explore).toHaveAttribute("href", "/private-dining");
  await explore.click();
  await expect(page).toHaveURL("/private-dining");
  await expect(dining).toHaveAttribute("aria-expanded", "false");
});
