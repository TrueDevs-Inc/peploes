import { expect, test } from "./menu-test";

const sections = [
  { route: "/our-story", text: "Peploe’s sits in a beautiful listed Georgian" },
  { route: "/", text: "From long lunches to special celebrations" },
  { route: "/menus", text: "Seasonal Irish ingredients, familiar favourites" },
  { route: "/contact", text: "Peploe’s is wheelchair accessible" },
  { route: "/seasonal", text: "During the warmer months, enjoy drinks" },
  {
    route: "/private-dining",
    text: "From long lunches and family celebrations",
  },
  {
    route: "/private-dining/groups-celebrations",
    text: "From birthdays and anniversaries to long lunches",
    maxWidth: 740,
  },
  {
    route: "/private-dining/weddings",
    text: "Champagne and welcome drinks",
  },
];

for (const { route, text, maxWidth } of sections) {
  test(`${route} descriptive copy uses its content column`, async ({
    page,
    isMobile,
  }) => {
    const widthsToCheck = isMobile
      ? [page.viewportSize()?.width ?? 390]
      : [768, 1440];
    for (const width of widthsToCheck) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route);
      await page.evaluate(() => document.fonts.ready);
      const paragraph = page
        .locator("main p")
        .filter({ hasText: text })
        .first();
      if (route === "/private-dining" && width < 640) {
        await expect(paragraph).toBeHidden();
      } else {
        await expect(paragraph).toBeVisible();
        await expect(paragraph).toHaveCSS("white-space", "normal");
        const widths = await paragraph.evaluate((element) => {
          const parent = element.parentElement;
          if (!parent) throw new Error("Paragraph has no content column");
          const style = getComputedStyle(parent);
          return {
            paragraph: element.getBoundingClientRect().width,
            column:
              parent.clientWidth -
              Number.parseFloat(style.paddingLeft) -
              Number.parseFloat(style.paddingRight),
          };
        });
        expect(
          Math.abs(
            widths.paragraph - Math.min(widths.column, maxWidth ?? Infinity),
          ),
        ).toBeLessThan(2);
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
  });
}
