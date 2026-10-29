import { expect, test } from "./menu-test";

for (const destination of [
  { label: "Dinner", menu: "dinner" },
  { label: "Group Set Lunch", menu: "group-set-menu" },
]) {
  test(`prepared ${destination.label} switches without waiting for another server response`, async ({
    page,
  }) => {
    const prepared = page.waitForResponse(
      (response) => {
        const url = new URL(response.url());
        return (
          url.pathname === "/menus" &&
          url.searchParams.get("menu") === destination.menu &&
          url.searchParams.has("_rsc")
        );
      },
      { timeout: 10_000 },
    );
    await page.goto("/menus?menu=lunch");
    const navigation = page.getByRole("navigation", {
      name: "Restaurant menus",
    });
    if (destination.menu === "group-set-menu") {
      await navigation
        .getByRole("button", { name: "Special menus" })
        .first()
        .click();
    }
    const link = navigation.getByRole("link", {
      name: destination.label,
      exact: true,
    });
    await link.scrollIntoViewIfNeeded();
    await prepared;

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
