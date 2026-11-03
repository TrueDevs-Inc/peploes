import type { Locator } from "@playwright/test";
import { expect, test } from "./menu-test";

async function isUnboxedTextAction(link: Locator) {
  if (!(await link.isVisible())) return false;
  return await link.evaluate((element) => {
    const style = getComputedStyle(element);
    return (
      style.backgroundColor === "rgba(0, 0, 0, 0)" &&
      style.boxShadow === "none" &&
      [
        style.borderTopWidth,
        style.borderRightWidth,
        style.borderBottomWidth,
        style.borderLeftWidth,
      ].every((width) => width === "0px")
    );
  });
}

test("narrow Stories text actions limit mouse hover while their wide boxes stay active", async ({
  page,
  isMobile,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const actions = page.locator(
    'section[aria-labelledby="stories-heading"] [data-variant="brand-secondary-inverse"]',
  );
  await expect(actions.first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  expect(await actions.count()).toBeGreaterThan(0);
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const action of await actions.all()) {
      if (!(await action.isVisible())) continue;
      await action.evaluate((element) =>
        element.scrollIntoView({ block: "center", behavior: "instant" }),
      );
      const bounds = await action.boundingBox();
      if (!bounds) throw new Error("The story action must be visible");
      const point = { x: bounds.x + bounds.width / 2, y: bounds.y + 2 };
      if (isMobile) {
        expect(bounds.height).toBeGreaterThanOrEqual(44);
        expect(
          await action.evaluate(
            (element, point) =>
              element.contains(document.elementFromPoint(point.x, point.y)),
            point,
          ),
        ).toBe(true);
      } else {
        await page.mouse.move(point.x, point.y);
        await expect
          .poll(() => action.evaluate((element) => element.matches(":hover")))
          .toBe(width >= 640);
        await page.mouse.move(point.x, bounds.y + bounds.height / 2);
        await expect
          .poll(() => action.evaluate((element) => element.matches(":hover")))
          .toBe(true);
      }
    }
  }
});

for (const route of [
  "/",
  "/private-dining",
  "/seasonal",
  "/visit-contact",
  "/journal",
  "/privacy-cookies",
]) {
  test(`text actions on ${route} limit hover and keep touch targets`, async ({
    page,
    isMobile,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(route);
    await expect(page.locator("main h1")).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const contents = page.getByRole("button", {
      name: "On this page",
      exact: true,
    });
    if (route === "/privacy-cookies" && (await contents.isVisible())) {
      await contents.click();
    }
    const links = page
      .locator(
        'main [data-slot="button"][data-hover-area="content"], footer [data-slot="button"][data-hover-area="content"]',
      )
      .and(page.getByRole("link"))
      .filter({ hasText: /\S/ });
    await expect
      .poll(async () => {
        for (const link of await links.all()) {
          if (await isUnboxedTextAction(link)) return true;
        }
        return false;
      })
      .toBe(true);
    let checked = 0;
    for (const link of await links.all()) {
      if (!(await isUnboxedTextAction(link))) continue;
      await link.evaluate((element) =>
        element.scrollIntoView({ block: "center", behavior: "instant" }),
      );
      const bounds = await link.evaluate((element) => {
        const { x, y, width, height } = element.getBoundingClientRect();
        return { x, y, width, height };
      });
      const label = `${route}: ${await link.innerText()}`;
      const content = await link.evaluate((element) => {
        const rectangles = [...element.querySelectorAll("svg")]
          .map((svg) => svg.getBoundingClientRect())
          .filter((rect) => rect.width > 2 && rect.height > 2);
        const decorations = [...element.querySelectorAll("*")]
          .filter((decoration) => {
            const style = getComputedStyle(decoration);
            return (
              Number.parseFloat(style.borderTopWidth) > 0 ||
              Number.parseFloat(style.borderBottomWidth) > 0
            );
          })
          .map((decoration) => decoration.getBoundingClientRect())
          .filter((rect) => rect.width > 0 && rect.height > 0);
        rectangles.push(...decorations);
        const textRectangles: DOMRect[] = [];
        const text = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
          acceptNode(node) {
            const parent = node.parentElement?.getBoundingClientRect();
            return node.textContent?.trim() &&
              parent &&
              parent.width > 2 &&
              parent.height > 2
              ? NodeFilter.FILTER_ACCEPT
              : NodeFilter.FILTER_REJECT;
          },
        });
        while (text.nextNode()) {
          const range = document.createRange();
          range.selectNodeContents(text.currentNode);
          textRectangles.push(
            ...[...range.getClientRects()].filter(
              (rect) => rect.width > 2 && rect.height > 2,
            ),
          );
        }
        rectangles.push(...textRectangles);
        const first = textRectangles[0];
        if (!first) throw new Error("The text action needs a visible label");
        return {
          left: Math.min(...rectangles.map((rect) => rect.left)),
          right: Math.max(...rectangles.map((rect) => rect.right)),
          top: Math.min(...rectangles.map((rect) => rect.top)),
          bottom: Math.max(...rectangles.map((rect) => rect.bottom)),
          inside: {
            x: first.left + first.width / 2,
            y: first.top + first.height / 2,
          },
        };
      });
      const center = (content.left + content.right) / 2;
      if (isMobile) {
        expect(bounds.height, label).toBeGreaterThanOrEqual(44);
        const textPosition = (content.inside.x - bounds.x) / bounds.width;
        await expect
          .poll(
            () =>
              link.evaluate((element, position) => {
                const current = element.getBoundingClientRect();
                return element.contains(
                  document.elementFromPoint(
                    current.x + current.width * position,
                    current.y + 2,
                  ),
                );
              }, textPosition),
            { message: label },
          )
          .toBe(true);
      } else {
        for (const point of [
          { x: center, y: content.top - 4 },
          { x: center, y: content.bottom + 4 },
          { x: content.left - 4, y: (content.top + content.bottom) / 2 },
          { x: content.right + 4, y: (content.top + content.bottom) / 2 },
        ]) {
          await page.mouse.move(point.x, point.y);
          await expect
            .poll(() => link.evaluate((element) => element.matches(":hover")), {
              message: label,
            })
            .toBe(false);
        }
        await page.mouse.move(content.inside.x, content.inside.y);
        await expect
          .poll(() => link.evaluate((element) => element.matches(":hover")), {
            message: label,
          })
          .toBe(true);
      }
      checked += 1;
    }
    expect(checked, route).toBeGreaterThan(0);
  });
}

test("text actions keep keyboard activation and boxed actions keep their padding", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  const action = page.getByRole("link", {
    name: "View what’s on",
    exact: true,
  });
  await action.focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  await expect(action).toBeFocused();
  await expect
    .poll(() => action.evaluate((element) => element.matches(":focus-visible")))
    .toBe(true);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/seasonal");
  await page.goto("/");
  const booking = page
    .getByRole("region", { name: /Good food, fine wine/ })
    .getByRole("link", { name: "Book a Table", exact: true });
  await page.setViewportSize({ width: 390, height: 844 });
  const wine = page.locator("#wine").getByRole("link").last();
  for (const boxed of [booking, wine]) {
    await boxed.scrollIntoViewIfNeeded();
    expect(
      await boxed.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        return element.contains(
          document.elementFromPoint(bounds.left + 4, bounds.top + 4),
        );
      }),
    ).toBe(true);
    if (!isMobile) {
      await boxed.hover({ position: { x: 4, y: 4 } });
      await expect
        .poll(() => boxed.evaluate((element) => element.matches(":hover")))
        .toBe(true);
    }
  }
});
