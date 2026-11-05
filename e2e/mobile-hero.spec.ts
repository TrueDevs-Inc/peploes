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
      const hero = page
        .getByRole("heading", { level: 1 })
        .locator("xpath=ancestor::section[1]");
      const bounds = await hero.boundingBox();
      expect(bounds?.height).toBeGreaterThanOrEqual(size.height - 1);
      const description = hero.locator("p").last();
      await expect(description).toBeHidden();
      const copy = await hero.getByRole("heading", { level: 1 }).boundingBox();
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
