import type { Page } from "@playwright/test";

export async function passWine(page: Page) {
  await page.locator("#wine").scrollIntoViewIfNeeded();
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await page.evaluate(() => {
    const wine = document.querySelector("#wine");
    if (wine)
      window.scrollTo(
        0,
        window.scrollY + wine.getBoundingClientRect().bottom + 10,
      );
  });
}
