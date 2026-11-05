import { expect, test } from "./menu-test";

test("the mobile building heading puts Dublin on the first of two lines", async ({
  page,
}) => {
  for (const width of [320, 360, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/our-story");
    const heading = page.locator("#story-building");
    await expect(heading).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const layout = await heading.evaluate((element) => {
      const span = element.querySelector("span");
      const text = span?.firstChild;
      if (!text) throw new Error("Building heading is missing");
      const word = document.createRange();
      word.setStart(text, 14);
      word.setEnd(text, 20);
      const start = document.createRange();
      start.setStart(text, 0);
      start.setEnd(text, 4);
      return {
        firstTop: start.getBoundingClientRect().top,
        dublinTop: word.getBoundingClientRect().top,
        height: element.getBoundingClientRect().height,
        lineHeight: Number.parseFloat(getComputedStyle(element).lineHeight),
        overflow: element.scrollWidth > element.clientWidth,
      };
    });
    expect(layout.dublinTop).toBeCloseTo(layout.firstTop, 0);
    expect(layout.height).toBeCloseTo(layout.lineHeight * 2, 0);
    expect(layout.overflow).toBe(false);
  }
});

test("timeline headings stay on one line with equal paragraph gaps", async ({
  page,
  isMobile,
}) => {
  const widths = isMobile
    ? [page.viewportSize()?.width ?? 390]
    : [640, 768, 1024, 1100, 1280, 1440];
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/our-story");
    await page.evaluate(() => document.fonts.ready);
    const timeline = page.getByRole("list", {
      name: "Peploe’s through the years",
    });
    const measurements = await timeline.locator("li").evaluateAll((cards) =>
      cards.map((card) => {
        const heading = card.querySelector("h3");
        const paragraph = heading?.nextElementSibling;
        if (!heading || !paragraph) throw new Error("Timeline copy is missing");
        const text = document.createRange();
        text.selectNodeContents(heading);
        return {
          gap:
            paragraph.getBoundingClientRect().top -
            text.getBoundingClientRect().bottom,
          headingHeight: heading.clientHeight,
          lineHeight: Number.parseFloat(getComputedStyle(heading).lineHeight),
          textWidth: text.getBoundingClientRect().width,
          availableWidth: heading.clientWidth,
        };
      }),
    );
    expect(measurements).toHaveLength(3);
    const gaps = measurements.map(({ gap }) => gap);
    expect(Math.max(...gaps) - Math.min(...gaps)).toBeLessThan(1);
    for (const measurement of measurements) {
      expect(measurement.headingHeight).toBe(measurement.lineHeight);
      expect(measurement.textWidth).toBeLessThanOrEqual(
        measurement.availableWidth + 1,
      );
    }
  }
});

test("Our Story loads its photographs without stretching or horizontal overflow", async ({
  page,
}) => {
  await page.goto("/our-story");
  const main = page.getByRole("main");
  await expect(
    main.getByRole("heading", {
      name: /A family restaurant,\s+more than two decades on\./,
      level: 1,
    }),
  ).toBeVisible();

  const photographs = main.getByRole("img");
  await expect(photographs).toHaveCount(7);
  for (const photograph of await photographs.all()) {
    await photograph.scrollIntoViewIfNeeded();
    await expect(photograph).toBeVisible();
    await expect(photograph).toHaveJSProperty("complete", true);
    await expect(photograph).not.toHaveJSProperty("naturalWidth", 0);
    await expect(photograph).toHaveCSS("object-fit", /^(cover|contain)$/);
  }
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    )
    .toBe(true);
});

test("archive copy and photograph stay separate at responsive widths", async ({
  page,
  isMobile,
}) => {
  const widths = isMobile
    ? [page.viewportSize()?.width ?? 390]
    : [1024, 1100, 1279, 1280, 1440, 2400];

  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/our-story");
    const archive = page.getByRole("region", {
      name: /Moments, menus\s+and memories\./,
    });
    const photograph = archive.getByRole("img");
    await photograph.scrollIntoViewIfNeeded();
    await expect(photograph).toBeVisible();
    await page.evaluate(() => document.fonts.ready);

    const image = await photograph.evaluate((element) =>
      element.getBoundingClientRect().toJSON(),
    );
    const copy = await archive
      .locator("p, h2, a, button")
      .evaluateAll((elements) =>
        elements.map((element) => ({
          text: element.textContent,
          bounds: element.getBoundingClientRect().toJSON(),
        })),
      );
    expect(copy.length).toBeGreaterThan(0);
    for (const { text, bounds } of copy) {
      expect(
        bounds.right <= image.left ||
          bounds.left >= image.right ||
          bounds.bottom <= image.top ||
          bounds.top >= image.bottom,
        `Archive copy box "${text}" overlaps its photograph at ${width}px`,
      ).toBe(true);
    }
  }
});

test("the home family story card opens Our Story", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("link", { name: "Discover Our Story", exact: true })
    .focus();
  await page
    .getByRole("main")
    .getByRole("link", { name: "Discover Our Story", exact: true })
    .click();

  await expect(page).toHaveURL("/our-story");
  await expect(
    page.getByRole("heading", {
      name: /A family restaurant,\s+more than two decades on\./,
      level: 1,
    }),
  ).toBeVisible();
});

test("Our Story navigation closes the mobile menu and shows its desktop active state", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  const navigation = page.getByRole("navigation", {
    name: "Main navigation",
    exact: true,
  });

  if (isMobile) {
    const toggle = navigation.getByRole("button", { name: "Open menu" });
    await toggle.click();
    const menu = page.getByRole("dialog", { name: "Navigation menu" });
    await menu.getByRole("link", { name: "Our Story", exact: true }).click();
    await expect(page).toHaveURL("/our-story");
    await expect(menu).not.toBeVisible();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  } else {
    const story = navigation.getByRole("link", {
      name: "Our Story",
      exact: true,
    });
    await story.click();
    await page.mouse.move(0, 0);
    await expect(page).toHaveURL("/our-story");
    await expect(story).toHaveAttribute("aria-current", "page");
    await expect(story).toHaveCSS("color", "rgb(122, 30, 36)");
    const indicator = navigation.locator("[data-navbar-indicator]");
    await expect(indicator).toHaveCSS("opacity", "1");
    const storyBounds = await story.boundingBox();
    expect(storyBounds).not.toBeNull();
    await expect
      .poll(() => indicator.boundingBox())
      .toMatchObject({
        x: storyBounds?.x,
        width: storyBounds?.width,
      });

    await navigation.getByRole("link", { name: "Peploe’s home" }).click();
    await page.mouse.move(0, 0);
    await expect(page).toHaveURL("/");
    await expect(story).not.toHaveAttribute("aria-current", "page");
    await expect(story).toHaveCSS("color", "rgb(46, 42, 40)");
  }
});

test("the footer reaches Our Story and Our Location reaches Visit & Contact", async ({
  page,
}) => {
  await page.goto("/contact");
  await page
    .getByRole("contentinfo")
    .getByRole("link", { name: "Our Story", exact: true })
    .click();
  await expect(page).toHaveURL("/our-story");

  const location = page
    .getByRole("main")
    .getByRole("link", { name: "Our Location", exact: true });
  await expect(location).toHaveAttribute("href", "/contact#find-us");
  await location.click();
  await expect(page).toHaveURL("/contact#find-us");
  await expect(page.locator("#find-us")).toBeInViewport();
});

for (const [name, href, heading] of [
  [
    "Discover the Mural Story",
    "/journal/the-art-of-peploes",
    /The art of Peploe.s/,
  ],
  ["Explore the Archive", "/journal?category=family-history", /The Journal/],
] as const) {
  test(`Our Story ${name} opens its Journal destination by keyboard`, async ({
    page,
  }) => {
    await page.goto("/our-story");
    const action = page
      .getByRole("main")
      .getByRole("link", { name, exact: true });
    await expect(action).toHaveAttribute("href", href);
    await action.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(href);
    const main = page.getByRole("main");
    await expect(main).toBeVisible();
    await expect(main.getByRole("heading", { level: 1 })).toHaveText(heading);
  });
}

test("Our Story Book a Table opens reservations by keyboard", async ({
  page,
}) => {
  await page.goto("/our-story");
  const action = page
    .getByRole("main")
    .getByRole("link", { name: "Book a Table", exact: true });
  await expect(action).toHaveAttribute("href", "/book-a-table");
  await action.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/book-a-table");
  await expect(
    page.getByRole("region", { name: "Table reservations" }),
  ).toBeVisible();
});
