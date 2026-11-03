import type { Locator } from "@playwright/test";
import { expect, test } from "./menu-test";

test("footer groups social links with contact details before opening hours", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const footer = page.getByRole("contentinfo");
  const contact = footer.getByRole("region", { name: /Contact|Get in Touch/ });
  const instagram = contact.getByRole("link", { name: /on Instagram/ });
  const facebook = contact.getByRole("link", { name: /on Facebook/ });
  await expect(instagram).toBeVisible();
  await expect(facebook).toBeVisible();
  await expect(instagram).toHaveAttribute(
    "href",
    "https://www.instagram.com/peploesstephensgreen/",
  );
  await expect(facebook).toHaveAttribute(
    "href",
    "https://www.facebook.com/Peploes",
  );
  const email = await contact
    .getByRole("link", { name: "reception@peploes.com", exact: true })
    .boundingBox();
  const social = await instagram.boundingBox();
  const hours = await contact
    .getByRole("heading", { name: "Opening Hours", exact: true })
    .boundingBox();
  if (!email || !social || !hours)
    throw new Error("Contact details must be visible");
  expect(social.y - (email.y + email.height)).toBeGreaterThanOrEqual(16);
  expect(social.y - (email.y + email.height)).toBeLessThanOrEqual(24);
  expect(hours.y - (social.y + social.height)).toBeGreaterThanOrEqual(24);
  const instagramIcon = instagram.locator("svg");
  const facebookIcon = facebook.locator("svg");
  await expect(instagramIcon).toHaveCSS("width", "28px");
  await expect(facebookIcon).toHaveCSS("width", "28px");
  await expect(instagramIcon).toHaveAttribute("stroke-width", "1.75");
  await expect(facebookIcon).toHaveAttribute("stroke-width", "1.75");
  await expect(instagramIcon).toHaveCSS("color", "rgb(46, 42, 40)");
  await expect(facebookIcon).toHaveCSS("color", "rgb(46, 42, 40)");
  const firstIcon = await instagramIcon.boundingBox();
  const secondIcon = await facebookIcon.boundingBox();
  if (!firstIcon || !secondIcon)
    throw new Error("Social icons must be visible");
  expect(firstIcon.x).toBeCloseTo(hours.x, 0);
  expect(secondIcon.x - (firstIcon.x + firstIcon.width)).toBeLessThanOrEqual(
    16,
  );
});

test("footer places the TrueDevs credit below the copyright", async ({
  page,
  isMobile,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const footer = page.getByRole("contentinfo");
  const credit = footer.getByRole("link", {
    name: "Made with care by TrueDevs",
    exact: true,
  });
  await expect(credit).toBeVisible();
  await expect(credit).toHaveAttribute(
    "href",
    "https://truedevs.tech/?utm_source=peploes&utm_medium=referral&utm_campaign=client_credit&utm_content=footer",
  );
  await expect(credit).toHaveAttribute("target", "_blank");
  await expect(credit).toHaveAttribute("rel", "noopener noreferrer");
  await expect(credit).toHaveCSS("font-family", /Inter/);
  await expect(credit).toHaveCSS("font-size", isMobile ? "12px" : "13.5px");
  await expect(credit).toHaveCSS("line-height", isMobile ? "16px" : "18px");
  await expect(credit).toHaveCSS("min-height", isMobile ? "24px" : "27px");
  await expect(credit.getByText("True", { exact: true })).toHaveCSS(
    "font-weight",
    "700",
  );
  await expect(credit.getByText("Devs", { exact: true })).toHaveCSS(
    "font-weight",
    "300",
  );
  const copyright = await footer
    .getByText("© 2026 Peploe’s", { exact: true })
    .boundingBox();
  const bounds = await credit.boundingBox();
  const footerBounds = await footer.boundingBox();
  if (!copyright || !bounds || !footerBounds)
    throw new Error("Footer credit and copyright must be visible");
  expect(bounds.y).toBeGreaterThanOrEqual(copyright.y + copyright.height);
  expect(bounds.x + bounds.width / 2).toBeCloseTo(
    footerBounds.x + footerBounds.width / 2,
    0,
  );
  expect(
    footerBounds.y + footerBounds.height - (bounds.y + bounds.height),
  ).toBeCloseTo(isMobile ? 12 : 13.5, 0);
  const legalBounds = await footer.locator("[data-footer-legal]").boundingBox();
  if (!legalBounds) throw new Error("Footer legal row must be visible");
  expect(bounds.y - (legalBounds.y + legalBounds.height)).toBeCloseTo(
    isMobile ? 16 : 18,
    0,
  );
  if (!isMobile) {
    await page.setViewportSize({ width: 1100, height: 900 });
    await expect(credit).toHaveCSS("font-size", "12.375px");
    await expect(credit).toHaveCSS("line-height", "16.5px");
    await expect(credit).toHaveCSS("min-height", "24.75px");
  }
  if (isMobile) await credit.focus();
  else await credit.hover();
  await expect(credit.getByText("True", { exact: true })).toHaveCSS(
    "color",
    "rgb(255, 77, 0)",
  );
});

test("mobile footer uses one address button without redundant hours or Directions links", async ({
  page,
  viewport,
}) => {
  if ((viewport?.width ?? 1440) >= 1280) {
    await page.setViewportSize({ width: 390, height: 844 });
  }
  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  await expect(
    footer.getByRole("link", { name: "View full opening times", exact: true }),
  ).toHaveCount(0);
  const address = footer.getByRole("link", {
    name: "16 St Stephen's Green",
    exact: true,
  });
  await expect(address).toBeVisible();
  await expect(address).toHaveAttribute("href", "/visit-contact#find-us");
  await expect(address).toHaveCSS("border-top-width", "1px");
  await expect(
    footer.getByRole("link", { name: "Directions", exact: true }),
  ).toHaveCount(0);
});

test("mobile footer legal links share one row with comfortable touch targets", async ({
  page,
  viewport,
}) => {
  if ((viewport?.width ?? 1440) >= 1280) {
    await page.setViewportSize({ width: 390, height: 844 });
  }

  for (const path of ["/", "/visit-contact"]) {
    await page.goto(path);
    const footer = page.getByRole("contentinfo");
    const legal = footer.getByRole("navigation", {
      name: "Legal and accessibility",
    });
    const controls = legal.getByRole("link").or(legal.getByRole("button"));
    await page.evaluate(() => document.fonts.ready);
    await expect(controls).toHaveCount(5);
    for (const [index, name] of [
      "Privacy Policy",
      "Terms",
      "Accessibility",
      "Booking & Cancellation",
      "Cookie Settings",
    ].entries()) {
      await expect(controls.nth(index)).toHaveAccessibleName(name);
    }
    expect(
      await controls.evaluateAll((elements) =>
        elements.map((element) => (element as HTMLElement).innerText),
      ),
    ).toEqual([
      "Privacy",
      "Terms",
      "Accessibility",
      "Booking",
      "Cookie Settings",
    ]);
    const positions = await controls.evaluateAll((elements) =>
      elements.map((element) => {
        const bounds = element.getBoundingClientRect();
        return { left: bounds.left, top: bounds.top, right: bounds.right };
      }),
    );
    for (let index = 1; index < positions.length; index++) {
      expect(positions[index].top).toBeCloseTo(positions[0].top, 0);
      expect(positions[index].left).toBeGreaterThanOrEqual(
        positions[index - 1].right,
      );
    }

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
    await legal.getByRole("button", { name: "Cookie Settings" }).click();
    await expect(
      page.getByRole("dialog", { name: "Cookie Preferences" }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(
      legal.getByRole("button", { name: "Cookie Settings" }),
    ).toBeFocused();
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

function sampleFooterFade(section: Locator) {
  return section.evaluate(async (element) => {
    const toggle = element.querySelector("summary");
    if (!toggle) throw new Error("The footer section needs a toggle.");
    const targetOpacity = element.hasAttribute("open") ? 0 : 1;
    const samples = [];
    toggle.click();
    const started = performance.now();
    do {
      await new Promise(requestAnimationFrame);
      const style = getComputedStyle(element, "::details-content");
      const opacity = Number(style.opacity);
      const height =
        element.getBoundingClientRect().height -
        toggle.getBoundingClientRect().height;
      samples.push({
        opacity,
        height,
        visibility: style.contentVisibility,
        duration: style.transitionDuration,
        easing: style.transitionTimingFunction,
      });
      if (opacity === targetOpacity) break;
    } while (performance.now() - started < 1000);
    return samples;
  });
}

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
  await expect(page).toHaveURL("/visit-contact");
});

test("mobile Explore has a bottom border and equal contact spacing", async ({
  page,
  viewport,
}) => {
  if ((viewport?.width ?? 1440) >= 1280) {
    await page.setViewportSize({ width: 390, height: 844 });
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  const explore = footer.getByRole("navigation", {
    name: "Explore",
    exact: true,
  });
  const details = explore.locator("details");

  for (const open of [true, false]) {
    if (!open) await explore.locator("summary").click();
    await expect(details).toHaveJSProperty("open", open);
    const spacing = await explore.evaluate((navigation) => {
      const contact = navigation
        .closest("footer")
        ?.querySelector('[data-footer-section="contact"]');
      if (!contact) throw new Error("The footer contact section is missing.");
      return {
        aboveContact:
          contact.getBoundingClientRect().top -
          navigation.getBoundingClientRect().bottom,
        belowContact: -Number.parseFloat(
          getComputedStyle(contact, "::after").bottom,
        ),
      };
    });
    expect(spacing.aboveContact).toBeCloseTo(40, 0);
    expect(spacing.belowContact).toBeCloseTo(spacing.aboveContact, 0);
    const bottomBorder = open ? details : explore.locator("summary h2");
    await expect(bottomBorder).toHaveCSS("border-bottom-width", "1px");
    await expect(bottomBorder).toHaveCSS("border-bottom-style", "solid");
    await expect(bottomBorder).toHaveCSS(
      "border-bottom-color",
      "rgb(217, 209, 198)",
    );
  }
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

test("footer content fades and collapses together", async ({
  page,
  viewport,
}) => {
  if ((viewport?.width ?? 1440) >= 1280) {
    await page.setViewportSize({ width: 390, height: 844 });
  }
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const section = page
    .getByRole("contentinfo")
    .getByRole("navigation", { name: "Explore", exact: true });
  const details = section.locator("details");
  const story = section.getByRole("link", { name: "Our Story", exact: true });

  await section.scrollIntoViewIfNeeded();
  await sampleFooterFade(details);
  const opening = await sampleFooterFade(details);
  expect(opening.at(0)?.duration).toBe("0.5s");
  expect(opening.at(0)?.easing).toBe("cubic-bezier(0.4, 0, 0.2, 1)");
  expect(opening.some(({ opacity }) => opacity > 0 && opacity < 1)).toBe(true);
  expect(opening.at(-1)?.opacity).toBe(1);
  await expect(story).toBeVisible();

  const expandedHeight = opening.at(-1)?.height ?? 0;
  const closing = await sampleFooterFade(details);
  expect(closing.at(0)?.duration).toBe("0.3s");
  expect(closing.at(0)?.easing).toBe("cubic-bezier(0.4, 0, 0.2, 1)");
  expect(
    closing.some(
      ({ opacity, height, visibility }) =>
        opacity > 0 &&
        opacity < 1 &&
        height > 0 &&
        height < expandedHeight - 1 &&
        visibility === "visible",
    ),
  ).toBe(true);
  for (const { opacity, height } of closing) {
    expect(Math.abs(height - expandedHeight * opacity)).toBeLessThan(2);
  }
  expect(closing.at(-1)?.opacity).toBe(0);
  expect(closing.at(-1)?.height).toBe(0);
  await expect(story).toBeHidden();
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
  expect(
    await section
      .locator("details")
      .evaluate(
        (element) =>
          getComputedStyle(element, "::details-content").transitionProperty,
      ),
  ).toBe("none");
  await toggle.click();
  await expect(story).toBeHidden();
});
