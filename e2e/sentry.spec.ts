import { expect, test } from "./menu-test";

function parseEvent(line: string): Record<string, unknown> | null {
  try {
    const value = JSON.parse(line);
    return value.exception ? value : null;
  } catch {
    return null;
  }
}

test("browser errors use configured labels and scrub URLs without deployment-based indexing changes", async ({
  page,
}) => {
  const events: Record<string, unknown>[] = [];
  await page.route("https://sentry.e2e.test/**", async (route) => {
    for (const line of (route.request().postData() ?? "").split("\n")) {
      const event = parseEvent(line);
      if (event) events.push(event);
    }
    await route.fulfill({
      status: 200,
      body: "{}",
      headers: { "access-control-allow-origin": "*" },
    });
  });
  const response = await page.goto(
    "/?token=synthetic-private-token#private-fragment",
  );
  expect(response?.headers()["x-robots-tag"]).toBeUndefined();
  await page.evaluate(() => {
    setTimeout(() => {
      throw new Error("Peploes browser staging verification");
    }, 0);
  });
  await expect.poll(() => events.length, { timeout: 15_000 }).toBe(1);
  expect(events[0]?.environment).toBe("e2e");
  expect(events[0]?.release).toBe("peploes-e2e");
  expect(JSON.stringify(events)).not.toContain("synthetic-private-token");
  expect(JSON.stringify(events)).not.toContain("private-fragment");
});
