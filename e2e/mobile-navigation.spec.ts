import { expect, test } from "@playwright/test";

test("the entire Private Dining row toggles its submenu and keeps the overview reachable", async ({
  page,
  isMobile,
}) => {
  if (!isMobile) await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  const menu = page.getByRole("dialog", { name: "Navigation menu" });
  const navigation = menu.getByRole("navigation", {
    name: "Mobile navigation",
  });
  const dining = navigation.getByRole("button", {
    name: "Private Dining & Events",
    exact: true,
  });
  const overview = navigation.getByRole("link", {
    name: "Overview",
    exact: true,
  });
  await expect(dining).toBeVisible();
  await expect(dining).toHaveAttribute("aria-expanded", "false");

  const row = await dining.boundingBox();
  const nav = await navigation.boundingBox();
  if (!row || !nav) throw new Error("Mobile navigation is missing");
  expect(row.width).toBeCloseTo(nav.width, 0);

  // Exercise the label, the space between label and icon, and the icon.
  for (const [x, expanded] of [
    [12, true],
    [row.width - 60, false],
    [row.width - 16, true],
  ] as const) {
    await dining.click({ position: { x, y: row.height / 2 } });
    await expect(dining).toHaveAttribute("aria-expanded", String(expanded));
    await expect(overview).toBeVisible({ visible: expanded });
    await expect(menu).toBeVisible();
    await expect(page).toHaveURL("/");
  }

  await dining.press("Space");
  await expect(dining).toHaveAttribute("aria-expanded", "false");
  await dining.press("Enter");
  await expect(dining).toHaveAttribute("aria-expanded", "true");
  for (const label of [
    "Groups & Celebrations",
    "Corporate & Exclusive Hire",
    "Weddings",
  ]) {
    await expect(
      navigation.getByRole("link", { name: label, exact: true }),
    ).toBeVisible();
  }

  const menus = navigation.getByRole("button", { name: "Menus", exact: true });
  await menus.click();
  await expect(menus).toHaveAttribute("aria-expanded", "true");
  await expect(dining).toHaveAttribute("aria-expanded", "false");
  await dining.click();
  await expect(menus).toHaveAttribute("aria-expanded", "false");
  await expect(overview).toHaveAttribute("href", "/private-dining");
  await overview.click();
  await expect(page).toHaveURL("/private-dining");
  await expect(menu).not.toBeVisible();
});
