import { rm, writeFile } from "node:fs/promises";
import { expect, test } from "./menu-test";

test("homepage event actions follow published availability without a rebuild", async ({
  page,
}) => {
  const statePath = ".next/e2e/published-seasonal-slugs.json";
  const card = page.getByRole("article").filter({
    has: page.getByRole("heading", {
      name: "Lobster Week Returns",
      exact: true,
    }),
  });
  try {
    for (const published of [[], ["lobster-season"], []]) {
      await writeFile(statePath, JSON.stringify(published));
      await page.goto("/");
      await expect(card.getByRole("link")).toHaveAttribute(
        "href",
        published.length ? "/seasonal/lobster-season" : "/seasonal",
      );
      if (!published.length) {
        await expect(page.locator('a[href^="/seasonal/"]')).toHaveCount(0);
      }
      await card.getByRole("link").click();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        published.length
          ? "Lobster Season"
          : /There’s always\s+something happening\s+at Peploe’s\./,
      );
    }
  } finally {
    await rm(statePath, { force: true });
  }
});

test("homepage contact and event actions reach their existing destinations", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: "Call Peploe's", exact: true }),
  ).toHaveAttribute("href", "tel:+35316763144");

  for (const [title, href, heading] of [
    ["Lobster Week Returns", "/seasonal/lobster-season", "Lobster Season"],
    [
      "A Seasonal Wine Dinner",
      "/seasonal/italian-wine-dinner",
      "An Evening with Italian Wines",
    ],
    ["Sunday at Peploe’s", "/seasonal/sunday-at-peploes", "Sunday at Peploe’s"],
  ]) {
    await page.goto("/");
    const card = page
      .getByRole("article")
      .filter({ has: page.getByRole("heading", { name: title, exact: true }) });
    const action = card.getByRole("link");
    await expect(action).toHaveAttribute("href", href);
    await action.click();
    await expect(page).toHaveURL(href);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
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
