import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.addEventListener("peploes:newsletter:accepted", () => {
      document.documentElement.dataset.newsletterAccepted = "true";
    });
    try {
      localStorage.setItem("peploes:newsletter:dismissed", "true");
    } catch {}
  });
});

for (const rejected of [false, true]) {
  test(`newsletter ${rejected ? "rejection and retry" : "acceptance"} preserves the page and email`, async ({
    page,
  }, testInfo) => {
    await page.goto("/");
    const newsletter = page.getByRole("region", { name: "A Letter from Gina" });
    const input = newsletter.getByLabel("Your email address", { exact: true });
    const email = `${rejected ? "rejected-" : "accepted-"}${testInfo.project.name}@example.test`;
    await input.fill(email);
    const submit = newsletter.getByRole("button", {
      name: "Subscribe",
      exact: true,
    });
    let submissions = 0;
    page.on("request", (request) => {
      if (request.method() === "POST" && request.headers()["next-action"])
        submissions += 1;
    });
    if (rejected) {
      await submit.evaluate((button: HTMLButtonElement) => {
        button.click();
        button.click();
      });
    } else {
      await submit.click();
    }
    await expect(
      newsletter.getByRole("button", { name: "Sending…", exact: true }),
    ).toBeDisabled();
    if (rejected) {
      await expect(newsletter.getByRole("alert")).toHaveText(
        "We could not send your signup request. Please try again later.",
      );
      await expect(submit).toBeEnabled();
      expect(submissions).toBe(1);
      await expect(newsletter.getByRole("status")).toHaveCount(0);
      await expect(input).toHaveValue(email);
      expect(
        await page.evaluate(() =>
          localStorage.getItem("peploes:newsletter:subscribed"),
        ),
      ).toBeNull();
      await expect(page.locator("html")).not.toHaveAttribute(
        "data-newsletter-accepted",
        "true",
      );
      await newsletter
        .getByRole("button", { name: "Subscribe", exact: true })
        .click();
    }
    await expect(newsletter.getByRole("status")).toHaveText(
      "Thanks for signing up.",
    );
    expect(submissions).toBe(rejected ? 2 : 1);
    await expect(input).toHaveValue(email);
    await expect(page).toHaveURL("/");
    await expect(input).toBeInViewport();
    await page.screenshot({
      path: testInfo.outputPath("newsletter-accepted.png"),
    });
    expect(
      await page.evaluate(() =>
        localStorage.getItem("peploes:newsletter:subscribed"),
      ),
    ).toBe("true");
    await expect(page.locator("html")).toHaveAttribute(
      "data-newsletter-accepted",
      "true",
    );
    await expect(
      newsletter.getByRole("button", {
        name: "Thanks for signing up.",
        exact: true,
      }),
    ).toBeDisabled();
  });
}

test("uncertain delivery preserves the address and does not record acceptance", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  const region = page.getByRole("region", { name: "A Letter from Gina" });
  const input = region.getByLabel("Your email address", { exact: true });
  const email = `unknown-${testInfo.project.name}@example.test`;
  await input.fill(email);
  await region.getByRole("button", { name: "Subscribe", exact: true }).click();
  await expect(region.getByRole("alert")).toHaveText(
    "We could not confirm your signup request. Please check your inbox before trying again.",
  );
  await expect(input).toHaveValue(email);
  await expect(page).toHaveURL("/");
  expect(
    await page.evaluate(() =>
      localStorage.getItem("peploes:newsletter:subscribed"),
    ),
  ).toBeNull();
});

test("storage restrictions cannot turn an accepted signup into an error", async ({
  page,
}, testInfo) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("blocked");
      },
    }),
  );
  await page.goto("/");
  const region = page.getByRole("region", { name: "A Letter from Gina" });
  await region
    .getByLabel("Your email address", { exact: true })
    .fill(`storage-${testInfo.project.name}@example.test`);
  await region.getByRole("button", { name: "Subscribe", exact: true }).click();
  await expect(region.getByRole("status")).toHaveText("Thanks for signing up.");
  await expect(region.getByRole("alert")).toHaveCount(0);
  await expect(page.locator("html")).toHaveAttribute(
    "data-newsletter-accepted",
    "true",
  );
});
