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
  const indicator = navigation.locator("[data-navbar-indicator]");
  const groups = navigation.getByRole("link", {
    name: "Private Dining & Events",
    exact: true,
  });
  await expect(navigation.getByText("Gift Vouchers")).toHaveCount(0);
  for (const control of [menus, groups, visit]) {
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
  for (const control of [groups, visit, menus]) {
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
  await expect(page).toHaveURL(/\/contact$/);
  await expect(indicator).toHaveAttribute("data-selection-moved", "true");
  await expect(indicator).toHaveCSS("opacity", "1");
  await expect
    .poll(async () => (await indicator.boundingBox())?.x)
    .toBe((await visit.boundingBox())?.x);
  await expect(visit).toHaveCSS("color", "rgb(122, 30, 36)");
  await expect(visit).toHaveCSS("text-decoration-line", "none");
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
  await expect(menus).not.toHaveAttribute("aria-expanded");

  await page.goto("/menus?menu=dinner");
  await menus.focus();
  await menus.press("Enter");
  await expect(page).toHaveURL("/menus");
  await expect(
    page.getByRole("heading", { name: "Lunch Menu", exact: true }),
  ).toBeVisible();
});

for (const [name, href] of [
  ["Menus", "/menus"],
  ["Private Dining & Events", "/private-dining"],
]) {
  test(`${name} stays a direct link on hover and keyboard focus`, async ({
    page,
  }) => {
    const navigation = page.getByRole("navigation", {
      name: "Main navigation",
      exact: true,
    });
    const link = navigation.getByRole("link", { name, exact: true });
    await expect(link).toHaveAttribute("href", href);
    await link.hover();
    await expect(link).not.toHaveAttribute("aria-expanded");
    await expect(link).not.toHaveAttribute("aria-controls");
    await link.focus();
    await link.press("ArrowDown");
    await expect(
      navigation.getByRole("link", { name: "Explore", exact: true }),
    ).toHaveCount(0);
    await expect(
      navigation.getByRole("link", { name: "Lunch", exact: true }),
    ).toHaveCount(0);
    await link.press("Enter");
    await expect(page).toHaveURL(href);
  });
}
