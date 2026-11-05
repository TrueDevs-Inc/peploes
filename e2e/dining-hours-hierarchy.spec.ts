import { expect, test } from "@playwright/test";

test("dining service headings are distinct from their times", async ({
  page,
}) => {
  await page.goto("/visit-contact");
  const dining = page.getByRole("region", { name: "When to join us." });
  await dining.scrollIntoViewIfNeeded();
  for (const service of await dining.getByRole("listitem").all()) {
    await service.scrollIntoViewIfNeeded();
    const heading = service.getByRole("heading", { level: 3 });
    const hours = service.locator("p").first();
    const headingStyle = await heading.evaluate((element) => ({
      size: Number.parseFloat(getComputedStyle(element).fontSize),
      family: getComputedStyle(element).fontFamily,
    }));
    const hoursStyle = await hours.evaluate((element) => ({
      size: Number.parseFloat(getComputedStyle(element).fontSize),
      family: getComputedStyle(element).fontFamily,
    }));
    expect(headingStyle.size).toBeGreaterThan(hoursStyle.size);
    expect(headingStyle.family).not.toBe(hoursStyle.family);
  }
  await expect(dining.getByRole("heading", { level: 3 })).toHaveCount(4);
});
