import { expect, test } from "./menu-test";

for (const destination of [
  { label: "Dinner", menu: "dinner" },
  { label: "Group Set Lunch", menu: "group-set-menu" },
]) {
  test(`prepared ${destination.label} switches without waiting for another server response`, async ({
    page,
  }) => {
    let prepared = false;
    page.on("response", (response) => {
      const url = new URL(response.url());
      if (
        url.pathname === "/menus" &&
        url.searchParams.get("menu") === destination.menu &&
        url.searchParams.has("_rsc")
      )
        prepared = response.ok();
    });
    await page.goto("/menus?menu=lunch");
    const navigation = page.getByRole("navigation", {
      name: "Restaurant menus",
    });
    await expect
      .poll(async () =>
        navigation
          .locator("[data-menu-indicator]")
          .evaluate((element) => element.getBoundingClientRect().width),
      )
      .toBeGreaterThan(0);
    if (destination.menu === "group-set-menu") {
      const specialMenus = navigation
        .getByRole("button", { name: "Special menus" })
        .first();
      await specialMenus.click();
      await expect(specialMenus).toHaveAttribute("aria-expanded", "true");
    }
    const link = navigation.getByRole("link", {
      name: destination.label,
      exact: true,
    });
    await link.scrollIntoViewIfNeeded();
    await expect.poll(() => prepared, { timeout: 10_000 }).toBe(true);

    // A warmed tab should not pay network latency again when it is selected.
    await page.route("**/menus?**", async (route) => {
      if (new URL(route.request().url()).searchParams.has("_rsc")) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
      await route.continue();
    });
    await link.click();
    await expect(page.locator("[data-menu-content]")).toHaveAttribute(
      "data-menu",
      destination.menu,
      { timeout: 1000 },
    );
    await expect(
      navigation.locator(`[data-menu-path="/menus?menu=${destination.menu}"]`),
    ).toHaveAttribute("aria-current", "page");
  });
}
