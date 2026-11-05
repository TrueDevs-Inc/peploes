import { expect, test } from "@playwright/test";

for (const path of [
  "/",
  "/contact",
  "/private-dining",
  "/private-dining/groups-celebrations",
  "/private-dining/corporate-events",
  "/private-dining/weddings",
  "/our-story",
  "/seasonal",
  "/menus",
  "/book-a-table",
  "/privacy-cookies",
]) {
  test(`${path} paired buttons have matching dimensions at every breakpoint`, async ({
    page,
  }) => {
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);
    for (const width of [320, 390, 640, 768, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const pairs = await page.evaluate(() => {
        const buttons = Array.from(
          document.querySelectorAll<HTMLElement>('[data-slot="button"]'),
        );
        const parents = new Set(
          buttons
            .filter((button) => button.checkVisibility())
            .map((button) => button.parentElement),
        );
        return Array.from(parents).flatMap((parent) => {
          if (!parent) return [];
          const controls = Array.from(parent.children).filter(
            (element) =>
              element.matches('[data-slot="button"]') &&
              element.checkVisibility(),
          );
          if (
            controls.length !== 2 ||
            controls.some(
              (control) =>
                !control.textContent?.trim() ||
                ![
                  "brand-primary",
                  "brand-primary-inverse",
                  "brand-secondary-inverse",
                  "brand-contact",
                ].includes(control.getAttribute("data-variant") ?? ""),
            )
          )
            return [];
          return [
            {
              labels: controls.map((control) => control.textContent?.trim()),
              sizes: controls.map((control) => {
                const bounds = control.getBoundingClientRect();
                return { width: bounds.width, height: bounds.height };
              }),
            },
          ];
        });
      });
      for (const pair of pairs) {
        expect(
          Math.abs(pair.sizes[0].width - pair.sizes[1].width),
          `${width}px: ${pair.labels.join(" / ")} widths`,
        ).toBeLessThan(1);
        expect(
          Math.abs(pair.sizes[0].height - pair.sizes[1].height),
          `${width}px: ${pair.labels.join(" / ")} heights`,
        ).toBeLessThan(1);
      }
      const reservationButtons = page
        .locator('[class*="reservationActions"] > [data-slot="button"]')
        .filter({ hasNot: page.locator('[class*="emailLabel"]') });
      if ((await reservationButtons.count()) === 2) {
        const first = await reservationButtons.first().boundingBox();
        const second = await reservationButtons.last().boundingBox();
        expect(first?.width).toBeCloseTo(second?.width ?? 0, 0);
        expect(first?.height).toBeCloseTo(second?.height ?? 0, 0);
      }
      expect(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth <=
            document.documentElement.clientWidth,
        ),
        `${width}px page overflow`,
      ).toBe(true);
    }
  });
}

test("matching sizes only applies to explicit groups of two CTA buttons", async ({
  page,
}) => {
  await page.goto("/");
  const groups = page.locator("[data-button-pair]");
  await expect(groups).toHaveCount(2);
  for (const group of await groups.all()) {
    await expect(group.locator(':scope > [data-slot="button"]')).toHaveCount(2);
  }
  await expect(
    page.locator(
      'header [data-button-pair], [data-button-pair] [data-variant="brand-text"], [data-button-pair] [data-variant="plain"]',
    ),
  ).toHaveCount(0);
  const sizes = await page.evaluate(() => {
    const button = document.querySelector(
      'main [data-variant="brand-primary"]',
    );
    if (!button) throw new Error("CTA button is missing");
    return [1, 3].map((count) => {
      const group = document.createElement("div");
      group.className = "button-scope-fixture";
      group.style.cssText = "display:flex;gap:12px;width:600px";
      for (let index = 0; index < count; index++)
        group.append(button.cloneNode(true));
      document.body.append(group);
      const dimensions = () =>
        Array.from(group.children).map((control) => {
          const bounds = control.getBoundingClientRect();
          return { width: bounds.width, height: bounds.height };
        });
      const before = dimensions();
      group.setAttribute("data-button-pair", "");
      const after = dimensions();
      group.remove();
      return { before, after };
    });
  });
  for (const size of sizes) expect(size.after).toEqual(size.before);
});
