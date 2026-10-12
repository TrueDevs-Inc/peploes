import { expect, test } from "@playwright/test";

test("Our Story loads its photographs without stretching or horizontal overflow", async ({
  page,
}) => {
  await page.goto("/our-story");
  const main = page.getByRole("main");
  await expect(
    main.getByRole("heading", {
      name: /A family restaurant,\s+more than two decades on\./,
      level: 1,
    }),
  ).toBeVisible();

  const photographs = main.getByRole("img");
  await expect(photographs).toHaveCount(5);
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

test("the home family story card opens Our Story", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("main")
    .getByRole("link", { name: "Discover Our Story", exact: true })
    .click();

  await expect(page).toHaveURL("/our-story");
  await expect(
    page.getByRole("heading", {
      name: /A family restaurant,\s+more than two decades on\./,
      level: 1,
    }),
  ).toBeVisible();
});

test("Our Story navigation closes the mobile menu and shows its desktop active state", async ({
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
    await menu.getByRole("link", { name: "Our Story", exact: true }).click();
    await expect(page).toHaveURL("/our-story");
    await expect(menu).not.toBeVisible();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  } else {
    const story = navigation.getByRole("link", {
      name: "Our Story",
      exact: true,
    });
    await story.click();
    await page.mouse.move(0, 0);
    await expect(page).toHaveURL("/our-story");
    await expect(story).toHaveAttribute("aria-current", "page");
    await expect(story).toHaveCSS("color", "rgb(122, 30, 36)");
    await expect(story).toHaveCSS("text-decoration-line", "underline");

    await navigation.getByRole("link", { name: "Peploe’s home" }).click();
    await page.mouse.move(0, 0);
    await expect(page).toHaveURL("/");
    await expect(story).not.toHaveAttribute("aria-current", "page");
    await expect(story).toHaveCSS("color", "rgb(46, 42, 40)");
  }
});

test("the footer reaches Our Story and Our Location reaches Visit & Contact", async ({
  page,
}) => {
  await page.goto("/visit-contact");
  await page
    .getByRole("contentinfo")
    .getByRole("link", { name: "Our Story", exact: true })
    .click();
  await expect(page).toHaveURL("/our-story");

  const location = page
    .getByRole("main")
    .getByRole("link", { name: "Our Location", exact: true });
  await expect(location).toHaveAttribute("href", "/visit-contact#find-us");
  await location.click();
  await expect(page).toHaveURL("/visit-contact#find-us");
  await expect(page.locator("#find-us")).toBeInViewport();
});

test("unbuilt story and booking actions remain clearly marked placeholders", async ({
  page,
}) => {
  await page.goto("/our-story");
  const main = page.getByRole("main");

  for (const name of [
    "Discover the Mural Story",
    "Explore the Archive",
    "Book a Table",
  ]) {
    const action = main.getByRole("button", { name, exact: true });
    await expect(action).toHaveAttribute("type", "button");
    await expect(action).toHaveAttribute("aria-disabled", "true");
    await action.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL("/our-story");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  }
});
