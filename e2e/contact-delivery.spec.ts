import { readFileSync, writeFileSync } from "node:fs";

import { expect, test } from "@playwright/test";

const evidencePath = ".next/e2e/email-sends.ndjson";

function requests(): { key: string; status: string }[] {
  const data = readFileSync(evidencePath, "utf8").trim();
  return data ? data.split("\n").map((line) => JSON.parse(line)) : [];
}

test.beforeEach(() => writeFileSync(evidencePath, ""));

async function fillContact(
  page: import("@playwright/test").Page,
  message: string,
) {
  const form = page.getByRole("form", { name: "General contact message" });
  await form.getByLabel("Your name").fill("Example Guest");
  await form.getByLabel("Email address").fill("guest@example.test");
  await form.getByLabel("Your message").fill(message);
  await form.getByRole("checkbox").check();
  return form;
}

test("one contact submission sends one restaurant notice", async ({ page }) => {
  await page.goto("/visit-contact");
  const form = await fillContact(page, "A question about opening hours.");
  await page.evaluate(() => {
    const button = document.querySelector(
      'form[aria-label="General contact message"] button[type=submit]',
    );
    if (!(button instanceof HTMLButtonElement))
      throw new Error("Contact button missing");
    button.click();
    button.click();
  });
  await expect(form.getByRole("status")).toContainText(
    "Your message has reached our team",
  );
  expect(requests()).toHaveLength(1);
  expect(requests()[0]?.status).toBe("accepted");
});

test("rejection keeps input and retry sends once", async ({ page }) => {
  await page.goto("/visit-contact");
  const form = await fillContact(page, "REJECT_ONCE A question.");
  await form.getByRole("button", { name: "Send Message" }).click();
  await expect(form.getByRole("status")).toContainText(
    "We could not send your message",
  );
  await expect(form.getByLabel("Your message")).toHaveValue(
    "REJECT_ONCE A question.",
  );
  await form.getByRole("button", { name: "Send Message" }).click();
  await expect(form.getByRole("status")).toContainText(
    "Your message has reached our team",
  );
  expect(requests().map((request) => request.status)).toEqual([
    "rejected",
    "accepted",
  ]);
});

test("invalid contact details cannot send", async ({ page }) => {
  await page.goto("/visit-contact");
  const form = page.getByRole("form", { name: "General contact message" });
  await form.getByLabel("Email address").fill("invalid");
  await form.getByRole("button", { name: "Send Message" }).click();
  expect(requests()).toHaveLength(0);
});
