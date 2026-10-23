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
    await expect(photograph).toHaveCSS("object-fit", /^(cover|contain)$/);
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
    await expect(whatsOn).toHaveCSS("color", "rgb(122, 30, 36)");
    await expect(whatsOn).toHaveCSS("text-decoration-line", "underline");
    await whatsOn.click();
    await expect(whatsOn).toHaveAttribute("aria-current", "page");
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

test("related card layout and sizing match homepage occasion cards", async ({
  page,
}) => {
  function dimensions(card: ReturnType<typeof page.getByRole>) {
    return card.evaluate((element) => {
      const image = element.querySelector("img");
      const heading = element.querySelector("h3");
      const description = element.querySelector("p");
      if (!image || !heading || !description)
        throw new Error("Card content is missing");
      const cardStyle = getComputedStyle(element);
      const headingStyle = getComputedStyle(heading);
      const descriptionStyle = getComputedStyle(description);
      return {
        columns: cardStyle.gridTemplateColumns
          .split(" ")
          .map((column) => Math.round(Number.parseFloat(column))),
        gap: cardStyle.columnGap,
        padding: [cardStyle.paddingLeft, cardStyle.paddingRight],
        minimumHeight: cardStyle.minHeight,
        imageWidth: image.getBoundingClientRect().width,
        imageHeight: image.getBoundingClientRect().height,
        divider: getComputedStyle(element, "::before").display,
        heading: [
          headingStyle.fontSize,
          headingStyle.lineHeight,
          headingStyle.fontWeight,
        ],
        description: [descriptionStyle.fontSize, descriptionStyle.lineHeight],
      };
    });
  }
  await page.goto("/");
  for (const card of await page
    .locator("#groups-occasions")
    .getByRole("listitem")
    .all()) {
    expect(
      (await card.locator("p").innerText()).trim().split(/\s+/).length,
    ).toBeLessThanOrEqual(12);
  }
  await expect(
    page
      .locator("#groups-occasions")
      .getByRole("link", { name: /^Explore / })
      .first(),
  ).toHaveCSS("font-size", "16px");
  await expectSharpOccasionPhotos(page);
  const homepage = await dimensions(
    page.locator("#groups-occasions").getByRole("listitem").first(),
  );
  expect(homepage.heading).toEqual(
    (page.viewportSize()?.width ?? 0) < 640
      ? ["22px", "28px", "500"]
      : ["24px", "30px", "500"],
  );
  expect(homepage.description).toEqual(["14px", "21px"]);
  if ((page.viewportSize()?.width ?? 0) < 640) {
    await expect(page.locator("#groups-occasions ul")).toHaveCSS(
      "row-gap",
      "40px",
    );
    expect(homepage.divider).toBe("none");
    expect(homepage.padding).toEqual(["0px", "0px"]);
  }
  if ((page.viewportSize()?.width ?? 0) >= 1280) {
    expect(homepage.imageWidth).toBe(160);
    expect(homepage.imageHeight).toBe(185);
  } else {
    expect(homepage.imageHeight).toBeCloseTo(
      (homepage.imageWidth * 4) / 3 -
        ((page.viewportSize()?.width ?? 0) < 640 ? 4 : 2),
      1,
    );
  }
  await page.goto(eventPath);
  await expect(
    page
      .getByRole("region", { name: "More to Explore" })
      .getByRole("link", { name: "Find Out More", exact: true })
      .first(),
  ).toHaveCSS(
    "font-size",
    (page.viewportSize()?.width ?? 0) < 640 ? "15px" : "16px",
  );
  for (const card of await page
    .getByRole("region", { name: "More to Explore" })
    .getByRole("listitem")
    .all()) {
    expect(
      (await card.locator("p").innerText()).trim().split(/\s+/).length,
    ).toBeLessThanOrEqual(12);
  }
  expect(
    await dimensions(
      page
        .getByRole("region", { name: "More to Explore" })
        .getByRole("listitem")
        .first(),
    ),
  ).toEqual(homepage);
});

test("related images share the action destination and homepage hover transition", async ({
  page,
  isMobile,
}) => {
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
  if (!isMobile) {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const photograph = imageLink.getByRole("img");
    const restingWidth = await photograph.evaluate(
      (image) => image.getBoundingClientRect().width,
    );
    await imageLink.hover();
    const action = firstCard.getByRole("link").filter({
      hasNot: page.getByRole("img"),
    });
    const arrow = action.locator("svg.lucide-arrow-right");
    await expect(arrow).toHaveCSS("transform", "matrix(1, 0, 0, 1, 3, 0)");
    await expect(action).toHaveCSS("text-decoration-line", "underline");
    await expect(
      related.getByRole("listitem").nth(1).locator("svg.lucide-arrow-right"),
    ).toHaveCSS("transform", "none");
    await expect
      .poll(() =>
        photograph.evaluate((image) => image.getBoundingClientRect().width),
      )
      .toBeCloseTo(restingWidth * 1.05, 1);
    await expect(imageLink.getByRole("img")).toHaveCSS(
      "transition-duration",
      "0.3s",
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(arrow).toHaveCSS("transform", "none");
    await expect
      .poll(() =>
        photograph.evaluate((image) => image.getBoundingClientRect().width),
      )
      .toBeCloseTo(restingWidth, 1);
    await expect(photograph).toHaveCSS("transition-property", "none");
  }
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
  await expect(
    related.getByRole("heading", { name: "More to Explore", exact: true }),
  ).toHaveCSS("font-family", /DM[_ ]Sans/);
  await expect(
    related.getByRole("heading", { name: "More to Explore", exact: true }),
  ).toHaveCSS("font-weight", "500");
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
    await expect(related.locator("ul")).toHaveCSS("row-gap", "40px");
    const bounds = await cards.evaluateAll((elements) =>
      elements.map((element) => {
        const { top, bottom, left, width } = element.getBoundingClientRect();
        return { top, bottom, left, width };
      }),
    );
    for (let index = 1; index < bounds.length; index++) {
      expect(bounds[index].top).toBeGreaterThan(bounds[index - 1].bottom);
      expect(bounds[index].left).toBeCloseTo(bounds[0].left, 0);
      expect(bounds[index].width).toBeCloseTo(bounds[0].width, 0);
    }

    for (const card of await cards.all()) {
      await card.scrollIntoViewIfNeeded();
      await expect(card).toBeInViewport();
    }
  } else {
    await related.scrollIntoViewIfNeeded();
    async function expectAlignedActions() {
      const actionPositions = await related
        .getByRole("link", { name: "Find Out More", exact: true })
        .evaluateAll((links) =>
          links.map((link) => link.getBoundingClientRect().top),
        );
      expect(actionPositions).toHaveLength(3);
      expect(
        Math.max(...actionPositions) - Math.min(...actionPositions),
      ).toBeLessThan(1);
      for (const card of await related.getByRole("listitem").all()) {
        const imageHeight = await card
          .getByRole("img")
          .evaluate((image) => image.getBoundingClientRect().height);
        const imageWidth = await card
          .getByRole("img")
          .evaluate((image) => image.getBoundingClientRect().width);
        if ((page.viewportSize()?.width ?? 0) >= 1280) {
          expect(imageWidth).toBe(160);
          expect(imageHeight).toBe(185);
        } else expect(imageHeight).toBeCloseTo((imageWidth * 4) / 3 - 2, 1);
      }
    }
    await expectAlignedActions();
    await expect(previous).toBeDisabled();
    await expect(first).toBeInViewport();
    await expect(last).toBeInViewport();
    await expect(next).toBeDisabled();

    await page.setViewportSize({ width: 768, height: 900 });
    await related.scrollIntoViewIfNeeded();
    await expectAlignedActions();
    await expect(previous).toBeDisabled();
    await expect(next).toBeEnabled();
    await expect(last).not.toBeInViewport();
    const middle = related.getByRole("listitem").nth(1);
    await next.click();
    await expect(middle).toBeInViewport({ ratio: 1 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await next.focus();
    await page.keyboard.press("Shift+Tab");
    await expect(previous.locator("svg")).toHaveCSS(
      "transform",
      "matrix(1, 0, 0, 1, -3, 0)",
    );
    await previous.blur();
    await previous.hover();
    await expect(previous.locator("svg")).toHaveCSS(
      "transform",
      "matrix(1, 0, 0, 1, -3, 0)",
    );
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
    ["lobster-season", "/menus/wine"],
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
    ).toHaveAttribute("href", "/menus/dinner");
    await expect(
      menu.getByRole("link", { name: "Find Out More", exact: true }),
    ).toHaveAttribute("href", secondHref);
    const imageLinks = menu.getByRole("link").filter({
      has: page.getByRole("img"),
    });
    await expect(imageLinks).toHaveCount(2);
    await expect(imageLinks.first()).toHaveAttribute("href", "/menus/dinner");
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
  ).toHaveAttribute("href", "/menus/dinner");
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
  ).toHaveAttribute("href", "/menus/wine");
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
