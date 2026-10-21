import { expect, test } from "./menu-test";

import { seasonalFixtures, seasonalPageFixture } from "./seasonal-fixtures";

const eventPath = "/seasonal/rugby-at-peploes";

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

test("event enquiry and contact links reach Visit & Contact", async ({
  page,
}) => {
  for (const name of [
    "Make an Inquiry",
    seasonalPageFixture.join.contactAction,
  ]) {
    await page.goto(eventPath);
    const contact = page
      .getByRole("main")
      .getByRole("link", { name, exact: true });
    await expect(contact).toHaveAttribute("href", "/visit-contact");
    await contact.click();
    await expect(page).toHaveURL("/visit-contact");
    await expect(
      page.getByRole("heading", {
        name: "Step down from the city.",
        level: 1,
      }),
    ).toBeVisible();
  }
});

test("booking actions remain unavailable until their booking flow is connected", async ({
  page,
}) => {
  await page.goto(eventPath);
  const main = page.getByRole("main");

  for (const name of [
    "Book this Experience",
    seasonalPageFixture.join.bookingAction,
  ]) {
    const actions = main.getByRole("button", { name, exact: true });
    await expect(actions.first()).toBeVisible();
    for (const action of await actions.all()) {
      await expect(action).toHaveAttribute("type", "button");
      await expect(action).toHaveAttribute("aria-disabled", "true");
      await action.focus();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(eventPath);
      await expect(page.getByRole("dialog")).toHaveCount(0);
    }
  }
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
      expect(bounds[index].left).toBeCloseTo(bounds[0].left, 0);
      expect(bounds[index].width).toBeCloseTo(bounds[0].width, 0);
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
    await next.click();
    await expect(last).toBeInViewport();
    await expect(next).toBeDisabled();
    await previous.click();
    await expect(first).toBeInViewport();
    await expect(previous).toBeDisabled();
  }
});

test("menu and related event links open their published destinations", async ({
  page,
}) => {
  await page.goto(eventPath);
  await expect(
    page
      .getByRole("main")
      .getByRole("link", { name: "View Menu", exact: true }),
  ).toHaveAttribute("href", "/menus/dinner");
  const related = page.getByRole("region", { name: "More to Explore" });
  await related.getByRole("link").first().click();
  await expect(page).toHaveURL("/seasonal/italian-wine-dinner");
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
  await page.goto("/seasonal/italian-wine-dinner");
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
  await expect(enquiry).toHaveAttribute("href", "/visit-contact");
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
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
});
