import { rmSync, writeFileSync } from "node:fs";
import { expect, test } from "./menu-test";
import { announceSanityPublish } from "./sanity-webhook";
import { seasonalFixtures } from "./seasonal-fixtures";

test("live booking responses remain uncached", async ({ request }) => {
  const response = await request.get("/book-a-table");
  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toContain("no-store");
});

test("cached event pages return 404 after unpublishing and recover after republishing", async ({
  request,
}) => {
  const slug = "rugby-at-peploes";
  const path = `/seasonal/${slug}`;
  const statePath = ".next/e2e/published-seasonal-slugs.json";
  expect((await request.get(path)).status()).toBe(200);
  writeFileSync(
    statePath,
    JSON.stringify(
      seasonalFixtures
        .filter((event) => event.slug !== slug)
        .map((event) => event.slug),
    ),
  );
  try {
    await announceSanityPublish(request);
    expect((await request.get(path)).status()).toBe(404);
  } finally {
    rmSync(statePath, { force: true });
    await announceSanityPublish(request);
  }
  expect((await request.get(path)).status()).toBe(200);
});
