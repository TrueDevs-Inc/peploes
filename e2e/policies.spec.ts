import { expect, test } from "@playwright/test";

const policies = [
  {
    path: "/privacy-cookies",
    heading: "Your privacy matters.",
    title: "Privacy & Cookies",
    emailLinkCount: 2,
  },
  {
    path: "/accessibility-policy",
    heading: "A warm welcome for everyone.",
    title: "Accessibility",
    emailLinkCount: 1,
  },
  {
    path: "/terms-conditions",
    heading: "Our terms and conditions.",
    title: "Terms & Conditions",
    emailLinkCount: 1,
  },
  {
    path: "/booking-cancellation-terms",
    heading: "Before you book.",
    title: "Booking & Cancellation Terms",
    emailLinkCount: 2,
  },
];

test("policy email links reach the reception address", async ({ page }) => {
  for (const policy of policies) {
    await test.step(policy.path, async () => {
      await page.goto(policy.path);
      const emailLinks = page.getByRole("main").locator('a[href^="mailto:"]');
      await expect(emailLinks).toHaveCount(policy.emailLinkCount);

      for (const link of await emailLinks.all()) {
        await expect(link).toHaveAttribute(
          "href",
          "mailto:reception@peploes.com",
        );
        await expect(link).toHaveText(/^reception@peploes\.com\.?$/);
      }
    });
  }
});

for (const policy of policies) {
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
        const paragraphBounds = await main
          .locator("[data-policy-content]")
          .getByRole("paragraph")
          .first()
          .boundingBox();
        if (!paragraphBounds) throw new Error("Policy text is missing");
        expect(paragraphBounds.width).toBeCloseTo(824, 0);
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

test("all four policies share the responsive contents and reading layout", async ({
  page,
  isMobile,
}) => {
  const headingStyles: string[] = [];

  for (const policy of policies) {
    await test.step(policy.title, async () => {
      await page.goto(policy.path);
      await page.evaluate(async () => {
        await document.fonts.ready;
      });
      const main = page.getByRole("main");
      headingStyles.push(
        await main.getByRole("heading", { level: 1 }).evaluate((element) => {
          const style = getComputedStyle(element);
          return [
            style.fontFamily,
            style.fontSize,
            style.fontWeight,
            style.lineHeight,
          ].join("|");
        }),
      );
      const contents = main.getByRole("navigation", {
        name: "On this page",
        exact: true,
      });
      await expect(contents).toBeVisible();
      const firstSection = main
        .locator("[data-policy-content]")
        .getByRole("region")
        .first();
      const [contentsBounds, sectionBounds, headingBounds, bodyBounds] =
        await Promise.all([
          contents.boundingBox(),
          firstSection.boundingBox(),
          firstSection.getByRole("heading", { level: 2 }).boundingBox(),
          firstSection.getByRole("paragraph").first().boundingBox(),
        ]);
      if (!contentsBounds || !sectionBounds || !headingBounds || !bodyBounds) {
        throw new Error(
          `${policy.title} is missing its contents or first section`,
        );
      }

      if (isMobile) {
        expect(contentsBounds.y + contentsBounds.height).toBeLessThanOrEqual(
          sectionBounds.y,
        );
      } else {
        expect(contentsBounds.x + contentsBounds.width).toBeLessThanOrEqual(
          sectionBounds.x,
        );
        expect(contentsBounds.y).toBeLessThan(
          headingBounds.y + headingBounds.height,
        );
      }
      expect(bodyBounds.x).toBeCloseTo(
        isMobile ? sectionBounds.x : headingBounds.x,
        0,
      );
      if (isMobile) {
        expect(bodyBounds.width).toBeCloseTo(sectionBounds.width, 0);
        const toggle = contents.getByRole("button", {
          name: "On this page",
          exact: true,
        });
        await expect(toggle).toHaveAttribute("aria-expanded", "false");
        await expect(contents.getByRole("link").first()).toBeHidden();
        await toggle.click();
        await expect(toggle).toHaveAttribute("aria-expanded", "true");
        await expect(contents.getByRole("link").first()).toBeVisible();
        await toggle.click();
        await expect(contents.getByRole("link").first()).toBeHidden();
      }
      expect(bodyBounds.y).toBeGreaterThanOrEqual(
        headingBounds.y + headingBounds.height,
      );
    });
  }

  expect(new Set(headingStyles).size).toBe(1);
});

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
  {
    path: "/accessibility-policy",
    id: "visiting-the-restaurant",
    heading: "Visiting the restaurant",
  },
  {
    path: "/booking-cancellation-terms",
    id: "cancellations",
    heading: "Cancellations",
  },
]) {
  test(`${destination.path} contents links work by keyboard and clear the sticky header`, async ({
    page,
    isMobile,
  }) => {
    await page.goto(destination.path);
    const contents = page.getByRole("navigation", {
      name: "On this page",
      exact: true,
    });
    if (isMobile) {
      const toggle = contents.getByRole("button", {
        name: "On this page",
        exact: true,
      });
      await toggle.focus();
      await page.keyboard.press("Enter");
      await expect(toggle).toHaveAttribute("aria-expanded", "true");
    }
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
