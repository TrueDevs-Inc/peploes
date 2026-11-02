import { expect, test } from "./menu-test";

const boundaries = [
  ["/", "#wine"],
  ["/private-dining", '[aria-label="Gathering at Peploe’s"]'],
  ["/private-dining/groups-celebrations", "#enquire"],
  ["/private-dining/corporate-events", "#enquire"],
  ["/private-dining/weddings", "div:has(> #enquire)"],
  ["/our-story", '[aria-labelledby="story-building"]'],
  ["/visit-contact", "#opening-hours"],
  ["/privacy-policy", '[aria-labelledby="policy-help-title"]'],
  ["/seasonal/lobster-season", '[aria-label="Event information"]'],
] as const;

for (const [path, selector] of boundaries) {
  test(`${path} separates similar section backgrounds with a subtle line`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(path);
    const boundary = page.locator(selector);
    await boundary.scrollIntoViewIfNeeded();
    await expect(boundary).toBeVisible();

    const line = await boundary.evaluate((element) => {
      const style = getComputedStyle(element, "::before");
      return {
        content: style.content,
        height: style.height,
        width: Number.parseFloat(style.width),
        color: style.backgroundColor,
        pointerEvents: style.pointerEvents,
        opacity: style.opacity,
        visibility: style.visibility,
        sectionWidth: element.getBoundingClientRect().width,
      };
    });
    expect(line.content).toBe('""');
    expect(line.height).toBe("1.5px");
    expect(line.color).toMatch(path === "/" ? /\/ 0\.5\)$/ : /\/ 0\.8\)$/);
    expect(line.pointerEvents).toBe("none");
    expect(line.opacity).toBe("1");
    expect(line.visibility).toBe("visible");
    expect(line.width).toBeCloseTo(line.sectionWidth, 0);
  });
}

test("corporate menu divider preserves the photograph's frame on wide screens", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/private-dining/corporate-events");
  const menus = page.locator("section").filter({
    has: page.getByRole("heading", { name: "Made around the occasion." }),
  });

  for (const width of [1440, 1920, 2560]) {
    await page.setViewportSize({ width, height: 1000 });
    await menus.scrollIntoViewIfNeeded();
    await expect(menus).toBeVisible();
    const frame = await menus.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      const overlay = getComputedStyle(element, "::after");
      return {
        width: bounds.width,
        height: bounds.height,
        shadow: overlay.boxShadow,
        opacity: overlay.opacity,
        visibility: overlay.visibility,
      };
    });
    expect(frame.height).toBeGreaterThanOrEqual((frame.width * 435) / 1440 - 1);
    expect(frame.shadow).toContain("/ 0.8)");
    expect(frame.shadow).toContain("0px 1.5px 0px 0px inset");
    expect(frame.opacity).toBe("1");
    expect(frame.visibility).toBe("visible");
  }
});
