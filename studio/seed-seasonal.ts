import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { getCliClient } from "sanity/cli";
import { SEASONAL_CONTENT } from "../src/lib/constants/seasonal";
import {
  seasonalEntrySchema,
  whatsOnPageSchema,
} from "../src/lib/seasonal-schema";
import type { ISectionImage } from "../src/lib/types";

const client = getCliClient({ apiVersion: "2026-10-06" }).withConfig({
  perspective: "raw",
  useCdn: false,
});
const eventId = "development-whats-on-example";
const eventSlug = "development-test-event";

async function main() {
  const config = client.config();
  if (config.projectId !== "3ggctsor" || config.dataset !== "development") {
    process.stderr.write(
      "This command only supports 3ggctsor/development. No content was changed.\n",
    );
    process.exitCode = 1;
    return;
  }
  const existing = await client.fetch<string[]>(
    '*[_id in [$eventId, "drafts." + $eventId, "whats-on-page", "drafts.whats-on-page"] || (_type == "seasonalEntry" && slug.current == $slug)]._id',
    { eventId, slug: eventSlug },
  );
  process.stdout.write(
    "Target: 3ggctsor/development. Create missing page settings and one labelled test event. Existing documents are preserved.\n",
  );
  if (process.env.PEPLOES_SEED_APPLY !== "1") {
    process.stdout.write(
      "Preview only. Run seed:events:development to create the example.\n",
    );
    return;
  }
  if (
    existing.some(
      (id) =>
        ![
          eventId,
          `drafts.${eventId}`,
          "whats-on-page",
          "drafts.whats-on-page",
        ].includes(id),
    )
  ) {
    process.stderr.write(
      "The test URL is already used by another document. No content was changed.\n",
    );
    process.exitCode = 1;
    return;
  }
  if (
    !existing.some(
      (id) => id === "whats-on-page" || id === "drafts.whats-on-page",
    )
  ) {
    const [heroImage, terraceImage, joinImage] = await Promise.all([
      uploadImage(SEASONAL_CONTENT.hero.image),
      uploadImage(SEASONAL_CONTENT.terrace.image),
      uploadImage(SEASONAL_CONTENT.join.image),
    ]);
    const settings = {
      ...SEASONAL_CONTENT,
      diary: {
        eyebrow: SEASONAL_CONTENT.diary.eyebrow,
        heading: SEASONAL_CONTENT.diary.heading,
        description: SEASONAL_CONTENT.diary.description,
        emptyMessage: SEASONAL_CONTENT.diary.emptyMessage,
        action: SEASONAL_CONTENT.diary.action,
      },
      hero: { ...SEASONAL_CONTENT.hero, image: heroImage },
      terrace: { ...SEASONAL_CONTENT.terrace, image: terraceImage },
      join: { ...SEASONAL_CONTENT.join, image: joinImage },
    };
    const parsed = whatsOnPageSchema.safeParse(settings);
    if (!parsed.success) {
      process.stderr.write(parsed.error.message);
      process.exitCode = 1;
      return;
    }
    await client.createIfNotExists({
      ...settings,
      _id: "whats-on-page",
      _type: "whatsOnPage",
    });
  }
  if (existing.includes(eventId) || existing.includes(`drafts.${eventId}`)) {
    process.stdout.write("Existing test event preserved.\n");
    return;
  }
  const image = await uploadImage(SEASONAL_CONTENT.hero.image);
  const sample = {
    _id: eventId,
    _type: "seasonalEntry",
    kind: "event",
    title: "Development Test Event",
    slug: { _type: "slug", current: eventSlug },
    enabled: true,
    noIndex: true,
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),
    category: "Development test",
    summary: "A sample for testing the CMS. This is not a real event.",
    seoDescription:
      "A development example used to test the What’s On CMS connection.",
    hero: {
      eyebrow: "Development test",
      heading: "Development Test Event",
      description:
        "Edit this text in Sanity, publish, then refresh this page to see your change. This is not a real event.",
      image,
    },
  };
  const parsed = seasonalEntrySchema.safeParse({
    ...sample,
    slug: eventSlug,
    _updatedAt: new Date().toISOString(),
  });
  if (!parsed.success) {
    process.stderr.write(parsed.error.message);
    process.exitCode = 1;
    return;
  }
  await client.createIfNotExists(sample);
  process.stdout.write(
    "Development example ready at /seasonal/development-test-event.\n",
  );
}

async function uploadImage(image: ISectionImage) {
  const filename = basename(image.src);
  const asset = await client.assets.upload(
    "image",
    await readFile(resolve("..", "public", filename)),
    { filename },
  );
  return {
    _type: "menuImage",
    asset: { _type: "reference", _ref: asset._id },
    alt: image.alt,
    src: asset.url,
  };
}

main().catch(() => {
  process.stderr.write(
    "Development setup failed. Existing documents were not replaced; rerunning is safe.\n",
  );
  process.exitCode = 1;
});
