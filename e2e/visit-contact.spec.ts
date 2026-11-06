import { expect, test } from "@playwright/test";

test("location sections keep the page background and the map has a shadow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/contact");
  const section = page.locator("#find-us");
  const desktopBackground = await page
    .getByRole("main")
    .evaluate((element) => getComputedStyle(element).backgroundColor);
  for (const width of [320, 390, 639, 768, 1280, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await expect(section).toHaveCSS("background-color", desktopBackground);
    for (const content of await section.locator(":scope > div").all()) {
      await expect(content).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    }
    const map = section.locator("[aria-busy]");
    await expect(map).toHaveCSS("border-top-style", "solid");
    const borderWidth = await map.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).borderTopWidth),
    );
    expect(borderWidth).toBeGreaterThan(0);
    expect(borderWidth).toBeLessThanOrEqual(1);
    await expect(map).not.toHaveCSS("box-shadow", "none");
  }
});

test("contact information has aligned mobile headings and compact details", async ({
  page,
  isMobile,
}) => {
  await page.goto("/contact");
  await page.evaluate(() => document.fonts.ready);
  const information = page.getByRole("region", {
    name: "Opening hours, address and contact",
  });
  const sizes = isMobile
    ? { heading: "27px", icon: "47px", detail: "15px" }
    : { heading: "30px", icon: "48px", detail: "18px" };
  for (const heading of await information.getByRole("heading").all()) {
    await expect(heading).toHaveCSS("font-size", sizes.heading);
    if (isMobile) {
      const offset = await heading.evaluate((element) => {
        const icon = element.parentElement?.parentElement?.querySelector("img");
        if (!icon) throw new Error("Contact information icon is missing");
        return (
          element.getBoundingClientRect().top - icon.getBoundingClientRect().top
        );
      });
      expect(Math.abs(offset)).toBeLessThan(1);
    }
  }
  for (const icon of await information.locator("img").all()) {
    await expect(icon).toHaveCSS("width", sizes.icon);
    await expect(icon).toHaveCSS("height", sizes.icon);
  }
  for (const selector of ["dl", "address"]) {
    await expect(information.locator(selector)).toHaveCSS(
      "font-size",
      sizes.detail,
    );
  }
  if (isMobile) {
    const links = information.getByRole("link");
    const phone = await links.nth(0).boundingBox();
    const email = await links.nth(1).boundingBox();
    if (!phone || !email) throw new Error("Contact links are missing");
    expect(email.y - phone.y - phone.height).toBeLessThan(1);
    const labelGap = await links.evaluateAll((elements) => {
      const bounds = elements.map((element) => {
        const range = document.createRange();
        range.selectNodeContents(element);
        return range.getBoundingClientRect();
      });
      return bounds[1].top - bounds[0].bottom;
    });
    expect(labelGap).toBeLessThan(6);
  }
});

test("the former Visit URL redirects permanently to Contact", async ({
  page,
  request,
}) => {
  const response = await request.get("/visit-contact?source=bookmark", {
    maxRedirects: 0,
  });
  expect(response.status()).toBe(308);
  expect(response.headers().location).toBe("/contact?source=bookmark");
  await page.goto("/visit-contact#find-us");
  await expect(page).toHaveURL("/contact#find-us");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /\/contact$/,
  );
});

test("Visit loads its image and contact information without horizontal overflow", async ({
  page,
}) => {
  await page.goto("/contact");

  await expect(
    page.getByRole("form", { name: "General contact message" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Send us a message." }),
  ).toHaveCount(0);
  const enquiry = page.locator("#enquire");
  await expect(
    enquiry.getByRole("form", { name: "Plan your gathering" }),
  ).toBeVisible();
  await expect(enquiry.locator("+ section")).toContainText("The city fades.");

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

test("navigation reaches Visit, closes the mobile menu and returns home on desktop", async ({
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
    await expect(page).toHaveURL(/\/contact$/);
    await expect(menu).not.toBeVisible();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  } else {
    const visit = navigation.getByRole("link", {
      name: "Visit & Contact",
      exact: true,
    });
    await visit.click();
    await page.mouse.move(0, 0);
    await expect(page).toHaveURL(/\/contact$/);
    await navigation.getByRole("link", { name: "Peploe’s home" }).click();
    await page.mouse.move(0, 0);
    await expect(page).toHaveURL("/");
  }
});

for (const destination of [{ id: "opening-hours" }, { id: "find-us" }]) {
  test(`${destination.id} lands below the sticky navigation`, async ({
    page,
    isMobile,
  }) => {
    const path = `/contact#${destination.id}`;
    if (isMobile && destination.id === "find-us") {
      await page.goto("/");
      const link = page.getByRole("contentinfo").getByRole("link", {
        name: "16 St Stephen's Green",
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
    const offsetBelowNavigation = () =>
      target.evaluate((section) => {
        const navigation = document.querySelector(
          'nav[aria-label="Main navigation"]',
        );
        if (!navigation) throw new Error("Main navigation is missing");
        return (
          section.getBoundingClientRect().top -
          navigation.getBoundingClientRect().bottom
        );
      });
    await expect(async () => {
      const offset = await offsetBelowNavigation();
      expect(offset).toBeGreaterThanOrEqual(0);
      expect(offset).toBeLessThanOrEqual(100);
    }).toPass({ timeout: 5000 });
  });
}

for (const targetId of ["opening-hours", "find-us"]) {
  test(`cold anchor links scroll to ${targetId} with a slower renderer`, async ({
    page,
  }) => {
    const session = await page.context().newCDPSession(page);
    await session.send("Emulation.setCPUThrottlingRate", { rate: 6 });
    await page.goto(`/contact#${targetId}`);
    const target = page.locator(`#${targetId}`);
    await expect(target).toBeInViewport();
    await expect
      .poll(() =>
        target.evaluate((element) => {
          const header = document.querySelector(
            'nav[aria-label="Main navigation"]',
          );
          if (!header) throw new Error("Main navigation is missing");
          return (
            element.getBoundingClientRect().top >=
            header.getBoundingClientRect().bottom
          );
        }),
      )
      .toBe(true);
  });
}

test("contact and map links point to the restaurant's public destinations", async ({
  page,
}) => {
  await page.goto("/contact");
  const main = page.getByRole("main");
  for (const label of ["+353 1 676 3144", "Call +353 1 676 3144"]) {
    await expect(
      main.getByRole("link", { name: label, exact: true }),
    ).toHaveAttribute("href", "tel:+35316763144");
  }
  for (const label of [
    "reception@peploes.com",
    "Email reception@peploes.com",
  ]) {
    await expect(
      main.getByRole("link", { name: label, exact: true }),
    ).toHaveAttribute("href", "mailto:reception@peploes.com");
  }
  const link = main.getByRole("link", { name: "Get Directions", exact: true });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  await expect(link).toHaveAttribute(
    "href",
    "https://www.google.com/maps/dir/?api=1&destination=Peploe%27s%2C%2016%20St%20Stephen%27s%20Green%2C%20Dublin%202",
  );
});

test("Contact keeps its only enquiry form immediately before the closing section", async ({
  page,
}) => {
  await page.goto("/contact");
  const main = page.getByRole("main");
  await expect(
    main.getByRole("form", { name: "Plan your gathering" }),
  ).toBeVisible();
  await expect(
    main.getByRole("form", { name: "General contact message" }),
  ).toHaveCount(0);
  await expect(main.getByRole("form")).toHaveCount(1);
  const sections = await main
    .locator(":scope > section")
    .evaluateAll((elements) =>
      elements.map((section) => ({
        id: section.id,
        hasForm: Boolean(section.querySelector("form")),
      })),
    );
  expect(sections.at(-2)).toEqual({ id: "enquire", hasForm: true });
  expect(sections.filter((section) => section.hasForm)).toHaveLength(1);
  expect(sections[0]?.hasForm).toBe(false);
});
