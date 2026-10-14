import { expect, test } from "@playwright/test";

for (const policy of [
  {
    path: "/privacy-cookies",
    heading: "Your privacy matters.",
    title: "Privacy & Cookies",
  },
  {
    path: "/accessibility-policy",
    heading: "A warm welcome for everyone.",
    title: "Accessibility",
  },
  {
    path: "/terms-conditions",
    heading: "Our terms and conditions.",
    title: "Terms & Conditions",
  },
  {
    path: "/booking-cancellation-terms",
    heading: "Before you book.",
    title: "Booking & Cancellation Terms",
  },
]) {
  test(`${policy.path} loads its photograph and fits the viewport`, async ({
    page,
    isMobile,
  }) => {
    await page.goto(policy.path);
    await expect(page).toHaveTitle(`${policy.title} | Peploe's`);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      new RegExp(`${policy.path}$`),
    );
    const main = page.getByRole("main");
    await expect(
      main.getByRole("heading", {
        name: policy.heading,
        level: 1,
        exact: true,
      }),
    ).toBeVisible();

    const photograph = main.getByRole("img");
    await expect(photograph).toBeVisible();
    await expect(photograph).toHaveJSProperty("complete", true);
    await expect(photograph).not.toHaveJSProperty("naturalWidth", 0);
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            document.documentElement.scrollWidth <=
            document.documentElement.clientWidth,
        ),
      )
      .toBe(true);

    if (!isMobile) {
      await page.setViewportSize({ width: 2400, height: 900 });
      await expect(async () => {
        const bounds = await main
          .locator("[data-policy-content]")
          .boundingBox();
        expect(bounds).not.toBeNull();
        if (!bounds) throw new Error("Policy content is missing");
        const viewport = await page.evaluate(() => {
          const body = document.body.getBoundingClientRect();
          return {
            contentLeft: body.left,
            contentWidth: body.width,
            width: document.documentElement.clientWidth,
          };
        });
        expect(bounds.width).toBeCloseTo(1440, 0);
        expect(bounds.x).toBeCloseTo(
          viewport.contentLeft + (viewport.contentWidth - bounds.width) / 2,
          0,
        );
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth),
        ).toBeLessThanOrEqual(viewport.width);
      }).toPass();
    }
  });
}

test("footer legal links open all four policies", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");

  for (const destination of [
    {
      label: "Privacy",
      path: "/privacy-cookies",
      heading: "Your privacy matters.",
    },
    {
      label: "Terms",
      path: "/terms-conditions",
      heading: "Our terms and conditions.",
    },
    {
      label: isMobile ? "Booking Terms" : "Booking & Cancellation",
      path: "/booking-cancellation-terms",
      heading: "Before you book.",
    },
    {
      label: "Accessibility",
      path: "/accessibility-policy",
      heading: "A warm welcome for everyone.",
    },
  ]) {
    const legalNavigation = page
      .getByRole("contentinfo")
      .getByRole("navigation", {
        name: "Legal and accessibility",
        exact: true,
      });
    const link = legalNavigation.getByRole("link", {
      name: destination.label,
      exact: true,
    });
    await expect(link).toHaveAttribute("href", destination.path);
    await link.click();
    await expect(page).toHaveURL(destination.path);
    await expect(
      page.getByRole("heading", {
        name: destination.heading,
        level: 1,
        exact: true,
      }),
    ).toBeVisible();
  }

  await expect(
    page.getByRole("contentinfo").getByText(/^(Cookie Preferences|Cookies)$/),
  ).toHaveCount(0);
});

test("an unknown policy slug returns a not-found page", async ({ page }) => {
  const response = await page.goto("/unknown-policy");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "Page Not Found", exact: true }),
  ).toBeVisible();
  await expect(page.locator("[data-policy-content]")).toHaveCount(0);
});

for (const destination of [
  {
    path: "/privacy-cookies",
    id: "cookies-and-similar-technologies",
    heading: "Cookies and similar technologies",
  },
  {
    path: "/terms-conditions",
    id: "gift-vouchers",
    heading: "Gift vouchers",
  },
]) {
  test(`${destination.path} contents links work by keyboard and clear the sticky header`, async ({
    page,
  }) => {
    await page.goto(destination.path);
    const contents = page.getByRole("navigation", {
      name: "On this page",
      exact: true,
    });
    const link = contents.getByRole("link", {
      name: new RegExp(destination.heading),
    });
    await expect(link).toHaveAttribute("href", `#${destination.id}`);
    await link.focus();
    await expect(link).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(`${destination.path}#${destination.id}`);

    const heading = page.getByRole("heading", {
      name: destination.heading,
      level: 2,
      exact: true,
    });
    await expect(heading).toBeInViewport();
    await expect(async () => {
      const offset = await heading.evaluate((element) => {
        const navigation = document.querySelector(
          'nav[aria-label="Main navigation"]',
        );
        if (!navigation) throw new Error("Main navigation is missing");
        return (
          element.getBoundingClientRect().top -
          navigation.getBoundingClientRect().bottom
        );
      });
      expect(offset).toBeGreaterThanOrEqual(0);
      expect(offset).toBeLessThanOrEqual(100);
    }).toPass({ timeout: 5000 });
  });
}
