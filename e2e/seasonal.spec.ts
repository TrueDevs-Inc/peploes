import { expect, test } from "@playwright/test";

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

test("the homepage What's On link reaches the hub and Contact Us reaches Visit & Contact", async ({
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
    .getByRole("link", { name: "Contact Us", exact: true })
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
      .getByRole("button", { name: "Menus", exact: true })
      .click();
    await navigation
      .getByRole("link", { name: "Seasonal", exact: true })
      .click();
  }

  await expect(page).toHaveURL("/menus/seasonal");
  await expect(
    page.getByRole("heading", { name: "Seasonal Menus", level: 1 }),
  ).toBeVisible();
});

test("diary entries link to their individual event pages while booking remains unavailable", async ({
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

  const booking = main.getByRole("button", {
    name: "Book a Table",
    exact: true,
  });
  await expect(booking).toHaveAttribute("type", "button");
  await expect(booking).toHaveAttribute("aria-disabled", "true");
  await booking.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/seasonal");
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await eventLinks.first().click();
  await expect(page).toHaveURL("/seasonal/rugby-at-peploes");
  await expect(
    main.getByRole("heading", {
      name: "Campaign/Event Title",
      level: 1,
      exact: true,
    }),
  ).toBeVisible();
});
