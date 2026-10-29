import { expect, test } from "@playwright/test";

const destinations = [
  "/private-dining/groups-celebrations",
  "/private-dining/corporate-events",
  "/private-dining/weddings",
];

test.describe("photographs at fractional display scaling", () => {
  test.use({ deviceScaleFactor: 1.25 });

  test("photographs settle without a final repaint jump", async ({
    page,
    isMobile,
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/private-dining");
    await page.keyboard.press("Tab");

    for (const [index, destination] of destinations.entries()) {
      const image = page.locator(`a[href="${destination}"] img`);
      const card = page.locator("main li").filter({ has: image });
      const photograph = card.getByRole("link").first();
      const action = card.getByRole("link", {
        name: "Find out more",
        exact: true,
      });
      await expect
        .poll(() =>
          image.evaluate((element) =>
            element instanceof HTMLImageElement ? element.naturalWidth : 0,
          ),
        )
        .toBeGreaterThan(0);
      if (isMobile) await photograph.focus();
      else await image.hover();
      await expect(image).toHaveCSS(
        "transform",
        "matrix(1.05, 0, 0, 1.05, 0, 0)",
      );
      await image.evaluate((element) => {
        element.addEventListener(
          "transitionrun",
          () => {
            const animation = element
              .getAnimations()
              .find(
                (item) =>
                  item instanceof CSSTransition &&
                  item.transitionProperty === "transform",
              );
            if (!animation?.effect) return;
            animation.pause();
            animation.currentTime =
              Number(animation.effect.getTiming().duration) - 0.1;
          },
          { once: true },
        );
      });
      if (isMobile) await action.focus();
      else await page.mouse.move(0, 0);
      await expect(image).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
      const lastFrame = await photograph.screenshot({
        animations: "allow",
        path: testInfo.outputPath(`card-${index}-last-frame.png`),
      });
      await image.evaluate((element) => {
        for (const animation of element.getAnimations()) animation.finish();
      });
      await expect(image).toHaveCSS("transform", "none");
      const settled = await photograph.screenshot({
        animations: "allow",
        path: testInfo.outputPath(`card-${index}-settled.png`),
      });
      const maxChannelDifference = await page.evaluate(
        async (screenshots) => {
          const pixels = await Promise.all(
            screenshots.map(async (screenshot) => {
              const bitmap = new Image();
              bitmap.src = `data:image/png;base64,${screenshot}`;
              await bitmap.decode();
              const canvas = document.createElement("canvas");
              canvas.width = bitmap.width;
              canvas.height = bitmap.height;
              const context = canvas.getContext("2d");
              if (!context) throw new Error("Image comparison needs a canvas");
              context.drawImage(bitmap, 0, 0);
              return context.getImageData(0, 0, bitmap.width, bitmap.height)
                .data;
            }),
          );
          if (pixels[0].length !== pixels[1].length)
            throw new Error("Photograph dimensions changed on settling");
          return pixels[0].reduce(
            (max, value, index) =>
              Math.max(max, Math.abs(value - pixels[1][index])),
            0,
          );
        },
        [lastFrame.toString("base64"), settled.toString("base64")],
      );
      // Compare at the endpoint, allowing only colour-channel rounding.
      expect(maxChannelDifference).toBeLessThanOrEqual(2);
    }
  });
});

test("photograph zoom starts gently and reverses without a jump", async ({
  page,
  isMobile,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/private-dining");
  await page.keyboard.press("Tab");
  for (const destination of destinations) {
    const image = page.locator(`a[href="${destination}"] img`);
    const card = page.locator("main li").filter({ has: image });
    const photograph = card.getByRole("link").first();
    const action = card.getByRole("link", {
      name: "Find out more",
      exact: true,
    });
    await image.evaluate((element) => {
      const pauseZoom = () => {
        for (const animation of element.getAnimations()) {
          if (
            animation instanceof CSSTransition &&
            animation.transitionProperty === "transform"
          ) {
            animation.pause();
          }
        }
      };
      const photograph = element.closest("a");
      if (!photograph) throw new Error("Photograph link is missing");
      // Short reversals can finish before transitionrun is dispatched.
      for (const event of [
        "pointerenter",
        "pointerleave",
        "focusin",
        "focusout",
      ])
        photograph.addEventListener(event, pauseZoom);
      element.addEventListener("transitionrun", pauseZoom);
    });
    await page.mouse.move(0, 0);
    if (isMobile) await photograph.focus();
    else await image.hover();
    const enteringScale = await image.evaluate((element) => {
      const animation = element
        .getAnimations()
        .find(
          (item) =>
            item instanceof CSSTransition &&
            item.transitionProperty === "transform",
        );
      if (!(animation?.effect instanceof KeyframeEffect))
        throw new Error("Image zoom transition is missing");
      animation.pause();
      animation.currentTime =
        Number(animation.effect.getTiming().duration) * 0.2;
      return new DOMMatrixReadOnly(getComputedStyle(element).transform).a;
    });
    expect(enteringScale).toBeGreaterThan(1);
    expect(enteringScale).toBeLessThan(1.012);
    if (isMobile) await action.focus();
    else await page.mouse.move(0, 0);
    const leaving = await image.evaluate((element) => {
      const animation = element
        .getAnimations()
        .find(
          (item) =>
            item instanceof CSSTransition &&
            item.transitionProperty === "transform",
        );
      if (!(animation?.effect instanceof KeyframeEffect))
        throw new Error("Image return transition is missing");
      animation.pause();
      const from = new DOMMatrixReadOnly(
        String(animation.effect.getKeyframes()[0].transform),
      ).a;
      animation.currentTime =
        Number(animation.effect.getTiming().duration) * 0.3;
      return {
        from,
        current: new DOMMatrixReadOnly(getComputedStyle(element).transform).a,
      };
    });
    expect(leaving.from).toBeCloseTo(enteringScale, 3);
    if (isMobile) await photograph.focus();
    else await image.hover();
    const reentryFrom = await image.evaluate((element) => {
      const animation = element
        .getAnimations()
        .find(
          (item) =>
            item instanceof CSSTransition &&
            item.transitionProperty === "transform",
        );
      if (!(animation?.effect instanceof KeyframeEffect))
        throw new Error("Image re-entry transition is missing");
      animation.pause();
      return new DOMMatrixReadOnly(
        String(animation.effect.getKeyframes()[0].transform),
      ).a;
    });
    expect(reentryFrom).toBeCloseTo(leaving.current, 3);
  }
});

test("occasion photographs open the same pages as their actions", async ({
  page,
}) => {
  for (const destination of destinations) {
    await page.goto("/private-dining");
    const photograph = page.locator(`main a[href="${destination}"]`).filter({
      has: page.getByRole("img"),
    });
    await expect(photograph).toHaveCount(1);
    await photograph.click();
    await expect(page).toHaveURL(destination);
  }
});

test("photograph hover animates its image and action arrow together", async ({
  page,
  isMobile,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/private-dining");
  for (const destination of destinations) {
    const image = page.locator(`a[href="${destination}"] img`);
    const card = page.locator("main li").filter({ has: image });
    const action = card.getByRole("link", {
      name: "Find out more",
      exact: true,
    });
    const arrow = action.locator("svg");
    const photograph = card.getByRole("link").first();
    if (isMobile) {
      await photograph.focus();
    } else {
      await image.hover();
    }
    await expect(image).toHaveCSS(
      "transform",
      "matrix(1.05, 0, 0, 1.05, 0, 0)",
    );
    await expect(arrow).toHaveCSS("transform", "matrix(1, 0, 0, 1, 3, 0)");
    await expect(action).toHaveCSS("text-decoration-line", "underline");
    await expect(image).toHaveCSS("transition-duration", "0.3s");
    await action.focus();
    if (!isMobile) await action.hover();
    await expect(image).toHaveCSS("transform", "none");
    await expect(arrow).toHaveCSS("transform", "matrix(1, 0, 0, 1, 3, 0)");
    await page.emulateMedia({ reducedMotion: "reduce" });
    if (isMobile) {
      await photograph.focus();
    } else {
      await image.hover();
    }
    await expect(image).toHaveCSS("transform", "none");
    await expect(arrow).toHaveCSS("transform", "none");
    await page.emulateMedia({ reducedMotion: "no-preference" });
  }
});
