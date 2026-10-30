import { expect, test } from "./menu-test";

test("homepage boxed actions use Figma medium sizing and fit phone layouts", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);

  const hero = page.getByRole("region", { name: /Good food, fine wine/ });
  if (!isMobile) {
    await expect(
      hero.getByRole("link", { name: "Book a Table", exact: true }),
    ).toHaveCSS("width", "156px");
    await expect(
      hero.getByRole("link", { name: "Call Peploe's", exact: true }),
    ).toHaveCSS("width", "136px");
  }

  const actions = [
    page
      .getByRole("region", { name: /Good food, fine wine/ })
      .getByRole("link"),
    page.getByRole("link", { name: "Explore Our Menus", exact: true }),
    page.getByRole("link", { name: "Explore the Wine List", exact: true }),
    page.getByRole("link", { name: "Groups & Occasions", exact: true }),
    page.locator("#book-a-table").getByRole("link"),
  ];

  for (const group of actions) {
    expect(await group.count()).toBeGreaterThan(0);
    for (const action of await group.all()) {
      await expect(action).toHaveCSS("height", "44px");
      await expect(action).toHaveCSS("font-size", "16px");
      await expect(action).toHaveCSS("font-weight", "500");
      await expect(action).toHaveCSS("line-height", "24px");
      await expect(action).toHaveCSS("border-radius", "4px");
      expect(
        await action.evaluate(
          (element) => element.scrollWidth <= element.clientWidth,
        ),
      ).toBe(true);
    }
  }

  const contactActions = page
    .getByRole("region", { name: "Would you prefer to speak to us?" })
    .getByRole("link");
  await expect(contactActions).toHaveCount(2);
  for (const action of await contactActions.all()) {
    await expect(action).toHaveCSS("height", "44px");
    await expect(action).toHaveCSS("font-size", "15px");
    await expect(action).toHaveCSS("line-height", "22px");
    await expect(action).toHaveCSS("padding-left", "16px");
    await expect(action).toHaveCSS("padding-right", "20px");
  }

  if (!isMobile) {
    const navigation = page.getByRole("navigation", {
      name: "Main navigation",
    });
    const booking = navigation.getByRole("link", {
      name: "Book a Table",
      exact: true,
    });
    await expect(booking).toHaveCSS("width", "156px");
    for (const action of [
      booking,
      page.getByRole("button", { name: "Subscribe", exact: true }),
    ]) {
      await expect(action).toHaveCSS("height", "44px");
      await expect(action).toHaveCSS("font-size", "16px");
      await expect(action).toHaveCSS("line-height", "24px");
    }
  }

  if (isMobile) {
    const subscribe = page.getByRole("button", {
      name: "Subscribe",
      exact: true,
    });
    const email = page.locator("#footer-newsletter-email");
    expect((await subscribe.boundingBox())?.width).toBe(
      (await email.boundingBox())?.width,
    );
  }

  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
