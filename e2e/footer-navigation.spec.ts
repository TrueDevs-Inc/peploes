import { expect, type Locator, test } from "@playwright/test";

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
