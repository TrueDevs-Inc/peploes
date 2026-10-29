import type { Locator } from "@playwright/test";
import { expect, test } from "./menu-test";

function footerAppearance(footer: Locator) {
  return footer.evaluate((element) =>
    [element, ...element.querySelectorAll("*")].map((item) => {
      const style = getComputedStyle(item);
      return {
        display: style.display,
        order: style.order,
        columns: style.gridTemplateColumns,
        gap: style.gap,
        padding: style.padding,
        margin: style.margin,
        font: style.font,
        color: style.color,
        border: style.border,
        width: style.width,
        height: style.height,
      };
    }),
  );
}

test("every public page uses the homepage footer layout and content", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const footer = page.getByRole("contentinfo");
  await expect(footer).toHaveCount(1);
  await expect(footer).toHaveCSS("border-top-width", "0px");
  await expect(page.getByRole("banner")).toHaveCSS(
    "box-shadow",
    /rgb\(217, 209, 198\) 0px -1px 0px 0px inset/,
  );
  const appearance = await footerAppearance(footer);
  const content = await footer.textContent();

  for (const path of [
    "/menus",
    "/menus?menu=lunch",
    "/menus?menu=dinner",
    "/menus?menu=pre-theatre",
    "/menus?menu=wine",
    "/menus?menu=cocktails",
    "/menus?menu=group-set-menu",
    "/menus?menu=seasonal",
    "/our-story",
    "/book-a-table",
    "/visit-contact",
    "/private-dining",
    "/private-dining/groups-celebrations",
    "/private-dining/corporate-events",
    "/private-dining/weddings",
    "/seasonal",
    "/seasonal/lobster-season",
    "/privacy-cookies",
    "/privacy-policy",
    "/terms-conditions",
    "/accessibility-policy",
    "/booking-cancellation-terms",
  ]) {
    await test.step(path, async () => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await page.evaluate(() => document.fonts.ready);
      await expect(footer).toHaveCount(1);
      expect(await footer.textContent()).toBe(content);
      expect(await footerAppearance(footer)).toEqual(appearance);
    });
  }
});
