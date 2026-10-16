import { expect, test } from "@playwright/test";

test("homepage contact and event actions reach their existing destinations", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: "Call Peploe's", exact: true }),
  ).toHaveAttribute("href", "tel:+35316763144");

  for (const [title, href] of [
    ["Lobster Week Returns", "/seasonal/lobster-season"],
    ["A Seasonal Wine Dinner", "/seasonal/italian-wine-dinner"],
    ["Sunday at Peploe’s", "/seasonal/sunday-at-peploes"],
  ]) {
    await page.goto("/");
    const card = page
      .getByRole("article")
      .filter({ has: page.getByRole("heading", { name: title, exact: true }) });
    const action = card.getByRole("link");
    await expect(action).toHaveAttribute("href", href);
    await action.click();
    await expect(page).toHaveURL(href);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Campaign/Event",
    );
  }
});

test("homepage links resolve and social icons use the restaurant profiles", async ({
  page,
  request,
}) => {
  await page.goto("/");
  for (const [name, href] of [
    [
      "Peploe’s on Instagram",
      "https://www.instagram.com/peploesstephensgreen/",
    ],
    ["Peploe’s on Facebook", "https://www.facebook.com/Peploes"],
  ]) {
    const link = page.getByRole("link", { name, exact: true });
    await expect(link).toHaveAttribute("href", href);
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  }

  const hrefs = await page
    .getByRole("link")
    .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  expect(hrefs).not.toContain(null);
  expect(hrefs).not.toContain("");
  expect(hrefs).not.toContain("#");
  for (const href of new Set(hrefs)) {
    if (!href?.startsWith("/")) continue;
    const [path, fragment] = href.split("#");
    const response = await request.get(path);
    expect(response.status(), href).toBe(200);
    if (fragment)
      expect(await response.text(), href).toContain(`id="${fragment}"`);
  }
});
