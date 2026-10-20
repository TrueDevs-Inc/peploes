import { expect, type Locator, test } from "@playwright/test";

test.beforeEach(async ({ page, isMobile }) => {
  if (!isMobile) await page.setViewportSize({ width: 768, height: 1024 });
});

async function sampleMotion(toggle: Locator, menu: Locator) {
  const dialogId = await menu.getAttribute("id");
  await toggle.focus();
  return toggle.evaluate(async (button, id) => {
    if (!(button instanceof HTMLButtonElement)) {
      throw new Error("The sidebar toggle must be a button.");
    }
    button.click();
    await new Promise(requestAnimationFrame);
    const element = id ? document.getElementById(id) : null;
    if (!element) throw new Error("The mobile sidebar must exist.");
    const animations = element.getAnimations({ subtree: true });
    for (const animation of animations) {
      animation.pause();
      animation.currentTime =
        Number(animation.effect?.getComputedTiming().duration) / 2;
    }
    const style = getComputedStyle(element);
    const sample = {
      opacity: Number(style.opacity),
      backdropOpacity: Number(getComputedStyle(element, "::backdrop").opacity),
      offset: new DOMMatrixReadOnly(style.transform).m41,
      width: element.getBoundingClientRect().width,
      duration: style.transitionDuration,
      easing: style.transitionTimingFunction,
      display: style.display,
    };
    for (const animation of animations) {
      animation.currentTime =
        Number(animation.currentTime) +
        (animation.playbackRate *
          Number(animation.effect?.getComputedTiming().duration)) /
          4;
    }
    const laterOffset = new DOMMatrixReadOnly(
      getComputedStyle(element).transform,
    ).m41;
    const laterBackdropOpacity = Number(
      getComputedStyle(element, "::backdrop").opacity,
    );
    for (const animation of animations) animation.finish();
    return { ...sample, laterOffset, laterBackdropOpacity };
  }, dialogId);
}

test("mobile sidebar matches Samsu motion while preserving focus and scrolling", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Open menu" });
  const menu = page.getByRole("dialog", {
    name: "Navigation menu",
    includeHidden: true,
  });
  const opening = await sampleMotion(toggle, menu);
  expect(opening.duration).toBe("0.5s");
  expect(opening.easing).toBe("cubic-bezier(0.4, 0, 0.2, 1)");
  expect(opening.opacity).toBe(1);
  expect(opening.offset / opening.width).toBeCloseTo(0.2244, 2);
  expect(opening.laterOffset).toBeLessThan(opening.offset);
  expect(opening.laterBackdropOpacity).toBeGreaterThan(opening.backdropOpacity);
  expect(opening.offset).toBeGreaterThan(0);
  await expect(menu).toHaveCSS("opacity", "1");
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
  const close = menu.getByRole("button", { name: "Close menu" });
  await expect(close).toBeFocused();
  const closing = await sampleMotion(close, menu);
  expect(closing.display).not.toBe("none");
  expect(closing.duration).toBe("0.3s");
  expect(closing.easing).toBe("cubic-bezier(0.4, 0, 0.2, 1)");
  expect(closing.opacity).toBe(1);
  expect(closing.offset / closing.width).toBeCloseTo(0.7756, 2);
  expect(closing.laterOffset).toBeGreaterThan(closing.offset);
  expect(closing.laterBackdropOpacity).toBeLessThan(closing.backdropOpacity);
  expect(closing.offset).toBeGreaterThan(0);
  await expect(menu).not.toBeVisible();
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
});

test("reduced motion opens and closes the menu without animation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Open menu" });
  const menu = page.getByRole("dialog", { name: "Navigation menu" });

  await toggle.click();
  await expect(menu).toHaveCSS("opacity", "1");
  expect(await menu.evaluate((element) => element.getAnimations().length)).toBe(
    0,
  );
  await page.keyboard.press("Escape");
  await expect(menu).not.toBeVisible();
  await expect(toggle).toBeFocused();
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
});

test("the menu can close during its entrance and reopen after a desktop resize", async ({
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
  const enteringOffset = await menu.evaluate((element) => {
    for (const animation of element.getAnimations()) {
      animation.pause();
      animation.currentTime =
        Number(animation.effect?.getComputedTiming().duration) / 5;
    }
    return new DOMMatrixReadOnly(getComputedStyle(element).transform).m41;
  });
  expect(enteringOffset).toBeGreaterThan(0);
  await page.keyboard.press("Escape");
  const closingOffset = await menu.evaluate((element) =>
    element.hasAttribute("open")
      ? new DOMMatrixReadOnly(getComputedStyle(element).transform).m41
      : window.innerWidth,
  );
  expect(closingOffset).toBeGreaterThanOrEqual(enteringOffset - 1);
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
  const navigationBox = await menu
    .getByRole("navigation", { name: "Mobile navigation" })
    .boundingBox();
  if (!row || !navigationBox) {
    throw new Error("The Private Dining row and navigation must be visible.");
  }
  expect(row.width).toBeCloseTo(navigationBox.width, 0);
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
