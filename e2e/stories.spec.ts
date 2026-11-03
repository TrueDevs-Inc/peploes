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
    await expect(copy).toHaveCSS("cursor", "text");
    await expect(copy).toHaveCSS("user-select", "text");
    for (const description of await details.locator("p").all()) {
      await expect(description).toHaveCSS("cursor", "text");
    }
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

for (const target of ["image", "button"] as const) {
  test(`clicking the family story ${target} opens Our Story`, async ({
    page,
  }) => {
    await page.goto("/");
    const card = page
      .getByRole("region", { name: /The people, produce, art and stories/ })
      .getByRole("article")
      .first();
    if (target === "button") {
      const action = card.getByRole("link", { name: "Discover Our Story" });
      await expect(action).toHaveCSS("cursor", "pointer");
      await action.focus();
      await page.keyboard.press("Enter");
    } else {
      await card.click({ position: { x: 20, y: 20 } });
    }
    await expect(page).toHaveURL("/our-story");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      /A family restaurant,\s+more than two\s+decades on\./,
    );
  });
}

for (const [name, href] of [
  ["Explore the Journal", "/journal"],
  ["Stories from the cellar", "/journal?category=food-wine"],
] as const) {
  test(`${name} opens the Journal`, async ({ page }) => {
    await page.goto("/");
    const link = page
      .getByRole("main")
      .getByRole("link", { name, exact: true });
    await expect(link).toHaveAttribute("href", href);
    await link.click();
    await expect(page).toHaveURL(href);
    const main = page.getByRole("main");
    await expect(main).toBeVisible();
    await expect(main.getByRole("heading", { level: 1 })).toHaveText(
      "The Journal",
    );
  });
}

for (const target of ["CTA", "image"] as const) {
  test(`home Journal story ${target} clicks open their matching destinations`, async ({
    page,
    isMobile,
  }) => {
    for (const [heading, href, destinationHeading] of [
      [
        /Rooted in good relationships/,
        "/journal?category=people-produce",
        /The Journal/,
      ],
      [
        isMobile ? /Wine things just happen/ : /Some things have changed/,
        isMobile
          ? "/journal/wine-things-just-happen"
          : "/journal/some-things-have-changed",
        isMobile ? /Wine things just happen/ : /Some things have changed/,
      ],
      [
        /The art of Peploe.s/,
        "/journal/the-art-of-peploes",
        /The art of Peploe.s/,
      ],
    ] as const) {
      await page.goto("/");
      const card = page
        .getByRole("region", { name: /The people, produce, art and stories/ })
        .getByRole("article")
        .filter({ has: page.getByRole("heading", { name: heading }) });
      const action = card.locator("[data-story-details]").getByRole("link");
      await expect(action).toHaveAttribute("href", href);
      if (target === "CTA") {
        await action.focus();
        await action.click();
      } else {
        await card.click({ position: { x: 20, y: 20 } });
      }
      await expect(page).toHaveURL(href);
      const main = page.getByRole("main");
      await expect(main).toBeVisible();
      await expect(main.getByRole("heading", { level: 1 })).toHaveText(
        destinationHeading,
      );
    }
  });
}

test("story text remains selectable without navigating", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const cards = page
    .getByRole("region", { name: /The people, produce, art and stories/ })
    .getByRole("article");
  for (const card of await cards.all()) {
    await card.hover();
    const heading = card.getByRole("heading");
    await expect(heading.getByRole("link")).toHaveCount(0);
    await expect(heading).toHaveCSS("cursor", "text");
    await heading.locator("[data-story-text]:visible").click({
      position: { x: 8, y: 8 },
    });
    await expect(page).toHaveURL("/");
    for (const description of await card
      .locator("[data-story-details] p")
      .all()) {
      if (!(await description.isVisible())) continue;
      const text = description.locator("[data-story-text]");
      await text.hover({ position: { x: 8, y: 8 } });
      const cursor = await text.evaluate((element) => {
        const bounds = element.getClientRects()[0];
        const hit = document.elementFromPoint(bounds.x + 8, bounds.y + 8);
        return hit ? getComputedStyle(hit).cursor : null;
      });
      expect(cursor).toBe("text");
      await text.click({ position: { x: 8, y: 8 } });
      await expect(page).toHaveURL("/");
    }
  }
  await cards
    .first()
    .getByRole("heading")
    .locator("[data-story-text]")
    .dblclick({ position: { x: 30, y: 16 } });
  await expect
    .poll(() => page.evaluate(() => window.getSelection()?.toString() ?? ""))
    .toMatch(/\S/);
  await expect(page).toHaveURL("/");
});

for (const gap of ["beside the label", "beside the button"] as const) {
  test(`empty story space ${gap} opens the photograph destination`, async ({
    page,
  }) => {
    await page.goto("/");
    const card = page
      .getByRole("region", { name: /The people, produce, art and stories/ })
      .getByRole("article")
      .first();
    await card.hover();
    const copy = await card.locator("[data-story-copy]").boundingBox();
    const target =
      gap === "beside the label"
        ? card.locator("[data-story-copy] > p")
        : card.getByRole("link", { name: "Discover Our Story" });
    await target.scrollIntoViewIfNeeded();
    const row = await target.boundingBox();
    expect(copy).not.toBeNull();
    expect(row).not.toBeNull();
    if (!copy || !row) return;
    const point = { x: copy.x + copy.width - 8, y: row.y + row.height / 2 };
    await page.mouse.move(point.x, point.y);
    const cursor = await page.evaluate(({ x, y }) => {
      const hit = document.elementFromPoint(x, y);
      return hit ? getComputedStyle(hit).cursor : null;
    }, point);
    expect(cursor).toBe("pointer");
    await page.mouse.click(point.x, point.y);
    await expect(page).toHaveURL("/our-story");
  });
}

test("story cards follow the shared navbar width on standard and wide screens", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  const cards = page
    .getByRole("region", { name: /The people, produce, art and stories/ })
    .getByRole("article");
  const navigation = page.getByRole("navigation", {
    name: "Main navigation",
    exact: true,
  });
  const widths = isMobile
    ? [page.viewportSize()?.width ?? 390]
    : [1440, 1520, 1920, 2400];
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    await expect(cards).toHaveCount(4);
    const navbar = await navigation.boundingBox();
    const first = await cards.first().boundingBox();
    const last = await cards.last().boundingBox();
    expect(navbar).not.toBeNull();
    expect(first).not.toBeNull();
    expect(last).not.toBeNull();
    if (navbar && first && last) {
      expect(navbar.width).toBeLessThanOrEqual(1440);
      expect(Math.abs(first.x - navbar.x)).toBeLessThan(1);
      expect(
        Math.abs(last.x + last.width - navbar.x - navbar.width),
      ).toBeLessThan(1);
    }
  }
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
