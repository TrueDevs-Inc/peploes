import { journalPageFixture } from "./journal-fixtures";
import { expect, test } from "./menu-test";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("the Journal opens the featured story and keeps the six reference cards ahead of newer stories", async ({
  page,
  viewport,
}) => {
  await page.goto("/journal");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "The Journal",
  );
  const main = page.getByRole("main");
  for (const text of [
    "Stories from St Stephen’s Green",
    "Food, wine, people, produce, art and the life of the restaurant.",
    "Stories from St Stephen’s Green — food, wine, people and the life of Peploe’s.",
  ]) {
    await expect(main.getByText(text, { exact: true })).toBeVisible();
  }
  const heroDescription = main.getByText(
    "Seasonal menus, special evenings, wine dinners and occasions throughout the year, all in the heart of St Stephen’s Green.",
    { exact: true },
  );
  if ((viewport?.width ?? 1440) < 640) {
    await expect(heroDescription).toBeHidden();
  } else {
    await expect(heroDescription).toBeVisible();
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

for (const path of ["/journal", "/journal/growers-we-work-with"]) {
  test(`${path} loads photographs without horizontal overflow`, async ({
    page,
  }) => {
    await page.goto(path);
    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { level: 1 })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const photographs = main.getByRole("img");
    await expect
      .poll(() => photographs.count())
      .toBeGreaterThanOrEqual(path === "/journal" ? 8 : 4);
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
}
