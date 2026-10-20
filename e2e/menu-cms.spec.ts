import { expect, test } from "./menu-test";

test("CMS group menu retains its banner layout and inclusion heading", async ({
  page,
  isMobile,
}) => {
  await page.goto("/menus/group-set-menu");
  const banner = page.getByRole("region", { name: "Bring everyone together." });
  await banner.scrollIntoViewIfNeeded();
  await expect(
    banner.getByRole("link", { name: "Enquire About a Group Booking" }),
  ).toHaveAttribute("href", "/private-dining#enquire");
  if (!isMobile) {
    await expect(
      page.getByText("Included with your menu", { exact: true }).first(),
    ).toBeVisible();
    await expect(banner.getByRole("heading")).toHaveCSS("text-align", "left");
    await expect(banner.getByRole("heading")).toHaveCSS("width", "300px");
    await expect(
      page.getByRole("navigation", { name: "Restaurant menus" }),
    ).toHaveCSS("padding-top", "8px");
  }
  for (const image of await page.getByRole("main").getByRole("img").all()) {
    await image.scrollIntoViewIfNeeded();
    await expect(image).toHaveJSProperty("complete", true);
    await expect
      .poll(() =>
        image.evaluate((element) =>
          element instanceof HTMLImageElement ? element.naturalWidth : 0,
        ),
      )
      .toBeGreaterThan(0);
  }
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
});

test("identically labeled collections open their own links and restore focus on Escape", async ({
  page,
}) => {
  await page.goto("/menus/lunch");
  const navigation = page.getByRole("navigation", { name: "Restaurant menus" });
  const triggers = navigation.getByRole("button", {
    name: "Special menus",
    exact: true,
  });
  await expect(triggers).toHaveCount(2);

  const destinations = [
    [
      "/menus/group-set-menu#group-set-lunch",
      "/menus/group-set-menu#group-set-dinner",
    ],
    [
      "/menus/seasonal#set-christmas-lunch",
      "/menus/seasonal#set-christmas-dinner",
    ],
  ];
  for (const [index, hrefs] of destinations.entries()) {
    const trigger = triggers.nth(index);
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(triggers.nth(1 - index)).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    const dropdown = navigation.getByRole("list", { name: "Special menus" });
    const links = dropdown.getByRole("link");
    await expect(links).toHaveCount(hrefs.length);
    for (const [linkIndex, href] of hrefs.entries()) {
      await expect(links.nth(linkIndex)).toHaveAttribute("href", href);
    }
    await links.first().focus();
    await page.keyboard.press("Escape");
    await expect(dropdown).toHaveCount(0);
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger).toBeFocused();
  }
});
