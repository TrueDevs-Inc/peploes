import { expect, test } from "./menu-test";

test("terrace and closing photographs have the diary section spacing", async ({
  page,
}) => {
  await page.goto("/seasonal");
  const terrace = page.getByRole("region", {
    name: "Terrace days at Peploe’s",
  });
  const join = page.locator('section[aria-labelledby="seasonal-join"]');
  await terrace.scrollIntoViewIfNeeded();
  const terraceBox = await terrace.boundingBox();
  const joinBox = await join.boundingBox();
  if (!terraceBox || !joinBox)
    throw new Error("Seasonal sections must have visible bounds");
  expect(joinBox.y - terraceBox.y - terraceBox.height).toBe(48);
});
