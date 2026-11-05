import { expect, test } from "./menu-test";

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
    await navigation.getByRole("link", { name: "Peploe’s home" }).click();
    await page.mouse.move(0, 0);
    await expect(page).toHaveURL("/");
    await expect(story).not.toHaveAttribute("aria-current", "page");
  }
});

test("the footer reaches Our Story and Our Location reaches Visit & Contact", async ({
  page,
}) => {
  await page.goto("/visit-contact");
  await page
    .getByRole("contentinfo")
    .getByRole("link", { name: "Our Story", exact: true })
    .click();
  await expect(page).toHaveURL("/our-story");

  const location = page
    .getByRole("main")
    .getByRole("link", { name: "Our Location", exact: true });
  await expect(location).toHaveAttribute("href", "/visit-contact#find-us");
  await location.click();
  await expect(page).toHaveURL("/visit-contact#find-us");
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

test("the unbuilt Book a Table action remains a clearly marked placeholder", async ({
  page,
}) => {
  await page.goto("/our-story");
  const action = page
    .getByRole("main")
    .getByRole("button", { name: "Book a Table", exact: true });
  await expect(action).toHaveAttribute("type", "button");
  await expect(action).toHaveAttribute("aria-disabled", "true");
  await action.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/our-story");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
