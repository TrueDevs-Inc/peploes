import { expect, test } from "./menu-test";

test("homepage event action supports keyboard activation", async ({ page }) => {
  await page.goto("/");
  const action = page.getByRole("link", {
    name: "View what’s on",
    exact: true,
  });
  await action.focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  await expect(action).toBeFocused();
  await expect
    .poll(() => action.evaluate((element) => element.matches(":focus-visible")))
    .toBe(true);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/seasonal");
});
