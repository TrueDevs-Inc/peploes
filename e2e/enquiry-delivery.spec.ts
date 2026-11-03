import { readFileSync, writeFileSync } from "node:fs";

import { expect, test } from "@playwright/test";

const evidencePath = ".next/e2e/email-sends.ndjson";

function requests(): { key: string; status: string }[] {
  return readFileSync(evidencePath, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

async function fillEnquiry(
  page: import("@playwright/test").Page,
  message: string,
) {
  const form = page.locator("#enquire").getByRole("form");
  await form.getByLabel("Occasion type").selectOption("Wedding");
  await form.getByLabel("Preferred date", { exact: true }).fill("2027-06-18");
  await form.getByLabel("Number of guests").selectOption("7");
  await form.getByLabel("Your name").fill("Example Guest");
  await form.getByLabel("Email address").fill("guest@example.test");
  await form.getByLabel("Tell us about your gathering").fill(message);
  return form;
}

test.beforeEach(() => {
  writeFileSync(evidencePath, "");
});

test("a double click delivers one restaurant notice and one guest acknowledgement", async ({
  page,
}) => {
  await page.goto("/private-dining");
  const form = await fillEnquiry(page, "A family celebration.");
  await page.evaluate(() => {
    const button = document.querySelector("#enquire form button[type=submit]");
    if (!(button instanceof HTMLButtonElement))
      throw new Error("Enquiry button missing");
    button.click();
    button.click();
  });
  await expect(form.getByRole("status")).toContainText(
    "Your enquiry has reached our team",
  );
  expect(requests()).toHaveLength(2);
  expect(requests().every((request) => request.status === "accepted")).toBe(
    true,
  );
});

test("a definite provider rejection keeps details and retries on the selected provider", async ({
  page,
}) => {
  await page.goto("/private-dining");
  const form = await fillEnquiry(page, "REJECT_ONCE A family celebration.");
  await form.getByRole("button", { name: "Send Enquiry" }).click();
  await expect(form.getByRole("status")).toContainText(
    "We could not send your enquiry",
  );
  await expect(form.getByLabel("Your name")).toHaveValue("Example Guest");
  await form.getByRole("button", { name: "Send Enquiry" }).click();
  await expect(form.getByRole("status")).toContainText(
    "Your enquiry has reached our team",
  );
  expect(requests().map((request) => request.status)).toEqual([
    "rejected",
    "accepted",
    "accepted",
  ]);
  expect(requests()[0]?.key).toBe(requests()[1]?.key);
});
