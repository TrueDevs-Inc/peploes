import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./menu-test";

async function revealContent(content: Locator) {
  if ((await content.getAttribute("data-scroll-reveal-state")) === "visible") {
    await expect(content).toHaveCSS("opacity", "1");
    return;
  }
  await expect(content).toHaveCSS("opacity", "0");
  await expect(content).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 24)");
  const height = (await content.boundingBox())?.height;
  const [duration] = await Promise.all([
    content.evaluate(
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
    ),
    content.evaluate((element) =>
      window.scrollTo({
        top: scrollY + element.getBoundingClientRect().top - innerHeight * 0.55,
        behavior: "instant",
      }),
    ),
  ]);
  expect(duration).toBeCloseTo(0.35);
  await expect(content).toHaveCSS("opacity", "1");
  await expect(content).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
  expect((await content.boundingBox())?.height).toBe(height);
}

async function expectDesktopRevealTargets(page: Page) {
  for (const [selector, count] of [
    ['[aria-labelledby="hero-heading"]', 1],
    ['[aria-label="The Peploe’s experience"]', 4],
    ['[aria-labelledby="menus-heading"]', 1],
    ["#whats-on", 4],
    ["#wine", 4],
    ['[aria-labelledby="stories-heading"]', 1],
    ["#groups-occasions", 4],
    ['[aria-labelledby="human-hospitality-heading"]', 3],
    ["#book-a-table", 1],
  ] as const) {
    await expect(
      page.locator(`${selector} [data-scroll-reveal-state]:visible`),
    ).toHaveCount(count);
  }
  const occasionCards = page.locator("#groups-occasions").getByRole("listitem");
  await expect(occasionCards).toHaveCount(3);
  for (const card of await occasionCards.all())
    await expect(card.locator("[data-scroll-reveal-state]")).toHaveCount(1);
  const footerGroups = page.locator(
    "footer [data-footer-section]:visible, footer [data-footer-meta]:visible",
  );
  await expect(footerGroups).toHaveCount(5);
  for (const group of await footerGroups.all())
    await expect(group).toHaveAttribute(
      "data-scroll-reveal-state",
      /pending|visible/,
    );
}

test("all homepage sections and footer reveal upwards once at every screen size", async ({
  page,
  isMobile,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const sections = page.locator("main > section");
  await expect(sections).toHaveCount(9);
  for (const section of await sections.all())
    expect(
      await section.locator("[data-scroll-reveal]").count(),
    ).toBeGreaterThan(0);

  if (!isMobile) {
    await expectDesktopRevealTargets(page);
    await expect(page.locator("[data-scroll-reveal-initial]")).toHaveCSS(
      "animation-duration",
      "0.35s",
    );
  }
  await expect(
    page.locator("[data-scroll-reveal-state='pending']").first(),
  ).toHaveCSS("opacity", "0");
  const content = page.locator("[data-scroll-reveal-state]:visible");
  expect(await content.count()).toBeGreaterThan(20);
  for (const group of await content.all()) await revealContent(group);
  await expect(
    page.locator("footer [data-scroll-reveal-state='visible']").first(),
  ).toHaveCSS("opacity", "1");
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  for (const group of await content.all())
    await expect(group).toHaveAttribute("data-scroll-reveal-state", "visible");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);

  await page
    .getByRole("link", { name: "Discover Our Story", exact: true })
    .focus();
  await page
    .getByRole("link", { name: "Discover Our Story", exact: true })
    .click();
  await expect(page).toHaveURL("/our-story");
  await expect(
    page.locator('[aria-labelledby="story-today"] [data-scroll-reveal-state]'),
  ).toHaveAttribute("data-scroll-reveal-state", "pending");
});

test("mobile reveal respects keyboard focus, resizing, and reduced motion", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const menus = page
    .getByRole("region", {
      name: "Good food brings people together.",
      exact: true,
    })
    .locator("[data-scroll-reveal]");
  await expect(menus).toHaveCSS("opacity", "0");
  await menus
    .getByRole("link", { name: "Explore Our Menus", exact: true })
    .focus();
  await expect(menus).toHaveAttribute("data-scroll-reveal-state", "visible");
  await expect(menus).toHaveCSS("opacity", "1");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("[data-scroll-reveal-state]")).toHaveCount(0);
  await expect(menus).toHaveCSS("opacity", "1");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(
    page.locator("[data-scroll-reveal-state='pending']").first(),
  ).toHaveCSS("opacity", "0");
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(menus).toHaveAttribute("data-scroll-reveal-state", "visible");
  expect(
    await page.locator("footer [data-scroll-reveal-state]").count(),
  ).toBeGreaterThan(0);
  await expect(menus).toHaveCSS("opacity", "1");
});
