import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page, isMobile }) => {
  if (!isMobile) await page.setViewportSize({ width: 768, height: 1024 });
});

test("mobile menu keeps navigation without unavailable vouchers or contact details", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  const menu = page.getByRole("dialog", { name: "Navigation menu" });

  await expect(menu.getByText("Opening Hours", { exact: true })).toHaveCount(0);
  await expect(
    menu.getByText(/^16 St Stephen['’]s Green, Dublin 2$/),
  ).toHaveCount(0);
  await expect(menu.locator('a[href^="tel:"], a[href^="mailto:"]')).toHaveCount(
    0,
  );
  await expect(
    menu.getByRole("link", { name: "Visit & Contact" }),
  ).toBeVisible();
  await expect(menu.getByText("Gift Vouchers")).toHaveCount(0);
  const booking = menu.getByRole("link", { name: "Book A Table", exact: true });
  await expect(booking).toBeInViewport();
  await expect(
    menu.getByText("People make Peploe’s.", { exact: true }),
  ).toBeInViewport();
  expect(
    await menu.evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    ),
  ).toBe(true);
});

test("mobile menu restores focus and background scrolling after closing", async ({
  page,
}) => {
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Open menu" });
  await toggle.click();
  const menu = page.getByRole("dialog", { name: "Navigation menu" });
  const close = menu.getByRole("button", { name: "Close menu" });
  await expect(close).toBeFocused();
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
  await close.click();
  await expect(menu).toBeHidden();
  await expect(toggle).toBeFocused();
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
});

test("the menu remains usable with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Open menu" });
  const menu = page.getByRole("dialog", { name: "Navigation menu" });

  await toggle.click();
  await expect(menu).toHaveCSS("opacity", "1");
  await page.keyboard.press("Escape");
  await expect(menu).not.toBeVisible();
  await expect(toggle).toBeFocused();
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
});

test("the menu can close and reopen after a desktop resize", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const viewport = page.viewportSize();
  if (!viewport) throw new Error("The mobile viewport must be configured.");
  const toggle = page.getByRole("button", { name: "Open menu" });
  const menu = page.getByRole("dialog", {
    name: "Navigation menu",
    includeHidden: true,
  });

  await toggle.click();
  await page.keyboard.press("Escape");
  await expect(menu).not.toBeVisible();
  await expect(toggle).toBeFocused();
  await toggle.click();
  await expect(menu).toBeVisible();

  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(menu).not.toBeVisible();
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  await page.setViewportSize(viewport);
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.click();
  await expect(menu).toBeVisible();
  await menu.getByRole("button", { name: "Close menu" }).click();
  await expect(menu).not.toBeVisible();
});

test("the whole Private Dining row toggles its dropdown and keeps its pages reachable", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  const menu = page.getByRole("dialog", { name: "Navigation menu" });
  await menu.getByText("Private Dining & Events", { exact: true }).click();
  await expect(page).toHaveURL("/");
  const groups = menu.getByRole("button", {
    name: "Private Dining & Events",
    exact: true,
  });
  await expect(groups).toHaveAttribute("aria-expanded", "true");
  const celebrations = menu.getByRole("link", {
    name: "Celebrations & Gatherings",
  });
  await expect(celebrations).toBeVisible();
  await expect(celebrations).toHaveAttribute(
    "href",
    "/private-dining/groups-celebrations",
  );
  await expect(
    menu.getByRole("link", { name: "Corporate & Exclusive Hire" }),
  ).toHaveAttribute("href", "/private-dining/corporate-events");
  await expect(menu.getByRole("link", { name: "Weddings" })).toHaveAttribute(
    "href",
    "/private-dining/weddings",
  );

  const row = await groups.boundingBox();
  if (!row) throw new Error("The Private Dining row must be visible.");
  await groups.click({ position: { x: row.width - 50, y: row.height / 2 } });
  await expect(groups).toHaveAttribute("aria-expanded", "false");
  await expect(celebrations).not.toBeVisible();
  await groups.getByText("+", { exact: true }).click();
  await expect(groups).toHaveAttribute("aria-expanded", "true");
  await groups.press("Space");
  await expect(groups).toHaveAttribute("aria-expanded", "false");
  await groups.press("Enter");
  await expect(groups).toHaveAttribute("aria-expanded", "true");

  const menus = menu.getByRole("button", { name: "Menus", exact: true });
  await menus.click();
  await expect(menus).toHaveAttribute("aria-expanded", "true");
  await expect(groups).toHaveAttribute("aria-expanded", "false");
  await groups.click();
  await expect(menus).toHaveAttribute("aria-expanded", "false");
  await menu.getByRole("link", { name: "Overview", exact: true }).click();
  await expect(page).toHaveURL("/private-dining");
  await expect(menu).not.toBeVisible();
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
});
