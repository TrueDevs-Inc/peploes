import { expect, test } from "@playwright/test";

test("newsletter shows errors for empty and invalid emails and recovers after editing", async ({
  page,
}) => {
  await page.goto("/");
  const newsletter = page.getByRole("region", { name: "A Letter from Gina" });
  const email = newsletter.getByLabel("Your email address", { exact: true });
  const subscribe = newsletter.getByRole("button", { name: "Subscribe" });
  await expect(newsletter.locator("form")).toHaveJSProperty("noValidate", true);

  await email.focus();
  await email.press("Enter");
  await expect(newsletter.getByRole("alert")).toHaveText(
    "Please enter your email address.",
  );
  await expect(email).toHaveAttribute("aria-invalid", "true");

  for (const invalid of ["alihassan", "ali@gmail", "ali@@gmail.com"]) {
    await email.fill(invalid);
    await expect(newsletter.getByRole("alert")).toHaveCount(0);
    await email.press("Enter");
    await expect(newsletter.getByRole("alert")).toHaveText(
      "Please enter a valid email address, such as name@gmail.com.",
    );
    await expect(email).toBeFocused();
    await expect(newsletter.getByRole("status")).toHaveCount(0);
  }

  await email.fill("ali@example.com");
  await subscribe.click();
  await expect(newsletter.getByRole("alert")).toHaveText(
    "Newsletter signup is temporarily unavailable. Please try again later.",
  );
  await expect(newsletter.getByRole("status")).toHaveCount(0);
  await expect(subscribe).toBeEnabled();
  await expect(page).toHaveURL("/");
  await email.fill("another@example.com");
  await expect(newsletter.getByRole("alert")).toHaveCount(0);
  await email.press("Enter");
  await expect(newsletter.getByRole("alert")).toContainText(
    "temporarily unavailable",
  );
});

test("newsletter allows saved-email autofill without a custom dropdown", async ({
  page,
}) => {
  await page.goto("/");
  const email = page.getByLabel("Your email address", { exact: true });
  await email.fill("ali");
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await expect(page.getByRole("option")).toHaveCount(0);
  await expect(email).toHaveAttribute("autocomplete", "email");
  await expect(email).toHaveAttribute("name", "email");
  await expect(
    page.getByRole("region", { name: "A Letter from Gina" }).locator("form"),
  ).not.toHaveAttribute("autocomplete", "off");
  await expect(email).not.toHaveAttribute("list");
  await expect(page.locator("[data-newsletter-completion]")).toHaveCount(0);
  await expect(email).toHaveValue("ali");
  await email.press("Tab");
  await expect(email).toHaveValue("ali");
  await expect(
    page.getByRole("button", { name: "Subscribe", exact: true }),
  ).toBeFocused();

  for (const value of ["ali@out", "ali@gm", "ali@example.com"]) {
    await email.fill(value);
    await expect(page.locator("[data-newsletter-completion]")).toHaveCount(0);
    await expect(email).toHaveValue(value);
  }
});

test("newsletter cannot perform a native GET before hydration", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  const email = page.getByLabel("Your email address", { exact: true });
  const submit = page
    .getByRole("region", { name: "A Letter from Gina" })
    .getByRole("button");
  await expect(email).toBeDisabled();
  await expect(submit).toBeDisabled();
  await expect(page).toHaveURL("/");
  await context.close();
});

test("newsletter waits safely through blocked hydration and enables after scripts recover", async ({
  page,
}) => {
  await page.route("**/_next/**/*.js*", (route) => route.abort());
  await page.goto("/");
  const region = page.getByRole("region", { name: "A Letter from Gina" });
  await expect(
    region.getByLabel("Your email address", { exact: true }),
  ).toBeDisabled();
  await expect(
    region.getByRole("button", { name: "Loading signup…", exact: true }),
  ).toBeDisabled();
  await expect(page).toHaveURL("/");
  await page.unroute("**/_next/**/*.js*");
  await page.reload();
  await expect(
    region.getByLabel("Your email address", { exact: true }),
  ).toBeEnabled();
});
