import { expect, type Locator, test } from "@playwright/test";

test("mobile footer legal and social controls have comfortable touch targets", async ({
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
    await expect(controls).toHaveText([
      "Privacy Policy",
      "Terms",
      "Accessibility",
      "Booking & Cancellation",
      "Cookie Settings",
    ]);
    const positions = await controls.evaluateAll((elements) =>
      elements.map((element) => {
        const bounds = element.getBoundingClientRect();
        return { left: bounds.left, top: bounds.top, bottom: bounds.bottom };
      }),
    );
    for (let index = 1; index < positions.length; index++) {
      expect(positions[index].left).toBeCloseTo(positions[0].left, 0);
      expect(positions[index].top).toBeGreaterThanOrEqual(
        positions[index - 1].bottom,
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
    const booking = legal.getByRole("link", {
      name: "Booking & Cancellation",
      exact: true,
    });
    expect(
      await booking.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        return bounds.left >= 0 && bounds.right <= innerWidth;
      }),
    ).toBe(true);
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

test("footer sections open independently and keep their links reachable", async ({
  page,
  viewport,
}) => {
  await page.goto("/");
  const footer = page.getByRole("contentinfo");

  if ((viewport?.width ?? 1440) >= 1280) {
    await expect(
      footer.getByRole("link", { name: "Our Story", exact: true }),
    ).toBeVisible();
    await expect(footer.locator("summary:visible")).toHaveCount(0);
    return;
  }

  const explore = footer.getByRole("navigation", {
    name: "Explore",
    exact: true,
  });
  const occasions = footer.getByRole("navigation", {
    name: "Occasions",
    exact: true,
  });
  const peploes = footer.getByRole("navigation", {
    name: "Peploe's",
    exact: true,
  });
  const story = explore.getByRole("link", { name: "Our Story", exact: true });
  const weddings = occasions.getByRole("link", {
    name: "Weddings",
    exact: true,
  });
  const contact = peploes.getByRole("link", { name: "Contact", exact: true });

  await expect(story).toBeVisible();
  await expect(weddings).toBeHidden();
  await expect(contact).toBeHidden();

  for (const [section, label, link] of [
    [explore, "Explore", story],
    [occasions, "Occasions", weddings],
    [peploes, "Peploe's", contact],
  ] as const) {
    const toggle = section.locator("summary");
    if (label === "Explore") {
      await toggle.click();
      await expect(link).toBeHidden();
    }
    await toggle.click();
    await expect(link).toBeVisible();
    await toggle.focus();
    await page.keyboard.press("Enter");
    await expect(link).toBeHidden();
    await expect(toggle).toBeFocused();
    await page.keyboard.press("Space");
    await expect(link).toBeVisible();
  }

  await expect(story).toBeVisible();
  await expect(weddings).toBeVisible();
  await expect(
    footer.getByRole("button", { name: "People & Produce" }),
  ).toHaveAttribute("aria-disabled", "true");
  await contact.click();
  await expect(page).toHaveURL("/visit-contact");
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
    .getByRole("navigation", { name: "Occasions", exact: true });
  const details = section.locator("details");
  const weddings = section.getByRole("link", { name: "Weddings", exact: true });

  await section.scrollIntoViewIfNeeded();
  const opening = await sampleFooterFade(details);
  expect(opening.at(0)?.duration).toBe("0.5s");
  expect(opening.at(0)?.easing).toBe("cubic-bezier(0.4, 0, 0.2, 1)");
  expect(opening.some(({ opacity }) => opacity > 0 && opacity < 1)).toBe(true);
  expect(opening.at(-1)?.opacity).toBe(1);
  await expect(weddings).toBeVisible();

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
  await expect(weddings).toBeHidden();
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
    .getByRole("navigation", { name: "Occasions", exact: true });
  const toggle = section.locator("summary");
  const weddings = section.getByRole("link", { name: "Weddings", exact: true });

  await toggle.click();
  await expect(weddings).toBeVisible();
  expect(
    await section
      .locator("details")
      .evaluate(
        (element) =>
          getComputedStyle(element, "::details-content").transitionProperty,
      ),
  ).toBe("none");
  await toggle.click();
  await expect(weddings).toBeHidden();
});
