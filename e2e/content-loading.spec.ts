import { rmSync, writeFileSync } from "node:fs";
import { expect, test } from "./menu-test";
import { announceSanityPublish } from "./sanity-webhook";

test.afterEach(() => {
  rmSync(".next/e2e/content-delay.json", { force: true });
});

test("published content hubs reuse their rendered HTML", async ({
  request,
}) => {
  for (const path of ["/journal", "/seasonal"]) {
    await request.get(path);
    const response = await request.get(path);
    expect(response.ok()).toBe(true);
    expect(response.headers()["x-nextjs-cache"]).toBe("HIT");
  }
});

for (const path of ["/menus", "/seasonal", "/journal"]) {
  test(`${path} keeps the footer below the viewport while content is pending`, async ({
    page,
    request,
  }) => {
    await page.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      if (
        url.pathname === path &&
        route.request().headers()["next-router-prefetch"]
      ) {
        await route.abort();
        return;
      }
      await route.fallback();
    });
    await page.goto("/our-story");
    await announceSanityPublish(request);
    writeFileSync(".next/e2e/content-delay.json", "1500");
    const observation = page.evaluate(async (destination) => {
      const footerPositions: number[] = [];
      const start = performance.now();
      while (performance.now() - start < 10000) {
        if (location.pathname === destination) {
          if (document.querySelector("main h1")) return footerPositions;
          const footer = document.querySelector("footer");
          if (footer)
            footerPositions.push(
              footer.getBoundingClientRect().top - innerHeight,
            );
        }
        await new Promise(requestAnimationFrame);
      }
      throw new Error("Content did not finish loading.");
    }, path);
    await page.locator(`a[href="${path}"]:visible`).first().click();
    const positions = await observation;
    if (path === "/menus") expect(positions.length).toBeGreaterThan(0);
    expect(positions.filter((position) => position < 0)).toEqual([]);
    await expect(page.locator("main h1")).toBeVisible({ timeout: 15000 });
  });
}
