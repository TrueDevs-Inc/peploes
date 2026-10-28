import type { Locator } from "@playwright/test";
import { expect, test } from "./menu-test";

function waitForTransformTransition(copy: Locator) {
  return copy.evaluate(
    (element) =>
      new Promise<number>((resolve) => {
        element.addEventListener("transitionend", (event) => {
          if (
            event instanceof TransitionEvent &&
            event.target === element &&
            event.propertyName === "transform"
          )
            resolve(event.elapsedTime);
        });
      }),
  );
}

async function leaveImageLinkFocused(card: Locator) {
  if (!(await card.locator('a[aria-hidden="true"]').count())) return;
  const bounds = await card.boundingBox();
  if (!bounds) throw new Error("Story card is missing");
  const page = card.page();
  await page.mouse.move(bounds.x + 20, bounds.y + 20);
  await page.mouse.down();
  await page.mouse.move(0, 0);
  await page.mouse.up();
}

function bottomInset(element: Locator) {
  return element.evaluate((element) => {
    const card = element.closest("article");
    if (!card) throw new Error("Story card is missing");
    return (
      card.getBoundingClientRect().bottom -
      element.getBoundingClientRect().bottom
    );
  });
}

test("story content animates on hover or scroll without disclosure buttons", async ({
  page,
  isMobile,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  if (!isMobile) {
    await page.addInitScript(() => {
      document.addEventListener("transitionrun", (event) => {
        if (
          event instanceof TransitionEvent &&
          event.propertyName === "transform" &&
          event.target instanceof Element &&
          event.target.matches("[data-story-copy]")
        ) {
          document.documentElement.dataset.storyInitialTransition = "true";
        }
      });
    });
  }
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const section = page.getByRole("region", {
    name: /The people, produce, art and stories/,
  });
  const cards = section.getByRole("article");
  await expect(cards).toHaveCount(4);
  if (!isMobile) {
    await expect
      .poll(() => cards.first().getAttribute("style"))
      .toContain("--story-hidden-offset");
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
    await expect(page.locator("html")).not.toHaveAttribute(
      "data-story-initial-transition",
      "true",
    );
  }
  await expect(section.getByRole("button", { name: /details/i })).toHaveCount(
    0,
  );
  if (isMobile)
    await expect(cards.first().locator("[data-story-copy]")).toHaveCSS(
      "opacity",
      "0",
    );
  for (const [index, card] of (await cards.all()).entries()) {
    const copy = card.locator("[data-story-copy]");
    const details = card.locator("[data-story-details]");
    await expect(card).toHaveCSS("cursor", "pointer");
    if (isMobile) {
      const bounds = await card.boundingBox();
      expect(bounds?.height).toBe([460, 390, 330, 330][index]);
      expect(bounds?.width).toBe((page.viewportSize()?.width ?? 0) - 32);
      await card.evaluate((element) =>
        window.scrollTo({
          top:
            scrollY + element.getBoundingClientRect().top - innerHeight * 0.8,
          behavior: "instant",
        }),
      );
      await expect(copy).toHaveCSS("opacity", "0");
      const [animationDuration] = await Promise.all([
        waitForTransformTransition(copy),
        copy.evaluate((element) => {
          window.scrollTo({
            top:
              scrollY +
              element.getBoundingClientRect().top -
              innerHeight * 0.82,
            behavior: "instant",
          });
        }),
      ]);
      expect(animationDuration).toBeCloseTo(0.35);
      await expect(copy).toHaveCSS("transition-duration", "0.35s, 0.35s");
      await expect(copy).toHaveCSS("opacity", "1");
      await expect(copy).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
    } else {
      await page.mouse.move(0, 0);
      await card.scrollIntoViewIfNeeded();
      await leaveImageLinkFocused(card);
      await expect(details).toHaveCSS("opacity", "0");
      const heading = card.getByRole("heading");
      const cardBefore = await card.boundingBox();
      expect(cardBefore).not.toBeNull();
      const [duration] = await Promise.all([
        waitForTransformTransition(copy),
        card.hover(),
      ]);
      expect(duration).toBeCloseTo(0.4);
      await expect(copy).toHaveCSS("transition-duration", "0.4s");
      await expect(details).toHaveCSS("transition-duration", "0.4s");
      await expect(details).toHaveCSS("opacity", "1");
      const expandedHeadingGap = await bottomInset(heading);
      const expandedGap = await bottomInset(
        card.getByRole("link").or(card.getByRole("button")).last(),
      );
      expect((await card.boundingBox())?.height).toBe(cardBefore?.height);
      await Promise.all([
        waitForTransformTransition(copy),
        page.mouse.move(0, 0),
      ]);
      await expect(details).toHaveCSS("opacity", "0");
      const collapsedGap = await bottomInset(heading);
      expect(Math.abs(collapsedGap - expandedGap)).toBeLessThan(2);
      expect(expandedHeadingGap).toBeGreaterThan(collapsedGap);
      await card.getByRole("link").or(card.getByRole("button")).first().focus();
      await page.keyboard.press("Tab");
      await page.keyboard.press("Shift+Tab");
      await expect(details).toHaveCSS("opacity", "1");
      await page
        .getByRole("navigation", { name: "Main navigation", exact: true })
        .getByRole("link", { name: /Peploe.s home/ })
        .focus();
    }
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("clicking the family story image opens Our Story", async ({ page }) => {
  await page.goto("/");
  const card = page
    .getByRole("region", { name: /The people, produce, art and stories/ })
    .getByRole("article")
    .first();
  await card.click({ position: { x: 20, y: 20 } });
  await expect(page).toHaveURL("/our-story");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    /A family restaurant,\s+more than two\s+decades on\./,
  );
});

test("reduced motion keeps story content visible without animation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const cards = page
    .getByRole("region", { name: /The people, produce, art and stories/ })
    .getByRole("article");
  for (const card of await cards.all()) {
    await expect(card.locator("[data-story-details]")).toHaveCSS(
      "opacity",
      "1",
    );
    await expect(card.locator("[data-story-details]")).toHaveCSS(
      "transition-duration",
      "0s",
    );
    await expect(card.locator("[data-story-copy]")).toHaveCSS("opacity", "1");
  }
});
