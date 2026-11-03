import { AssertionError, strict as assert } from "node:assert";
import { readFile, realpath } from "node:fs/promises";
import { basename, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { getCliClient } from "sanity/cli";
import { z } from "zod";
import {
  journalArticleSchema,
  journalCategorySchema,
  journalPageSchema,
} from "../src/lib/journal-schema";
import {
  JOURNAL_ARTICLES,
  JOURNAL_CATEGORIES,
  JOURNAL_PAGE,
} from "./journal-content";

type TSeed = Record<string, unknown> & { _id: string; _type: string };
const imageSchema = z
  .object({ src: z.string() })
  .passthrough()
  .transform((image) => ({
    ...journalArticleSchema.shape.heroImage.omit({ src: true }).parse(image),
    src: image.src,
  }));
const existingSchema = z.array(
  z.object({
    _id: z.string(),
    _type: z.string(),
    slug: z.object({ current: z.string() }).nullish(),
    enabled: z.boolean().nullish(),
    runtime: z.unknown(),
  }),
);
const categoryProjection = `{_id,name,"slug":slug.current}`;
const cardProjection = `{
  ...,"slug":slug.current,"noIndex":coalesce(noIndex,true),"category":category->${categoryProjection},
  "heroImage":heroImage{alt,desktopPosition,mobilePosition,"src":asset->url}
}`;
const placeholderUrl =
  "https://cdn.sanity.io/images/w789ottu/development/preview.jpg";
let operation = "initialize Sanity client";

function mapImages(
  value: unknown,
  convert: (image: z.infer<typeof imageSchema>) => unknown,
): unknown {
  if (Array.isArray(value))
    return value.map((item) => mapImages(item, convert));
  if (!value || typeof value !== "object") return value;
  const record = z.record(z.string(), z.unknown()).parse(value);
  if ("src" in record) return convert(imageSchema.parse(record));
  return Object.fromEntries(
    Object.entries(record).map(([key, item]) => [
      key,
      mapImages(item, convert),
    ]),
  );
}

function manifest() {
  const categories = JOURNAL_CATEGORIES.map((category) =>
    journalCategorySchema.parse(category),
  );
  const articles = JOURNAL_ARTICLES.map((article) =>
    journalArticleSchema.parse(
      mapImages(
        {
          ...article,
          _updatedAt: "2000-01-01T00:00:00.000Z",
        },
        (image) => ({ ...image, src: placeholderUrl }),
      ),
    ),
  );
  const featured = articles.find(
    (article) => article.slug === JOURNAL_PAGE.featuredArticleSlug,
  );
  journalPageSchema.parse(
    mapImages({ ...JOURNAL_PAGE, featuredArticle: featured }, (image) => ({
      ...image,
      src: placeholderUrl,
    })),
  );
  for (const category of categories)
    assert(
      category._id === `journal-category-${category.slug}`,
      `Invalid category ID: ${category._id}`,
    );
  for (const article of articles) {
    assert(
      article._id === `journal-article-${article.slug}`,
      `Invalid article ID: ${article._id}`,
    );
    assert(
      article.noIndex === true,
      `Article must remain noIndex: ${article._id}`,
    );
    assert(
      categories.some(
        (category) =>
          category._id === article.category._id &&
          category.slug === article.category.slug,
      ),
      `Unknown category: ${article._id}`,
    );
  }
  const { featuredArticleSlug, ...page } = JOURNAL_PAGE;
  const seeds: TSeed[] = [
    ...categories.map((category, index) => ({
      ...category,
      _type: "journalCategory",
      sortOrder: index + 1,
      slug: { _type: "slug", current: category.slug },
    })),
    ...JOURNAL_ARTICLES.map((article) => ({
      ...article,
      _type: "journalArticle",
      enabled: true,
      noIndex: true,
      slug: { _type: "slug", current: article.slug },
      category: { _type: "reference", _ref: article.category._id },
    })),
    {
      ...page,
      _id: "journal-page",
      _type: "journalPage",
      featuredArticle: {
        _type: "reference",
        _ref: `journal-article-${featuredArticleSlug}`,
      },
    },
  ];
  assert(
    new Set(seeds.map((seed) => seed._id)).size === seeds.length,
    "Duplicate manifest IDs.",
  );
  return seeds;
}

async function localImages(seeds: TSeed[]) {
  const sources = new Set<string>();
  mapImages(seeds, (image) => sources.add(image.src));
  const publicRoot = await realpath(
    fileURLToPath(new URL("../public", import.meta.url)),
  );
  const files = new Map<string, { path: string; bytes: Buffer }>();
  for (const src of sources) {
    operation = `validate local image ${src}`;
    assert(
      src.startsWith("/") && !src.startsWith("//") && !/[\\?#:]/.test(src),
      `Expected local public image: ${src}`,
    );
    const path = await realpath(resolve(publicRoot, src.slice(1)));
    const inside = relative(publicRoot, path);
    assert(
      inside &&
        inside !== ".." &&
        !inside.startsWith(`..${sep}`) &&
        !isAbsolute(inside),
      `Image escapes public: ${src}`,
    );
    files.set(src, { path, bytes: await readFile(path) });
  }
  return files;
}

function plan(seeds: TSeed[], existing: z.infer<typeof existingSchema>) {
  for (const document of existing) {
    const id = document._id.replace(/^drafts\./, "");
    const seed = seeds.find((item) => item._id === id);
    assert(
      seed && document._type === seed._type,
      `Conflicting ID/type or URL: ${document._id}`,
    );
    const slug = seed.slug
      ? z.object({ current: z.string() }).parse(seed.slug).current
      : undefined;
    assert(
      document.slug?.current === slug,
      `Conflicting slug: ${document._id}`,
    );
  }
  const missing: TSeed[] = [];
  let blockers = 0;
  let preserved = 0;
  for (const seed of seeds) {
    if (existing.some((doc) => doc._id === seed._id)) {
      preserved++;
      process.stdout.write(
        `preserve ${seed._id} (published and any draft unchanged)\n`,
      );
    } else if (existing.some((doc) => doc._id === `drafts.${seed._id}`)) {
      blockers++;
      process.stdout.write(
        `blocked ${seed._id} (draft only; will not publish a twin)\n`,
      );
    } else {
      missing.push(seed);
      process.stdout.write(`create ${seed._id}\n`);
    }
  }
  process.stdout.write(
    `${missing.length} create, ${preserved} preserved, ${blockers} draft blockers.\n`,
  );
  assert(
    blockers === 0,
    "Draft-only documents block this import. Publish or resolve them in Studio first.",
  );
  return missing;
}

function validateRuntime(
  seeds: TSeed[],
  existing: z.infer<typeof existingSchema>,
  urls: Map<string, string>,
) {
  const published = new Map(
    existing
      .filter((doc) => !doc._id.startsWith("drafts."))
      .map((doc) => [doc._id, doc]),
  );
  const runtime = new Map<string, unknown>(
    [...published].map(([id, doc]) => [id, doc.runtime]),
  );
  for (const seed of seeds) {
    if (published.has(seed._id)) continue;
    const value = z.record(z.string(), z.unknown()).parse(
      mapImages(seed, (image) => ({
        ...image,
        src: urls.get(image.src) ?? placeholderUrl,
      })),
    );
    const slug = seed.slug
      ? z.object({ current: z.string() }).parse(seed.slug).current
      : undefined;
    if (seed._type === "journalCategory")
      runtime.set(seed._id, journalCategorySchema.parse({ ...value, slug }));
    if (seed._type === "journalArticle") {
      const category = z.object({ _ref: z.string() }).parse(seed.category)._ref;
      runtime.set(
        seed._id,
        journalArticleSchema.parse({
          ...value,
          slug,
          category: runtime.get(category),
          _updatedAt: "2000-01-01T00:00:00.000Z",
        }),
      );
    }
    if (seed._type === "journalPage") {
      const featured = z
        .object({ _ref: z.string() })
        .parse(seed.featuredArticle)._ref;
      assert(
        published.get(featured)?.enabled !== false,
        `Featured article is disabled: ${featured}`,
      );
      journalPageSchema.parse({
        ...value,
        featuredArticle: runtime.get(featured),
      });
    }
  }
}

async function main() {
  const client = getCliClient({ apiVersion: "2026-10-06" }).withConfig({
    perspective: "raw",
    useCdn: false,
  });
  const config = client.config();
  assert(
    config.projectId === "w789ottu" && config.dataset === "development",
    "This command only supports w789ottu/development. No content was changed.",
  );
  process.stdout.write(
    "Target: w789ottu/development. Existing documents are never replaced.\n",
  );
  operation = "validate Journal manifest";
  const seeds = manifest();
  operation = "resolve public image directory";
  const files = await localImages(seeds);
  // Run with Journal editing paused: this preflight does not lock concurrent writers.
  operation = "read existing Journal documents";
  const existing = existingSchema.parse(
    await client.fetch(
      `*[_id in $ids || slug.current in $slugs]{
    _id,_type,slug,enabled,
    "runtime":select(_type == "journalCategory" => ${categoryProjection}, _type == "journalArticle" => ${cardProjection})
  }`,
      {
        ids: seeds.flatMap((seed) => [seed._id, `drafts.${seed._id}`]),
        slugs: seeds.flatMap((seed) =>
          seed.slug
            ? [z.object({ current: z.string() }).parse(seed.slug).current]
            : [],
        ),
      },
    ),
  );
  operation = "validate Journal document identities and references";
  const missing = plan(seeds, existing);
  const urls = new Map<string, string>();
  validateRuntime(seeds, existing, urls);
  process.stdout.write(`${files.size} validated local images.\n`);
  if (process.env.PEPLOES_SEED_APPLY !== "1") {
    process.stdout.write(
      "Preview only; no uploads or mutations. Run seed:journal:development to apply.\n",
    );
    return;
  }
  const needed = new Set<string>();
  mapImages(missing, (image) => needed.add(image.src));
  const assets = new Map<string, string>();
  for (const src of needed) {
    operation = `upload local image ${src}`;
    const file = files.get(src);
    assert(file, `Unvalidated image: ${src}`);
    const asset = z
      .object({ _id: z.string().min(1), url: z.string().url() })
      .parse(
        await client.assets.upload("image", file.bytes, {
          filename: basename(file.path),
        }),
      );
    assets.set(src, asset._id);
    urls.set(src, asset.url);
  }
  operation = "validate uploaded image references";
  validateRuntime(seeds, existing, urls);
  if (missing.length) {
    operation = "commit missing Journal documents";
    const transaction = client.transaction();
    for (const seed of missing) {
      const prepared = z.record(z.string(), z.unknown()).parse(
        mapImages(seed, ({ src, ...image }) => ({
          ...image,
          _type: "menuImage",
          asset: { _type: "reference", _ref: assets.get(src) },
        })),
      );
      transaction.createIfNotExists({
        ...prepared,
        _id: seed._id,
        _type: seed._type,
      });
    }
    await transaction.commit();
  }
  process.stdout.write(
    `Journal import finished: ${missing.length} missing documents submitted; existing values preserved.\n`,
  );
}

export const journalSeed = main().catch((error: unknown) => {
  if (error instanceof AssertionError || error instanceof z.ZodError)
    process.stderr.write(`${error.message}\n`);
  const status = z
    .object({ statusCode: z.number().int().min(100).max(599) })
    .safeParse(error);
  process.stderr.write(
    `Journal setup failed during ${operation}${status.success ? ` (HTTP ${status.data.statusCode})` : ""}. Existing documents were not replaced. Uploaded assets may remain if an upload or commit failed; rerunning is safe.\n`,
  );
  process.exitCode = 1;
});
