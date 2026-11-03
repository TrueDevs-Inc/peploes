import { expect, test } from "./menu-test";

test("wine index has a desktop gap and animates opening and closing", async ({
  page,
  viewport,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/menus?menu=wine");
  const index = page.locator("details").filter({
    has: page.locator("summary", { hasText: "Browse the wine list" }),
  });
  const navigation = index.getByRole("navigation");
  await expect(navigation).toBeVisible();
  if ((viewport?.width ?? 1440) >= 1280) {
    const gap = await index.evaluate((element) => {
      const button = element.querySelector("summary");
      const panel = element.querySelector("nav");
      if (!button || !panel) throw new Error("Wine index is incomplete");
      return (
        panel.getBoundingClientRect().top -
        button.getBoundingClientRect().bottom
      );
    });
    expect(gap).toBeGreaterThanOrEqual(12);
    const panelBounds = await navigation.boundingBox();
    const summaryBounds = await index.locator("summary").boundingBox();
    const closeBounds = await index
      .getByRole("button", { name: "Close wine list" })
      .boundingBox();
    if (!panelBounds || !summaryBounds || !closeBounds)
      throw new Error("Wine index is not visible");
    expect(Math.abs(closeBounds.y - summaryBounds.y)).toBeLessThanOrEqual(1);
    expect(closeBounds.y + closeBounds.height).toBeLessThan(panelBounds.y);
    expect(closeBounds.x + closeBounds.width).toBeLessThanOrEqual(
      panelBounds.x + panelBounds.width,
    );
  }
  for (const open of [false, true]) {
    const animated = await index.evaluate(
      async (element, useCloseButton) => {
        const control = element.querySelector<HTMLElement>(
          useCloseButton ? "button" : "summary",
        );
        if (!control) throw new Error("Wine index control is missing");
        control.click();
        const start = performance.now();
        let intermediateOpacity = false;
        while (performance.now() - start < 500) {
          await new Promise(requestAnimationFrame);
          const opacity = Number(
            getComputedStyle(element, "::details-content").opacity,
          );
          intermediateOpacity ||= opacity > 0 && opacity < 1;
        }
        return intermediateOpacity;
      },
      !open && (viewport?.width ?? 1440) >= 1280,
    );
    expect(animated).toBe(true);
    await expect(index).toHaveJSProperty("open", open);
    if (!open && (viewport?.width ?? 1440) >= 1280) {
      await expect(index.locator("summary")).toBeFocused();
    }
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await index.locator("summary").click();
  await expect(navigation).toBeHidden();
});
