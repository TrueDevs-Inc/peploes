import { expect, test } from "./menu-test";

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test(`wine index can close and reopen with ${reducedMotion} motion`, async ({
    page,
    viewport,
  }) => {
    await page.emulateMedia({ reducedMotion });
    await page.goto("/menus?menu=wine");
    const index = page.locator("details").filter({
      has: page.locator("summary", { hasText: "Browse the wine list" }),
    });
    const navigation = index.getByRole("navigation");
    const summary = index.locator("summary");
    await expect(navigation).toBeVisible();
    if ((viewport?.width ?? 1440) >= 1280) {
      await index.getByRole("button", { name: "Close wine list" }).click();
      await expect(summary).toBeFocused();
    } else await summary.click();
    await expect(navigation).toBeHidden();
    await summary.focus();
    await summary.press("Enter");
    await expect(navigation).toBeVisible();
    await summary.press("Space");
    await expect(navigation).toBeHidden();
  });
}
