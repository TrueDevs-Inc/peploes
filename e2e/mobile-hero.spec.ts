import { expect, test } from "./menu-test";

for (const path of ["/private-dining", "/seasonal"]) {
  test(`${path} mobile hero fills the viewport and grows with its copy`, async ({
    page,
  }) => {
    for (const size of [
      { width: 390, height: 844 },
      { width: 320, height: 740 },
      { width: 390, height: 568 },
    ]) {
      await page.setViewportSize(size);
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      const hero = page.locator("main > section").first();
      const bounds = await hero.boundingBox();
      expect(bounds?.height).toBeGreaterThanOrEqual(size.height - 1);
      const description = hero.locator("p").last();
      const copy = await description.boundingBox();
      if (!bounds || !copy) throw new Error("Hero content is missing");
      expect(copy.y + copy.height).toBeLessThanOrEqual(
        bounds.y + bounds.height,
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
  });
}
