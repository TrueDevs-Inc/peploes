import { expect, test } from "./menu-test";

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
        "/journal/rooted-in-good-relationships",
        /Rooted in good relationships/,
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
    await expect(card.locator("[data-story-copy]")).toHaveCSS("opacity", "1");
  }
});
