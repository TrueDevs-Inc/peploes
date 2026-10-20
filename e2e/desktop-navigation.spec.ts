import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

for (const shelf of [
  {
    trigger: "Menus",
    role: "button",
    crossedLink: "Our Story",
    destination: "Lunch",
    path: "/menus/lunch",
  },
  {
    trigger: "Private Dining & Events",
    role: "link",
    crossedLink: "What’s On",
    destination: "Groups & Celebrations",
    path: "/private-dining/groups-celebrations",
  },
] as const) {
  test(`${shelf.trigger} stays open during diagonal pointer travel into its panel`, async ({
    page,
  }) => {
    const navigation = page.getByRole("navigation", {
      name: "Main navigation",
      exact: true,
    });
    const trigger = navigation.getByRole(shelf.role, {
      name: shelf.trigger,
      exact: true,
    });
    const crossedLink = navigation.getByRole("link", {
      name: shelf.crossedLink,
      exact: true,
    });
    const navigationBox = await navigation.boundingBox();
    const crossedBox = await crossedLink.boundingBox();
    if (!navigationBox || !crossedBox) {
      throw new Error("Desktop navigation must have visible bounds.");
    }

    await trigger.hover();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await page.clock.install();
    await page.clock.pauseAt(new Date(Date.now() + 1000));

    const crossedX = crossedBox.x + crossedBox.width / 2;
    const panelTop = navigationBox.y + navigationBox.height;
    await page.mouse.move(crossedX, panelTop - 6, { steps: 8 });
    await page.mouse.move(crossedX + 60, panelTop + 24, { steps: 8 });
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    await page.clock.runFor(1000);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await page.mouse.move(0, 800);
    await page.clock.runFor(1000);
    await expect(trigger).toHaveAttribute("aria-expanded", "false");

    await trigger.hover();
    await navigation
      .getByRole("link", { name: shelf.destination, exact: true })
      .click();
    await expect(page).toHaveURL(shelf.path);
  });
}

test("switching shelves cancels a pending close and keeps keyboard and outside-click dismissal", async ({
  page,
}) => {
  const navigation = page.getByRole("navigation", {
    name: "Main navigation",
    exact: true,
  });
  const menus = navigation.getByRole("button", { name: "Menus", exact: true });
  const groups = navigation.getByRole("link", {
    name: "Private Dining & Events",
    exact: true,
  });
  const celebration = navigation.getByRole("link", {
    name: "Groups & Celebrations",
    exact: true,
  });

  await menus.hover();
  await page.clock.install();
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  await page.mouse.move(0, 800);
  await groups.hover();
  await page.clock.runFor(1000);
  await expect(menus).toHaveAttribute("aria-expanded", "false");
  await expect(groups).toHaveAttribute("aria-expanded", "true");

  await groups.press("ArrowDown");
  await page.keyboard.press("Tab");
  await expect(celebration).toBeFocused();
  await page.mouse.move(0, 800);
  await page.clock.runFor(1000);
  await expect(groups).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(groups).toBeFocused();
  await expect(groups).toHaveAttribute("aria-expanded", "false");

  await menus.hover();
  await page.mouse.click(0, 800);
  await expect(menus).toHaveAttribute("aria-expanded", "false");
  await menus.press("Enter");
  await expect(menus).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Tab");
  await expect(
    navigation.getByRole("link", { name: "Lunch", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menus).toBeFocused();
  await expect(menus).toHaveAttribute("aria-expanded", "false");
});
