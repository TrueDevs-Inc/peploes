import { expect, test } from "@playwright/test";

test("Visit loads its image and contact information without horizontal overflow", async ({
  page,
}) => {
  await page.goto("/visit-contact");

  await expect(
    page.getByRole("heading", { name: "Step down from the city.", level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Opening hours, address and contact" }),
  ).toBeVisible();
  const entrance = page.getByRole("img", {
    name: "Peploe’s entrance and terrace beneath its burgundy awning on St Stephen’s Green.",
  });
  await expect(entrance).toBeVisible();
  await expect(entrance).toHaveJSProperty("complete", true);
  await expect(entrance).not.toHaveJSProperty("naturalWidth", 0);
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

test("navigation reaches Visit, closes the mobile menu and shows the desktop active state", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  const navigation = page.getByRole("navigation", {
    name: "Main navigation",
    exact: true,
  });

  if (isMobile) {
    const toggle = navigation.getByRole("button", { name: "Open menu" });
    await toggle.click();
    const menu = page.getByRole("dialog", { name: "Navigation menu" });
    await expect(menu).toBeVisible();
    await menu
      .getByRole("link", { name: "Visit & Contact", exact: true })
      .click();
    await expect(page).toHaveURL(/\/visit-contact$/);
    await expect(menu).not.toBeVisible();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  } else {
    const visit = navigation.getByRole("link", {
      name: "Visit & Contact",
      exact: true,
    });
    await visit.click();
    await page.mouse.move(0, 0);
    await expect(page).toHaveURL(/\/visit-contact$/);
    await expect(visit).toHaveCSS("color", "rgb(122, 30, 36)");
    await expect
      .poll(() =>
        visit.evaluate((link) => {
          const underline = getComputedStyle(link, "::after");
          return {
            content: underline.content,
            height: underline.height,
            color: underline.backgroundColor,
          };
        }),
      )
      .toEqual({ content: '""', height: "2px", color: "rgb(122, 30, 36)" });
    await navigation.getByRole("link", { name: "Peploe’s home" }).click();
    await page.mouse.move(0, 0);
    await expect(page).toHaveURL("/");
    await expect(visit).toHaveCSS("color", "rgb(46, 42, 40)");
  }
});

test("opening hours and find-us anchors land below the sticky navigation", async ({
  page,
  isMobile,
}) => {
  for (const destination of [
    { id: "opening-hours", label: "View full opening times" },
    { id: "find-us", label: "16 St Stephen's Green" },
  ]) {
    const path = `/visit-contact#${destination.id}`;
    if (isMobile) {
      await page.goto("/");
      const link = page.getByRole("contentinfo").getByRole("link", {
        name: destination.label,
        exact: true,
      });
      await expect(link).toHaveAttribute("href", path);
      await link.click();
    } else {
      await page.goto(path);
    }

    await expect(page).toHaveURL(path);
    const target = page.locator(`#${destination.id}`);
    await expect(target).toBeInViewport();
    await expect
      .poll(async () => {
        const section = await target.boundingBox();
        const navigation = await page
          .getByRole("navigation", { name: "Main navigation", exact: true })
          .boundingBox();
        return (
          section !== null &&
          navigation !== null &&
          section.y >= navigation.y + navigation.height &&
          section.y <= navigation.y + navigation.height + 100
        );
      })
      .toBe(true);
  }
});

test("contact and map links point to the restaurant's public destinations", async ({
  page,
}) => {
  await page.goto("/visit-contact");
  const main = page.getByRole("main");
  for (const label of ["+353 1 676 3144", "Call +353 1 676 3144"]) {
    await expect(
      main.getByRole("link", { name: label, exact: true }),
    ).toHaveAttribute("href", "tel:+35316763144");
  }
  for (const label of ["reception@peploes.ie", "Email reception@peploes.ie"]) {
    await expect(
      main.getByRole("link", { name: label, exact: true }),
    ).toHaveAttribute("href", "mailto:reception@peploes.ie");
  }
  for (const label of [
    "Get Directions",
    "Get directions to Peploe’s on Google Maps",
  ]) {
    const link = main.getByRole("link", { name: label, exact: true });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute(
      "href",
      "https://www.google.com/maps/dir/?api=1&destination=Peploe%27s%2C%2016%20St%20Stephen%27s%20Green%2C%20Dublin%202",
    );
  }
});
