import { rm, writeFile } from "node:fs/promises";
import { expect, test } from "./menu-test";
import { announceSanityPublish } from "./sanity-webhook";

test("mobile hero fills the first screen and keeps the desktop entrance artwork", async ({
  page,
  viewport,
}) => {
  await page.goto("/");
  const hero = page.locator('section[aria-labelledby="hero-heading"]');
  // Issue #162 requires equal hero actions; compare them without fixing pixel sizes.
  await page.evaluate(() => document.fonts.ready);
  const booking = hero.getByRole("link", { name: "Book a Table", exact: true });
  const call = hero.getByRole("link", { name: "Call Peploe's", exact: true });
  const bookingBounds = await booking.boundingBox();
  const callBounds = await call.boundingBox();
  if (!bookingBounds || !callBounds)
    throw new Error("Hero actions must be visible");
  expect(callBounds.width).toBe(bookingBounds.width);
  expect(callBounds.height).toBe(bookingBounds.height);
  const description = hero.getByText(
    "Great food, exceptional wine and genuine hospitality in the heart of the city.",
    { exact: true },
  );
  const entrance = hero.getByRole("img", {
    name: "Peploe’s red awning above the steps leading down to the restaurant.",
    exact: true,
  });
  await expect(entrance).toHaveAttribute("src", /url=%2Fpeploes-entrance\.png/);

  if ((viewport?.width ?? 1440) >= 640) {
    await expect(description).toBeVisible();
    return;
  }

  for (const height of [viewport?.height ?? 844, 568]) {
    await page.setViewportSize({ width: viewport?.width ?? 390, height });
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(description).toBeHidden();
    await expect(
      hero.getByRole("link", { name: "Call Peploe's", exact: true }),
    ).toBeInViewport();
    await expect(entrance).not.toBeInViewport();
    await entrance.scrollIntoViewIfNeeded();
    await expect(entrance).toBeVisible();
    await expect(entrance).not.toHaveJSProperty("naturalWidth", 0);
  }
});

test("homepage event actions follow published availability without a rebuild", async ({
  page,
  request,
}) => {
  const statePath = ".next/e2e/published-seasonal-slugs.json";
  const card = page.getByRole("article").filter({
    has: page.getByRole("heading", {
      name: "Lobster Week Returns",
      exact: true,
    }),
  });
  try {
    await announceSanityPublish(request);
    await page.goto("/");
    await writeFile(statePath, JSON.stringify([]));
    await page.goto("/");
    await expect(
      card.getByRole("link", { name: "Lobster Week Returns", exact: true }),
    ).toHaveAttribute("href", "/seasonal/lobster-season");

    for (const published of [[], ["lobster-season"], []]) {
      await writeFile(statePath, JSON.stringify(published));
      await announceSanityPublish(request);
      await page.goto("/");
      await expect(card.getByRole("link")).toHaveCount(2);
      for (const link of await card.getByRole("link").all()) {
        await expect(link).toHaveAttribute(
          "href",
          published.length ? "/seasonal/lobster-season" : "/seasonal",
        );
      }
      if (!published.length) {
        await expect(page.locator('a[href^="/seasonal/"]')).toHaveCount(0);
      }
      await card
        .getByRole("link", { name: "Lobster Week Returns", exact: true })
        .click();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        published.length
          ? "Lobster Season"
          : /There’s always\s+something happening\s+at Peploe’s\./,
      );
    }
  } finally {
    await rm(statePath, { force: true });
    await announceSanityPublish(request);
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
    for (const link of await card.getByRole("link").all()) {
      await expect(link).toHaveAttribute("href", href);
    }
    const action = card.locator("[data-card-action]");
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
