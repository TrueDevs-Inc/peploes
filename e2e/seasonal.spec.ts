import { expect, test } from "./menu-test";
import { seasonalPageFixture } from "./seasonal-fixtures";

test("What's On loads its photographs without stretching or horizontal overflow", async ({
  page,
}) => {
  await page.goto("/seasonal");
  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { level: 1 })).toBeVisible();

  const photographs = main.getByRole("img");
  await expect(photographs).toHaveCount(3);
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

test("What's On navigation closes the mobile menu and marks the desktop link as current", async ({
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
    await menu.getByRole("link", { name: "What’s On", exact: true }).click();
    await expect(page).toHaveURL("/seasonal");
    await expect(menu).not.toBeVisible();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  } else {
    const whatsOn = navigation.getByRole("link", {
      name: "What’s On",
      exact: true,
    });
    await whatsOn.click();
    await page.mouse.move(0, 0);
    await expect(page).toHaveURL("/seasonal");
    await expect(whatsOn).toHaveAttribute("aria-current", "page");
    await expect(whatsOn).toHaveCSS("color", "rgb(122, 30, 36)");
    await expect(whatsOn).toHaveCSS("text-decoration-line", "underline");

    await navigation.getByRole("link", { name: "Peploe’s home" }).click();
    await page.mouse.move(0, 0);
    await expect(page).toHaveURL("/");
    await expect(whatsOn).not.toHaveAttribute("aria-current", "page");
    await expect(whatsOn).toHaveCSS("color", "rgb(46, 42, 40)");
  }
});

test("the homepage What's On link reaches the hub and its contact action reaches Visit & Contact", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("main")
    .getByRole("link", { name: "View what’s on", exact: true })
    .click();
  await expect(page).toHaveURL("/seasonal");

  await page
    .getByRole("main")
    .getByRole("link", {
      name: seasonalPageFixture.join.contactAction,
      exact: true,
    })
    .click();
  await expect(page).toHaveURL("/visit-contact");
  await expect(
    page.getByRole("heading", { name: "Step down from the city.", level: 1 }),
  ).toBeVisible();
});

test("the Seasonal menu remains a separate destination from What's On", async ({
  page,
  isMobile,
}) => {
  await page.goto("/seasonal");
  const navigation = page.getByRole("navigation", {
    name: "Main navigation",
    exact: true,
  });

  if (isMobile) {
    await navigation.getByRole("button", { name: "Open menu" }).click();
    const menu = page.getByRole("dialog", { name: "Navigation menu" });
    await menu.getByRole("button", { name: "Menus", exact: true }).click();
    await menu.getByRole("link", { name: "Seasonal", exact: true }).click();
    await expect(menu).not.toBeVisible();
  } else {
    await navigation
      .getByRole("link", { name: "Menus", exact: true })
      .press("ArrowDown");
    await navigation
      .getByRole("link", { name: "Seasonal", exact: true })
      .click();
  }

  await expect(page).toHaveURL("/menus/seasonal");
  await expect(
    page.getByRole("heading", { name: "Seasonal Menus", level: 1 }),
  ).toBeVisible();
});

test("diary entries and booking actions open their respective pages", async ({
  page,
}) => {
  await page.goto("/seasonal");
  const main = page.getByRole("main");
  const diary = main.getByRole("region", { name: "In the diary." });
  const eventLinks = diary.getByRole("link");
  await expect(eventLinks).toHaveCount(6);
  const destinations = [
    "/seasonal/rugby-at-peploes",
    "/seasonal/italian-wine-dinner",
    "/seasonal/christmas-at-peploes",
    "/seasonal/sunday-at-peploes",
    "/seasonal/lobster-season",
    "/seasonal/new-years-eve",
  ];
  for (const [index, destination] of destinations.entries()) {
    await expect(eventLinks.nth(index)).toHaveAttribute("href", destination);
  }

  const booking = main.getByRole("link", {
    name: seasonalPageFixture.join.bookingAction,
    exact: true,
  });
  await expect(booking).toHaveAttribute("href", "/book-a-table");
  await booking.click();
  await expect(page).toHaveURL("/book-a-table");
  await expect(
    page.getByRole("heading", { name: "A table at Peploe’s.", level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Table reservations" }),
  ).toBeVisible();
  await page.goto("/seasonal");

  await eventLinks.first().click();
  await expect(page).toHaveURL("/seasonal/rugby-at-peploes");
  await expect(
    main.getByRole("heading", {
      name: "Rugby at Peploe’s",
      level: 1,
      exact: true,
    }),
  ).toBeVisible();
});

test("shared closing banners fit long CMS labels and retain original short-label dimensions", async ({
  page,
}) => {
  for (const pathname of ["/seasonal", "/seasonal/rugby-at-peploes"]) {
    await page.goto(pathname);
    await page.evaluate(() => document.fonts.ready);
    const banner = page.getByRole("region", {
      name: seasonalPageFixture.join.heading,
    });
    const actions = [
      banner.getByRole("link", {
        name: seasonalPageFixture.join.bookingAction,
        exact: true,
      }),
      banner.getByRole("link", {
        name: seasonalPageFixture.join.contactAction,
        exact: true,
      }),
    ];
    for (const action of actions) {
      await action.scrollIntoViewIfNeeded();
      await expect(action).toBeVisible();
      await expect
        .poll(() =>
          action.evaluate((element) => {
            const button = element.getBoundingClientRect();
            const content = document.createRange();
            content.selectNodeContents(element);
            return (
              button.height >= 44 &&
              button.left >= 0 &&
              button.right <= document.documentElement.clientWidth &&
              Array.from(content.getClientRects()).every(
                (rect) =>
                  rect.left >= button.left &&
                  rect.right <= button.right &&
                  rect.top >= button.top &&
                  rect.bottom <= button.bottom,
              )
            );
          }),
        )
        .toBe(true);
    }
    const booking = await actions[0].boundingBox();
    const contact = await actions[1].boundingBox();
    expect(booking).not.toBeNull();
    expect(contact).not.toBeNull();
    if (booking && contact) {
      expect(
        contact.y >= booking.y + booking.height ||
          contact.x >= booking.x + booking.width,
      ).toBe(true);
    }
    // Keep the original labels as a second layout case on the same rendered controls.
    for (const [index, label] of ["Book a Table", "Contact Us"].entries()) {
      await actions[index].evaluate((element, value) => {
        const text = document
          .createTreeWalker(element, NodeFilter.SHOW_TEXT)
          .nextNode();
        if (!text) throw new Error("Button label is missing");
        text.textContent = value;
      }, label);
    }
    const shortBooking = banner.getByRole("link", {
      name: "Book a Table",
      exact: true,
    });
    const shortContact = banner.getByRole("link", {
      name: "Contact Us",
      exact: true,
    });
    await expect(shortBooking).toHaveCSS("height", "44px");
    await expect(shortContact).toHaveCSS("height", "44px");
    if ((page.viewportSize()?.width ?? 0) >= 640) {
      await expect(shortBooking).toHaveCSS("width", "156px");
      await expect(shortContact).toHaveCSS("width", "148px");
      const booking = await shortBooking.boundingBox();
      const contact = await shortContact.boundingBox();
      expect(
        booking && contact && contact.x - booking.x - booking.width,
      ).toBeCloseTo(20, 0);
    }
  }
});
