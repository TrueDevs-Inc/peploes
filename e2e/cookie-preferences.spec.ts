import { expect, test } from "@playwright/test";

test("footer opens preferences, retains choices and restores keyboard focus", async ({
  page,
}) => {
  await page.goto("/visit-contact");
  const trigger = page.getByRole("button", {
    name: "Cookie Settings",
    exact: true,
  });
  await expect(trigger).not.toHaveAttribute("aria-controls");
  await trigger.click();
  const dialog = page.getByRole("dialog", {
    name: "Cookie Preferences",
    exact: true,
  });
  await expect(dialog).toBeVisible();
  await expect(trigger).toHaveAttribute(
    "aria-controls",
    (await dialog.getAttribute("id")) ?? "",
  );
  await expect(
    dialog.getByText("Always active", { exact: true }),
  ).toBeVisible();
  const analytics = dialog.getByRole("switch", {
    name: "Analytics",
    exact: true,
  });
  await expect(analytics).not.toBeChecked();
  await analytics.check();
  await expect(analytics).toBeChecked();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await page.reload();
  await trigger.click();
  await expect(analytics).toBeChecked();
  await expect(
    dialog.getByRole("switch", { name: "Marketing", exact: true }),
  ).not.toBeChecked();
  await dialog.getByRole("button", { name: "Accept All", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await trigger.click();
  for (const name of ["Analytics", "Performance", "Marketing"]) {
    await expect(
      dialog.getByRole("switch", { name, exact: true }),
    ).toBeChecked();
  }
  await dialog
    .getByRole("button", { name: "Reject non-essential", exact: true })
    .click();
  await trigger.click();
  for (const name of ["Analytics", "Performance", "Marketing"]) {
    await expect(
      dialog.getByRole("switch", { name, exact: true }),
    ).not.toBeChecked();
  }
  await dialog
    .getByRole("button", { name: "Close cookie preferences" })
    .click();
  await expect(trigger).toBeFocused();
});

test("preferences remain usable in narrow viewports and link to the privacy policy", async ({
  page,
}, testInfo) => {
  await page.goto("/visit-contact");
  await page
    .getByRole("button", { name: "Cookie Settings", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Cookie Preferences",
    exact: true,
  });
  await expect(dialog).toBeVisible();
  const viewportWidth = page.viewportSize()?.width ?? 1440;
  const reject = dialog.getByRole("button", {
    name: "Reject non-essential",
    exact: true,
  });
  const accept = dialog.getByRole("button", {
    name: "Accept All",
    exact: true,
  });
  const rejectBounds = await reject.boundingBox();
  const acceptBounds = await accept.boundingBox();
  if (!rejectBounds || !acceptBounds)
    throw new Error("Consent actions are missing");
  if (viewportWidth <= 600) {
    expect(rejectBounds.y).toBeLessThan(acceptBounds.y);
  } else {
    expect(rejectBounds.x).toBeLessThan(acceptBounds.x);
  }
  await reject.focus();
  await page.keyboard.press("Tab");
  await expect(accept).toBeFocused();
  await expect
    .poll(() =>
      dialog.evaluate((element) => element.getBoundingClientRect().width),
    )
    .toBe(viewportWidth <= 600 ? Math.min(390, viewportWidth - 24) : 720);
  await page.screenshot({
    path: `test-results/cookie-preferences-${testInfo.project.name}.png`,
  });
  expect(
    await dialog.evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    ),
  ).toBe(true);
  await dialog
    .getByRole("link", { name: "View Privacy & Cookies Policy" })
    .click();
  await expect(page).toHaveURL("/privacy-cookies");
  await expect(dialog).not.toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.body.style.overflow))
    .not.toBe("hidden");
});

test("outside taps close preferences while touches inside keep them open", async ({
  page,
  isMobile,
}) => {
  await page.goto("/visit-contact");
  const trigger = page.getByRole("button", {
    name: "Cookie Settings",
    exact: true,
  });
  await trigger.click();
  const dialog = page.getByRole("dialog", {
    name: "Cookie Preferences",
    exact: true,
  });
  await expect(dialog).toBeVisible();
  await dialog.click({ position: { x: 8, y: 8 } });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("switch", { name: "Analytics", exact: true }).check();
  await expect(dialog).toBeVisible();
  if (isMobile) {
    await page.touchscreen.tap(4, 4);
  } else {
    await page.mouse.click(4, 4);
  }
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await expect
    .poll(() => page.evaluate(() => document.body.style.overflow))
    .not.toBe("hidden");
  await trigger.click();
  await expect(
    dialog.getByRole("switch", { name: "Analytics", exact: true }),
  ).toBeChecked();
});

test("blocked storage reports a failed save without pretending preferences were accepted", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get: () => {
        throw new Error("Storage blocked");
      },
    });
  });
  await page.goto("/visit-contact");
  await page
    .getByRole("button", { name: "Cookie Settings", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Cookie Preferences",
    exact: true,
  });
  await dialog.getByRole("button", { name: "Accept All", exact: true }).click();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("alert")).toHaveText(
    "Your preferences could not be saved. Please try again.",
  );
  await expect(
    dialog.getByRole("switch", { name: "Analytics", exact: true }),
  ).not.toBeChecked();
});

test("failed withdrawal stays denied across reloads and tabs until a successful save", async ({
  page,
  context,
}) => {
  await page.goto("/visit-contact");
  const trigger = page.getByRole("button", {
    name: "Cookie Settings",
    exact: true,
  });
  await trigger.click();
  const dialog = page.getByRole("dialog", {
    name: "Cookie Preferences",
    exact: true,
  });
  await dialog.getByRole("button", { name: "Accept All", exact: true }).click();
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new Error("Storage full");
    };
  });
  await trigger.click();
  await dialog
    .getByRole("button", { name: "Reject non-essential", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toBeVisible();
  const otherTab = await context.newPage();
  await otherTab.goto("/visit-contact");
  await otherTab
    .getByRole("button", { name: "Cookie Settings", exact: true })
    .click();
  await expect(
    otherTab.getByRole("switch", { name: "Analytics", exact: true }),
  ).not.toBeChecked();
  await otherTab.reload();
  await otherTab
    .getByRole("button", { name: "Cookie Settings", exact: true })
    .click();
  await expect(
    otherTab.getByRole("switch", { name: "Analytics", exact: true }),
  ).not.toBeChecked();
  await otherTab
    .getByRole("button", { name: "Accept All", exact: true })
    .click();
  await dialog
    .getByRole("button", { name: "Close cookie preferences" })
    .click();
  await trigger.click();
  await expect(
    dialog.getByRole("switch", { name: "Analytics", exact: true }),
  ).toBeChecked();
  await otherTab.close();
  await page.reload();
  await trigger.click();
  await expect(
    dialog.getByRole("switch", { name: "Analytics", exact: true }),
  ).toBeChecked();
});
