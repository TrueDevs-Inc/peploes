import { expect, type Locator, test } from "@playwright/test";

const enquiryPaths = [
  "/private-dining",
  "/private-dining/groups-celebrations",
  "/private-dining/corporate-events",
  "/private-dining/weddings",
];

const enquiryNow = new Date("2026-10-29T12:00:00Z");

async function expectFocusedControl(control: Locator) {
  await control.page().bringToFront();
  await expect(control).toBeFocused();
}

test.use({ timezoneId: "UTC" });

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(enquiryNow);
});

async function fillEnquiry(form: Locator) {
  const selects = form.getByRole("combobox");
  await expect(selects.first()).toBeVisible();
  for (const select of await selects.all()) {
    await select.selectOption({ index: 1 });
    await expect(select).not.toHaveValue("");
  }
  await form.getByLabel("Preferred date", { exact: true }).fill("2026-12-01");
  await form.getByLabel("Your name").fill("Test Guest");
  await form.getByLabel("Email address").fill("guest@example.test");
  await form.locator("textarea").fill("Please share your dining options.");
  const consent = form.getByRole("checkbox");
  if (await consent.count()) await consent.check();
}

for (const path of enquiryPaths) {
  test(`${path} lets an incomplete enquiry show the missing field`, async ({
    page,
  }) => {
    await page.goto(path);
    const form = page.locator("#enquire").getByRole("form");
    const submit = form.getByRole("button", { name: "Send Enquiry" });
    await expect(submit).toBeEnabled();
    await submit.click();
    await expect(
      form.locator("input:invalid, select:invalid, textarea:invalid").first(),
    ).toBeFocused();
    expect(
      await form
        .locator("input:invalid, select:invalid, textarea:invalid")
        .first()
        .evaluate(
          (element: HTMLInputElement | HTMLSelectElement) =>
            element.validationMessage,
        ),
    ).not.toBe("");
    await expect(form.getByRole("status")).toBeEmpty();
  });

  test(`${path} rejects past enquiry dates and accepts today and future dates`, async ({
    page,
  }) => {
    await page.clock.setFixedTime(new Date("2026-07-01T23:30:00Z"));
    await page.goto(path);
    const form = page.locator("#enquire").getByRole("form");
    const date = form.getByLabel("Preferred date", { exact: true });
    const submit = form.getByRole("button", { name: "Send Enquiry" });
    await fillEnquiry(form);
    await date.fill("2026-07-01");
    await expect(submit).toBeEnabled();
    await expect(date).toHaveAttribute("min", "2026-07-02");
    await date.press("Enter");
    await expectFocusedControl(date);
    expect(
      await date.evaluate((input: HTMLInputElement) => input.validationMessage),
    ).not.toBe("");
    await expect(form.getByRole("status")).toBeEmpty();
    await date.fill("2026-07-02");
    await expect(submit).toBeEnabled();
    await date.fill("2026-07-03");
    await expect(submit).toBeEnabled();
  });

  test(`${path} valid enquiry waits for delivery and preserves input on failure`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    let releaseRequest: () => void = () => undefined;
    const responseGate = new Promise<void>((resolve) => {
      releaseRequest = resolve;
    });
    await page.route(`**${path}`, async (route) => {
      if (route.request().method() === "POST") await responseGate;
      await route.continue();
    });
    await page.goto(path);
    const form = page.locator("#enquire").getByRole("form");
    const submit = form.locator('button[type="submit"]');
    await expect(submit).toBeEnabled();
    await expect(form.getByRole("status")).toBeEmpty();
    await fillEnquiry(form);
    try {
      await submit.click();
      await expect(submit).toHaveAttribute("aria-busy", "true");
      await expect(form).not.toHaveAttribute("aria-busy", "true");
      await expect(submit).toBeDisabled();
      await expect(submit).toHaveText("Sending…");
      await expect(submit.locator("svg")).toHaveCSS("animation-name", "none");
    } finally {
      releaseRequest();
    }
    await expect(submit).toHaveAttribute("aria-busy", "false");
    await expect(submit).toBeEnabled();
    await expect(form.getByRole("status")).toContainText(
      "Online enquiries are unavailable",
    );
    await expect(form.getByLabel("Your name")).toHaveValue("Test Guest");
    await expect(form.getByLabel("Email address")).toHaveValue(
      "guest@example.test",
    );
    expect(new URL(page.url()).pathname).toBe(path);
  });
}

test("enquiry date minimum refreshes when an overnight page is reopened", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date("2026-07-02T12:00:00Z"));
  await page.goto("/private-dining");
  const form = page.locator("#enquire").getByRole("form");
  const date = form.getByLabel("Preferred date", { exact: true });
  const submit = form.getByRole("button", { name: "Send Enquiry" });
  await fillEnquiry(form);
  await date.fill("2026-07-02");
  await expect(submit).toBeEnabled();
  await expectFocusedControl(date);
  await page.clock.setFixedTime(new Date("2026-07-02T23:30:00Z"));
  await date.click();
  await expect(date).toHaveAttribute("min", "2026-07-03");
  await page.keyboard.press("Escape");
  await expect(submit).toBeEnabled();
  await submit.click();
  await expectFocusedControl(date);
  await expect(form.getByRole("status")).toBeEmpty();
  await date.fill("2026-07-03");
  await expect(submit).toBeEnabled();
});

test("enquiry validation, editing and keyboard retries preserve real delivery state", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  let releaseRequest: () => void = () => undefined;
  const responseGate = new Promise<void>((resolve) => {
    releaseRequest = resolve;
  });
  let submissions = 0;
  await page.route("**/private-dining/corporate-events", async (route) => {
    if (route.request().method() === "POST") {
      submissions += 1;
      await responseGate;
    }
    await route.continue();
  });
  await page.goto("/private-dining/corporate-events");
  const form = page.locator("#enquire").getByRole("form");
  const submit = form.locator('button[type="submit"]');
  const email = form.getByLabel("Email address");
  const consent = form.getByRole("checkbox");
  await fillEnquiry(form);
  await email.fill("invalid-email");
  await expect(submit).toBeEnabled();
  await email.press("Enter");
  await expectFocusedControl(email);
  expect(
    await email.evaluate((input: HTMLInputElement) => input.validationMessage),
  ).not.toBe("");
  await expect(submit).toHaveAttribute("aria-busy", "false");
  await email.fill("guest@example.test");
  await consent.uncheck();
  await expect(submit).toBeEnabled();
  await submit.click();
  await expectFocusedControl(consent);
  await consent.check();
  await expect(submit).toBeEnabled();

  try {
    await email.press("Enter");
    await expect(submit).toHaveAttribute("aria-busy", "true");
    await expect(submit).toBeDisabled();
    await expect(submit.locator("svg")).toHaveCSS("animation-name", "spin");
    await expect.poll(() => submissions).toBe(1);
    await email.press("Enter");
    expect(submissions).toBe(1);
  } finally {
    releaseRequest();
  }
  await expect(form.getByRole("status")).toContainText(
    "Online enquiries are unavailable",
  );
  const previousId = await form.locator('[name="notificationId"]').inputValue();
  await form.locator("textarea").fill("An updated enquiry.");
  await expect(form.getByRole("status")).toBeEmpty();
  expect(await form.locator('[name="notificationId"]').inputValue()).not.toBe(
    previousId,
  );
  await expect(submit).toBeEnabled();
  await email.fill("");
  await expect(submit).toBeEnabled();
  await email.press("Enter");
  await expectFocusedControl(email);
  await expect(submit).toHaveAttribute("aria-busy", "false");
  await expect(form.getByRole("status")).toBeEmpty();
  await email.fill("updated@example.test");
  await email.press("Enter");
  await expect(form.getByRole("status")).toContainText(
    "Online enquiries are unavailable",
  );
  await expect(email).toHaveValue("updated@example.test");
  await form.getByLabel("Preferred date", { exact: true }).click();
  await form
    .getByRole("button", { name: "Wednesday, 2 December 2026", exact: true })
    .click();
  await expect(form.getByLabel("Preferred date", { exact: true })).toHaveValue(
    "2026-12-02",
  );
  await expect(form.getByRole("status")).toBeEmpty();
  await expect(submit).toBeEnabled();
});

test("private dining message area shows three lines without scrolling", async ({
  page,
  isMobile,
}) => {
  await page.goto("/private-dining");
  const message = page.locator('#enquire textarea[name="message"]');
  await message.fill(
    "A corporate dinner\nFor twelve guests\nPlease share availability",
  );
  await expect(message).toHaveCSS("height", isMobile ? "190px" : "90px");
  const dimensions = await message.evaluate((element) => ({
    height: element.clientHeight,
    contentHeight: element.scrollHeight,
  }));
  expect(dimensions.contentHeight).toBeLessThanOrEqual(dimensions.height);
  await expect(message).toHaveCSS("resize", "vertical");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("enquiry calendar keeps adjacent dates separate at 1024px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto("/private-dining");
  const date = page
    .locator("#enquire")
    .getByLabel("Preferred date", { exact: true });
  await date.fill("2026-12-01");
  await date.click();
  const calendar = page.getByRole("group", {
    name: "Choose date",
    exact: true,
  });
  const tuesday = await calendar
    .getByRole("button", { name: "Tuesday, 1 December 2026", exact: true })
    .boundingBox();
  const wednesday = await calendar
    .getByRole("button", { name: "Wednesday, 2 December 2026", exact: true })
    .boundingBox();
  if (!tuesday || !wednesday)
    throw new Error("Adjacent calendar dates must both be visible.");
  expect(tuesday.x + tuesday.width).toBeLessThanOrEqual(wednesday.x + 0.5);
  await calendar
    .getByRole("button", { name: "Wednesday, 2 December 2026", exact: true })
    .click();
  await expect(date).toHaveValue("2026-12-02");
  await expect(calendar).toBeHidden();
});

for (const path of enquiryPaths) {
  test(`${path} date picker opens from the entire input`, async ({ page }) => {
    await page.goto(path);
    const form = page.locator("#enquire").getByRole("form");
    await expect(
      form.getByRole("button", { name: "Send Enquiry" }),
    ).toBeEnabled();
    const date = form.getByLabel("Preferred date", { exact: true });
    const field = form.locator('fieldset:has(input[name="date"])');
    const calendar = form.getByRole("group", {
      name: "Choose date",
      exact: true,
    });
    await date.scrollIntoViewIfNeeded();
    const width = await date.evaluate((element) => element.clientWidth);
    for (const x of [16, width / 2, width - 16]) {
      await field.click({ position: { x, y: 16 } });
      await expect(calendar).toBeVisible();
      await expect(
        page.locator('#enquire input[type="date"]:open'),
      ).toHaveCount(0);
      await page.keyboard.press("Escape");
      await expect(calendar).toBeHidden();
      await expectFocusedControl(date);
    }
    await date.click();
    await expect(
      calendar.getByRole("button", { name: "Previous month" }),
    ).toBeDisabled();
    await expect(
      calendar.getByRole("button", {
        name: "Wednesday, 28 October 2026",
        exact: true,
      }),
    ).toBeDisabled();
    await calendar.getByRole("button", { name: "Next month" }).click();
    await expect(calendar).toContainText("November 2026");
    await calendar
      .getByRole("button", { name: "Sunday, 1 November 2026", exact: true })
      .click();
    await expect(date).toHaveValue("2026-11-01");
    await expect(calendar).toBeHidden();
    await date.fill("2026-12-01");
    await expect(date).toHaveValue("2026-12-01");
    await date.click({ position: { x: 16, y: 16 } });
    await expect(calendar).toBeVisible();
    await expect(
      calendar.getByRole("button", {
        name: "Tuesday, 1 December 2026",
        exact: true,
      }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(calendar).toHaveCSS("background-color", "rgb(250, 247, 241)");
    const bounds = await calendar.boundingBox();
    const inputBounds = await date.boundingBox();
    if (!bounds || !inputBounds)
      throw new Error("The date field and calendar must both be visible.");
    expect(bounds.x).toBeCloseTo(inputBounds.x, 0);
    expect(bounds.width).toBeCloseTo(inputBounds.width, 0);
    const firstWeek = await calendar
      .locator("button[data-date]")
      .evaluateAll((days) =>
        days.slice(0, 7).map((day) => {
          const { left, right } = day.getBoundingClientRect();
          return { left, right };
        }),
      );
    expect(firstWeek).toHaveLength(7);
    for (let index = 1; index < firstWeek.length; index += 1)
      expect(firstWeek[index - 1].right).toBeLessThanOrEqual(
        firstWeek[index].left + 0.5,
      );
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(
      page.viewportSize()?.width ?? 0,
    );
    await page.screenshot({
      path: test.info().outputPath("enquiry-calendar.png"),
    });
    await page.keyboard.press("Escape");
    await expect(date).toHaveValue("2026-12-01");
    await date.press("ArrowDown");
    await expect(
      calendar.getByRole("button", {
        name: "Tuesday, 1 December 2026",
        exact: true,
      }),
    ).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(
      calendar.getByRole("button", {
        name: "Wednesday, 2 December 2026",
        exact: true,
      }),
    ).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(date).toHaveValue("2026-12-02");
    await date.click();
    await page.locator("#enquire").getByRole("heading").first().click();
    await expect(calendar).toBeHidden();
  });

  test(`${path} enquiry controls share rounded styling and subtle focus`, async ({
    page,
  }) => {
    await page.goto(path);
    const form = page.locator("#enquire").getByRole("form");
    const fields = form.locator(
      'input:not([type="checkbox"]):not([type="hidden"]):not([name="website"]), select, textarea',
    );
    await page.keyboard.press("Tab");
    for (const field of await fields.all()) {
      await expect(field).toHaveCSS("border-radius", "4px");
      const restingShadow = await field.evaluate(
        (element) => getComputedStyle(element).boxShadow,
      );
      await field.focus();
      await expect(field).toBeFocused();
      await expect(field).toHaveCSS("outline-style", "none");
      await expect(field).toHaveCSS("box-shadow", /0px 0px 0px 2px inset$/);
      await expect(field).not.toHaveCSS("box-shadow", restingShadow);
    }
    const selects = form.getByRole("combobox");
    for (const select of await selects.all()) {
      await expect(select).toHaveCSS("cursor", "pointer");
      await expect(select).toHaveCSS("appearance", "base-select");
      await expect(select).toHaveCSS("margin-top", "0px");
      await expect(select).toHaveCSS("margin-bottom", "0px");
    }
    const guests = form.getByLabel("Number of guests");
    await guests.click();
    expect(
      await guests.locator("option:not(:disabled)").allTextContents(),
    ).toEqual(["1", "2", "3", "4", "5", "6", "7"]);
    const sevenGuests = guests.getByRole("option", {
      name: "7",
      exact: true,
    });
    await sevenGuests.scrollIntoViewIfNeeded();
    await expect(sevenGuests).toBeVisible();
    await sevenGuests.click();
    await expect(guests).toHaveValue("7");
    await expect(form.getByLabel("Preferred date", { exact: true })).toHaveCSS(
      "cursor",
      "pointer",
    );
    await form.getByLabel("Preferred date", { exact: true }).fill("2026-12-01");
    await expect(
      form.getByLabel("Preferred date", { exact: true }),
    ).toHaveValue("2026-12-01");
    const consent = form.getByRole("checkbox");
    if (await consent.count()) {
      await expect(consent).toHaveCSS("cursor", "pointer");
      const restingShadow = await consent.evaluate(
        (element) => getComputedStyle(element).boxShadow,
      );
      await consent.check();
      await expect(consent).toBeChecked();
      await consent.focus();
      await consent.press("Space");
      await expect(consent).not.toBeChecked();
      await expect(consent).toHaveCSS("box-shadow", /0px 0px 0px 2px inset$/);
      await expect(consent).not.toHaveCSS("box-shadow", restingShadow);
    }
    await expect(
      form.getByRole("button", { name: "Send Enquiry" }),
    ).toBeEnabled();
    await page.emulateMedia({ forcedColors: "active" });
    await form.getByLabel("Email address").focus();
    await expect(form.getByLabel("Email address")).toHaveCSS(
      "outline-style",
      "solid",
    );
    await expect(form.getByLabel("Email address")).toHaveCSS(
      "outline-width",
      "2px",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });

  test(`${path} enquiry pickers highlight hovered and selected options`, async ({
    page,
    isMobile,
  }) => {
    await page.goto(path);
    const scrollbar = await page.evaluate(() => {
      const root = document.documentElement;
      return {
        width: getComputedStyle(root, "::-webkit-scrollbar").width,
        track: getComputedStyle(root, "::-webkit-scrollbar-track")
          .backgroundColor,
        thumb: getComputedStyle(root, "::-webkit-scrollbar-thumb")
          .backgroundColor,
        radius: getComputedStyle(root, "::-webkit-scrollbar-thumb")
          .borderRadius,
      };
    });
    expect(scrollbar).toEqual({
      width: "4px",
      track: "rgba(0, 0, 0, 0)",
      thumb: "rgba(122, 30, 36, 0.4)",
      radius: "2px",
    });
    const form = page.locator("#enquire").getByRole("form");
    const reveal = page.locator("#enquire [data-scroll-reveal]:has(form)");
    await reveal.scrollIntoViewIfNeeded();
    await expect(reveal).toHaveCSS("opacity", "1");
    await expect(reveal).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
    for (const select of await form.getByRole("combobox").all()) {
      await select.evaluate((element) =>
        element.scrollIntoView({ block: "center", behavior: "instant" }),
      );
      await page.mouse.move(0, 0);
      await select.click();
      await expect(select).toHaveJSProperty("value", "");
      await expect(select.locator('option[value=""]')).toBeHidden();
      const firstOption = select.locator("option:not(:disabled)").first();
      await expect(firstOption).toBeVisible();
      await expect(firstOption).toHaveCSS("border-top-width", "0px");
      const secondOption = select.locator("option:not(:disabled)").nth(1);
      await expect(secondOption).toHaveCSS("border-top-width", "1px");
      await expect(secondOption).toHaveCSS("border-top-style", "solid");
      await expect(secondOption).toHaveCSS(
        "border-top-color",
        "rgb(217, 209, 198)",
      );
      const restingBackground = await firstOption.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      );
      const pickerBackground = await select.evaluate(
        (element) =>
          getComputedStyle(element, "::picker(select)").backgroundColor,
      );
      expect(restingBackground).toBe(pickerBackground);
      const layout = await select.evaluate((element) => {
        const picker = getComputedStyle(element, "::picker(select)");
        const option = element.querySelector("option:not(:disabled)");
        return {
          triggerInset: getComputedStyle(element).paddingLeft,
          optionInset: option && getComputedStyle(option).paddingLeft,
          checkOrder: option && getComputedStyle(option, "::checkmark").order,
          bottomPadding: picker.paddingBottom,
        };
      });
      expect(layout.optionInset).toBe(layout.triggerInset);
      expect(layout.checkOrder).toBe("1");
      expect(layout.bottomPadding).toBe("0px");
      const trigger = await select.boundingBox();
      const option = await firstOption.boundingBox();
      expect(trigger).not.toBeNull();
      expect(option).not.toBeNull();
      expect(option?.y).toBeGreaterThanOrEqual(
        (trigger?.y ?? 0) + (trigger?.height ?? 0),
      );
      if (!isMobile) {
        await firstOption.hover();
        await expect(firstOption).not.toHaveCSS(
          "background-color",
          restingBackground,
        );
      }
      await firstOption.click();
      await expect(select).not.toHaveJSProperty("value", "");
      await select.click();
      await page.mouse.move(0, 0);
      await expect(firstOption).not.toHaveCSS(
        "background-color",
        pickerBackground,
      );
      await page.keyboard.press("ArrowDown");
      const focusedOption = select.locator("option:focus-visible");
      await expect(focusedOption).toHaveCount(1);
      await expect(focusedOption).toHaveCSS("outline-width", "2px");
      await expect(focusedOption).toHaveCSS(
        "background-color",
        pickerBackground,
      );
      await page.keyboard.press("Escape");
    }
  });
}

test("private dining enquiry keeps guest input when delivery is unavailable", async ({
  page,
}) => {
  await page.goto("/private-dining");
  const form = page.locator("#enquire").getByRole("form");
  await form.getByLabel("Occasion type").selectOption("Wedding");
  await form.getByLabel("Preferred date", { exact: true }).fill("2027-06-18");
  await form.getByLabel("Number of guests").selectOption("7");
  await form.getByLabel("Your name").fill("Example Guest");
  await form.getByLabel("Email address").fill("guest@example.test");
  await form
    .getByLabel("Tell us about your gathering")
    .fill("A family celebration.");
  await form.getByRole("button", { name: "Send Enquiry" }).click();
  await expect(form.getByRole("status")).toContainText(
    "Online enquiries are unavailable",
  );
  await expect(form.getByLabel("Your name")).toHaveValue("Example Guest");
  await expect(form.getByLabel("Email address")).toHaveValue(
    "guest@example.test",
  );
  const previousId = await form.locator('[name="notificationId"]').inputValue();
  await form.getByLabel("Your name").fill("Revised Guest");
  await expect(form.getByLabel("Your name")).toHaveValue("Revised Guest");
  expect(await form.locator('[name="notificationId"]').inputValue()).not.toBe(
    previousId,
  );
});

test("private dining enquiry does not submit an invalid form", async ({
  page,
}) => {
  await page.goto("/private-dining");
  const form = page.locator("#enquire").getByRole("form");
  await form.getByRole("button", { name: "Send Enquiry" }).click();
  expect(
    await form
      .getByLabel("Preferred date", { exact: true })
      .evaluate((element) => element.matches(":invalid")),
  ).toBe(true);
  await expect(form.getByRole("status")).toBeEmpty();
});

test("private dining enquiry blocks retry when the action response is lost", async ({
  page,
}) => {
  await page.route("**/private-dining", async (route) => {
    if (route.request().method() === "POST") {
      await route.abort("failed");
      return;
    }
    await route.continue();
  });
  await page.goto("/private-dining");
  const form = page.locator("#enquire").getByRole("form");
  await form.getByLabel("Occasion type").selectOption("Wedding");
  await form.getByLabel("Preferred date", { exact: true }).fill("2027-06-18");
  await form.getByLabel("Number of guests").selectOption("7");
  await form.getByLabel("Your name").fill("Example Guest");
  await form.getByLabel("Email address").fill("guest@example.test");
  await form
    .getByLabel("Tell us about your gathering")
    .fill("A family celebration.");
  const notificationId = await form
    .locator('[name="notificationId"]')
    .inputValue();
  await form.getByRole("button", { name: "Send Enquiry" }).click();
  await expect(form.getByRole("status")).toContainText(
    "could not confirm delivery",
  );
  await expect(
    form.getByRole("button", { name: "Send Enquiry" }),
  ).toBeDisabled();
  expect(await form.locator('[name="notificationId"]').inputValue()).toBe(
    notificationId,
  );
});
