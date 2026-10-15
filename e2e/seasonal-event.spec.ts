import { expect, test } from "@playwright/test";

const eventPath = "/seasonal/rugby-at-peploes";

test("each diary destination serves the approved template without indexing placeholder copy", async ({
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
        name: "Campaign/Event Title",
        level: 1,
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /\bnoindex\b/,
    );
  }

  const missingEvent = await page.goto("/seasonal/not-an-event");
  expect(missingEvent?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "Campaign/Event Title", level: 1 }),
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
    name: "Campaign/Event Title",
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
  for (const name of ["Make an Inquiry", "Contact Us"]) {
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

test("unfinished menu, related and booking actions remain inert placeholders", async ({
  page,
}) => {
  await page.goto(eventPath);
  const main = page.getByRole("main");

  for (const name of [
    "View Menu",
    "Find Out More",
    "Book this Experience",
    "Book a Table",
  ]) {
    const actions = main.getByRole("button", { name, exact: true });
    expect(await actions.count()).toBeGreaterThan(0);
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
    name: "Related Campaign",
    exact: true,
  });
  const last = related.getByRole("heading", {
    name: "Special Event",
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
