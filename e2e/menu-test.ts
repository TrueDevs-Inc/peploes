import { test as base } from "@playwright/test";

export { expect } from "@playwright/test";
export const test = base.extend({
  page: async ({ page }, use) => {
    // Exercise Next's optimizer with local copies of the CMS fixture images.
    await page.route("**/_next/image?**", async (route) => {
      const request = new URL(route.request().url());
      const source = request.searchParams.get("url");
      const prefix = "https://cdn.sanity.io/images/testproject/development/";
      if (source?.startsWith(prefix)) {
        request.searchParams.set("url", `/${source.slice(prefix.length)}`);
        await route.continue({ url: request.href });
        return;
      }
      await route.continue();
    });
    await use(page);
  },
});
