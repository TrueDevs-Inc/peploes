import type { Page } from "@playwright/test";
import { expect, test } from "./menu-test";

import { seasonalFixtures, seasonalPageFixture } from "./seasonal-fixtures";

const eventPath = "/seasonal/rugby-at-peploes";

async function expectSharpOccasionPhotos(page: Page) {
  const cards = page.locator("#groups-occasions").getByRole("listitem");
  await expect(cards).toHaveCount(3);
  for (const card of await cards.all()) {
    const photograph = card.getByRole("img");
    await photograph.scrollIntoViewIfNeeded();
    await photograph.evaluate((image: HTMLImageElement) => image.decode());
    const photo = await photograph.evaluate(async (image: HTMLImageElement) => {
      const decoded = new Image();
      decoded.src = image.currentSrc;
      await decoded.decode();
      return {
        decodedHeight: decoded.naturalHeight,
        height: image.getBoundingClientRect().height,
        dpr: devicePixelRatio,
      };
    });
    expect(photo.decodedHeight).toBeGreaterThanOrEqual(
      photo.height * photo.dpr,
    );
  }
}

test.describe("retina occasion photographs", () => {
  test.use({ deviceScaleFactor: 2 });
  test("portrait crops retain enough decoded pixels on high-density screens", async ({
    page,
    isMobile,
  }) => {
    await page.goto("/");
    await expectSharpOccasionPhotos(page);
    if (!isMobile) {
      await page.setViewportSize({ width: 768, height: 900 });
      await page.reload();
      await expectSharpOccasionPhotos(page);
    }
  });
});

test("empty optional CMS sections leave no headings or placeholder sections", async ({
  page,
}) => {
  const response = await page.goto("/seasonal/christmas-at-peploes");
  expect(response?.status()).toBe(200);
  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { level: 1 })).toHaveText(
    "Christmas at Peploe’s",
  );
  await expect(main.locator(":scope > section")).toHaveCount(2);
  await expect(
    main.getByRole("region", { name: "Event information" }),
  ).toHaveCount(0);
  await expect(
    main.locator(
      "#event-menu, #event-story, #event-gallery, #event-invitation, #event-related",
    ),
  ).toHaveCount(0);
});

test("each published diary entry serves its own content and keeps test copy out of search", async ({
  page,
}) => {
  for (const slug of [
    "rugby-at-peploes",
    "italian-wine-dinner",
    "christmas-at-peploes",
    "sunday-at-peploes",
    "lobster-season",
    "new-years-eve",
  ]) {
    const response = await page.goto(`/seasonal/${slug}`);
    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole("main").getByRole("heading", {
        name: seasonalFixtures.find((entry) => entry.slug === slug)?.title,
        level: 1,
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /\bnoindex\b/,
    );
  }

  const missingPage = await page.goto("/seasonal/not-an-event");
  expect(missingPage?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "Page Not Found", exact: true }),
  ).toBeVisible();
  await expect(
    page.locator('meta[name="robots"][content="noindex"]').first(),
  ).toBeAttached();
  const missingEvent = await page.request.get("/seasonal/not-an-event", {
    headers: { "User-Agent": "Twitterbot/1.0" },
  });
  expect(missingEvent.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "Rugby at Peploe’s", level: 1 }),
  ).toHaveCount(0);
});

test("event photographs load with preserved proportions and content fits without clipping or page overflow", async ({
  page,
}) => {
  await page.goto(eventPath);
  const photographs = page.getByRole("main").getByRole("img");
  await expect(photographs).toHaveCount(12);

  for (const photograph of await photographs.all()) {
    await photograph.scrollIntoViewIfNeeded();
    await expect(photograph).toBeVisible();
    await expect(photograph).toHaveJSProperty("complete", true);
    await expect(photograph).not.toHaveJSProperty("naturalWidth", 0);
  }

  const heading = page.getByRole("heading", {
    name: "Rugby at Peploe’s",
    level: 1,
    exact: true,
  });
  await expect
    .poll(() =>
      heading.evaluate((element) => {
        const rightEdge = element.getBoundingClientRect().right;
        const textNodes = document.createTreeWalker(
          element,
          NodeFilter.SHOW_TEXT,
        );
        let textNode = textNodes.nextNode();
        while (textNode) {
          const range = document.createRange();
          range.selectNodeContents(textNode);
          if (
            Array.from(range.getClientRects()).some(
              (rect) => rect.right > rightEdge + 1,
            )
          ) {
            return false;
          }
          textNode = textNodes.nextNode();
        }
        return true;
      }),
    )
    .toBe(true);

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

test("What's On remains the active section and returns from an event to the diary", async ({
  page,
  isMobile,
}) => {
  await page.goto(eventPath);
  const navigation = page.getByRole("navigation", {
    name: "Main navigation",
    exact: true,
  });

  if (isMobile) {
    const toggle = navigation.getByRole("button", { name: "Open menu" });
    await toggle.click();
    const menu = page.getByRole("dialog", { name: "Navigation menu" });
    await menu.getByRole("link", { name: "What’s On", exact: true }).click();
    await expect(menu).not.toBeVisible();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  } else {
    const whatsOn = navigation.getByRole("link", {
      name: "What’s On",
      exact: true,
    });
    await expect(whatsOn).not.toHaveAttribute("aria-current", "page");
    await whatsOn.click();
  }

  await expect(page).toHaveURL("/seasonal");
  await expect(
    page.getByRole("heading", { name: "In the diary.", exact: true }),
  ).toBeVisible();
});

test("event enquiry reaches the private dining form and contact reaches Visit & Contact", async ({
  page,
}) => {
  await page.goto(eventPath);
  const enquiry = page.getByRole("link", {
    name: "Make an Inquiry",
    exact: true,
  });
  await expect(enquiry).toHaveAttribute("href", "/private-dining#enquire");
  await enquiry.click();
  await expect(page).toHaveURL("/private-dining#enquire");
  await expect(page.locator("#enquire")).toBeInViewport();
  await expect(page.getByRole("textbox", { name: "Your name" })).toBeVisible();

  await page.goto(eventPath);
  const contact = page.getByRole("main").getByRole("link", {
    name: seasonalPageFixture.join.contactAction,
    exact: true,
  });
  await expect(contact).toHaveAttribute("href", "/visit-contact");
  await contact.click();
  await expect(page).toHaveURL("/visit-contact");
  await expect(
    page.getByRole("heading", {
      name: "Step down from the city.",
      level: 1,
    }),
  ).toBeVisible();
});

test("event booking actions open the Book a Table page", async ({ page }) => {
  for (const name of [
    "Book this Experience",
    seasonalPageFixture.join.bookingAction,
  ]) {
    await page.goto(eventPath);
    const action = page
      .getByRole("main")
      .getByRole("link", { name, exact: true });
    await expect(action).toHaveAttribute("href", "/book-a-table");
    await action.click();
    await expect(page).toHaveURL("/book-a-table");
    await expect(
      page.getByRole("heading", { name: "A table at Peploe’s.", level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Table reservations" }),
    ).toBeVisible();
  }
});

test("related images open their published destination", async ({ page }) => {
  await page.goto(eventPath);
  const related = page.getByRole("region", { name: "More to Explore" });
  const firstCard = related.getByRole("listitem").first();
  const imageLink = firstCard
    .getByRole("link")
    .filter({ has: page.getByRole("img") });
  await expect(imageLink).toHaveAttribute(
    "href",
    "/seasonal/italian-wine-dinner",
  );
  await imageLink.click();
  await expect(page).toHaveURL("/seasonal/italian-wine-dinner");
  await expect(
    page.getByRole("heading", {
      name: "An Evening with Italian Wines",
      level: 1,
    }),
  ).toBeVisible();
});

test("related items stack on phones and remain navigable on tablets", async ({
  page,
  isMobile,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(eventPath);
  const related = page.getByRole("region", { name: "More to Explore" });
  const previous = related.getByRole("button", {
    name: "Previous related items",
    exact: true,
  });
  const next = related.getByRole("button", {
    name: "Next related items",
    exact: true,
  });
  const first = related.getByRole("heading", {
    name: "An Evening with Italian Wines",
    exact: true,
  });
  const last = related.getByRole("heading", {
    name: "Sunday at Peploe’s",
    exact: true,
  });

  if (isMobile) {
    await expect(previous).toBeHidden();
    await expect(next).toBeHidden();
    const cards = related.getByRole("listitem");
    await expect(cards).toHaveCount(3);
    const bounds = await cards.evaluateAll((elements) =>
      elements.map((element) => {
        const { top, bottom, left, width } = element.getBoundingClientRect();
        return { top, bottom, left, width };
      }),
    );
    for (let index = 1; index < bounds.length; index++) {
      expect(bounds[index].top).toBeGreaterThan(bounds[index - 1].bottom);
    }

    for (const card of await cards.all()) {
      await card.scrollIntoViewIfNeeded();
      await expect(card).toBeInViewport();
    }
  } else {
    await related.scrollIntoViewIfNeeded();
    await expect(previous).toBeDisabled();
    await expect(first).toBeInViewport();
    await expect(last).toBeInViewport();
    await expect(next).toBeDisabled();

    await page.setViewportSize({ width: 768, height: 900 });
    await related.scrollIntoViewIfNeeded();
    await expect(previous).toBeDisabled();
    await expect(next).toBeEnabled();
    await expect(last).not.toBeInViewport();
    const middle = related.getByRole("listitem").nth(1);
    await next.click();
    await expect(middle).toBeInViewport({ ratio: 1 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await next.focus();
    await page.keyboard.press("Shift+Tab");
    await previous.blur();
    await previous.hover();
    await page.mouse.move(0, 0);
    await expect(last).not.toBeInViewport();
    await next.click();
    await expect(last).toBeInViewport();
    await expect(next).toBeDisabled();
    await previous.click();
    await expect(middle).toBeInViewport({ ratio: 1 });
    await previous.click();
    await expect(first).toBeInViewport();
    await expect(previous).toBeDisabled();
  }
});

test("menu and related event links open their published destinations", async ({
  page,
}) => {
  for (const [slug, secondHref] of [
    ["lobster-season", "/menus?menu=wine"],
    ["italian-wine-dinner", "https://example.com/events/wine"],
    ["sunday-at-peploes", "/seasonal/lobster-season?from=card#event-menu"],
  ]) {
    await page.goto(`/seasonal/${slug}`);
    const menu = page.getByRole("region", {
      name: "Menu & Experience",
      exact: true,
    });
    await expect(
      menu.getByRole("link", { name: "View Menu", exact: true }),
    ).toHaveAttribute("href", "/menus?menu=dinner");
    await expect(
      menu.getByRole("link", { name: "Find Out More", exact: true }),
    ).toHaveAttribute("href", secondHref);
    const imageLinks = menu.getByRole("link").filter({
      has: page.getByRole("img"),
    });
    await expect(imageLinks).toHaveCount(2);
    await expect(imageLinks.first()).toHaveAttribute(
      "href",
      "/menus?menu=dinner",
    );
    await expect(imageLinks.nth(1)).toHaveAttribute("href", secondHref);
  }
  const navigationStart = await page.evaluate(() => performance.timeOrigin);
  await page
    .getByRole("region", { name: "Menu & Experience", exact: true })
    .getByRole("link")
    .filter({ has: page.getByRole("img") })
    .nth(1)
    .click();
  await expect(page).toHaveURL(
    /\/seasonal\/lobster-season\?from=card#event-menu$/,
  );
  expect(await page.evaluate(() => performance.timeOrigin)).toBe(
    navigationStart,
  );
  await expect(
    page.getByRole("heading", {
      name: "Lobster Season",
      level: 1,
      exact: true,
    }),
  ).toBeVisible();
  await page.goto(eventPath);
  await expect(
    page
      .getByRole("main")
      .getByRole("link", { name: "View Menu", exact: true }),
  ).toHaveAttribute("href", "/menus?menu=dinner");
  const related = page.getByRole("region", { name: "More to Explore" });
  const imageNavigationStart = await page.evaluate(
    () => performance.timeOrigin,
  );
  await related.getByRole("link").first().click();
  await expect(page).toHaveURL("/seasonal/italian-wine-dinner");
  expect(await page.evaluate(() => performance.timeOrigin)).toBe(
    imageNavigationStart,
  );
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "An Evening with Italian Wines",
    }),
  ).toBeVisible();
});

test("encoded event URLs resolve and malformed encodings stay unavailable", async ({
  page,
}) => {
  const response = await page.goto("/seasonal/rugby%2Dat%2Dpeploes");
  expect(response?.status()).toBe(200);
  await expect(
    page.getByRole("heading", {
      name: "Rugby at Peploe’s",
      level: 1,
      exact: true,
    }),
  ).toBeVisible();

  const malformed = await page.request.get("/seasonal/%E0%A4%A");
  expect(malformed.status()).toBe(404);
});

test("CMS optional sections, five-photo galleries, highlights and related pages render together", async ({
  page,
}) => {
  await page.goto("/seasonal/new-years-eve");
  const main = page.getByRole("main");
  await expect(
    main.getByRole("region", { name: "Event information" }),
  ).toHaveCount(0);
  await expect(
    main.getByRole("region", { name: "Section Heading", exact: true }),
  ).toHaveCount(0);
  const highlight = main.getByRole("article").filter({
    has: page.getByRole("heading", {
      name: "A Taste of What to Expect",
      exact: true,
    }),
  });
  await expect(highlight).toBeVisible();
  await expect(highlight.getByRole("link")).toHaveCount(0);
  await expect(highlight.getByRole("button")).toHaveCount(0);
  const enquiry = main.getByRole("link", {
    name: "Enquire about a gathering",
    exact: true,
  });
  await expect(enquiry).toHaveAttribute("href", "/private-dining#enquire");
  await expect
    .poll(() =>
      enquiry.evaluate((element) => {
        const button = element.getBoundingClientRect();
        const content = document.createRange();
        content.selectNodeContents(element);
        return Array.from(content.getClientRects()).every(
          (rect) =>
            rect.left >= button.left &&
            rect.right <= button.right &&
            rect.top >= button.top &&
            rect.bottom <= button.bottom,
        );
      }),
    )
    .toBe(true);
  await expect(
    main
      .getByRole("region", { name: "Moments at Peploe’s", exact: true })
      .getByRole("img"),
  ).toHaveCount(5);
  const related = main.getByRole("region", { name: "More to Explore" });
  await expect(
    related.getByRole("link", { name: "Explore wines" }),
  ).toHaveAttribute("href", "/menus?menu=wine");
  await expect(
    related.getByRole("link", { name: "Explore groups" }),
  ).toHaveAttribute("href", "/private-dining/groups-celebrations");
  await expect(
    related.getByRole("link", { name: "Explore partner event" }),
  ).toHaveAttribute(
    "href",
    "https://example.com/events/special?day=sunday#details",
  );
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
});
