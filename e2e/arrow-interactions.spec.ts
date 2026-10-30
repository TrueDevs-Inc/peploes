import { expect, test } from "@playwright/test";

test.use({
  viewport: { width: 1440, height: 900 },
  isMobile: false,
  hasTouch: false,
});

test("arrows animate when hovering the whole control and respect reduced motion", async ({
  page,
}) => {
  await page.goto("/visit-contact");
  await page.emulateMedia({ reducedMotion: "no-preference" });

  const navigation = page.getByRole("navigation", { name: "Main navigation" });
  const booking = navigation.getByRole("link", { name: "Book a Table" });
  const email = page
    .getByRole("region", { name: /find your preferred date/ })
    .getByRole("link", { name: /@/ });

  const subscribe = page.getByRole("button", {
    name: "Subscribe",
    exact: true,
  });
  await expect(subscribe).toBeEnabled();

  for (const control of [booking, email, subscribe]) {
    const arrow = control.locator("svg.lucide-arrow-right");
    await expect(arrow).toBeVisible();
    await control.hover({ position: { x: 4, y: 4 } });
    await expect(arrow).toHaveCSS("transform", "matrix(1, 0, 0, 1, 3, 0)");
    await page.mouse.move(0, 0);
    await expect(arrow).toHaveCSS("transform", "none");
  }

  await page.emulateMedia({ reducedMotion: "reduce" });
  await booking.hover({ position: { x: 4, y: 4 } });
  await expect(booking.locator("svg.lucide-arrow-right")).toHaveCSS(
    "transform",
    "none",
  );
});
