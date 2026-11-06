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

test("policy contents link to the related policies in the design", async ({
  page,
  isMobile,
}) => {
  for (const policy of [
    {
      path: "/privacy-cookies",
      related: ["Terms & Conditions", "Accessibility"],
    },
    {
      path: "/accessibility-policy",
      related: ["Privacy & Cookies", "Terms & Conditions"],
    },
    {
      path: "/terms-conditions",
      related: ["Booking & Cancellation Terms", "Privacy & Cookies"],
    },
    {
      path: "/booking-cancellation-terms",
      related: ["Terms & Conditions", "Privacy & Cookies"],
    },
  ]) {
    await page.goto(policy.path);
    const contents = page.getByRole("navigation", {
      name: "On this page",
      exact: true,
    });
    const related = contents.getByRole("list", {
      name: "Related policies",
      exact: true,
    });
    if (isMobile) {
      await expect(related).toBeHidden();
      await contents
        .getByRole("button", { name: "On this page", exact: true })
        .click();
    }
    await expect(related).toBeVisible();
    await expect(related.getByRole("link")).toHaveText(policy.related);
    for (const title of policy.related) {
      const destination = policies.find(
        (candidate) => candidate.title === title,
      );
      if (!destination) throw new Error(`Unknown related policy: ${title}`);
      const link = related.getByRole("link", {
        name: title,
        exact: true,
      });
      await expect(link).toHaveAttribute("href", destination.path);
    }
    const firstLink = related.getByRole("link").first();
    const href = await firstLink.getAttribute("href");
    await firstLink.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(href ?? "");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
});

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
  });
}

test("all four policies share the responsive contents and reading layout", async ({
  page,
  isMobile,
}) => {
  for (const policy of policies) {
    await test.step(policy.title, async () => {
      await page.goto(policy.path);
      await page.evaluate(async () => {
        await document.fonts.ready;
      });
      const main = page.getByRole("main");
      const contents = main.getByRole("navigation", {
        name: "On this page",
        exact: true,
      });
      await expect(contents).toBeVisible();
      if (isMobile) {
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
    });
  }
});

test("footer legal links open the requested policies", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");

  if (!isMobile) {
    await expect(
      page.locator('[data-footer-section="explore"]').getByRole("link", {
        name: "Visit & Contact",
        exact: true,
      }),
    ).toHaveAttribute("href", "/contact");
  }

  for (const destination of [
    {
      label: "Privacy Policy",
      path: "/privacy-policy",
      heading: "Your privacy matters.",
    },
    {
      label: "Terms",
      path: "/terms-conditions",
      heading: "Our terms and conditions.",
    },
    {
      label: "Accessibility",
      path: "/accessibility-policy",
      heading: "A warm welcome for everyone.",
    },
    {
      label: "Booking & Cancellation",
      path: "/booking-cancellation-terms",
      heading: "Before you book.",
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
    if (destination.path === "/privacy-policy") {
      await page.reload();
      await expect(page).toHaveURL("/privacy-policy");
    }
    await expect(
      page.getByRole("heading", {
        name: destination.heading,
        level: 1,
        exact: true,
      }),
    ).toBeVisible();
  }

  await expect(
    page
      .getByRole("contentinfo")
      .getByRole("button", { name: "Cookie Settings", includeHidden: true }),
  ).toBeHidden();
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
