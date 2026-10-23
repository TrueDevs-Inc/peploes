import { expect, test } from "@playwright/test";

for (const path of [
  "/private-dining",
  "/private-dining/groups-celebrations",
  "/private-dining/corporate-events",
  "/private-dining/weddings",
]) {
  test(`${path} enquiry controls share rounded styling and subtle focus`, async ({
    page,
  }) => {
    await page.goto(path);
    const form = page.locator("#enquire").getByRole("form");
    const fields = form.locator(
      'input:not([type="checkbox"]), select, textarea',
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
    const twelveGuests = guests.getByRole("option", {
      name: "12",
      exact: true,
    });
    await expect(twelveGuests).toBeVisible();
    await twelveGuests.click();
    await expect(guests).toHaveValue("12");
    await expect(form.getByLabel("Preferred date")).toHaveCSS(
      "cursor",
      "pointer",
    );
    await form.getByLabel("Preferred date").fill("2026-12-01");
    await expect(form.getByLabel("Preferred date")).toHaveValue("2026-12-01");
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
    ).toBeDisabled();
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
      const restingBackground = await firstOption.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      );
      const pickerBackground = await select.evaluate(
        (element) =>
          getComputedStyle(element, "::picker(select)").backgroundColor,
      );
      expect(restingBackground).toBe(pickerBackground);
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
