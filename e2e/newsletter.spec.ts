import { expect, test } from "@playwright/test";

test("newsletter focus thickens the rule downward without shifting text", async ({
  page,
}) => {
  for (const path of [
    "/",
    "/visit-contact",
    "/private-dining",
    "/private-dining/groups-celebrations",
    "/privacy-cookies",
  ]) {
    await page.goto(path);
    const email = page.getByLabel("Your email address", { exact: true });
    const restingHeight = await email.evaluate((input) => input.clientHeight);
    await email.focus();
    expect(await email.evaluate((input) => input.clientHeight)).toBe(
      restingHeight,
    );
    await expect(email).toHaveCSS(
      "box-shadow",
      /rgb\(122, 30, 36\) 0px 1px 0px 0px$/,
    );
    await expect(email).toHaveCSS("border-bottom-width", "1px");
    await expect(email).toHaveCSS("border-bottom-color", "rgb(122, 30, 36)");
    await expect(email).toHaveCSS("background-image", "none");
  }
});

test("newsletter shows errors for empty and invalid emails and recovers after editing", async ({
  page,
}) => {
  await page.goto("/");
  const newsletter = page.getByRole("region", { name: "A Letter from Gina" });
  const email = newsletter.getByLabel("Your email address", { exact: true });
  const subscribe = newsletter.getByRole("button", { name: "Subscribe" });

  await email.focus();
  await email.press("Enter");
  await expect(newsletter.getByRole("alert")).toHaveText(
    "Please enter your email address.",
  );
  await expect(email).toHaveAttribute("aria-invalid", "true");

  for (const invalid of ["alihassan", "ali@gmail", "ali@@gmail.com"]) {
    await email.fill(invalid);
    await expect(newsletter.getByRole("alert")).toHaveCount(0);
    await subscribe.click();
    await expect(newsletter.getByRole("alert")).toHaveText(
      "Please enter a valid email address, such as name@gmail.com.",
    );
    await expect(email).toBeFocused();
    await expect(newsletter.getByRole("status")).toHaveCount(0);
  }

  await email.fill("ali@example.com");
  await subscribe.click();
  await expect(email).toHaveAttribute("aria-invalid", "false");
  await expect(newsletter.getByRole("alert")).toHaveCount(0);
  await expect(newsletter.getByRole("status")).toHaveText(
    "Newsletter signup is not available yet. Your email has not been sent or saved.",
  );
  await expect(page).toHaveURL("/");
  await email.fill("another@example.com");
  await expect(newsletter.getByRole("status")).toHaveCount(0);
  await email.press("Enter");
  await expect(newsletter.getByRole("status")).toContainText(
    "not been sent or saved",
  );
});

test("newsletter completes inline with Tab without any popup suggestions", async ({
  page,
}) => {
  await page.goto("/");
  const email = page.getByLabel("Your email address", { exact: true });
  await email.fill("ali");
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await expect(page.getByRole("option")).toHaveCount(0);
  await expect(email).toHaveAttribute("autocomplete", "off");
  await expect(email).not.toHaveAttribute("list");
  await expect(page.locator("[data-newsletter-completion]")).toHaveText(
    "ali@gmail.com",
  );
  await expect(email).toHaveValue("ali");
  await email.press("Tab");
  await expect(email).toHaveValue("ali@gmail.com");
  await expect(email).toBeFocused();
  await email.press("Tab");
  await expect(
    page.getByRole("button", { name: "Subscribe", exact: true }),
  ).toBeFocused();

  await email.fill("ali@out");
  await expect(page.locator("[data-newsletter-completion]")).toHaveText(
    "ali@outlook.com",
  );
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await email.press("Tab");
  await expect(email).toHaveValue("ali@outlook.com");
  await email.fill("ali@gm");
  await expect(page.locator("[data-newsletter-completion]")).toHaveText(
    "ali@gmail.com",
  );
  await email.press("Escape");
  await expect(page.locator("[data-newsletter-completion]")).toHaveCount(0);
  await expect(email).toHaveValue("ali@gm");
  await email.fill("ali@example.com");
  await expect(page.locator("[data-newsletter-completion]")).toHaveCount(0);
  await expect(email).toHaveValue("ali@example.com");
});
