import { expect, test } from "@playwright/test";

test("corporate capacity shows its guest limits and availability without overflow", async ({
  page,
}) => {
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
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
