import { expect, type Locator, test } from "@playwright/test";

const enquiryPaths = [
  "/contact",
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
  await expect(
    form.getByRole("spinbutton", { name: "Number of guests" }),
  ).toBeVisible();
  for (const select of await selects.all()) {
    await select.selectOption({ index: 1 });
    await expect(select).not.toHaveValue("");
  }
  await form.getByRole("spinbutton", { name: "Number of guests" }).fill("80");
  await form.getByLabel("Preferred date", { exact: true }).fill("2026-12-01");
  await form.getByLabel("Your name").fill("Test Guest");
  await form.getByLabel("Email address").fill("guest@example.test");
  await form.locator("textarea").fill("Please share your dining options.");
}

for (const path of enquiryPaths) {
  test(`${path} required warnings move from the button to the only missing field`, async ({
    page,
  }) => {
    let submissions = 0;
    await page.route("**/*", async (route) => {
      if (route.request().method() === "POST") {
        if (route.request().headers()["next-action"]) submissions += 1;
        await route.abort();
      } else {
        await route.continue();
      }
    });
    await page.goto(path);
    const form = page.locator("#enquire").getByRole("form");
    const submit = form.getByRole("button", { name: "Send Enquiry" });
    await submit.click();
    const summary = form.getByText("Please complete all required fields.", {
      exact: true,
    });
    await expect(summary).toBeVisible();
    await expect(form.getByRole("alert")).toHaveCount(1);
    await expectFocusedControl(
      form.locator("input:invalid, select:invalid, textarea:invalid").first(),
    );

    const summaryBounds = await summary.boundingBox();
    const submitBounds = await submit.boundingBox();
    expect(
      (summaryBounds?.y ?? 0) + (summaryBounds?.height ?? 0),
    ).toBeLessThanOrEqual(submitBounds?.y ?? 0);
    await fillEnquiry(form);
    await expect(form.getByRole("alert")).toHaveCount(0);
    const required = form.locator(
      "input[required], select[required], textarea[required]",
    );
    for (const control of await required.all()) {
      const value = await control.inputValue();
      if (
        await control.evaluate(
          (element) => element instanceof HTMLSelectElement,
        )
      ) {
        await control.evaluate((element: HTMLSelectElement) => {
          element.selectedIndex = 0;
          element.dispatchEvent(new Event("change", { bubbles: true }));
        });
      } else {
        await control.fill("");
      }
      await submit.click();
      await expect(summary).toHaveCount(0);
      const error = form.getByRole("alert");
      await expect(error).toHaveCount(1);
      const messages: Record<string, string> = {
        occasion: "Please select an occasion type.",
        date: "Please choose a preferred date.",
        guests: "Please enter the number of guests.",
        name: "Please enter your name.",
        email: "Please enter your email address.",
        message: "Please enter your enquiry details.",
      };
      await expect(error).toHaveText(
        messages[(await control.getAttribute("name")) ?? ""],
      );

      await expectFocusedControl(control);
      await expect(control).toHaveAttribute("aria-invalid", "true");
      await expect(control).toHaveAttribute(
        "aria-describedby",
        (await error.getAttribute("id")) ?? "",
      );
      const controlBounds = await control.boundingBox();
      const errorBounds = await error.boundingBox();
      expect(errorBounds?.y).toBeGreaterThanOrEqual(
        (controlBounds?.y ?? 0) + (controlBounds?.height ?? 0),
      );
      if (
        await control.evaluate(
          (element) => element instanceof HTMLSelectElement,
        )
      ) {
        await control.selectOption(value);
      } else {
        await control.fill(value);
      }
      await expect(form.getByRole("alert")).toHaveCount(0);
    }
    const email = form.getByRole("textbox", { name: "Email address" });
    await email.fill("invalid-email");
    await submit.click();
    await expect(form.getByRole("alert")).toHaveCount(1);
    await expectFocusedControl(
      form.locator("input:invalid, select:invalid, textarea:invalid").first(),
    );
    await expect(form.getByRole("alert")).toHaveText(
      "Please enter a valid email address.",
    );
    await expect(email).toHaveAttribute("aria-invalid", "true");
    await email.fill("guest@example.test");
    await expect(form.getByRole("alert")).toHaveCount(0);
    expect(submissions).toBe(0);
  });

  test(`${path} guest validation appears below the field and clears when corrected`, async ({
    page,
  }) => {
    await page.goto(path);
    const form = page.locator("#enquire").getByRole("form");
    const guests = form.getByRole("spinbutton", { name: "Number of guests" });
    await guests.evaluate((input: HTMLInputElement) => {
      input.max = "120";
    });
    await guests.fill("125");
    const error = form.getByRole("alert");
    await expect(error).toContainText("120");
    await expect(error).toHaveText("The maximum number of guests is 120.");
    await expect(guests).toHaveAttribute("aria-invalid", "true");
    await expect(guests).toHaveAttribute(
      "aria-describedby",
      (await error.getAttribute("id")) ?? "",
    );

    await expect
      .poll(() =>
        guests.evaluate((input) => {
          const error = document.getElementById(
            input.getAttribute("aria-describedby") ?? "",
          );
          if (!error) throw new Error("Guest validation message is missing");
          return (
            error.getBoundingClientRect().top -
            input.getBoundingClientRect().bottom
          );
        }),
      )
      .toBeGreaterThanOrEqual(0);
    expect(
      await guests.evaluate((input: HTMLInputElement) => {
        let prevented = false;
        input.addEventListener(
          "invalid",
          (event) => {
            prevented = event.defaultPrevented;
          },
          { once: true },
        );
        input.reportValidity();
        return prevented;
      }),
    ).toBe(true);
    await guests.fill("120");
    await expect(error).toHaveCount(0);
    await expect(guests).toHaveAttribute("aria-invalid", "false");
    await guests.fill("125");
    await form
      .getByRole("button", { name: "Decrease number of guests" })
      .click();
    await expect(guests).toHaveValue("120");
    await expect(error).toHaveCount(0);
  });

  test(`${path} guest buttons adjust the count and respect its limits`, async ({
    page,
  }) => {
    await page.goto(path);
    const form = page.locator("#enquire").getByRole("form");
    const guests = form.getByRole("spinbutton", { name: "Number of guests" });
    const increase = form.getByRole("button", {
      name: "Increase number of guests",
    });
    const decrease = form.getByRole("button", {
      name: "Decrease number of guests",
    });
    await expect(increase).toBeVisible();
    await expect(decrease).toBeVisible();

    await increase.click();
    await expect(guests).toHaveValue("1");
    await decrease.click();
    await expect(guests).toHaveValue("1");
    const maximum = await guests.getAttribute("max");
    const startingCount = maximum
      ? Math.min(80, Math.max(1, Number(maximum) - 1))
      : 80;
    const increasedCount = maximum
      ? Math.min(startingCount + 1, Number(maximum))
      : startingCount + 1;
    await guests.fill(String(startingCount));
    await increase.click();
    await expect(guests).toHaveValue(String(increasedCount));
    await decrease.focus();
    await decrease.press("Enter");
    await expect(guests).toHaveValue(String(Math.max(1, increasedCount - 1)));
    if (maximum) {
      await guests.fill(maximum);
      await increase.click();
      await expect(guests).toHaveValue(maximum);
      await guests.fill(String(Number(maximum) + 1));
      expect(
        await guests.evaluate(
          (input: HTMLInputElement) => input.validity.rangeOverflow,
        ),
      ).toBe(true);
    }
    await expect(form.getByRole("status")).toBeEmpty();
  });

  test(`${path} accepts custom guest counts above 80 and rejects invalid counts`, async ({
    page,
  }) => {
    await page.goto(path);
    const form = page.locator("#enquire").getByRole("form");
    await expect(form.getByRole("checkbox")).toHaveCount(0);
    const guests = form.getByRole("spinbutton", { name: "Number of guests" });
    const maximum = await guests.getAttribute("max");
    for (const count of ["80", "120", "250"]) {
      await guests.fill(count);
      expect(
        await guests.evaluate((input: HTMLInputElement) =>
          input.checkValidity(),
        ),
      ).toBe(!maximum || Number(count) <= Number(maximum));
      expect(
        await form.evaluate((element: HTMLFormElement) =>
          new FormData(element).get("guests"),
        ),
      ).toBe(count);
    }
    for (const count of ["", "0", "-1", "1.5"]) {
      await guests.fill(count);
      expect(
        await guests.evaluate((input: HTMLInputElement) =>
          input.checkValidity(),
        ),
      ).toBe(false);
    }
  });

  test(`${path} calendar hides past weeks and stays above following content`, async ({
    page,
  }) => {
    await page.goto(path);
    const form = page.locator("#enquire").getByRole("form");
    const date = form.getByLabel("Preferred date", { exact: true });
    await date.click();
    const calendar = form.getByRole("group", {
      name: "Choose date",
      exact: true,
    });
    const pastWeeks = calendar.locator('[data-past-week="true"]');
    await expect(calendar).toBeVisible();
    expect(await pastWeeks.count()).toBeGreaterThan(0);
    for (const day of await pastWeeks.all()) await expect(day).toBeHidden();
    await calendar.getByRole("button", { name: "Next month" }).click();
    const lastDay = calendar.getByRole("button", {
      name: "Sunday, 6 December 2026",
      exact: true,
    });
    await lastDay.scrollIntoViewIfNeeded();
    await lastDay.click();
    await expect(date).toHaveValue("2026-12-06");
  });

  test(`${path} lets an incomplete enquiry show the missing field`, async ({
    page,
  }) => {
    await page.goto(path);
    const form = page.locator("#enquire").getByRole("form");
    const submit = form.getByRole("button", { name: "Send Enquiry" });
    await expect(submit).toBeEnabled();
    await submit.click();
    await expect(
      form
        .getByRole("alert")
        .filter({ hasText: "Please complete all required fields." }),
    ).toBeVisible();
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
  await expect(submit).toBeEnabled();

  try {
    await email.press("Enter");
    await expect(submit).toHaveAttribute("aria-busy", "true");
    await expect(submit).toBeDisabled();
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

test("mobile enquiry fields size naturally without oversized minimum heights", async ({
  page,
}) => {
  test.setTimeout(90_000);
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    for (const path of enquiryPaths) {
      await page.goto(path);
      const form = page.locator("#enquire").getByRole("form");
      const fields = form.locator(
        'input:not([type="hidden"]):not([aria-hidden="true"]):not([type="checkbox"]), select',
      );
      for (const field of await fields.all()) {
        await expect(field).toHaveCSS("min-height", "0px");
        await expect(field).toHaveCSS("height", "44px");
        await expect(field).toHaveCSS("padding-top", "10px");
        await expect(field).toHaveCSS("padding-bottom", "10px");
        await expect(field).toHaveCSS("border-top-width", "1px");
      }
      await expect(form.locator("textarea")).toHaveCSS("height", "92px");
      await expect(form.locator("textarea")).toHaveCSS("min-height", "0px");
      await expect(form.locator("textarea")).toHaveCSS("resize", "vertical");
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
  }
});

test("enquiry date placeholders stay vertically centered on phones", async ({
  page,
}) => {
  test.setTimeout(90_000);
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    for (const path of enquiryPaths) {
      await page.goto(path);
      const date = page
        .locator("#enquire")
        .getByLabel("Preferred date", { exact: true });
      const name = page
        .locator("#enquire")
        .getByLabel("Your name", { exact: true });
      await name.focus();
      const placeholder = date.locator("+ span");
      await expect(placeholder).toBeVisible();
      await expect(date).toHaveCSS("color", "rgba(0, 0, 0, 0)");
      const offset = await placeholder.evaluate((element) => {
        const input = element.previousElementSibling;
        if (!(input instanceof HTMLInputElement))
          throw new Error("Date field is missing");
        const text = element.getBoundingClientRect();
        const field = input.getBoundingClientRect();
        return text.top + text.height / 2 - field.top - field.height / 2;
      });
      expect(Math.abs(offset)).toBeLessThan(0.5);
      await date.focus();
      await expect(placeholder).toBeHidden();
      await expect(date).not.toHaveCSS("color", "rgba(0, 0, 0, 0)");
      await name.focus();
      await expect(placeholder).toBeVisible();
      await expect(date).toHaveCSS("color", "rgba(0, 0, 0, 0)");
      await date.fill("2026-12-01");
      await expect(placeholder).toBeHidden();
      await expect(date).toHaveValue("2026-12-01");
      await name.focus();
      await expect(placeholder).toBeHidden();
      await expect(date).not.toHaveCSS("color", "rgba(0, 0, 0, 0)");
    }
  }
});

test("mobile message handles resize by touch and keyboard without changing the enquiry", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const session = await page.context().newCDPSession(page);
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    for (const path of enquiryPaths) {
      await page.goto(path);
      const form = page.locator("#enquire").getByRole("form");
      const message = form.locator("textarea");
      const handle = form.getByRole("button", {
        name: "Resize message",
        exact: true,
      });
      await expect(handle).toBeVisible();
      await message.fill("Please share your celebration options.");
      await handle.evaluate((element) =>
        element.scrollIntoView({ block: "center" }),
      );
      const bounds = await handle.boundingBox();
      if (!bounds) throw new Error("Message resize handle is missing");
      const initialHeight = await message.evaluate(
        (element) => element.getBoundingClientRect().height,
      );
      const x = bounds.x + bounds.width / 2;
      const y = bounds.y + bounds.height / 2;
      await session.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x, y }],
      });
      await session.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x, y: y + 60 }],
      });
      await session.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      await expect
        .poll(() =>
          message.evaluate((element) => element.getBoundingClientRect().height),
        )
        .toBeCloseTo(initialHeight + 60, 0);
      await handle.focus();
      await handle.press("ArrowUp");
      await expect
        .poll(() =>
          message.evaluate((element) => element.getBoundingClientRect().height),
        )
        .toBeCloseTo(initialHeight + 38, 0);
      await handle.press("Enter");
      await expect
        .poll(() =>
          message.evaluate((element) => element.getBoundingClientRect().height),
        )
        .toBeCloseTo(initialHeight + 60, 0);
      await expect(message).toHaveValue(
        "Please share your celebration options.",
      );
      await expect(form.getByRole("status")).toBeEmpty();
    }
  }
});

test("private dining message area shows three lines without scrolling", async ({
  page,
}) => {
  await page.goto("/private-dining");
  const message = page.locator('#enquire textarea[name="message"]');
  await message.fill(
    "A corporate dinner\nFor twelve guests\nPlease share availability",
  );
  const dimensions = await message.evaluate((element) => ({
    height: element.clientHeight,
    contentHeight: element.scrollHeight,
  }));
  expect(dimensions.contentHeight).toBeLessThanOrEqual(dimensions.height);
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
    const bounds = await calendar.boundingBox();
    if (!bounds) throw new Error("The calendar must be visible.");
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

  test(`${path} enquiry controls accept guest details and retain forced-colors focus`, async ({
    page,
  }) => {
    await page.goto(path);
    const form = page.locator("#enquire").getByRole("form");
    await expect(
      form.getByRole("button", { name: "Send Enquiry" }),
    ).toBeEnabled();
    await page.keyboard.press("Tab");
    const fields = form.locator(
      'input:not([type="hidden"]):not([name="website"]), select, textarea',
    );
    for (const field of await fields.all()) {
      const restingShadow = await field.evaluate(
        (element) => getComputedStyle(element).boxShadow,
      );
      await field.focus();
      await expect(field).toBeFocused();
      await expect
        .poll(() =>
          field.evaluate((element, resting) => {
            const style = getComputedStyle(element);
            const outline =
              style.outlineStyle !== "none" &&
              Number.parseFloat(style.outlineWidth) > 0 &&
              style.outlineColor !== "rgba(0, 0, 0, 0)";
            return (
              outline ||
              (style.boxShadow !== "none" && style.boxShadow !== resting)
            );
          }, restingShadow),
        )
        .toBe(true);
    }
    const guests = form.getByLabel("Number of guests", { exact: true });
    await guests.fill("120");
    await expect(guests).toHaveValue("120");
    await form.getByLabel("Preferred date", { exact: true }).fill("2026-12-01");
    await expect(
      form.getByLabel("Preferred date", { exact: true }),
    ).toHaveValue("2026-12-01");
    await expect(form.getByRole("checkbox")).toHaveCount(0);
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
      /^(?!0px$).+$/,
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });

  test(`${path} enquiry pickers support selection and keyboard dismissal`, async ({
    page,
  }) => {
    await page.goto(path);
    const form = page.locator("#enquire").getByRole("form");
    for (const select of await form.getByRole("combobox").all()) {
      await select.click();
      const firstOption = select.locator("option:not(:disabled)").first();
      await expect(firstOption).toBeVisible();
      await expect(select.locator('option[value=""]')).toBeHidden();
      await firstOption.click();
      await expect(select).not.toHaveValue("");
      await select.focus();
      await select.press("ArrowDown");
      await select.press("Escape");
      await expect(select).toBeFocused();
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
  await form.getByLabel("Number of guests", { exact: true }).fill("80");
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
  await form.getByLabel("Number of guests", { exact: true }).fill("80");
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
