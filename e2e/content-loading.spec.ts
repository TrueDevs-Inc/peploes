import { expect, test } from "./menu-test";

for (const destination of [
  { path: "/journal", heading: "The Journal" },
  {
    path: "/seasonal",
    heading: /There’s always\s+something happening\s+at Peploe’s\./,
  },
]) {
  test(`${destination.path} retains content without a footer flash during slow navigation`, async ({
    page,
  }) => {
    let release = () => {};
    let observed = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const requested = new Promise<void>((resolve) => {
      observed = resolve;
    });
    await page.route("**/*", async (route) => {
      if (new URL(route.request().url()).pathname === destination.path) {
        const headers = route.request().headers();
        if (
          headers["next-router-prefetch"] ||
          headers["next-router-segment-prefetch"]
        ) {
          await route.abort();
          return;
        }
        observed();
        await gate;
      }
      await route.fallback();
    });
    await page.goto("/");
    const originalHeading = await page
      .getByRole("main")
      .getByRole("heading", { level: 1 })
      .innerText();
    const link = page
      .getByRole("main")
      .locator(`a[href="${destination.path}"]`)
      .first();
    const activation = link.click();
    try {
      await requested;
      await expect(
        page.getByRole("main").getByRole("heading", { level: 1 }),
      ).toHaveText(originalHeading);
      await expect
        .poll(() =>
          page
            .getByRole("contentinfo")
            .evaluate(
              (element) => element.getBoundingClientRect().top >= innerHeight,
            ),
        )
        .toBe(true);
    } finally {
      release();
    }
    await activation;
    await expect(page).toHaveURL(destination.path);
    await expect(
      page.getByRole("main").getByRole("heading", { level: 1 }),
    ).toHaveText(destination.heading);
  });
}
