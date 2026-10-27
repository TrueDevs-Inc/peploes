import { expect, test } from "@playwright/test";

// This suite's build is a live-site build (NEXT_PUBLIC_VERCEL_ENV=production)
// with empty provider IDs (see `test:e2e`), so the deployment gate is open and
// the missing-ID gate is what is tested: a visitor who accepts analytics must
// still produce no provider traffic.
test("accepting analytics without provider configuration contacts no provider", async ({
  page,
  context,
}) => {
  const providerRequests: string[] = [];
  await context.route(
    /(googletagmanager|google-analytics|analytics\.google|posthog)\.com/,
    (route) => {
      providerRequests.push(route.request().url());
      return route.abort();
    },
  );
  await page.goto("/");
  await page
    .getByRole("button", { name: "Cookie Settings", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "Cookie Preferences", exact: true })
    .getByRole("button", { name: "Accept All", exact: true })
    .click();
  await page.locator('a[href="/our-story"]:visible').first().click();
  await expect(page).toHaveURL("/our-story");
  await page.waitForTimeout(4000);
  expect(providerRequests).toEqual([]);
  expect(
    await page.evaluate(() =>
      [...Object.keys(localStorage), document.cookie].filter((entry) =>
        /ph_|_ga|app_utm/.test(entry),
      ),
    ),
  ).toEqual([]);
});
