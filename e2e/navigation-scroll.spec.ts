import { expect, test } from "./menu-test";

for (const destination of [
  { label: "Menus", path: "/menus" },
  { label: "Visit & Contact", path: "/visit-contact" },
]) {
  test(`${destination.label} opens at the top without a footer flash`, async ({
    page,
    isMobile,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const previousScroll = await page.evaluate(() => scrollY);
    expect(previousScroll).toBeGreaterThan(1000);

    let navigation = page.getByRole("navigation", {
      name: "Main navigation",
      exact: true,
    });
    let label = destination.label;
    if (isMobile) {
      await navigation.getByRole("button", { name: "Open menu" }).click();
      navigation = page.getByRole("dialog", { name: "Navigation menu" });
      if (destination.path === "/menus") {
        await navigation
          .getByRole("button", { name: "Menus", exact: true })
          .click();
        label = "Lunch";
      }
    }

    const samples = await page.evaluateHandle(() => {
      const previousMain = document.querySelector("main");
      const positions: number[] = [];
      let frame = 0;
      function sample() {
        const main = document.querySelector("main");
        if (main && main !== previousMain && main.getClientRects().length) {
          positions.push(scrollY);
        }
        frame = requestAnimationFrame(sample);
      }
      sample();
      return {
        stop: () => {
          cancelAnimationFrame(frame);
          return positions;
        },
      };
    });
    await navigation.getByRole("link", { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${destination.path}(\\?.*)?$`));
    await expect(page.getByRole("heading", { level: 1 })).toBeInViewport();
    const positions = await samples.evaluate(async (recorder) => {
      await new Promise(requestAnimationFrame);
      return recorder.stop();
    });
    await samples.dispose();
    expect(positions.length).toBeGreaterThan(0);
    expect(Math.max(...positions)).toBe(0);

    await page.evaluate(() => window.scrollTo(0, 300));
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(300);
    await page.goBack();
    await expect(page).toHaveURL("/");
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(previousScroll);
    await page.goForward();
    await expect(page).toHaveURL(new RegExp(`${destination.path}(\\?.*)?$`));
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(300);
  });
}
