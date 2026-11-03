import { expect, test } from "@playwright/test";
import { passWine } from "./newsletter-popup";

test.use({ storageState: { cookies: [], origins: [] } });

test("homepage popup opens after wine, dismisses with Escape and remembers on revisit", async ({
  page,
}) => {
  await page.goto("/");
  const popup = page.getByRole("dialog", { name: "A Letter from Gina" });
  await expect(popup).not.toBeVisible();
  const focusTarget = page.getByRole("link", { name: "Peploe’s home" }).first();
  await focusTarget.focus();
  await passWine(page);
  await expect(popup).toBeVisible();
  await expect(
    popup.getByRole("button", { name: "Close newsletter signup" }),
  ).toBeFocused();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(popup).not.toBeVisible();
  await expect(focusTarget).toBeFocused();
  await page.reload();
  await passWine(page);
  await expect(popup).not.toBeVisible();
});

test("popup retains rejected input and scroll position without navigation", async ({
  page,
}) => {
  await page.goto("/");
  await passWine(page);
  const popup = page.getByRole("dialog", { name: "A Letter from Gina" });
  await expect(popup).toBeVisible();
  const email = popup.getByLabel("Your email address", { exact: true });
  await email.fill("popup@example.test");
  const scroll = await page.evaluate(() => scrollY);
  await popup.getByRole("button", { name: "Subscribe", exact: true }).click();
  await expect(popup.getByRole("alert")).toContainText(
    "temporarily unavailable",
  );
  await expect(email).toHaveValue("popup@example.test");
  expect(await page.evaluate(() => scrollY)).toBe(scroll);
  await expect(page).toHaveURL("/");
  await popup.getByRole("button", { name: "Close newsletter signup" }).click();
  await expect(popup).not.toBeVisible();
});

test("blocked storage remains usable and another open dialog prevents stacking", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new Error("blocked");
    };
    Storage.prototype.setItem = () => {
      throw new Error("blocked");
    };
  });
  await page.goto("/");
  await passWine(page);
  const popup = page.getByRole("dialog", { name: "A Letter from Gina" });
  await expect(popup).toBeVisible();
  await page.keyboard.press("Escape");
  await passWine(page);
  await expect(popup).not.toBeVisible();
  await page.reload();
  await page.evaluate(() => {
    const other = document.createElement("dialog");
    other.textContent = "Other task";
    document.body.append(other);
    other.showModal();
  });
  await passWine(page);
  await expect(popup).not.toBeVisible();
});

test("recent display suppresses popup until seven days pass", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("peploes:newsletter:last-shown", String(Date.now())),
  );
  await page.goto("/");
  await passWine(page);
  await expect(
    page.getByRole("dialog", { name: "A Letter from Gina" }),
  ).not.toBeVisible();
});

test("expired cooldown allows a new display and subscribed visitors stay suppressed", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() =>
    localStorage.setItem(
      "peploes:newsletter:last-shown",
      String(Date.now() - 8 * 86400000),
    ),
  );
  await page.reload();
  await passWine(page);
  await expect(
    page.getByRole("dialog", { name: "A Letter from Gina" }),
  ).toBeVisible();
  await page.evaluate(() => {
    localStorage.removeItem("peploes:newsletter:last-shown");
    localStorage.setItem("peploes:newsletter:subscribed", "true");
  });
  await page.reload();
  await passWine(page);
  await expect(
    page.getByRole("dialog", { name: "A Letter from Gina" }),
  ).not.toBeVisible();
});

test("keyboard focus stays in the popup and dismissal returns to the page", async ({
  page,
}) => {
  await page.goto("/");
  await passWine(page);
  const popup = page.getByRole("dialog", { name: "A Letter from Gina" });
  await expect(popup).toBeVisible();
  for (const key of ["Shift+Tab", "Tab", "Tab", "Tab", "Tab"]) {
    await page.keyboard.press(key);
    expect(
      await popup.evaluate((dialog) => dialog.contains(document.activeElement)),
    ).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(popup).not.toBeVisible();
});

test("a focused reservation link skips the popup opening opportunity", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("link", { name: "Book a Table", exact: true })
    .first()
    .focus();
  await passWine(page);
  await expect(
    page.getByRole("dialog", { name: "A Letter from Gina" }),
  ).not.toBeVisible();
});

test("blocked storage still remembers dismissal across client navigation", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new Error("blocked");
    };
    Storage.prototype.setItem = () => {
      throw new Error("blocked");
    };
  });
  await page.goto("/");
  await passWine(page);
  const popup = page.getByRole("dialog", { name: "A Letter from Gina" });
  await expect(popup).toBeVisible();
  await page.keyboard.press("Escape");
  await page.evaluate(() => window.scrollTo(0, 0));
  const menu = page.getByRole("button", { name: "Open menu", exact: true });
  if (await menu.isVisible()) await menu.click();
  await page
    .getByRole("link", { name: "Our Story", exact: true })
    .first()
    .click();
  await expect(page).toHaveURL("/our-story");
  await expect(popup).toHaveCount(0);
  await page.getByRole("link", { name: "Peploe’s home" }).first().click();
  await passWine(page);
  await expect(popup).not.toBeVisible();
});

test("clicking the backdrop dismisses and remembers the popup", async ({
  page,
}) => {
  await page.goto("/");
  await passWine(page);
  const popup = page.getByRole("dialog", { name: "A Letter from Gina" });
  await expect(popup).toBeVisible();
  await page.mouse.click(2, 2);
  await expect(popup).not.toBeVisible();
  await page.reload();
  await passWine(page);
  await expect(popup).not.toBeVisible();
});

test("active footer controls keep focus without a popup interruption", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const section = page
    .getByRole("contentinfo")
    .getByRole("navigation", { name: "Explore", exact: true });
  const toggle = section.locator("summary");
  const story = section.getByRole("link", { name: "Our Story", exact: true });
  await toggle.focus();
  await passWine(page);
  await toggle.click();
  await expect(story).toBeHidden();
  await toggle.click();
  await expect(story).toBeVisible();
  await expect(
    page.getByRole("dialog", { name: "A Letter from Gina" }),
  ).not.toBeVisible();
  await expect(toggle).toBeFocused();
});
