import { rmSync, writeFileSync } from "node:fs";
import { journalArticles } from "./journal-fixtures";
import { expect, test } from "./menu-test";
import { announceSanityPublish } from "./sanity-webhook";
import { seasonalFixtures } from "./seasonal-fixtures";

test("public content pages reuse rendered HTML", async ({ request }) => {
  test.setTimeout(90000);
  for (const path of [
    "/",
    "/our-story",
    "/private-dining",
    "/private-dining/groups-celebrations",
    "/private-dining/corporate-events",
    "/private-dining/weddings",
    "/visit-contact",
    "/journal",
    "/seasonal",
    "/privacy-cookies",
    "/privacy-policy",
    "/terms-conditions",
    "/accessibility-policy",
    "/booking-cancellation-terms",
    ...journalArticles.map((article) => `/journal/${article.slug}`),
    ...seasonalFixtures.map((event) => `/seasonal/${event.slug}`),
  ]) {
    await test.step(path, async () => {
      await request.get(path);
      await expect
        .poll(
          async () => {
            const response = await request.get(path);
            expect(response.status()).toBe(200);
            return response.headers()["x-nextjs-cache"];
          },
          { timeout: 15000 },
        )
        .toBe("HIT");
    });
  }
});

test("live booking responses remain uncached", async ({ request }) => {
  const response = await request.get("/book-a-table");
  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect(response.headers()["x-nextjs-cache"]).toBeUndefined();
});

function destinationPath(url: URL) {
  const menu = url.searchParams.get("menu");
  return `${url.pathname}${menu ? `?menu=${menu}` : ""}`;
}

test("cached event pages return 404 after unpublishing and recover after republishing", async ({
  request,
}) => {
  const slug = "rugby-at-peploes";
  const path = `/seasonal/${slug}`;
  const statePath = ".next/e2e/published-seasonal-slugs.json";
  expect((await request.get(path)).status()).toBe(200);
  writeFileSync(
    statePath,
    JSON.stringify(
      seasonalFixtures
        .filter((event) => event.slug !== slug)
        .map((event) => event.slug),
    ),
  );
  try {
    await announceSanityPublish(request);
    expect((await request.get(path)).status()).toBe(404);
  } finally {
    rmSync(statePath, { force: true });
    await announceSanityPublish(request);
  }
  expect((await request.get(path)).status()).toBe(200);
});

for (const destination of [
  {
    source: "/",
    scope: "main",
    href: "/menus?menu=lunch",
    heading: "Lunch Menu",
  },
  {
    source: "/our-story",
    scope: "footer",
    href: "/menus",
    heading: "Lunch Menu",
  },
  {
    source: "/journal",
    scope: "main",
    href: "/journal/rooted-in-good-relationships",
    heading: "Rooted in good relationships.",
  },
  {
    source: "/seasonal",
    scope: "main",
    href: "/seasonal/rugby-at-peploes",
    heading: "Rugby at Peploe’s",
  },
]) {
  test(`prepared ${destination.href} opens from ${destination.scope} without another server response`, async ({
    page,
  }) => {
    let prepared = false;
    let delayNavigation = false;
    await page.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      if (
        delayNavigation &&
        destinationPath(url) === destination.href &&
        url.searchParams.has("_rsc")
      ) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
      await route.fallback();
    });
    page.on("response", (response) => {
      const url = new URL(response.url());
      if (
        destinationPath(url) !== destination.href ||
        !url.searchParams.has("_rsc") ||
        response.request().headers()["next-router-segment-prefetch"] ===
          "/_tree" ||
        !response.ok()
      )
        return;
      prepared = true;
    });
    await page.goto(destination.source);
    const link = page
      .locator(`${destination.scope} a[href="${destination.href}"]:visible`)
      .first();
    await link.scrollIntoViewIfNeeded();
    await link.hover();
    await expect.poll(() => prepared, { timeout: 15000 }).toBe(true);
    delayNavigation = true;
    await link.click();
    await expect(page.locator("main h1")).toHaveText(destination.heading, {
      timeout: 1000,
    });
  });
}
