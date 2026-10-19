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
