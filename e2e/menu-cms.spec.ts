import { expect, test } from "./menu-test";

test("menu navigation keeps its height when switching menus", async ({
  page,
}) => {
  await page.goto("/menus/lunch");
  const navigation = page.getByRole("navigation", { name: "Restaurant menus" });
  const originalHeight = await navigation.evaluate(
    (element) => element.getBoundingClientRect().height,
  );
  for (const name of ["Wine", "Cocktails", "Dinner", "Pre-Theatre", "Lunch"]) {
    await navigation.getByRole("link", { name, exact: true }).click();
    await expect(
      navigation.getByRole("link", { name, exact: true }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      await navigation.evaluate(
        (element) => element.getBoundingClientRect().height,
      ),
    ).toBe(originalHeight);
  }
});

test("mobile navigation leaves the next menu tab half visible", async ({
  page,
  isMobile,
}) => {
  const widths = isMobile
    ? [page.viewportSize()?.width ?? 390]
    : [320, 360, 390, 430, 480, 640, 768, 1024];
  await page.goto("/menus/lunch");
  const navigation = page.getByRole("navigation", { name: "Restaurant menus" });
  const strip = navigation.locator(":scope > div").first();
  // The shared CMS fixture uses identical labels; include the longer live label.
  await navigation
    .getByRole("button")
    .first()
    .evaluate((button) => {
      if (button.firstChild) button.firstChild.textContent = "Group Set Menu";
    });
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    await strip.evaluate((element) => {
      element.scrollLeft = 0;
    });
    const visibleFraction = () =>
      strip.evaluate((element) => {
        const edge = element.getBoundingClientRect().right;
        const clipped = Array.from(element.querySelectorAll("li"))
          .map((tab) => tab.getBoundingClientRect())
          .find((tab) => tab.left < edge && tab.right > edge);
        return clipped ? (edge - clipped.left) / clipped.width : 0;
      });
    if (width < 640) {
      await expect.poll(visibleFraction).toBeCloseTo(0.5, 1);
    } else {
      await expect.poll(visibleFraction).toBeGreaterThan(0);
      await expect.poll(visibleFraction).toBeLessThan(1);
    }
    await expect
      .poll(() =>
        strip.evaluate((element) => {
          return Array.from(
            element.querySelectorAll("li > a, li > button"),
          ).every((control) => {
            const text = control.firstChild;
            if (!text) return false;
            const range = document.createRange();
            range.selectNodeContents(text);
            return (
              range.getClientRects().length === 1 &&
              control.scrollWidth <= control.clientWidth &&
              control.getBoundingClientRect().height === 48
            );
          });
        }),
      )
      .toBe(true);
    await expect(strip).toHaveCSS("background-image", "none");
  }
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/menus/wine");
  const wine = navigation.getByRole("link", { name: "Wine", exact: true });
  await expect(wine).toHaveAttribute("aria-current", "page");
  await expect
    .poll(() =>
      strip.evaluate((element) => {
        const tab = element.querySelector('[aria-current="page"]');
        return tab
          ? tab.getBoundingClientRect().left -
              element.getBoundingClientRect().left
          : -1;
      }),
    )
    .toBeCloseTo(8, 0);
  await strip.evaluate((element) => {
    element.scrollLeft = element.scrollWidth;
  });
  await expect
    .poll(() =>
      strip.evaluate((element) => {
        const edge = element.getBoundingClientRect().left;
        const clipped = Array.from(element.querySelectorAll("li"))
          .map((tab) => tab.getBoundingClientRect())
          .find((tab) => tab.left < edge && tab.right > edge);
        return clipped ? (clipped.right - edge) / clipped.width : 0;
      }),
    )
    .toBeGreaterThan(0);
});

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
