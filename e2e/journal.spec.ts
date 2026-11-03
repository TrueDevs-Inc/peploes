import type { Locator } from "@playwright/test";
import { journalPageFixture } from "./journal-fixtures";
import { expect, test } from "./menu-test";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

async function revealOnScroll(content: Locator) {
  await expect(content).toHaveAttribute(
    "data-scroll-reveal-state",
    /pending|visible/,
  );
  if ((await content.getAttribute("data-scroll-reveal-state")) === "pending") {
    await expect(content).toHaveCSS("opacity", "0");
    await expect(content).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 24)");
    await content.evaluate((element) =>
      window.scrollTo({
        top: scrollY + element.getBoundingClientRect().top - innerHeight * 0.55,
        behavior: "instant",
      }),
    );
  }
  await expect(content).toHaveCSS("transition-duration", "0.35s, 0.35s");
  await expect(content).toHaveCSS("opacity", "1");
  await expect(content).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
}

test("Journal controls and filtered stories retain the site's scroll reveal", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/journal");
  const categories = page.getByRole("navigation", {
    name: "Explore the Journal",
  });
  await revealOnScroll(categories.locator(":scope > div"));
  await categories.evaluate((element) =>
    window.scrollTo({
      top: scrollY + element.getBoundingClientRect().top - innerHeight + 200,
      behavior: "instant",
    }),
  );
  await categories
    .getByRole("link", { name: "Food & Wine", exact: true })
    .click();
  await expect(page.locator("#journal-story-list > li")).toHaveCount(2);
  await categories
    .getByRole("link", { name: "All stories", exact: true })
    .click();
  const cards = page.locator("#journal-story-list > li");
  await expect(cards).toHaveCount(6);
  await expect(cards.last()).toHaveCSS("opacity", "0");
  await revealOnScroll(cards.last());
  const loadMore = page.getByRole("button", {
    name: journalPageFixture.listing.loadMoreAction,
    exact: true,
  });
  await revealOnScroll(loadMore.locator(".."));
  await loadMore.click();
  await expect(cards).toHaveCount(9);
  await expect(cards.nth(6).getByRole("link").first()).toBeFocused();
  await expect(cards.nth(6)).toHaveCSS("opacity", "1");
  await revealOnScroll(cards.last());
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("main [data-scroll-reveal-state]")).toHaveCount(0);
  await expect(categories.locator(":scope > div")).toHaveCSS("opacity", "1");
  await expect(cards.last()).toHaveCSS("opacity", "1");
});

test("Journal article photographs, body blocks and related stories share scroll reveal", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/journal/rooted-in-good-relationships");
  const article = page.getByRole("article", {
    name: "Rooted in good relationships.",
    exact: true,
  });
  await revealOnScroll(article.locator("header img").locator(".."));
  const articleGroups = article.locator("[data-scroll-reveal]");
  await expect(articleGroups).toHaveCount(9);
  for (const block of await articleGroups.all()) await revealOnScroll(block);
  const related = page.getByRole("region", {
    name: "More from People & Produce",
    exact: true,
  });
  const relatedGroups = related.locator("[data-scroll-reveal]");
  await expect(relatedGroups).toHaveCount(4);
  for (const group of await relatedGroups.all()) await revealOnScroll(group);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("main [data-scroll-reveal-state]")).toHaveCount(0);
  await expect(article.locator("header img").locator("..")).toHaveCSS(
    "opacity",
    "1",
  );
});

test("category selection moves one underline and reveals the latest stories smoothly", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/journal?utm_source=fixture#journal-stories");
  const categories = page.getByRole("navigation", {
    name: "Explore the Journal",
  });
  const indicator = categories.locator("[data-journal-indicator]");
  const results = page.locator("[data-journal-results]");
  await expect(indicator).toBeVisible();
  await expect(results).toHaveCSS("animation-name", "none");
  await expect(results).toHaveCSS("opacity", "1");
  await expect(indicator).toHaveCSS("transition-duration", "0.26s");

  // Freeze the rendered animation deterministically instead of racing its duration.
  await page.addStyleTag({
    content:
      "[data-journal-results] { animation-play-state: paused !important; }",
  });
  await indicator.evaluate((element) => {
    const observer = new MutationObserver(() => {
      for (const animation of element.getAnimations()) animation.pause();
    });
    observer.observe(element, { attributes: true, attributeFilter: ["style"] });
  });
  await categories
    .getByRole("link", { name: "Food & Wine", exact: true })
    .click();
  await expect(page).toHaveURL(
    "/journal?utm_source=fixture&category=food-wine#journal-stories",
  );
  await expect(results.getByRole("article")).toHaveCount(2);
  await expect(results).toHaveCSS("animation-duration", "0.22s");
  const motion = await results.evaluate((element) => {
    const animation = element.getAnimations()[0];
    animation.currentTime = 110;
    return getComputedStyle(element).opacity;
  });
  expect(Number(motion)).toBeGreaterThan(0);
  expect(Number(motion)).toBeLessThan(1);
  const underlineMotion = await indicator.evaluate((element) => {
    const animation = element.getAnimations()[0];
    animation.currentTime = 0;
    const start = getComputedStyle(element).transform;
    animation.currentTime = 130;
    const middle = getComputedStyle(element).transform;
    animation.finish();
    return { start, middle, end: getComputedStyle(element).transform };
  });
  expect(underlineMotion.middle).not.toBe(underlineMotion.start);
  expect(underlineMotion.middle).not.toBe(underlineMotion.end);
  await categories
    .getByRole("link", { name: "Food & Wine", exact: true })
    .click();
  expect(
    await results.evaluate((element) => element.getAnimations()[0].currentTime),
  ).toBe(110);

  await categories
    .getByRole("link", { name: "People & Produce", exact: true })
    .click();
  await categories
    .getByRole("link", { name: "Food & Wine", exact: true })
    .click();
  await expect(results.getByRole("article")).toHaveCount(2);
  await page.goBack();
  await expect(results.getByRole("article")).toHaveCount(4);
  await page.goForward();
  await expect(results.getByRole("article")).toHaveCount(2);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(results).toHaveCSS("animation-name", "none");
  await expect(results).toHaveCSS("opacity", "1");
  await expect(indicator).toHaveCSS("transition-duration", "0s");
  const active = categories.locator('[aria-current="page"]');
  await expect
    .poll(async () => {
      const line = await indicator.boundingBox();
      const link = await active.boundingBox();
      return line && link
        ? Math.abs(line.x - link.x) + Math.abs(line.width - link.width)
        : Infinity;
    })
    .toBeLessThan(1);
  await expect(active).toBeInViewport({ ratio: 1 });

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await categories
    .getByRole("link", { name: "All stories", exact: true })
    .click();
  await expect(
    categories.getByRole("link", { name: "All stories", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(results.getByRole("article")).toHaveCount(6);
  await expect(results).toHaveCSS("animation-duration", "0.22s");
  await expect
    .poll(() => results.evaluate((element) => element.getAnimations().length))
    .toBe(1);
  await results.evaluate((element) => element.getAnimations()[0].finish());
  await page
    .getByRole("button", {
      name: journalPageFixture.listing.loadMoreAction,
      exact: true,
    })
    .click();
  await expect(results.getByRole("article")).toHaveCount(9);
  await expect(results.locator("li").nth(6)).toHaveAttribute(
    "data-scroll-reveal",
    "true",
  );
  await expect(
    results.locator("li").nth(6).getByRole("link").first(),
  ).toBeFocused();
  expect(
    await results.evaluate((element) => element.getAnimations()[0].playState),
  ).toBe("finished");
});

test("the featured photograph zooms within its frame on hover and keyboard focus, respecting reduced motion", async ({
  page,
  isMobile,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/journal");
  const featured = page.getByRole("region", {
    name: "Some things have changed. The things that matter haven’t.",
  });
  const image = featured.getByRole("img");
  const photograph = featured
    .getByRole("link")
    .filter({ has: page.getByRole("img") });
  const action = featured.getByRole("link", { name: /^Read the story\s*:/ });
  await photograph.scrollIntoViewIfNeeded();
  await expect(photograph).toHaveCSS("opacity", "1");
  const frame = await photograph.boundingBox();
  await featured.getByRole("link", { name: "From Gina", exact: true }).focus();
  await page.keyboard.press("Shift+Tab");
  await expect(photograph).toBeFocused();
  await expect(image).toHaveCSS("transform", "matrix(1.05, 0, 0, 1.05, 0, 0)");
  await expect(image).toHaveCSS("transition-duration", "0.3s");
  await expect(photograph).toHaveCSS("overflow", "hidden");
  await expect(photograph).toHaveCSS("outline-style", "solid");
  // Keyboard navigation can scroll the page without changing the image frame.
  expect(await photograph.boundingBox()).toEqual({
    ...frame,
    y: expect.any(Number),
  });
  await action.focus();
  await expect(image).toHaveCSS("transform", "none");
  if (!isMobile) {
    await photograph.hover();
    await expect(image).toHaveCSS(
      "transform",
      "matrix(1.05, 0, 0, 1.05, 0, 0)",
    );
    expect(await photograph.boundingBox()).toEqual({
      ...frame,
      y: expect.any(Number),
    });
  } else {
    await photograph.focus();
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(image).toHaveCSS("transform", "none");
  await expect(image).toHaveCSS("transition-duration", "0s");
  await expect(photograph).toHaveAttribute(
    "href",
    (await action.getAttribute("href")) ?? "",
  );
});

test("the Journal opens the featured story and keeps the six reference cards ahead of newer stories", async ({
  page,
}) => {
  await page.goto("/journal");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "The Journal",
  );
  const main = page.getByRole("main");
  for (const text of [
    "Stories from St Stephen’s Green",
    "Food, wine, people, produce, art and the life of the restaurant.",
    "Seasonal menus, special evenings, wine dinners and occasions throughout the year, all in the heart of St Stephen’s Green.",
    "Stories from St Stephen’s Green — food, wine, people and the life of Peploe’s.",
  ]) {
    await expect(main.getByText(text, { exact: true })).toBeVisible();
  }
  await expect(
    page
      .getByRole("navigation", { name: "Explore the Journal" })
      .getByRole("link"),
  ).toHaveText([
    "All stories",
    "From Gina",
    "People & Produce",
    "Food & Wine",
    "Art & Place",
    "Family & History",
  ]);
  const stories = page.getByRole("region", {
    name: "Stories from Peploe’s.",
  });
  await expect(stories.getByRole("heading", { level: 2 })).toHaveText(
    "Stories from Peploe’s.",
  );
  await expect(stories.getByRole("heading", { level: 3 })).toHaveText([
    "Rooted in good relationships.",
    "A season at its best.",
    "The art of Peploe’s.",
    "Moments, menus and memories.",
    "A room worth being in.",
    "Bottles worth sharing.",
  ]);
  const featured = page.getByRole("region", {
    name: "Some things have changed. The things that matter haven’t.",
  });
  await expect(featured).toContainText(
    "A few reflections on change, continuity and the things that continue to make Peploe’s feel like Peploe’s.",
  );
  await expect(featured).toContainText("8 min read");
  await expect(featured.locator("time")).toHaveAttribute(
    "datetime",
    "2026-04-12",
  );
  await expect(stories).not.toContainText(
    "Some things have changed. The things that matter haven’t.",
  );
  await featured.getByRole("link", { name: /^Read the story\s*:/ }).click();
  await expect(page).toHaveURL("/journal/some-things-have-changed");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Some things have changed. The things that matter haven’t.",
  );
});

test("direct category links, keyboard selection and browser history keep the filter and featured story in sync", async ({
  page,
}) => {
  await page.goto("/journal?category=food-wine");
  const categories = page.getByRole("navigation", {
    name: "Explore the Journal",
  });
  const food = categories.getByRole("link", {
    name: "Food & Wine",
    exact: true,
  });
  const people = categories.getByRole("link", {
    name: "People & Produce",
    exact: true,
  });
  const stories = page.getByRole("region", {
    name: journalPageFixture.listing.heading,
  });
  const featured = page.getByRole("region", {
    name: "Some things have changed. The things that matter haven’t.",
  });
  await expect(food).toHaveAttribute("aria-current", "page");
  await expect(stories.getByRole("heading", { level: 3 })).toHaveText([
    "A season at its best.",
    "Bottles worth sharing.",
  ]);
  const featuredContent = await featured.textContent();
  await people.focus();
  await people.press("Enter");
  await expect(page).toHaveURL("/journal?category=people-produce");
  await expect(people).toHaveAttribute("aria-current", "page");
  await expect(people).toBeInViewport({ ratio: 1 });
  await expect(stories.getByRole("heading", { level: 3 })).toHaveText([
    "Rooted in good relationships.",
    "Synthetic fixture: growing together.",
    "Synthetic fixture: the early delivery.",
    "Synthetic fixture: from the field.",
  ]);
  await expect(featured).toHaveText(featuredContent ?? "");

  await page.goBack();
  await expect(page).toHaveURL("/journal?category=food-wine");
  await expect(food).toHaveAttribute("aria-current", "page");
  await expect(stories.getByRole("heading", { level: 3 })).toHaveText([
    "A season at its best.",
    "Bottles worth sharing.",
  ]);
  await page.goForward();
  await expect(page).toHaveURL("/journal?category=people-produce");
  await expect(people).toHaveAttribute("aria-current", "page");
  await expect(stories.getByRole("article")).toHaveCount(4);
  await expect(featured).toHaveText(featuredContent ?? "");
});

test("an unknown category is removed without losing attribution, the fragment or browser history", async ({
  page,
}) => {
  await page.goto("/");
  await page.goto(
    "/journal?category=not-a-category&utm_source=fixture#journal-stories",
  );
  await expect(page).toHaveURL("/journal?utm_source=fixture#journal-stories");
  await expect(
    page
      .getByRole("navigation", { name: "Explore the Journal" })
      .getByRole("link", { name: "All stories", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(
    page
      .getByRole("region", { name: journalPageFixture.listing.heading })
      .getByRole("article"),
  ).toHaveCount(6);
  await page.goBack();
  await expect(page).toHaveURL("/");
});

for (const completion of ["finish", "resize", "reduced motion"]) {
  test(`load more opens downward and restores natural height on ${completion}`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/journal");
    const results = page.locator("[data-journal-results]");
    const loadMore = page.getByRole("button", { name: "Load more stories" });
    await loadMore.scrollIntoViewIfNeeded();
    await expect(loadMore.locator("..")).toHaveCSS("opacity", "1");
    await page.evaluate(() => document.fonts.ready);
    await results.evaluate((element) => {
      const observer = new MutationObserver(() => {
        for (const animation of element.getAnimations()) {
          if (
            animation.effect instanceof KeyframeEffect &&
            animation.effect.getKeyframes().some((frame) => "height" in frame)
          ) {
            animation.pause();
            animation.currentTime = 0;
          }
        }
      });
      observer.observe(element, { childList: true, subtree: true });
    });
    const measure = () =>
      results.evaluate((element) => {
        const closing = document.querySelector(
          '[aria-labelledby="journal-closing"]',
        );
        if (!closing) throw new Error("The Journal closing section is missing");
        return {
          height: element.getBoundingClientRect().height,
          top: element.getBoundingClientRect().top + scrollY,
          closing: closing.getBoundingClientRect().top + scrollY,
          scroll: scrollY,
        };
      });
    const before = await measure();
    await loadMore.click();
    await expect(results.getByRole("article")).toHaveCount(9);
    await expect
      .poll(() =>
        results.evaluate((element) => element.getBoundingClientRect().height),
      )
      .toBeCloseTo(before.height, 1);
    await results.evaluate((element) => {
      const animation = element
        .getAnimations()
        .find(
          (motion) =>
            motion.effect instanceof KeyframeEffect &&
            motion.effect.getKeyframes().some((frame) => "height" in frame),
        );
      if (!animation)
        throw new Error("Load more did not animate the results height");
      animation.currentTime =
        Number(animation.effect?.getTiming().duration) / 2;
    });
    const middle = await measure();
    if (completion === "resize") {
      const viewport = page.viewportSize();
      if (!viewport) throw new Error("The test needs a viewport");
      await page.setViewportSize({ ...viewport, height: viewport.height + 1 });
    } else if (completion === "reduced motion") {
      await page.emulateMedia({ reducedMotion: "reduce" });
    } else {
      await results.evaluate((element) => {
        for (const animation of element.getAnimations()) animation.finish();
      });
    }
    await expect(results).toHaveCSS("overflow", "visible");
    const after = await measure();
    expect(middle.height).toBeGreaterThan(before.height);
    expect(middle.height).toBeLessThan(after.height);
    expect(middle.closing).toBeGreaterThan(before.closing);
    expect(middle.closing).toBeLessThan(after.closing);
    expect(middle.top).toBeCloseTo(before.top, 1);
    expect(Math.abs(middle.scroll - before.scroll)).toBeLessThanOrEqual(1);
    await expect(results).toHaveCSS("overflow", "visible");
    expect(
      Math.abs((await page.evaluate(() => scrollY)) - before.scroll),
    ).toBeLessThanOrEqual(1);
    await expect(
      results.locator("li").nth(6).getByRole("link").first(),
    ).toBeFocused();
  });
}

test("load more fades and lifts new stories without replaying existing cards", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/journal");
  const cards = page.locator("#journal-story-list > li");
  const loadMore = page.getByRole("button", { name: "Load more stories" });
  await loadMore.scrollIntoViewIfNeeded();
  await expect(loadMore.locator("..")).toHaveCSS("opacity", "1");
  await page.addStyleTag({
    content:
      "#journal-story-list > li > article { animation-play-state: paused !important; }",
  });
  const scrollBefore = await page.evaluate(() => scrollY);
  await loadMore.click();
  await expect(cards).toHaveCount(9);
  await expect(cards.nth(6).getByRole("link").first()).toBeFocused();
  expect(
    Math.abs((await page.evaluate(() => scrollY)) - scrollBefore),
  ).toBeLessThanOrEqual(1);
  for (const card of (await cards.all()).slice(0, 6)) {
    await expect(card.getByRole("article")).toHaveCSS("animation-name", "none");
  }
  for (const card of (await cards.all()).slice(6)) {
    const story = card.getByRole("article");
    await expect(story).toHaveCSS("opacity", "0");
    const motion = await story.evaluate((element) => {
      const animation = element.getAnimations()[0];
      animation.currentTime =
        Number(animation.effect?.getTiming().duration) / 2;
      const middle = getComputedStyle(element);
      const opacity = Number(middle.opacity);
      const offset = new DOMMatrix(middle.transform).m42;
      animation.finish();
      return { opacity, offset };
    });
    expect(motion.opacity).toBeGreaterThan(0);
    expect(motion.opacity).toBeLessThan(1);
    expect(motion.offset).toBeGreaterThan(0);
    await expect(story).toHaveCSS("opacity", "1");
    await expect(story).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await loadMore.click();
  await expect(cards).toHaveCount(9);
  for (const card of (await cards.all()).slice(6)) {
    await expect(card.getByRole("article")).toHaveCSS("animation-name", "none");
    await expect(card.getByRole("article")).toHaveCSS("opacity", "1");
  }
});

test("load more keeps the current view, focuses the first new story and resets only when the category changes", async ({
  page,
}) => {
  await page.goto("/journal");
  const stories = page.getByRole("region", {
    name: journalPageFixture.listing.heading,
  });
  const loadMore = stories.getByRole("button", { name: "Load more stories" });
  await expect(stories.getByRole("status")).toHaveText("6 of 9 stories shown.");
  await loadMore.scrollIntoViewIfNeeded();
  await loadMore.focus();
  const scrollBefore = await page.evaluate(() => scrollY);
  await loadMore.press("Enter");
  await expect(stories.getByRole("article")).toHaveCount(9);
  await expect(stories.getByRole("status")).toHaveText("9 of 9 stories shown.");
  await expect(
    stories
      .getByRole("link", {
        name: "Synthetic fixture: growing together.",
        exact: true,
      })
      .first(),
  ).toBeFocused();
  expect(
    Math.abs((await page.evaluate(() => scrollY)) - scrollBefore),
  ).toBeLessThanOrEqual(1);
  await expect(loadMore).toHaveCount(0);
  await expect(page).toHaveURL("/journal");

  const categories = page.getByRole("navigation", {
    name: "Explore the Journal",
  });
  const all = categories.getByRole("link", {
    name: "All stories",
    exact: true,
  });
  await all.click();
  await expect(stories.getByRole("article")).toHaveCount(9);
  await categories
    .getByRole("link", { name: "Food & Wine", exact: true })
    .click();
  await expect(stories.getByRole("article")).toHaveCount(2);
  await expect(stories.getByRole("status")).toHaveText("2 of 2 stories shown.");
  await expect(loadMore).toHaveCount(0);
  await all.click();
  await expect(stories.getByRole("article")).toHaveCount(6);
  await expect(stories.getByRole("status")).toHaveText("6 of 9 stories shown.");
  await expect(loadMore).toBeVisible();
});

test("an article renders its metadata, introduction and every supported body block", async ({
  page,
}) => {
  await page.goto("/journal/rooted-in-good-relationships");
  const article = page.getByRole("article", {
    name: "Rooted in good relationships.",
  });
  await expect(article.getByRole("heading", { level: 1 })).toHaveText(
    "Rooted in good relationships.",
  );
  await expect(
    article.getByRole("link", { name: "People & Produce", exact: true }),
  ).toHaveAttribute("href", "/journal?category=people-produce");
  await expect(article.locator("time")).toHaveText("20 Mar 2026");
  await expect(article.locator("time")).toHaveAttribute(
    "datetime",
    "2026-03-20",
  );
  await expect(article).toContainText("6 min read");
  await expect(article).toContainText("From Peploe’s");
  await expect(article).toContainText(
    "Synthetic fixture: good food begins with the people who grow it.",
  );
  await expect(article).toContainText(
    "Synthetic fixture: our kitchen starts each morning with a conversation about what is ready in the fields.",
  );
  await expect(
    article.getByRole("heading", {
      name: "Synthetic fixture: a shared season",
      level: 2,
    }),
  ).toBeVisible();
  await expect(
    article.getByRole("heading", {
      name: "Synthetic fixture: from field to table",
      level: 3,
    }),
  ).toBeVisible();
  await expect(
    article.getByRole("img", {
      name: "An artichoke from the seasonal kitchen",
    }),
  ).toBeVisible();
  await expect(article.locator("figcaption")).toHaveText([
    "Synthetic fixture: produce selected for the kitchen.",
    "Fixture grower",
  ]);
  await expect(article.locator("blockquote")).toHaveText(
    "Synthetic fixture: the best ingredients come with a conversation.",
  );
  await article
    .getByRole("link", { name: "People & Produce", exact: true })
    .click();
  await expect(page).toHaveURL("/journal?category=people-produce");
  await expect(
    page
      .getByRole("navigation", { name: "Explore the Journal" })
      .getByRole("link", { name: "People & Produce", exact: true }),
  ).toHaveAttribute("aria-current", "page");
});

test("related stories share the category, exclude the current article and open their own page", async ({
  page,
}) => {
  await page.goto("/journal/rooted-in-good-relationships");
  const main = page.getByRole("main");
  const related = main.getByRole("region", {
    name: "More from People & Produce",
    exact: true,
  });
  await expect(related.getByRole("heading", { level: 3 })).toHaveText([
    "Synthetic fixture: growing together.",
    "Synthetic fixture: the early delivery.",
    "Synthetic fixture: from the field.",
  ]);
  await expect(
    related.getByRole("link", { name: "People & Produce", exact: true }),
  ).toHaveCount(3);
  await expect(
    related.getByRole("link", {
      name: "Rooted in good relationships.",
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(
    related.getByRole("link", { name: "Food & Wine", exact: true }),
  ).toHaveCount(0);
  await related
    .getByRole("link", {
      name: "Synthetic fixture: growing together.",
      exact: true,
    })
    .first()
    .click();
  await expect(page).toHaveURL("/journal/fixture-growing-together");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Synthetic fixture: growing together.",
  );
});

test("the Growers template renders the reference copy and its category reading list", async ({
  page,
}) => {
  await page.goto("/journal/growers-we-work-with");
  const article = page.getByRole("article", {
    name: "The growers we work with.",
    exact: true,
  });
  await expect(article.getByRole("heading", { level: 2 })).toHaveText([
    "A relationship built over time",
    "A seasonal approach",
    "Working together",
  ]);
  await expect(article).toContainText(
    "At Peploe’s, great food begins long before it reaches our kitchen.",
  );
  const related = page.getByRole("region", {
    name: "More from People & Produce",
    exact: true,
  });
  await expect(
    related.getByText("Continue reading", { exact: true }),
  ).toBeVisible();
  await expect(related.getByRole("heading", { level: 3 })).toHaveText([
    "The ingredients that inspire.",
    "A focus on seasonal ingredients.",
    "From supplier to table.",
  ]);
  await expect(related.locator("time")).toHaveText([
    "March 2026",
    "February 2026",
    "January 2026",
  ]);
});

test("article metadata and the sitemap publish canonical, indexable destinations only", async ({
  page,
}) => {
  await page.goto("/journal/rooted-in-good-relationships?utm_source=fixture");
  await expect(page).toHaveTitle(/Rooted in good relationships\./);
  const canonical = page.locator('link[rel="canonical"]');
  await expect(canonical).toHaveAttribute(
    "href",
    /^https?:\/\/[^/]+\/journal\/rooted-in-good-relationships$/,
  );
  const indexableUrl = await canonical.getAttribute("href");
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    "content",
    indexableUrl ?? "",
  );
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute(
    "content",
    "article",
  );
  await expect(
    page.locator('meta[property="article:published_time"]'),
  ).toHaveAttribute("content", "2026-03-20");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    "Synthetic Journal article for browser verification.",
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /\bindex\b/,
  );

  await page.goto("/journal/a-season-at-its-best");
  await expect(canonical).toHaveAttribute(
    "href",
    /^https?:\/\/[^/]+\/journal\/a-season-at-its-best$/,
  );
  const noIndexUrl = await canonical.getAttribute("href");
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute(
    "content",
    "article",
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /\bnoindex\b/,
  );

  await page.goto("/journal?category=food-wine");
  await expect(canonical).toHaveAttribute(
    "href",
    /^https?:\/\/[^/]+\/journal$/,
  );
  const hubUrl = await canonical.getAttribute("href");
  const sitemap = await page.request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  const urls = [...(await sitemap.text()).matchAll(/<loc>(.*?)<\/loc>/g)].map(
    (match) => match[1],
  );
  expect(urls).toContain(hubUrl);
  expect(urls).toContain(indexableUrl);
  expect(urls).not.toContain(noIndexUrl);
  const journalUrls = urls
    .map((url) => new URL(url))
    .filter(
      (url) =>
        url.pathname === "/journal" || url.pathname.startsWith("/journal/"),
    );
  expect(journalUrls.every((url) => url.search === "")).toBe(true);
});

test("an unknown article returns a real 404 to guests and search crawlers", async ({
  page,
}) => {
  const response = await page.goto("/journal/not-a-published-story");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "Page Not Found", exact: true }),
  ).toBeVisible();
  await expect(
    page.locator('meta[name="robots"][content="noindex"]').first(),
  ).toBeAttached();
  const crawler = await page.request.get("/journal/not-a-published-story", {
    headers: { "User-Agent": "Twitterbot/1.0" },
  });
  expect(crawler.status()).toBe(404);
});

test("article heroes use each photograph's framing without changing the shared layout", async ({
  page,
}) => {
  const desktop = await page.evaluate(
    () => matchMedia("(min-width: 80rem)").matches,
  );
  for (const slug of [
    "growers-we-work-with",
    "the-art-of-peploes",
    "some-things-have-changed",
  ]) {
    await page.goto(`/journal/${slug}`);
    const hero = page.locator("main > article > header");
    const photograph = hero.getByRole("img");
    await expect(photograph).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await expect(photograph).toHaveCSS("object-fit", "cover");
    if (desktop) {
      const gutterWidth = await page.evaluate(
        () =>
          innerWidth - document.documentElement.getBoundingClientRect().width,
      );
      await page.setViewportSize({
        width: 1440 + gutterWidth,
        height: 900,
      });
    }
    await expect(photograph).toHaveCSS(
      "object-position",
      desktop && slug === "growers-we-work-with" ? "50% 95%" : "50% 50%",
    );
    await expect(photograph).toHaveJSProperty("complete", true);
    await expect(photograph).not.toHaveJSProperty("naturalWidth", 0);
    const frame = await photograph.boundingBox();
    expect(frame).not.toBeNull();
    if (desktop) {
      expect(frame?.x).toBe(600);
      expect(frame?.width).toBe(840);
      expect(frame?.height).toBeGreaterThanOrEqual(356);
      if (slug === "growers-we-work-with") expect(frame?.height).toBe(356);
    } else {
      expect(frame?.x).toBe(0);
      expect(frame?.width).toBe(page.viewportSize()?.width);
    }
    await expect(photograph).not.toHaveAttribute("desktopPosition");
    await expect(photograph).not.toHaveAttribute("mobilePosition");
  }
});

for (const path of ["/journal", "/journal/growers-we-work-with"]) {
  test(`${path} loads photographs with their designed fit and without horizontal overflow`, async ({
    page,
  }) => {
    await page.goto(path);
    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { level: 1 })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const photographs = main.getByRole("img");
    expect(await photographs.count()).toBeGreaterThanOrEqual(
      path === "/journal" ? 8 : 4,
    );
    for (const photograph of await photographs.all()) {
      await photograph.scrollIntoViewIfNeeded();
      await expect(photograph).toBeVisible();
      await expect(photograph).toHaveJSProperty("complete", true);
      await expect(photograph).not.toHaveJSProperty("naturalWidth", 0);
      const hasAuthoredHeroFill = await photograph.evaluate(
        (image) =>
          Boolean(image.closest('section[aria-labelledby="journal-title"]')) &&
          matchMedia("(min-width: 64rem)").matches,
      );
      await expect(photograph).toHaveCSS(
        "object-fit",
        hasAuthoredHeroFill ? "fill" : /^(cover|contain)$/,
      );
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
}
