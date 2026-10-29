import { expect, test } from "@playwright/test";

test("corporate capacity balances mobile stat cards and readable detail rows", async ({
  page,
  isMobile,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/private-dining/corporate-events");
  const section = page.locator("section").filter({
    has: page.getByRole("heading", {
      name: "A flexible space for your event.",
      exact: true,
    }),
  });
  await section.scrollIntoViewIfNeeded();
  const items = section.getByRole("listitem");
  await expect(items).toHaveCount(4);
  await expect(
    section.getByRole("heading", { name: "80", exact: true }),
  ).toBeVisible();
  await expect(
    section.getByRole("heading", { name: "~100", exact: true }),
  ).toBeVisible();
  await expect(section.getByText("can be hired exclusively")).toBeVisible();
  await expect(
    section.getByText(
      "Limited availability in November & December. Sunday opening can also be arranged for events.",
    ),
  ).toBeVisible();
  const rows = await items.evaluateAll((elements) =>
    elements.map((item) => {
      const icon = item.querySelector("img")?.getBoundingClientRect();
      const heading = item.querySelector("h3")?.getBoundingClientRect();
      const rect = item.getBoundingClientRect();
      return {
        x: rect.x,
        y: rect.y,
        right: rect.right,
        width: rect.width,
        iconRight: icon?.right,
        headingX: heading?.x,
        headingY: heading?.y,
      };
    }),
  );
  if (isMobile) {
    expect(rows[1].y).toBeCloseTo(rows[0].y, 1);
    expect(rows[1].x).toBeGreaterThan(rows[0].x);
    expect(rows[1].width).toBeCloseTo(rows[0].width, 1);
    expect(rows[2].y).toBeGreaterThan(rows[0].y);
    expect(rows[3].y).toBeGreaterThan(rows[2].y);
    for (const row of rows.slice(2)) {
      expect(row.iconRight).toBeDefined();
      expect(row.headingX).toBeGreaterThan(row.iconRight ?? 0);
      expect(row.headingY).toBeLessThan(row.y + 30);
      expect(row.right).toBeLessThanOrEqual(page.viewportSize()?.width ?? 0);
    }
    await expect(items.nth(1)).toHaveCSS("border-top-width", "1px");
    await expect(items.nth(0).getByRole("heading")).toHaveCSS(
      "font-size",
      "44px",
    );
    await expect(items.nth(0).getByRole("heading")).toHaveCSS(
      "line-height",
      "46px",
    );
    await expect(items.nth(0).locator("p").first()).toHaveCSS(
      "font-size",
      "16px",
    );
    await expect(items.nth(2).getByRole("heading")).toHaveCSS(
      "font-size",
      "24px",
    );
    await expect(items.nth(3).locator("p").last()).toHaveCSS(
      "font-size",
      "14px",
    );
    await expect(items.nth(3).locator("p").first()).toHaveCSS(
      "font-size",
      "16px",
    );
  } else {
    for (const row of rows) expect(row.y).toBeCloseTo(rows[0].y, 1);
    expect(rows[1].x).toBeGreaterThan(rows[0].x);
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await section.screenshot({ path: testInfo.outputPath("capacity.png") });
});
