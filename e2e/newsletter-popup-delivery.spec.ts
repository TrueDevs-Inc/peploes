import { expect, test } from "@playwright/test";
import { passWine } from "./newsletter-popup";

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("popup provider outcomes", () => {
  test("a footer subscription on another page suppresses the homepage popup with blocked storage", async ({
    page,
  }, testInfo) => {
    await page.addInitScript(() => {
      Storage.prototype.getItem = () => {
        throw new Error("blocked");
      };
      Storage.prototype.setItem = () => {
        throw new Error("blocked");
      };
    });
    await page.goto("/our-story");
    const footer = page.getByRole("region", { name: "A Letter from Gina" });
    await footer
      .getByLabel("Your email address", { exact: true })
      .fill(`footer-popup-${testInfo.project.name}@example.test`);
    await footer
      .getByRole("button", { name: "Subscribe", exact: true })
      .click();
    await expect(footer.getByRole("status")).toHaveText(
      "Thanks for signing up.",
    );
    await page.getByRole("link", { name: "Peploe’s home" }).first().click();
    await passWine(page);
    await expect(
      page.getByRole("dialog", { name: "A Letter from Gina" }),
    ).not.toBeVisible();
  });

  test("acceptance shows confirmation, blocks duplicate clicks and suppresses revisit", async ({
    page,
  }, testInfo) => {
    let submissions = 0;
    page.on("request", (request) => {
      if (request.method() === "POST" && request.headers()["next-action"])
        submissions += 1;
    });
    await page.goto("/");
    await passWine(page);
    const popup = page.getByRole("dialog", { name: "A Letter from Gina" });
    const email = popup.getByLabel("Your email address", { exact: true });
    expect(
      await page.locator('input[type="email"]').evaluateAll((inputs) => {
        const ids = inputs.map((input) => input.id);
        return ids.length === new Set(ids).size;
      }),
    ).toBe(true);
    await email.fill(`popup-${testInfo.project.name}@example.test`);
    const scroll = await page.evaluate(() => scrollY);
    const submit = popup.getByRole("button", {
      name: "Subscribe",
      exact: true,
    });
    await submit.evaluate((button: HTMLButtonElement) => {
      button.click();
      button.click();
    });
    await expect(
      popup.getByRole("button", { name: "Sending…" }),
    ).toBeDisabled();
    await expect(popup.getByRole("status")).toHaveText(
      "Thanks for signing up.",
    );
    await expect(
      popup.getByRole("button", {
        name: "Thanks for signing up.",
        exact: true,
      }),
    ).toBeDisabled();
    await expect(
      popup.getByRole("button", {
        name: "Thanks for signing up.",
        exact: true,
      }),
    ).toBeInViewport();
    await page.screenshot({ path: testInfo.outputPath("popup-accepted.png") });
    expect(submissions).toBe(1);
    expect(await page.evaluate(() => scrollY)).toBe(scroll);
    await expect(page).toHaveURL("/");
    await page.reload();
    await passWine(page);
    await expect(popup).not.toBeVisible();
  });

  test("rejection retains input and allows an accepted retry", async ({
    page,
  }, testInfo) => {
    await page.goto("/");
    await passWine(page);
    const popup = page.getByRole("dialog", { name: "A Letter from Gina" });
    const email = popup.getByLabel("Your email address", { exact: true });
    const address = `rejected-popup-${testInfo.project.name}@example.test`;
    await email.fill(address);
    const submit = popup.getByRole("button", {
      name: "Subscribe",
      exact: true,
    });
    await submit.evaluate((button: HTMLButtonElement) => {
      button.click();
      button.click();
    });
    await expect(popup.getByRole("alert")).toContainText("could not send");
    await expect(email).toHaveValue(address);
    await expect(popup.getByRole("status")).toHaveCount(0);
    await submit.click();
    await expect(popup.getByRole("status")).toHaveText(
      "Thanks for signing up.",
    );
  });

  test("unknown provider outcome retains input without claiming acceptance", async ({
    page,
  }, testInfo) => {
    await page.goto("/");
    await passWine(page);
    const popup = page.getByRole("dialog", { name: "A Letter from Gina" });
    const email = popup.getByLabel("Your email address", { exact: true });
    const address = `unknown-popup-${testInfo.project.name}@example.test`;
    await email.fill(address);
    await popup.getByRole("button", { name: "Subscribe", exact: true }).click();
    await expect(popup.getByRole("alert")).toContainText("could not confirm");
    await expect(email).toHaveValue(address);
    await expect(popup.getByRole("status")).toHaveCount(0);
    expect(
      await page.evaluate(() =>
        localStorage.getItem("peploes:newsletter:subscribed"),
      ),
    ).toBeNull();
    await expect(page).toHaveURL("/");
  });
});
