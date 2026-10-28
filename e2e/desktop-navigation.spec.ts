import { expect, test } from "./menu-test";

test("menu underline stays on the selection during hover, focus and dropdown opening", async ({
  page,
}) => {
  await page.goto("/menus?menu=lunch");
  const navigation = page.getByRole("navigation", { name: "Restaurant menus" });
  const indicator = navigation.locator("[data-menu-indicator]");
  const lunch = navigation.getByRole("link", { name: "Lunch", exact: true });
  const dinner = navigation.getByRole("link", { name: "Dinner", exact: true });
  const initial = await lunch.boundingBox();
  await expect
    .poll(async () => (await indicator.boundingBox())?.x)
    .toBeCloseTo(initial?.x ?? -1, 0);
  const expectSelected = async () => {
    await indicator.evaluate((element) =>
      Promise.all(
        element.getAnimations().map((animation) => animation.finished),
      ),
    );
    const bounds = await indicator.boundingBox();
    expect(bounds?.x).toBeCloseTo(initial?.x ?? -1, 0);
    expect(bounds?.width).toBeCloseTo(initial?.width ?? -1, 0);
  };
  await dinner.hover();
  await expectSelected();
  await dinner.focus();
  await expectSelected();
  const collection = navigation.getByRole("button").first();
  await collection.click();
  await expect(collection).toHaveAttribute("aria-expanded", "true");
  await expectSelected();
  await page.keyboard.press("Escape");
  await expect(lunch).toHaveAttribute("aria-current", "page");
});

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("the shared underline changes only after navigation activation", async ({
  page,
}) => {
  const navigation = page.getByRole("navigation", {
    name: "Main navigation",
    exact: true,
  });
  const menus = navigation.getByRole("link", { name: "Menus", exact: true });
  const visit = navigation.getByRole("link", {
    name: "Visit & Contact",
    exact: true,
  });
  const gift = navigation.getByRole("button", {
    name: "Gift Vouchers",
    exact: true,
  });
  const indicator = navigation.locator("[data-navbar-indicator]");
  const groups = navigation.getByRole("link", {
    name: "Private Dining & Events",
    exact: true,
  });
  for (const control of [menus, groups, visit, gift]) {
    await control.hover();
    await expect(indicator).toHaveCSS("opacity", "0");
    await control.focus();
    await expect(indicator).toHaveCSS("opacity", "0");
    await expect(control).toHaveCSS("text-decoration-line", "none");
  }
  await menus.click();
  await expect(page).toHaveURL("/menus");
  await expect(indicator).toHaveCSS("opacity", "1");
  const selected = await menus.boundingBox();
  await expect
    .poll(async () => (await indicator.boundingBox())?.x)
    .toBe(selected?.x);
  for (const control of [groups, visit, gift, menus]) {
    await control.hover();
    await expect(indicator).toHaveCSS("opacity", "1");
    expect(await indicator.boundingBox()).toMatchObject({
      x: selected?.x,
      width: selected?.width,
    });
    await control.focus();
    expect(await indicator.boundingBox()).toMatchObject({
      x: selected?.x,
      width: selected?.width,
    });
  }
  await expect(gift).toHaveAttribute("aria-disabled", "true");
  await indicator.evaluate((element) => {
    element.addEventListener("transitionrun", (event) => {
      if (
        event instanceof TransitionEvent &&
        event.propertyName === "transform"
      )
        element.setAttribute("data-selection-moved", "true");
    });
  });
  await visit.click();
  await page.mouse.move(0, 800);
  await page.getByRole("heading").first().click();
  await expect(page).toHaveURL(/\/visit-contact$/);
  await expect(indicator).toHaveAttribute("data-selection-moved", "true");
  await expect(indicator).toHaveCSS("opacity", "1");
  await expect
    .poll(async () => (await indicator.boundingBox())?.x)
    .toBe((await visit.boundingBox())?.x);
  await expect(visit).toHaveCSS("color", "rgb(122, 30, 36)");
  await expect(visit).toHaveCSS("text-decoration-line", "none");
});

test("switching dropdowns animates the background and content while preserving the selected underline", async ({
  page,
}) => {
  const navigation = page.locator("[data-navbar-primary]");
  const menus = navigation.getByRole("link", { name: "Menus", exact: true });
  const groups = navigation.getByRole("link", {
    name: "Private Dining & Events",
    exact: true,
  });
  const indicator = navigation.locator("[data-navbar-indicator]");
  const backdrop = navigation.locator("[data-navbar-backdrop]");
  await menus.click();
  await expect(page).toHaveURL("/menus");
  await menus.hover();
  await expect(indicator).toHaveCSS("opacity", "1");
  const start = await indicator.boundingBox();
  const startHeight = (await backdrop.boundingBox())?.height;
  await groups.hover();
  const properties = await navigation.evaluate((node) => {
    const animations = node.getAnimations({ subtree: true });
    for (const animation of animations) {
      animation.pause();
      animation.currentTime =
        Number(animation.effect?.getTiming().duration) / 2;
    }
    return animations.flatMap((animation) =>
      animation instanceof CSSTransition ? [animation.transitionProperty] : [],
    );
  });
  expect(properties).toEqual(
    expect.arrayContaining(["transform", "opacity", "height"]),
  );
  expect(await indicator.boundingBox()).toEqual(start);
  expect((await backdrop.boundingBox())?.height).toBeGreaterThan(
    startHeight ?? 0,
  );
  const oldPanel = page.locator(
    `[id="${await menus.getAttribute("aria-controls")}"]`,
  );
  expect(await oldPanel.getAttribute("aria-hidden")).toBe("true");
  expect(await oldPanel.getAttribute("inert")).toBe("");
  const groupPanel = page.locator(
    `[id="${await groups.getAttribute("aria-controls")}"]`,
  );
  const incoming = await groupPanel.locator(":scope > div").evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      x: new DOMMatrix(style.transform).m41,
      opacity: Number(style.opacity),
    };
  });
  expect(incoming.x).toBeGreaterThan(0);
  expect(incoming.x).toBeLessThan(16);
  expect(incoming.opacity).toBeGreaterThan(0);
  expect(incoming.opacity).toBeLessThan(1);
  for (const trigger of [menus, groups, menus]) await trigger.hover();
  expect(await groupPanel.getAttribute("aria-hidden")).toBe("true");
  expect(await groupPanel.getAttribute("inert")).toBe("");
  await expect
    .poll(async () => (await indicator.boundingBox())?.x)
    .toBe(start?.x);
  await expect(backdrop).toHaveCSS(
    "height",
    `${(await oldPanel.boundingBox())?.height}px`,
  );
  await menus.press("Escape");
  await expect(backdrop).toHaveCSS("opacity", "0");
});

test("reduced motion switches dropdowns immediately and survives rapid switching", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const navigation = page.locator("[data-navbar-primary]");
  const menus = navigation.getByRole("link", { name: "Menus", exact: true });
  const groups = navigation.getByRole("link", {
    name: "Private Dining & Events",
    exact: true,
  });
  for (const trigger of [menus, groups, menus, groups]) {
    await trigger.hover();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(
      await navigation.evaluate(
        (node) => node.getAnimations({ subtree: true }).length,
      ),
    ).toBe(0);
    await expect(navigation.locator("[data-navbar-indicator]")).toHaveCSS(
      "opacity",
      "0",
    );
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    navigation.locator('[data-navigation-id="Private Dining & Events"]'),
  ).toHaveAttribute("aria-expanded", "false");
  await page.mouse.move(0, 800);
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(groups).toHaveAttribute("aria-expanded", "false");
});

test("desktop shelves match their Figma heights without moving the page", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const scrollbarWidth = await page.evaluate(
    () =>
      window.innerWidth -
      document.documentElement.getBoundingClientRect().width,
  );
  await page.setViewportSize({ width: 1440 + scrollbarWidth, height: 900 });
  const navigation = page.getByRole("navigation", {
    name: "Main navigation",
    exact: true,
  });
  const menus = navigation.getByRole("link", { name: "Menus", exact: true });
  const groups = navigation.getByRole("link", {
    name: "Private Dining & Events",
    exact: true,
  });
  const heading = page.getByRole("main").getByRole("heading").first();
  await menus.hover();
  const menuPanel = page.locator(
    `[id="${await menus.getAttribute("aria-controls")}"]`,
  );
  const originalPanel = await menuPanel.boundingBox();
  const originalHeading = await heading.boundingBox();
  expect(originalPanel).not.toBeNull();
  expect(originalPanel?.height).toBe(218);
  for (const trigger of [groups, menus, groups, menus]) {
    await trigger.hover();
    const panel = page.locator(
      `[id="${await trigger.getAttribute("aria-controls")}"]`,
    );
    await expect(panel).toBeVisible();
    expect(await panel.boundingBox()).toEqual({
      ...originalPanel,
      height: trigger === groups ? 292 : 218,
    });
    expect(await heading.boundingBox()).toEqual(originalHeading);
  }
  await groups.hover();
  const groupPanel = page.locator(
    `[id="${await groups.getAttribute("aria-controls")}"]`,
  );
  const images = groupPanel.locator("img");
  for (const [index, x] of [448, 766.6667, 1085.3333].entries()) {
    const image = images.nth(index);
    await expect(image).toBeVisible();
    await expect
      .poll(() =>
        image.evaluate((node) =>
          node instanceof HTMLImageElement ? node.naturalWidth : 0,
        ),
      )
      .toBeGreaterThan(0);
    const bounds = await image.boundingBox();
    expect(bounds?.x).toBeCloseTo(x, 1);
    expect(bounds?.y).toBe(112);
    expect(bounds?.width).toBeCloseTo(282.6667, 1);
    expect(bounds?.height).toBe(132);
  }
  await page.setViewportSize({ width: 1440 + scrollbarWidth, height: 240 });
  expect((await groupPanel.boundingBox())?.height).toBe(164);
  expect(
    await groupPanel.evaluate((node) => node.scrollHeight > node.clientHeight),
  ).toBe(true);
  await groupPanel.getByRole("link", { name: "Weddings", exact: true }).focus();
  await expect(
    groupPanel.getByRole("link", { name: "Weddings", exact: true }),
  ).toBeInViewport();
});

test("desktop Menus opens Lunch by pointer and keyboard", async ({ page }) => {
  const menus = page
    .getByRole("navigation", { name: "Main navigation", exact: true })
    .getByRole("link", { name: "Menus", exact: true });

  await expect(menus).toHaveAttribute("href", "/menus");
  await menus.click();
  await expect(page).toHaveURL("/menus");
  await expect(
    page.getByRole("heading", { name: "Lunch Menu", exact: true }),
  ).toBeVisible();
  await expect(menus).toHaveAttribute("aria-expanded", "false");

  await page.goto("/menus?menu=dinner");
  await menus.focus();
  await menus.press("Enter");
  await expect(page).toHaveURL("/menus");
  await expect(
    page.getByRole("heading", { name: "Lunch Menu", exact: true }),
  ).toBeVisible();
});

for (const shelf of [
  {
    trigger: "Menus",
    role: "link",
    crossedLink: "Menus",
    destination: "Lunch",
    path: "/menus?menu=lunch",
  },
  {
    trigger: "Private Dining & Events",
    role: "link",
    crossedLink: "What’s On",
    destination: "Celebrations & Gatherings",
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
  const menus = navigation.getByRole("link", { name: "Menus", exact: true });
  const groups = navigation.getByRole("link", {
    name: "Private Dining & Events",
    exact: true,
  });
  const celebration = navigation.getByRole("link", {
    name: "Celebrations & Gatherings",
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
  await expect(
    navigation.getByRole("link", { name: "Explore", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(celebration).toBeFocused();
  await page.mouse.move(0, 800);
  await page.clock.runFor(1000);
  await expect(groups).toHaveAttribute("aria-expanded", "true");
  await page.clock.resume();
  await page.keyboard.press("Escape");
  await expect(groups).toBeFocused();
  await expect(groups).toHaveAttribute("aria-expanded", "false");

  await menus.hover();
  await page.mouse.click(0, 800);
  await expect(menus).toHaveAttribute("aria-expanded", "false");
  await menus.press("ArrowDown");
  await expect(menus).toHaveAttribute("aria-expanded", "true");
  await expect(
    navigation.getByRole("link", { name: "Lunch", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(
    navigation.getByRole("link", { name: "Lunch", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menus).toBeFocused();
  await expect(menus).toHaveAttribute("aria-expanded", "false");
});

test("desktop shelves keep menu links and the private dining overview reachable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const navigation = page.getByRole("navigation", {
    name: "Main navigation",
    exact: true,
  });
  const menus = navigation.getByRole("link", { name: "Menus", exact: true });
  await menus.press("ArrowDown");
  await expect(menus).toHaveAttribute("aria-expanded", "true");

  for (const [name, href] of [
    ["Lunch", "/menus?menu=lunch"],
    ["Dinner", "/menus?menu=dinner"],
    ["Pre-Theatre", "/menus?menu=pre-theatre"],
    ["Wine", "/menus?menu=wine"],
    ["Cocktails", "/menus?menu=cocktails"],
    ["Seasonal", "/menus?menu=seasonal"],
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
