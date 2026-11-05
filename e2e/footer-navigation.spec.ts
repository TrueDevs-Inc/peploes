import { expect, test } from "./menu-test";

test("mobile footer legal links keep accessible names, touch targets", async ({
  page,
  viewport,
}) => {
  if ((viewport?.width ?? 1440) >= 1280) {
    await page.setViewportSize({ width: 390, height: 844 });
  }

  for (const path of ["/", "/contact"]) {
    await page.goto(path);
    const footer = page.getByRole("contentinfo");
    const legal = footer.getByRole("navigation", {
      name: "Legal and accessibility",
    });
    const controls = legal.getByRole("link").or(legal.getByRole("button"));
    await page.evaluate(() => document.fonts.ready);
    await expect(controls).toHaveCount(4);
    for (const [index, name] of [
      "Privacy Policy",
      "Terms",
      "Accessibility",
      "Booking & Cancellation",
    ].entries()) {
      await expect(controls.nth(index)).toHaveAccessibleName(name);
    }
    expect(
      await controls.evaluateAll((elements) =>
        elements.map((element) => (element as HTMLElement).innerText),
      ),
    ).toEqual(["Privacy", "Terms", "Accessibility", "Booking"]);
    for (const control of [
      ...(await controls.all()),
      footer.getByRole("link", { name: /on Instagram/ }),
      footer.getByRole("link", { name: /on Facebook/ }),
    ]) {
      await expect(control).toBeVisible();
      const bounds = await control.boundingBox();
      expect(bounds?.width).toBeGreaterThanOrEqual(44);
      expect(bounds?.height).toBeGreaterThanOrEqual(44);
    }

    await expect(
      legal.getByRole("link", { name: "Privacy Policy", exact: true }),
    ).toHaveAttribute("href", "/privacy-policy");
    await expect(
      legal.getByRole("button", {
        name: "Cookie Settings",
        includeHidden: true,
      }),
    ).toBeHidden();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.evaluate(() => {
      document.body.style.zoom = "2";
    });
    for (const control of await controls.all()) {
      expect(
        await control.evaluate((element) => {
          const bounds = element.getBoundingClientRect();
          return bounds.left >= 0 && bounds.right <= innerWidth;
        }),
      ).toBe(true);
    }
    await page.evaluate(() => {
      document.body.style.zoom = "";
    });
  }
});

test("footer Explore matches desktop links and keeps them reachable", async ({
  page,
  viewport,
}) => {
  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  const explore = footer.getByRole("navigation", {
    name: "Explore",
    exact: true,
  });
  await expect(explore.getByRole("listitem")).toHaveText([
    "Menus",
    "Our Story",
    "Private Dining & Events",
    "What’s On",
    "The Journal",
    "Visit & Contact",
  ]);
  await expect(
    explore.getByRole("link", { name: "Private Dining & Events", exact: true }),
  ).toHaveAttribute("href", "/private-dining");
  await expect(explore.getByText("Gift Vouchers")).toHaveCount(0);
  await expect(
    footer.getByRole("navigation", { name: "Occasions", exact: true }),
  ).toHaveCount(0);
  await expect(
    footer.getByRole("navigation", { name: "Peploe's", exact: true }),
  ).toHaveCount(0);

  if ((viewport?.width ?? 1440) >= 1280) {
    await expect(
      footer.getByRole("link", { name: "Our Story", exact: true }),
    ).toBeVisible();
    await expect(footer.locator("summary:visible")).toHaveCount(0);
    return;
  }

  await expect(footer.locator("summary:visible")).toHaveCount(1);
  const story = explore.getByRole("link", { name: "Our Story", exact: true });
  const contact = explore.getByRole("link", {
    name: "Visit & Contact",
    exact: true,
  });

  await expect(story).toBeVisible();
  const toggle = explore.locator("summary");
  await toggle.click();
  await expect(story).toBeHidden();
  await toggle.click();
  await expect(story).toBeVisible();
  await toggle.focus();
  await page.keyboard.press("Enter");
  await expect(story).toBeHidden();
  await expect(toggle).toBeFocused();
  await page.keyboard.press("Space");
  await expect(story).toBeVisible();
  await contact.click();
  await expect(page).toHaveURL("/contact");
});

test("footer Journal link opens the hub", async ({ page, viewport }) => {
  await page.goto("/");
  const link = page
    .getByRole("contentinfo")
    .getByRole("link", { name: "The Journal", exact: true });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute("href", "/journal");
  if ((viewport?.width ?? 1440) < 1280) {
    const bounds = await link.boundingBox();
    expect(bounds?.width).toBeGreaterThanOrEqual(44);
    expect(bounds?.height).toBeGreaterThanOrEqual(44);
  }
  await link.click();
  await expect(page).toHaveURL("/journal");
  const main = page.getByRole("main");
  await expect(main).toBeVisible();
  await expect(main.getByRole("heading", { level: 1 })).toHaveText(
    "The Journal",
  );
});

test("footer respects reduced motion when opening and closing", async ({
  page,
  viewport,
}) => {
  if ((viewport?.width ?? 1440) >= 1280) {
    await page.setViewportSize({ width: 390, height: 844 });
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const section = page
    .getByRole("contentinfo")
    .getByRole("navigation", { name: "Explore", exact: true });
  const toggle = section.locator("summary");
  const story = section.getByRole("link", { name: "Our Story", exact: true });

  await toggle.click();
  await expect(story).toBeHidden();
  await toggle.click();
  await expect(story).toBeVisible();
  await toggle.click();
  await expect(story).toBeHidden();
});

test("footer social and credit links retain their public destinations", async ({
  page,
}) => {
  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  await expect(
    footer.getByRole("link", { name: /on Instagram/ }),
  ).toHaveAttribute("href", "https://www.instagram.com/peploesstephensgreen/");
  await expect(
    footer.getByRole("link", { name: /on Facebook/ }),
  ).toHaveAttribute("href", "https://www.facebook.com/Peploes");
  const credit = footer.getByRole("link", {
    name: "Made with care by TrueDevs",
    exact: true,
  });
  await expect(credit).toHaveAttribute(
    "href",
    "https://truedevs.tech/?utm_source=peploes&utm_medium=referral&utm_campaign=client_credit&utm_content=footer",
  );
  await expect(credit).toHaveAttribute("target", "_blank");
  await expect(credit).toHaveAttribute("rel", "noopener noreferrer");
});

test("mobile footer address opens the restaurant location", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  for (const name of ["View full opening times", "Directions"]) {
    await expect(footer.getByRole("link", { name, exact: true })).toHaveCount(
      0,
    );
  }
  const address = footer.getByRole("link", {
    name: "16 St Stephen's Green",
    exact: true,
  });
  await address.click();
  await expect(page).toHaveURL("/contact#find-us");
  await expect(page.locator("#find-us")).toBeInViewport();
});
