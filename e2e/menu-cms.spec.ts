import { expect, test } from "./menu-test";

for (const menu of [
  "lunch",
  "dinner",
  "pre-theatre",
  "group-set-menu",
  "seasonal",
]) {
  test(`${menu} allergen information stays visible without disclosure controls`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/menus?menu=${menu}`);
    const heading = page.getByRole("heading", {
      name: "Allergen Information",
      exact: true,
    });
    const information = heading.locator("..");
    await expect(heading).toBeVisible();
    await expect(information.locator("p")).toBeVisible();
    await expect(information.locator("summary, button")).toHaveCount(0);
  });
}
test("switching from deep Wine content keeps menu navigation visible", async ({
  page,
}) => {
  await page.goto("/menus?menu=wine");
  const navigation = page.getByRole("navigation", { name: "Restaurant menus" });
  await page.locator("main").evaluate((element) =>
    window.scrollTo({
      top: scrollY + element.getBoundingClientRect().bottom - innerHeight,
      behavior: "instant",
    }),
  );
  await navigation.getByRole("link", { name: "Dinner", exact: true }).click();
  await expect(page.locator("[data-menu-content]")).toHaveAttribute(
    "data-menu",
    "dinner",
  );
  await expect(page.locator("[data-menu-content]")).toHaveAttribute(
    "data-phase",
    "idle",
  );
  await expect(navigation).toBeInViewport();
  const bounds = await navigation.boundingBox();
  expect(bounds?.y).toBeGreaterThanOrEqual(0);
});

test("menu introduction recovers the same CMS image when optimization fails", async ({
  page,
}) => {
  await page.route("**/_next/image?**", async (route) => {
    if (
      decodeURIComponent(route.request().url()).includes(
        "peploes-menu-wine-bottles.webp",
      )
    ) {
      await route.fulfill({ status: 503, body: "Image optimizer unavailable" });
    } else await route.fallback();
  });
  await page.route(
    "https://cdn.sanity.io/images/testproject/development/peploes-menu-wine-bottles.webp",
    async (route) => {
      await route.fulfill({
        path: "public/peploes-menu-wine-bottles.webp",
        contentType: "image/webp",
      });
    },
  );
  await page.goto("/menus?menu=wine");
  const image = page.getByRole("img", { name: /A selection of wines/ });
  await expect
    .poll(() =>
      image.evaluate((element) =>
        element instanceof HTMLImageElement ? element.naturalWidth : 0,
      ),
    )
    .toBeGreaterThan(0);
  await expect(image).toHaveAttribute(
    "src",
    "https://cdn.sanity.io/images/testproject/development/peploes-menu-wine-bottles.webp",
  );
});

test("selecting a visible menu keeps the tab strip still", async ({ page }) => {
  await page.goto("/menus?menu=lunch");
  const navigation = page.getByRole("navigation", { name: "Restaurant menus" });
  const strip = navigation.locator(":scope > div").first();
  const dinner = navigation.getByRole("link", { name: "Dinner", exact: true });
  const before = await strip.evaluate((element) => element.scrollLeft);
  const tabBounds = await dinner.boundingBox();
  await dinner.click();
  await expect(page).toHaveURL("/menus?menu=dinner");
  await expect(page.locator("[data-menu-content]")).toHaveAttribute(
    "data-menu",
    "dinner",
  );
  await expect(page.locator("[data-menu-content]")).toHaveAttribute(
    "data-phase",
    "idle",
  );
  expect(await strip.evaluate((element) => element.scrollLeft)).toBeCloseTo(
    before,
    0,
  );
  expect((await dinner.boundingBox())?.x).toBeCloseTo(tabBounds?.x ?? -1, 0);
  await page.goBack();
  await expect(page).toHaveURL("/menus?menu=lunch");
  await expect(page.locator("[data-menu-content]")).toHaveAttribute(
    "data-phase",
    "idle",
  );
  expect(await strip.evaluate((element) => element.scrollLeft)).toBeCloseTo(
    before,
    0,
  );
  if (
    await strip.evaluate((element) => element.scrollWidth > element.clientWidth)
  ) {
    await strip.evaluate((element) => {
      const tab = element.querySelector(
        '[data-menu-path="/menus?menu=dinner"]',
      );
      if (tab)
        element.scrollLeft +=
          tab.getBoundingClientRect().left -
          element.getBoundingClientRect().left -
          4;
    });
    const scrolled = await strip.evaluate((element) => element.scrollLeft);
    await dinner.click();
    await expect(page.locator("[data-menu-content]")).toHaveAttribute(
      "data-menu",
      "dinner",
    );
    await expect(page.locator("[data-menu-content]")).toHaveAttribute(
      "data-phase",
      "idle",
    );
    expect(await strip.evaluate((element) => element.scrollLeft)).toBeCloseTo(
      scrolled,
      0,
    );
  }
});

test("old menu links redirect and query defaults keep matching metadata", async ({
  page,
  request,
}) => {
  for (const slug of [
    "lunch",
    "dinner",
    "pre-theatre",
    "wine",
    "cocktails",
    "group-set-menu",
    "seasonal",
  ]) {
    const response = await request.get(`/menus/${slug}`, { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toBe(`/menus?menu=${slug}`);
  }
  for (const path of [
    "/menus",
    "/menus?menu=invalid",
    "/menus?menu=wine&menu=dinner",
  ]) {
    await page.goto(path);
    await expect(page.locator("[data-menu-content]")).toHaveAttribute(
      "data-menu",
      "lunch",
    );
    await expect(
      page
        .getByRole("navigation", { name: "Restaurant menus" })
        .getByRole("link", { name: "Lunch", exact: true }),
    ).toHaveAttribute("aria-current", "page");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /\/menus\?menu=lunch$/,
    );
  }
});

for (const [index, slug, title] of [
  [0, "group-set-menu", "Group Set Menu"],
  [1, "seasonal", "Seasonal Menus"],
] as const) {
  test(`${slug} dropdown renders only the selected menu below the introduction`, async ({
    page,
  }) => {
    await page.goto("/menus?menu=wine");
    await expect(page.locator("[data-menu-content]")).toBeVisible();
    const navigation = page.getByRole("navigation", {
      name: "Restaurant menus",
    });
    const trigger = navigation.getByRole("button").nth(index);
    await trigger.click();
    await navigation.locator("#menu-subnavigation a").first().click();
    await expect(page.locator("[data-menu-content]")).toHaveAttribute(
      "data-menu",
      slug,
    );
    await expect(page.locator("[data-menu-content]")).toHaveAttribute(
      "data-phase",
      "idle",
    );
    const introduction = page.getByRole("heading", {
      level: 1,
      name: title,
      exact: true,
    });
    const firstId =
      slug === "group-set-menu" ? "group-set-lunch" : "set-christmas-lunch";
    async function expectIntroduction() {
      await expect(page).toHaveURL(`/menus?menu=${slug}#${slug}-introduction`);
      await expect(navigation.locator("#menu-subnavigation")).toHaveCount(0);
      // The transition's hash scroll starts after the content becomes idle.
      await page.evaluate(
        () =>
          new Promise<void>((resolve) => {
            let previous = scrollY;
            let stillFrames = 0;
            function sample() {
              stillFrames = scrollY === previous ? stillFrames + 1 : 0;
              previous = scrollY;
              if (stillFrames === 10) resolve();
              else requestAnimationFrame(sample);
            }
            requestAnimationFrame(sample);
          }),
      );
      await expect(introduction).toBeInViewport();
      await expect
        .poll(async () => {
          const heading = await introduction.boundingBox();
          const tabs = await navigation.boundingBox();
          return Boolean(heading && tabs && heading.y >= tabs.y + tabs.height);
        })
        .toBe(true);
    }
    await expectIntroduction();
    await expect(page.locator(`#${firstId}-title`)).toHaveCount(1);

    await trigger.click();
    const laterItem = navigation.locator("#menu-subnavigation a").last();
    const laterId =
      slug === "group-set-menu" ? "group-set-dinner" : "set-christmas-dinner";
    const laterSection = page.locator(`#${laterId}`);
    await expect(page.locator(`#${laterId}-title`)).toHaveCount(0);
    await laterItem.click();
    await expect(page).toHaveURL(`/menus?menu=${slug}#${laterId}`);
    await expect(laterSection).toBeInViewport();
    await expect(introduction).toBeInViewport();
    await expect(page.locator(`#${laterId}-title`)).toHaveCount(1);
    await expect(page.locator(`#${firstId}-title`)).toHaveCount(0);
    await navigation.getByRole("link", { name: "Wine", exact: true }).click();
    await expect(page.locator("[data-menu-content]")).toHaveAttribute(
      "data-menu",
      "wine",
    );
    await page.goBack();
    await expect(page).toHaveURL(`/menus?menu=${slug}#${laterId}`);
    await expect(page.locator("[data-menu-content]")).toHaveAttribute(
      "data-menu",
      slug,
    );
    await expect(page.locator(`#${laterId}-title`)).toHaveCount(1);
    await trigger.click();
    await navigation.locator("#menu-subnavigation a").first().click();
    await expectIntroduction();
    await expect(page.locator(`#${firstId}-title`)).toHaveCount(1);
    await expect(page.locator(`#${laterId}-title`)).toHaveCount(0);

    await page.goBack();
    await expect(page).toHaveURL(`/menus?menu=${slug}#${laterId}`);
    await expect(laterSection).toBeInViewport();
    await page.goForward();
    await expectIntroduction();

    for (const reducedMotion of ["no-preference", "reduce"] as const) {
      await page.emulateMedia({ reducedMotion });
      await expectIntroduction();
      await page
        .getByRole("navigation", { name: `${title} sections` })
        .evaluate((element) => element.scrollIntoView({ behavior: "instant" }));
      await expect(introduction).not.toBeInViewport();
      await trigger.click();
      await navigation.locator("#menu-subnavigation a").first().click();
      await expectIntroduction();
    }
  });

  test(`${slug} bottom card switches menus and retains the selection through refresh and history`, async ({
    page,
  }) => {
    const firstId =
      slug === "group-set-menu" ? "group-set-lunch" : "set-christmas-lunch";
    const laterId =
      slug === "group-set-menu" ? "group-set-dinner" : "set-christmas-dinner";
    await page.goto(`/menus?menu=${slug}#${laterId}`);
    const origin = await page.evaluate(() => performance.timeOrigin);
    const cards = page.getByRole("navigation", { name: `${title} sections` });
    const selected = page.locator(
      `section[aria-labelledby="${laterId}-title"]`,
    );
    await expect(selected).toBeVisible();
    await expect(page.locator(`#${firstId}-title`)).toHaveCount(0);
    await expect(cards.getByRole("link")).toHaveCount(1);
    const card = cards.getByRole("link");
    await expect(card).toHaveAttribute("href", `#${firstId}`);
    await card.scrollIntoViewIfNeeded();
    const contentBounds = await selected.boundingBox();
    const cardBounds = await card.boundingBox();
    expect(contentBounds).not.toBeNull();
    expect(cardBounds).not.toBeNull();
    if (contentBounds && cardBounds) {
      expect(cardBounds.y).toBeGreaterThanOrEqual(
        contentBounds.y + contentBounds.height,
      );
    }

    await card.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(`/menus?menu=${slug}#${firstId}`);
    await expect(page.locator(`#${firstId}-title`)).toHaveCount(1);
    await expect(page.locator(`#${firstId}-title`)).toBeFocused();
    await expect(page.locator(`#${laterId}-title`)).toHaveCount(0);
    await expect(cards.getByRole("link")).toHaveAttribute(
      "href",
      `#${laterId}`,
    );
    await expect(
      page.getByRole("heading", { level: 1, name: title }),
    ).toBeInViewport();
    expect(await page.evaluate(() => performance.timeOrigin)).toBe(origin);

    await page.reload();
    await expect(page.locator(`#${firstId}-title`)).toHaveCount(1);
    await expect(page.locator(`#${laterId}-title`)).toHaveCount(0);
    await page.goBack();
    await expect(page).toHaveURL(`/menus?menu=${slug}#${laterId}`);
    await expect(page.locator(`#${laterId}-title`)).toHaveCount(1);
    await expect(page.locator(`#${firstId}-title`)).toHaveCount(0);
    await page.goForward();
    await expect(page.locator(`#${firstId}-title`)).toHaveCount(1);
    await expect(page.locator(`#${laterId}-title`)).toHaveCount(0);
  });

  test(`${slug} course anchors select their owning menu on direct load and refresh`, async ({
    page,
  }) => {
    const firstId =
      slug === "group-set-menu" ? "group-set-lunch" : "set-christmas-lunch";
    const laterId =
      slug === "group-set-menu" ? "group-set-dinner" : "set-christmas-dinner";
    await page.goto(`/menus?menu=${slug}#${laterId}-starters`);
    await expect(page.locator(`#${laterId}-title`)).toHaveCount(1);
    await expect(page.locator(`#${firstId}-title`)).toHaveCount(0);
    await expect(page.locator(`#${laterId}-starters`)).toBeInViewport();
    await page.reload();
    await expect(page.locator(`#${laterId}-title`)).toHaveCount(1);
    await expect(page.locator(`#${firstId}-title`)).toHaveCount(0);
    await expect(page.locator(`#${laterId}-starters`)).toBeInViewport();
  });
}

test("collection selections retain their section anchor after switching", async ({
  page,
}) => {
  await page.goto("/menus?menu=lunch");
  const navigation = page.getByRole("navigation", { name: "Restaurant menus" });
  await navigation.getByRole("button").first().click();
  await navigation.locator("#menu-subnavigation a").last().click();
  await expect(page).toHaveURL("/menus?menu=group-set-menu#group-set-dinner");
  await expect(page.locator("[data-menu-content]")).toHaveAttribute(
    "data-phase",
    "idle",
  );
  await expect(page.locator("#group-set-dinner")).toBeInViewport();
  await page.goto("/menus/group-set-menu#group-set-dinner");
  await expect(page).toHaveURL("/menus?menu=group-set-menu#group-set-dinner");
  await expect(page.locator("#group-set-dinner")).toBeInViewport();
});

test("menu tabs switch inside one query-addressed page", async ({ page }) => {
  await page.goto("/menus?menu=lunch");
  await expect(page).toHaveURL("/menus?menu=lunch");
  const navigation = page.getByRole("navigation", { name: "Restaurant menus" });
  const hero = page.locator("#menus-hero-heading");
  await hero.evaluate((node) => node.setAttribute("data-preserved", "true"));
  const origin = await page.evaluate(() => performance.timeOrigin);
  await navigation.getByRole("link", { name: "Dinner", exact: true }).click();
  await expect(page).toHaveURL("/menus?menu=dinner");
  await expect(
    page.getByRole("heading", { name: "Dinner Menu", exact: true }),
  ).toBeVisible();
  await expect(hero).toHaveAttribute("data-preserved", "true");
  expect(await page.evaluate(() => performance.timeOrigin)).toBe(origin);
  await page.goBack();
  await expect(page).toHaveURL("/menus?menu=lunch");
  await expect(
    page.getByRole("heading", { name: "Lunch Menu", exact: true }),
  ).toBeVisible();
  await page.goForward();
  await expect(page).toHaveURL("/menus?menu=dinner");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Dinner Menu", exact: true }),
  ).toBeVisible();
});

test("CMS group menu retains its enquiry destination and inclusion heading", async ({
  page,
  isMobile,
}) => {
  await page.goto("/menus?menu=group-set-menu");
  const banner = page.getByRole("region", { name: "Bring everyone together." });
  await banner.scrollIntoViewIfNeeded();
  await expect(
    banner.getByRole("link", { name: "Enquire About a Group Booking" }),
  ).toHaveAttribute("href", "/private-dining#enquire");
  if (!isMobile) {
    await expect(
      page.getByText("Included with your menu", { exact: true }).first(),
    ).toBeVisible();
  }
  for (const image of await page.getByRole("main").getByRole("img").all()) {
    await image.scrollIntoViewIfNeeded();
    await expect(image).toHaveJSProperty("complete", true);
    await expect
      .poll(() =>
        image.evaluate((element) =>
          element instanceof HTMLImageElement ? element.naturalWidth : 0,
        ),
      )
      .toBeGreaterThan(0);
  }
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
});

test("identically labeled collections open their own links and restore focus on Escape", async ({
  page,
}) => {
  await page.goto("/menus?menu=lunch");
  const navigation = page.getByRole("navigation", { name: "Restaurant menus" });
  const triggers = navigation.getByRole("button", {
    name: "Special menus",
    exact: true,
  });
  await expect(triggers).toHaveCount(2);

  const destinations = [
    [
      "/menus?menu=group-set-menu#group-set-menu-introduction",
      "/menus?menu=group-set-menu#group-set-dinner",
    ],
    [
      "/menus?menu=seasonal#seasonal-introduction",
      "/menus?menu=seasonal#set-christmas-dinner",
    ],
  ];
  for (const [index, hrefs] of destinations.entries()) {
    const trigger = triggers.nth(index);
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(triggers.nth(1 - index)).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    const dropdown = navigation.getByRole("list", { name: "Special menus" });
    const links = dropdown.getByRole("link");
    await expect(links).toHaveCount(hrefs.length);
    for (const [linkIndex, href] of hrefs.entries()) {
      await expect(links.nth(linkIndex)).toHaveAttribute("href", href);
    }
    await links.first().focus();
    await page.keyboard.press("Escape");
    await expect(dropdown).toHaveCount(0);
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger).toBeFocused();
  }
});

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test(`menu selection reaches the latest destination with ${reducedMotion} motion`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion });
    await page.goto("/menus?menu=lunch");
    const navigation = page.getByRole("navigation", {
      name: "Restaurant menus",
    });
    await navigation.getByRole("link", { name: "Dinner", exact: true }).click();
    const latest = navigation.getByRole("link", {
      name: "Pre-Theatre",
      exact: true,
    });
    await latest.click();
    await expect(page).toHaveURL("/menus?menu=pre-theatre");
    await expect(latest).toHaveAttribute("aria-current", "page");
    await expect(
      page.getByRole("heading", { name: "Pre-Theatre Menu", exact: true }),
    ).toBeVisible();
    await navigation.getByRole("link", { name: "Lunch", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Lunch Menu", exact: true }),
    ).toBeVisible();
  });
}
