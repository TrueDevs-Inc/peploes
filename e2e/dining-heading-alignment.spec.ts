import { expect, test } from "@playwright/test";

test("dining introduction aligns its paragraph with the heading", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/visit-contact");
  const heading = page.getByRole("heading", { name: "When to join us." });
  await heading.scrollIntoViewIfNeeded();
  await page.evaluate(() => document.fonts.ready);
  const paragraph = page.getByText(
    "From a leisurely lunch to pre-theatre dining or a late dinner, Peploe’s is open throughout the week, with a warm welcome.",
    { exact: true },
  );
  const h = await heading.boundingBox();
  const p = await paragraph.boundingBox();
  if (!h || !p) throw new Error("Dining introduction must have visible bounds");
  if ((page.viewportSize()?.width ?? 0) >= 1280) {
    expect(p.y + p.height / 2).toBeCloseTo(h.y + h.height / 2, 0);
    expect(p.x).toBeGreaterThan(h.x + h.width);
  } else {
    expect(p.y).toBeGreaterThanOrEqual(h.y + h.height);
    expect(p.x).toBe(h.x);
  }
});
