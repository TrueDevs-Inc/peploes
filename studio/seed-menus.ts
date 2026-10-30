import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, resolve, sep } from "node:path";
import { getCliClient } from "sanity/cli";
import { z } from "zod";
import { cmsMenuSchema, menusPageSchema } from "../src/lib/cms-menu-schema";
import { COCKTAILS_MENU } from "../src/lib/constants/cocktails-menu";
import { DINNER_MENU } from "../src/lib/constants/dinner-menu";
import { GROUP_SET_MENU } from "../src/lib/constants/group-set-menu";
import { LUNCH_MENU } from "../src/lib/constants/lunch-menu";
import { MENU_PAGE_CONTENT } from "../src/lib/constants/menu-page";
import { PRE_THEATRE_MENU } from "../src/lib/constants/pre-theatre-menu";
import { SEASONAL_MENU } from "../src/lib/constants/seasonal-menu";
import { WINE_MENU } from "../src/lib/constants/wine-menu";

const client = getCliClient({ apiVersion: "2026-10-06" }).withConfig({
  perspective: "raw",
  useCdn: false,
});
const arrayTypes: Record<string, string> = {
  courses: "menuCourse",
  dishes: "menuDish",
  cocktailSections: "menuCourse",
  spirits: "menuCourse",
  sections: "menuWineSection",
  columns: "menuWineColumn",
  categories: "menuWineCategory",
  wines: "menuWine",
  menus: "setMenu",
  navigation: "menuNavigationItem",
};
const images = new Map<string, { id: string; url: string }>();
const seeds = [
  { type: "restaurantMenu", content: LUNCH_MENU },
  { type: "restaurantMenu", content: DINNER_MENU },
  { type: "restaurantMenu", content: PRE_THEATRE_MENU },
  { type: "wineMenu", content: WINE_MENU },
  { type: "drinksMenu", content: COCKTAILS_MENU },
  { type: "setMenuCollection", content: GROUP_SET_MENU },
  { type: "setMenuCollection", content: SEASONAL_MENU },
];
const existingSchema = z.array(
  z
    .object({
      _id: z.string(),
      _type: z.string(),
      slug: z.object({ current: z.string() }).optional(),
    })
    .passthrough(),
);

async function main() {
  const config = client.config();
  if (config.dataset !== "development") {
    process.stderr.write(
      "This setup command only writes to the development dataset.\n",
    );
    process.exitCode = 1;
    return;
  }
  const existing = existingSchema.parse(
    await client.fetch(
      '*[_type in ["restaurantMenu", "wineMenu", "drinksMenu", "setMenuCollection", "menusPage"]]',
    ),
  );
  process.stdout.write(`Target: ${config.projectId}/${config.dataset}\n`);
  for (const seed of seeds) {
    const matches = existing.filter(
      (doc) => doc.slug?.current === seed.content.slug,
    );
    process.stdout.write(
      `${seed.content.slug}: ${matches.length ? "keep existing fields; add missing fields" : "create from website preview content"}\n`,
    );
  }
  if (process.env.PEPLOES_SEED_APPLY !== "1") {
    process.stdout.write(
      "Preview only. Run seed:development to apply. Existing field values are never replaced.\n",
    );
    return;
  }
  const backupDirectory = resolve(".sanity", "menu-backups");
  await mkdir(backupDirectory, { recursive: true });
  const backupFile = resolve(backupDirectory, `before-${Date.now()}.json`);
  await writeFile(backupFile, JSON.stringify(existing, null, 2));
  process.stdout.write(`Backup: ${backupFile}\n`);

  for (const seed of seeds) await seedMenu(seed, existing);

  const settings = await prepareValue({
    ...MENU_PAGE_CONTENT,
    navigation: MENU_PAGE_CONTENT.navigation.map((link) => ({
      label: link.label,
      menu: new URL(link.href, "https://example.com").searchParams.get("menu"),
    })),
  });
  const settingsFields = z.record(z.string(), z.unknown()).parse(settings);
  const shared = { ...settingsFields, _id: "menus-page", _type: "menusPage" };
  const settingsResult = menusPageSchema.safeParse(projectDocument(shared));
  if (!settingsResult.success) {
    process.stderr.write(
      `Invalid shared settings: ${settingsResult.error.message}\n`,
    );
    process.exitCode = 1;
    return;
  }
  const sharedMatches = existing.filter(
    (doc) => doc._id === "menus-page" || doc._id === "drafts.menus-page",
  );
  if (sharedMatches.length) {
    for (const match of sharedMatches)
      await client.patch(match._id).setIfMissing(settingsFields).commit();
  } else {
    await client.createIfNotExists(shared);
  }
  process.stdout.write(
    "Development menu setup finished. Existing values were preserved.\n",
  );
}

async function prepareValue(value: unknown, field = ""): Promise<unknown> {
  if (Array.isArray(value)) {
    const items: unknown[] = [];
    for (const [index, item] of value.entries()) {
      const prepared = await prepareValue(item, field);
      if (
        prepared &&
        typeof prepared === "object" &&
        !Array.isArray(prepared)
      ) {
        items.push({
          _key: `item-${index}`,
          _type: arrayTypes[field],
          ...prepared,
        });
        continue;
      }
      items.push(prepared);
    }
    return items;
  }
  if (!value || typeof value !== "object") return value;
  const record: Record<string, unknown> = Object.fromEntries(
    Object.entries(value),
  );
  if (typeof record.src === "string") return uploadImage(record);
  const entries: [string, unknown][] = [];
  for (const [key, item] of Object.entries(record))
    entries.push([key, await prepareValue(item, key)]);
  const prepared = Object.fromEntries(entries);
  if (arrayTypes[field] === "menuCourse") {
    prepared.kind = courseKind(String(record.heading ?? ""));
  }
  return prepared;
}

async function uploadImage(record: Record<string, unknown>) {
  const src = z.string().parse(record.src);
  const publicRoot = resolve("..", "public");
  const path = resolve(publicRoot, src.replace(/^[/\\]+/, ""));
  if (!path.startsWith(publicRoot + sep)) return undefined;
  let asset = images.get(src);
  if (!asset) {
    const uploaded = await client.assets.upload("image", await readFile(path), {
      filename: basename(path),
    });
    asset = { id: uploaded._id, url: uploaded.url };
    images.set(src, asset);
  }
  const fields = Object.fromEntries(
    Object.entries(record).filter(([key]) => key !== "src"),
  );
  return {
    ...fields,
    _type: "menuImage",
    asset: { _type: "reference", _ref: asset.id },
  };
}

function projectImage(value: unknown) {
  if (!value) return undefined;
  const image = z
    .object({ asset: z.object({ _ref: z.string() }) })
    .passthrough()
    .parse(value);
  const asset = [...images.values()].find(
    (item) => item.id === image.asset._ref,
  );
  return { ...image, src: asset?.url };
}

function projectDocument(document: Record<string, unknown>) {
  const booking = document.booking
    ? z.record(z.string(), z.unknown()).parse(document.booking)
    : undefined;
  const slug = document.slug
    ? z.object({ current: z.string() }).parse(document.slug).current
    : undefined;
  return {
    ...document,
    slug,
    image: projectImage(document.image),
    booking: booking
      ? { ...booking, image: projectImage(booking.image) }
      : undefined,
  };
}

function courseKind(heading: string) {
  const normalized = heading.toLowerCase();
  if (normalized.includes("small bite")) return "small-bites";
  if (normalized.includes("starter")) return "starters";
  if (normalized.includes("main")) return "mains";
  if (normalized.includes("dessert")) return "desserts";
  if (normalized.includes("side")) return "sides";
  return "other";
}

main().catch(() => {
  process.stderr.write(
    "Menu setup failed. Check Sanity login, permissions and the saved backup. Existing fields are never overwritten.\n",
  );
  process.exitCode = 1;
});

async function seedMenu(
  seed: (typeof seeds)[number],
  existing: z.infer<typeof existingSchema>,
) {
  const matches = existing.filter(
    (doc) => doc.slug?.current === seed.content.slug,
  );
  if (
    matches.some((doc) => doc._type !== seed.type) ||
    matches.filter((doc) => !doc._id.startsWith("drafts.")).length > 1
  ) {
    process.stderr.write(
      `Skipped duplicate or conflicting menu: ${seed.content.slug}\n`,
    );
    process.exitCode = 1;
    return;
  }
  const value = await prepareValue(seed.content);
  const fields = z.record(z.string(), z.unknown()).parse(value);
  const document = {
    ...fields,
    _id: `menu-${seed.content.slug}`,
    _type: seed.type,
    slug: { _type: "slug", current: seed.content.slug },
  };
  const validated = cmsMenuSchema.safeParse(projectDocument(document));
  if (!validated.success) {
    process.stderr.write(
      `Invalid seed for ${seed.content.slug}: ${validated.error.message}\n`,
    );
    process.exitCode = 1;
    return;
  }
  if (matches.length) {
    for (const match of matches) {
      await client.patch(match._id).setIfMissing(fields).commit();
    }
    return;
  }
  await client.createIfNotExists(document);
}
