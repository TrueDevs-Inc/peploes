import { expect, test } from "./menu-test";

for (const menu of [
  "lunch",
  "dinner",
  "pre-theatre",
  "group-set-menu",
  "seasonal",
]) {
  test(`${menu} allergens remain visible without a dropdown and centered on desktop`, async ({
    page,
    viewport,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/menus?menu=${menu}`);
    const heading = page.getByRole("heading", {
      name: "Allergen Information",
      exact: true,
    });
    const information = heading.locator("..");
    const description = information.locator("p");
    await expect(description).toBeVisible();
    await heading.click();
    await expect(description).toBeVisible();
    await expect(information.locator("summary")).toHaveCount(0);
    if ((viewport?.width ?? 1440) >= 1280) {
      await expect
        .poll(() =>
          information.evaluate((element) => {
            const panel = element.closest(".site-container");
            const heading = element.querySelector("h3");
            const last = element.querySelector("p");
            if (!panel || !heading || !last) {
              throw new Error("The menu allergen panel is incomplete.");
            }
            const bounds = panel.getBoundingClientRect();
            const top = heading.getBoundingClientRect().top - bounds.top;
            const bottom = bounds.bottom - last.getBoundingClientRect().bottom;
            return Math.abs(top - bottom);
          }),
        )
        .toBeLessThanOrEqual(1);
    }
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

test("sticky menu navigation stays still throughout content switching", async ({
  page,
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });
  await page.goto("/menus?menu=wine");
  const navigation = page.getByRole("navigation", { name: "Restaurant menus" });
  await navigation.evaluate((element) =>
    window.scrollTo({
      top: window.scrollY + element.getBoundingClientRect().top,
      behavior: "instant",
    }),
  );
  const sampling = navigation.evaluate(
    (nav) =>
      new Promise<Array<Record<string, number>>>((resolve) => {
        const samples: Array<Record<string, number>> = [];
        const mainNavigation = document.querySelector(
          'nav[aria-label="Main navigation"]',
        );
        if (!mainNavigation) {
          resolve([]);
          return;
        }
        const start = performance.now();
        let sawExit = false;
        const sample = () => {
          const { x, y, width, height } = nav.getBoundingClientRect();
          const header = mainNavigation.getBoundingClientRect();
          samples.push({
            x,
            y,
            width,
            height,
            headerX: header.x,
            headerY: header.y,
            headerWidth: header.width,
            headerHeight: header.height,
          });
          sawExit ||=
            document.querySelector('[data-menu-content][data-phase="out"]') !==
            null;
          const finished =
            document.querySelector(
              '[data-menu-content][data-menu="dinner"][data-phase="idle"]',
            ) !== null;
          if (sawExit && finished) resolve(samples);
          else if (performance.now() - start >= 6000) resolve([]);
          else requestAnimationFrame(sample);
        };
        sample();
      }),
  );
  await navigation.getByRole("link", { name: "Dinner", exact: true }).click();
  const positions = await sampling;
  expect(positions.length).toBeGreaterThan(2);
  for (const key of Object.keys(positions[0])) {
    const values = positions.map((position) => position[key]);
    expect(Math.max(...values) - Math.min(...values)).toBeLessThanOrEqual(1);
  }
  await expect(page.locator("[data-menu-content]")).toHaveAttribute(
    "data-menu",
    "dinner",
  );
  expect(pageErrors).toEqual([]);
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

test("menu motion reverses from its current position and can be disabled mid-transition", async ({
  page,
}) => {
  await page.goto("/menus?menu=lunch");
  const navigation = page.getByRole("navigation", { name: "Restaurant menus" });
  const content = page.locator("[data-menu-content]");
  await page.evaluate(() => {
    document.addEventListener("animationstart", (event) => {
      if (
        event.target instanceof HTMLElement &&
        event.target.hasAttribute("data-menu-content")
      ) {
        for (const animation of event.target.getAnimations()) animation.pause();
      }
    });
  });
  const finish = () =>
    content.evaluate((element) => {
      for (const animation of element.getAnimations()) animation.finish();
    });
  await navigation.getByRole("link", { name: "Dinner", exact: true }).click();
  await expect(content).toHaveAttribute("data-phase", "out");
  await navigation.getByRole("link", { name: "Lunch", exact: true }).click();
  await expect(content).toHaveAttribute("data-phase", "in");
  await expect(content).not.toHaveAttribute("inert");
  await finish();
  await expect(content).toHaveAttribute("data-phase", "idle");
  await navigation.getByRole("link", { name: "Dinner", exact: true }).click();
  await expect(content).toHaveAttribute("data-phase", "out");
  await finish();
  await expect(content).toHaveAttribute("data-phase", "in");
  const opacity = await content.evaluate(async (element) => {
    for (const animation of element.getAnimations()) {
      await animation.ready;
      animation.currentTime = 110;
    }
    return Number(getComputedStyle(element).opacity);
  });
  await navigation
    .getByRole("link", { name: "Pre-Theatre", exact: true })
    .click();
  await expect(content).toHaveAttribute("data-phase", "out");
  expect(
    await content.evaluate((element) => {
      const effect = element.getAnimations()[0]?.effect;
      return effect instanceof KeyframeEffect
        ? Number(effect.getKeyframes()[0]?.opacity)
        : -1;
    }),
  ).toBeCloseTo(opacity, 4);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(content).toHaveAttribute("data-menu", "pre-theatre");
  await expect(content).toHaveAttribute("data-phase", "idle");
  await expect(content).not.toHaveAttribute("inert");
});

test("menu motion survives interrupted selection and respects reduced motion", async ({
  page,
}) => {
  await page.goto("/menus?menu=lunch");
  const navigation = page.getByRole("navigation", { name: "Restaurant menus" });
  const content = page.locator("[data-menu-content]");
  await page.evaluate(() => {
    document.addEventListener("animationstart", (event) => {
      if (
        event.target instanceof HTMLElement &&
        event.target.matches('[data-menu-content][data-phase="out"]')
      ) {
        for (const animation of event.target.getAnimations()) animation.pause();
      }
    });
  });
  await navigation.getByRole("link", { name: "Dinner", exact: true }).click();
  await expect(content).toHaveAttribute("data-phase", "out");
  await expect(content).toHaveAttribute("inert", "");
  await navigation
    .getByRole("link", { name: "Pre-Theatre", exact: true })
    .click();
  await expect(page).toHaveURL("/menus?menu=pre-theatre");
  await content.evaluate((element) => {
    for (const animation of element.getAnimations()) animation.finish();
  });
  await expect(content).toHaveAttribute("data-menu", "pre-theatre");
  await expect(content).toHaveAttribute("data-phase", "idle");
  await expect(content).not.toHaveAttribute("inert");
  const selected = navigation.getByRole("link", {
    name: "Pre-Theatre",
    exact: true,
  });
  const indicator = navigation.locator("[data-menu-indicator]");
  await expect
    .poll(async () => {
      const tab = await selected.boundingBox();
      const line = await indicator.boundingBox();
      return tab && line
        ? Math.abs(tab.x - line.x) + Math.abs(tab.width - line.width)
        : 100;
    })
    .toBeLessThan(1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await navigation.getByRole("link", { name: "Lunch", exact: true }).click();
  await expect(content).toHaveAttribute("data-menu", "lunch");
  await expect(content).toHaveAttribute("data-phase", "idle");
  await expect(indicator).toHaveCSS("transition-duration", "0s");
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

test("menu navigation keeps its height when switching menus", async ({
  page,
}) => {
  await page.goto("/menus?menu=lunch");
  const navigation = page.getByRole("navigation", { name: "Restaurant menus" });
  const originalHeight = await navigation.evaluate(
    (element) => element.getBoundingClientRect().height,
  );
  for (const name of ["Wine", "Cocktails", "Dinner", "Pre-Theatre", "Lunch"]) {
    await navigation.getByRole("link", { name, exact: true }).click();
    await expect(
      navigation.getByRole("link", { name, exact: true }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      await navigation.evaluate(
        (element) => element.getBoundingClientRect().height,
      ),
    ).toBe(originalHeight);
  }
});

test("mobile navigation leaves the next menu tab half visible", async ({
  page,
  isMobile,
}) => {
  const widths = isMobile
    ? [page.viewportSize()?.width ?? 390]
    : [320, 360, 390, 430, 480, 640, 768, 1024];
  await page.goto("/menus?menu=lunch");
  const navigation = page.getByRole("navigation", { name: "Restaurant menus" });
  const strip = navigation.locator(":scope > div").first();
  // The shared CMS fixture uses identical labels; include the longer live label.
  await navigation
    .getByRole("button")
    .first()
    .evaluate((button) => {
      if (button.firstChild) button.firstChild.textContent = "Group Set Menu";
    });
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    await strip.evaluate((element) => {
      element.scrollLeft = 0;
    });
    const visibleFraction = () =>
      strip.evaluate((element) => {
        const edge = element.getBoundingClientRect().right;
        const clipped = Array.from(element.querySelectorAll("li"))
          .map((tab) => tab.getBoundingClientRect())
          .find((tab) => tab.left < edge && tab.right > edge);
        return clipped ? (edge - clipped.left) / clipped.width : 0;
      });
    if (width < 640) {
      await expect.poll(visibleFraction).toBeCloseTo(0.5, 1);
    } else {
      await expect.poll(visibleFraction).toBeGreaterThan(0);
      await expect.poll(visibleFraction).toBeLessThan(1);
    }
    await expect
      .poll(() =>
        strip.evaluate((element) => {
          return Array.from(
            element.querySelectorAll("li > a, li > button"),
          ).every((control) => {
            const text = control.firstChild;
            if (!text) return false;
            const range = document.createRange();
            range.selectNodeContents(text);
            return (
              range.getClientRects().length === 1 &&
              control.scrollWidth <= control.clientWidth &&
              control.getBoundingClientRect().height === 48
            );
          });
        }),
      )
      .toBe(true);
    await expect(strip).toHaveCSS("background-image", "none");
  }
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/menus?menu=wine");
  const wine = navigation.getByRole("link", { name: "Wine", exact: true });
  await expect(wine).toHaveAttribute("aria-current", "page");
  await expect
    .poll(() =>
      strip.evaluate((element) => {
        const tab = element.querySelector('[aria-current="page"]');
        return tab
          ? element.getBoundingClientRect().right -
              tab.getBoundingClientRect().right
          : -1;
      }),
    )
    .toBeCloseTo(8, 0);
  await strip.evaluate((element) => {
    element.scrollLeft = element.scrollWidth;
  });
  await expect
    .poll(() =>
      strip.evaluate((element) => {
        const edge = element.getBoundingClientRect().left;
        const clipped = Array.from(element.querySelectorAll("li"))
          .map((tab) => tab.getBoundingClientRect())
          .find((tab) => tab.left < edge && tab.right > edge);
        return clipped ? (clipped.right - edge) / clipped.width : 0;
      }),
    )
    .toBeGreaterThan(0);
});

test("CMS group menu retains its banner layout and inclusion heading", async ({
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
    await expect(banner.getByRole("heading")).toHaveCSS("text-align", "left");
    await expect(banner.getByRole("heading")).toHaveCSS("width", "300px");
    await expect(
      page.getByRole("navigation", { name: "Restaurant menus" }),
    ).toHaveCSS("padding-top", "8px");
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
