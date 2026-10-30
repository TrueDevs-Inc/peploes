import { expect, test } from "@playwright/test";

const destinations = [
  "/private-dining/groups-celebrations",
  "/private-dining/corporate-events",
  "/private-dining/weddings",
];

test("occasion photographs open the same pages as their actions", async ({
  page,
}) => {
  for (const destination of destinations) {
    await page.goto("/private-dining");
    const photograph = page.locator(`main a[href="${destination}"]`).filter({
      has: page.getByRole("img"),
    });
    await expect(photograph).toHaveCount(1);
    await photograph.click();
    await expect(page).toHaveURL(destination);
  }
});

test("photograph hover animates its image and action arrow together", async ({
  page,
  isMobile,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/private-dining");
  for (const destination of destinations) {
    const image = page.locator(`a[href="${destination}"] img`);
    const card = page.locator("main li").filter({ has: image });
    const action = card.getByRole("link", {
      name: "Find out more",
      exact: true,
    });
    const arrow = action.locator("svg");
    const photograph = card.getByRole("link").first();
    if (isMobile) {
      await photograph.focus();
    } else {
      await image.hover();
    }
    await expect(image).toHaveCSS(
      "transform",
      "matrix(1.05, 0, 0, 1.05, 0, 0)",
    );
    await expect(arrow).toHaveCSS("transform", "matrix(1, 0, 0, 1, 3, 0)");
    await expect(action).toHaveCSS("text-decoration-line", "underline");
    await expect(image).not.toHaveCSS("transition-duration", "0s");
    await action.focus();
    if (!isMobile) await action.hover();
    await expect(image).toHaveCSS("transform", "none");
    await expect(arrow).toHaveCSS("transform", "matrix(1, 0, 0, 1, 3, 0)");
    await page.emulateMedia({ reducedMotion: "reduce" });
    if (isMobile) {
      await photograph.focus();
    } else {
      await image.hover();
    }
    await expect(image).toHaveCSS("transform", "none");
    await expect(arrow).toHaveCSS("transform", "none");
    await page.emulateMedia({ reducedMotion: "no-preference" });
  }
});
