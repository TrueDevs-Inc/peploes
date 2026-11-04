import { expect, test } from "./menu-test";

test("diary introduction aligns its paragraph with the heading", async ({
  page,
}) => {
  await page.goto("/seasonal");
  const heading = page.getByRole("heading", { name: "In the diary." });
  await heading.scrollIntoViewIfNeeded();
  await page.evaluate(() => document.fonts.ready);
  const paragraph = page.getByText(
    "From seasonal dishes to special evenings, there’s always something to look forward to at Peploe’s.",
    { exact: true },
  );
  const h = await heading.boundingBox();
  const p = await paragraph.boundingBox();
  if (!h || !p) throw new Error("Diary introduction must have visible bounds");
  if ((page.viewportSize()?.width ?? 0) >= 1024) {
    expect(p.y + p.height / 2).toBeCloseTo(h.y + h.height / 2, 0);
    expect(p.x).toBeGreaterThan(h.x + h.width);
  } else {
    expect(p.y).toBeGreaterThanOrEqual(h.y + h.height);
    expect(p.x).toBe(h.x);
  }
});
