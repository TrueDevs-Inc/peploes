import { expect, test } from "@playwright/test";

test("Visit loads the map automatically and its location controls work", async ({
  page,
  isMobile,
}) => {
  let requests = 0;
  await page.route("https://*.mapbox.com/**", async (route) => {
    requests++;
    if (route.request().url().includes("/styles/v1/")) {
      await route.fulfill({
        json: {
          version: 8,
          sources: {},
          layers: [
            {
              id: "background",
              type: "background",
              paint: { "background-color": "#ffffff" },
            },
          ],
        },
      });
    } else {
      await route.fulfill({ json: {} });
    }
  });
  await page.goto("/");
  expect(requests).toBe(0);
  const navigation = page.getByRole("navigation", {
    name: "Main navigation",
    exact: true,
  });
  if (isMobile) {
    await navigation.getByRole("button", { name: "Open menu" }).click();
    await page
      .getByRole("dialog", { name: "Navigation menu" })
      .getByRole("link", { name: "Visit & Contact", exact: true })
      .click();
  } else {
    await navigation
      .getByRole("link", { name: "Visit & Contact", exact: true })
      .click();
  }
  await expect(page).toHaveURL(/\/visit-contact$/);
  await expect(
    page.getByRole("button", {
      name: "Explore the map",
      exact: true,
    }),
  ).toHaveCount(0);
  const map = page.getByRole("region", {
    name: "Interactive map showing Peploe’s",
    exact: true,
  });
  await expect(map).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Zoom in", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Peploe’s, 16 St Stephen’s Green",
      exact: true,
    })
    .click();
  await expect(page.locator(".mapboxgl-popup")).toContainText("Dublin 2");
  const popupBounds = await page.locator(".mapboxgl-popup").boundingBox();
  const recenterBounds = await page
    .getByRole("button", { name: "Recenter map on Peploe’s" })
    .boundingBox();
  expect(popupBounds).not.toBeNull();
  expect(recenterBounds).not.toBeNull();
  if (!popupBounds || !recenterBounds)
    throw new Error("Map popup or recenter control are missing");
  expect(popupBounds.y).toBeGreaterThan(
    recenterBounds.y + recenterBounds.height,
  );
  await page.getByRole("button", { name: "Recenter map on Peploe’s" }).click();
  await expect(
    page.getByRole("link", {
      name: "Get directions to Peploe’s on Google Maps",
    }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Get Directions", exact: true }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    )
    .toBe(true);
});

test("a Mapbox failure preserves the preview and directions", async ({
  page,
}) => {
  await page.route("https://*.mapbox.com/**", (route) => route.abort("failed"));
  await page.goto("/visit-contact#find-us");
  await expect(
    page.getByText(
      "Interactive map unavailable. You can still get directions.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("img", {
      name: "Map showing Peploe’s on the north side of St Stephen’s Green in central Dublin.",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", {
      name: "Get Directions",
      exact: true,
    }),
  ).toBeVisible();
});
